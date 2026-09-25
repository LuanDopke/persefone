"""Discovery and normalization of external taxonomic identification keys."""

from concurrent.futures import ThreadPoolExecutor
from html import unescape
import re
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

from django.core.cache import cache
import requests

from catalog.services import _gbif_get


KEYBASE_API = 'https://keybase.rbg.vic.gov.au/api/v1'
PLAZI_API = 'https://api.plazi.org/v1'
PLAZI_READER = 'https://treatment.plazi.org/GgServer'
MAX_IMPORT_BYTES = 5 * 1024 * 1024
ALLOWED_SDD_HOSTS = {'app.xper3.fr', 'wiki.xper3.fr'}


class KeySourceError(Exception):
    pass


class SourceLicenseError(KeySourceError):
    pass


def _request(url, *, expect_json=False):
    try:
        response = requests.get(url, timeout=15, headers={'User-Agent': 'Persefone/1.0'})
        response.raise_for_status()
        if len(response.content) > MAX_IMPORT_BYTES:
            raise KeySourceError('O arquivo excede o limite de 5 MB.')
        return response.json() if expect_json else response.content
    except (requests.RequestException, ValueError) as exc:
        raise KeySourceError('A fonte externa não respondeu corretamente.') from exc


def discover_keys(term):
    """Search supported public catalogs and return source-specific failures separately."""
    term = ' '.join((term or '').split())[:100]
    if len(term) < 2:
        return {'results': [], 'errors': []}
    cache_key = f'identification-key-discovery:{term.casefold()}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    results, errors = [], []
    with ThreadPoolExecutor(max_workers=2) as executor:
        jobs = {
            'keybase': executor.submit(_discover_keybase, term),
            'plazi': executor.submit(_discover_plazi, term),
        }
        for source, job in jobs.items():
            try:
                results.extend(job.result())
            except KeySourceError:
                errors.append(source)
    payload = {'results': results, 'errors': errors}
    cache.set(cache_key, payload, 60 * 60 * 6)
    return payload


def _discover_keybase(term):
    rows = _request(f'{KEYBASE_API}/search_items/{requests.utils.quote(term, safe="")}', expect_json=True)
    return [{
        'source_kind': 'keybase',
        'external_id': str(row.get('key_id')),
        'title': row.get('key_title') or row.get('key_name') or 'Chave sem título',
        'scope_name': row.get('taxonomic_scope') or term,
        'coverage': row.get('geographic_scope') or 'Abrangência não informada',
        'project': (row.get('project') or {}).get('project_name', ''),
        'reader_url': f'https://keybase.rbg.vic.gov.au/keys/{row.get("key_id")}',
        'import_status': 'review',
    } for row in rows if row.get('key_id')]


def _discover_plazi(term):
    genus = re.sub(r'[^A-Za-zÀ-ÿ-]', '', term.split()[0])
    if len(genus) < 2:
        return []
    rows = _request(
        f'{PLAZI_API}/Taxon/TreatmentsWithKeys?genus={requests.utils.quote(genus, safe="")}&format=Json&limit=20',
        expect_json=True,
    )
    seen = set()
    results = []
    for row in rows:
        article_id = row.get('DocArticleUuid')
        if not article_id or article_id in seen:
            continue
        seen.add(article_id)
        name = row.get('TaxName') or row.get('TaxGenusEpithet') or genus
        results.append({
            'source_kind': 'plazi',
            'external_id': article_id,
            'title': f'Chave publicada para {name}',
            'scope_name': row.get('TaxGenusEpithet') or genus,
            'coverage': 'Consulte a publicação para confirmar a abrangência geográfica.',
            'project': 'Plazi TreatmentBank',
            'reader_url': f'{PLAZI_READER}/summary/{article_id}',
            'import_status': 'review',
        })
    return results


def load_external_source(source_kind, external_id=None, uploaded=None, source_url=None, declared_license=''):
    """Return a normalized graph plus bibliographic metadata for an import draft."""
    if source_kind == 'keybase':
        if not str(external_id or '').isdigit():
            raise KeySourceError('Identificador da KeyBase inválido.')
        data = _request(f'{KEYBASE_API}/key_get/{external_id}', expect_json=True)
        inferred_license = 'CC BY 3.0 AU' if data.get('modified_from_source') or not data.get('source') else ''
        license_name = declared_license.strip() or inferred_license
        source_page = f'https://keybase.rbg.vic.gov.au/keys/{external_id}'
        if not license_name:
            raise SourceLicenseError('A KeyBase atribui esta chave a uma publicação e não informa licença de redistribuição. Use o leitor da fonte ou informe uma autorização/licença.')
        graph, title, source, language = _parse_keybase(data), data.get('key_title'), _keybase_citation(data), 'und'
        coverage = data.get('geographic_scope') or 'Abrangência não informada'
    elif source_kind == 'plazi':
        article_id = str(external_id or '')
        if not re.fullmatch(r'[0-9A-Fa-f]{32}', article_id):
            raise KeySourceError('Identificador da Plazi inválido.')
        summary_url = f'{PLAZI_READER}/summary/{article_id}'
        summary = _request(summary_url).decode('utf-8', errors='replace')
        match = re.search(r'href="/GgServer/html/([0-9A-F]{32})"[^>]*>.*?</a>\s*</td>\s*<td[^>]*>\s*key', summary, re.I | re.S)
        if not match:
            raise KeySourceError('A publicação foi encontrada, mas o XML da chave não pôde ser localizado.')
        key_id = match.group(1)
        raw = _request(f'{PLAZI_API}/Treatments/fetch?UUID={key_id}')
        root = _xml_root(raw)
        inferred_license = root.attrib.get('zenodo-license-document', '')
        license_name = declared_license.strip() or inferred_license
        if not license_name:
            raise SourceLicenseError('O XML da Plazi não declara licença de redistribuição. Use o leitor da fonte ou informe uma autorização/licença.')
        graph, title, source, language = _parse_plazi(root)
        coverage = 'Abrangência descrita na publicação original.'
        source_page = summary_url
        external_id = key_id
    elif source_kind == 'sdd':
        if uploaded is not None:
            raw = uploaded.read(MAX_IMPORT_BYTES + 1)
            source_page = ''
        elif source_url:
            parsed = urlparse(source_url)
            if parsed.scheme != 'https' or parsed.hostname not in ALLOWED_SDD_HOSTS:
                raise KeySourceError('A importação por URL aceita apenas arquivos HTTPS públicos do Xper3. Envie outros arquivos diretamente.')
            raw = _request(source_url)
            source_page = source_url
        else:
            raise KeySourceError('Envie um arquivo SDD ou informe uma URL pública do Xper3.')
        if len(raw) > MAX_IMPORT_BYTES:
            raise KeySourceError('O arquivo excede o limite de 5 MB.')
        license_name = declared_license.strip()
        if not license_name:
            raise SourceLicenseError('Informe a licença ou autorização aplicável ao arquivo antes de salvá-lo no Persefone.')
        graph, title, source, language = _parse_sdd(_xml_root(raw))
        coverage = 'Abrangência informada no arquivo importado.'
        external_id = ''
    else:
        raise KeySourceError('Fonte de chave não suportada.')

    return {
        'title': (title or 'Chave importada')[:160],
        'coverage': coverage,
        'source': (source or source_page or 'Arquivo importado')[:500],
        'draft_graph': graph,
        'source_metadata': {
            'kind': source_kind,
            'external_id': str(external_id or ''),
            'url': source_page,
            'license': license_name,
            'language': language or 'und',
            'imported': True,
        },
    }


def resolve_graph_taxa(graph, expected_rank):
    """Resolve imported terminal names against GBIF before a draft is created."""
    if graph.get('type') == 'multi_access':
        taxa = graph.get('taxa', [])
    else:
        taxa = [choice['taxon'] for step in graph.get('steps', []) for choice in step.get('choices', []) if choice.get('taxon')]
    if any(not isinstance(row.get('name'), str) or not row['name'].strip() for row in taxa):
        raise KeySourceError('A chave contém um resultado sem nome taxonômico.')
    names = list(dict.fromkeys(row.get('name', '') for row in taxa if row.get('name')))
    if len(names) > 500:
        raise KeySourceError('A chave excede o limite de 500 táxons por importação.')
    with ThreadPoolExecutor(max_workers=6) as executor:
        matches = dict(zip(names, executor.map(lambda name: _match_taxon(name, expected_rank), names)))
    missing = [name for name, match in matches.items() if match is None]
    if missing:
        shown = ', '.join(missing[:8])
        suffix = f' e mais {len(missing) - 8}' if len(missing) > 8 else ''
        raise KeySourceError(f'Não foi possível vincular ao GBIF: {shown}{suffix}. Revise o arquivo ou a fonte.')
    for row in taxa:
        match = matches[row['name']]
        row.update(match)
    return graph


def _match_taxon(name, expected_rank):
    cache_key = f'identification-key-match:{expected_rank}:{name.casefold()}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached or None
    try:
        result = _gbif_get('species/match', params={'name': name, 'kingdom': 'Plantae', 'strict': 'false'})
    except (requests.RequestException, ValueError):
        raise KeySourceError('O GBIF está indisponível durante a vinculação dos táxons.')
    rank = (result.get('rank') or '').lower()
    key = result.get('usageKey') or result.get('acceptedUsageKey')
    confidence = result.get('confidence', 0)
    if rank != expected_rank or type(key) is not int or confidence < 80:
        cache.set(cache_key, {}, 60 * 30)
        return None
    match = {'key': key, 'rank': rank, 'name': result.get('canonicalName') or name}
    cache.set(cache_key, match, 60 * 60 * 24 * 30)
    return match


def _parse_keybase(data):
    items = {str(row.get('item_id')): row for row in data.get('items', [])}
    by_parent = {}
    for lead in data.get('leads', []):
        by_parent.setdefault(str(lead.get('parent_id')), []).append(lead)
    root = str((data.get('first_step') or {}).get('root_node_id') or '')
    if not root or root not in by_parent:
        raise KeySourceError('A KeyBase não retornou um passo inicial válido.')
    steps = []
    for parent_id, leads in by_parent.items():
        choices = []
        for lead in leads:
            text = _clean_lead(lead.get('lead_text', ''), has_next=str(lead.get('lead_id')) in by_parent)
            item = items.get(str(lead.get('item')))
            if item:
                choices.append({'text': text, 'taxon': {'name': item.get('item_name', '').strip()}})
            elif str(lead.get('lead_id')) in by_parent:
                choices.append({'text': text, 'next': f'kb-{lead.get("lead_id")}'})
            else:
                raise KeySourceError('A chave contém uma alternativa sem destino utilizável.')
        steps.append({'id': f'kb-{parent_id}', 'prompt': 'Escolha a alternativa que corresponde à planta.', 'choices': choices})
    return {'type': 'branching', 'start': f'kb-{root}', 'steps': steps}


def _keybase_citation(data):
    source = data.get('source') or {}
    citation = re.sub(r'<[^>]+>', '', unescape(source.get('citation') or '')).strip()
    return citation or data.get('key_author') or 'KeyBase'


def _clean_lead(value, has_next=False):
    text = ' '.join((value or '').split())
    text = re.sub(r'^(?:\d+[a-z]?[.)]|[-–—+])\s*', '', text)
    if has_next:
        text = re.sub(r'(?:\.{2,}|\s)\s*\d+\s*$', '', text).rstrip(' .')
    return text[:500]


def _xml_root(raw):
    if b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
        raise KeySourceError('O XML contém declarações não permitidas.')
    try:
        return ET.fromstring(raw)
    except ET.ParseError as exc:
        raise KeySourceError('O arquivo XML está inválido.') from exc


def _local(tag):
    return tag.rsplit('}', 1)[-1]


def _children(element, name):
    return [child for child in element.iter() if _local(child.tag) == name]


def _label(element):
    label = next((node for node in element.iter() if _local(node.tag) == 'Label'), None)
    return ' '.join(''.join(label.itertext()).split()) if label is not None else ''


def _parse_sdd(root):
    dataset = next((node for node in root.iter() if _local(node.tag) == 'Dataset'), None)
    if dataset is None:
        raise KeySourceError('O arquivo não contém um conjunto SDD.')
    language = dataset.attrib.get('{http://www.w3.org/XML/1998/namespace}lang', 'und')
    title = _label(dataset) or 'Chave SDD importada'
    taxon_names = {}
    for node in _children(dataset, 'TaxonName'):
        name = _label(node)
        if node.attrib.get('id') and name:
            taxon_names[node.attrib['id']] = name
    descriptors = []
    for character in _children(dataset, 'CategoricalCharacter'):
        character_id = character.attrib.get('id')
        states = []
        for state in [node for node in character.iter() if _local(node.tag) == 'StateDefinition']:
            state_id = state.attrib.get('id')
            if state_id:
                states.append({'id': state_id, 'label': _label(state) or state_id})
        if character_id and states:
            descriptors.append({'id': character_id, 'label': _label(character) or character_id, 'states': states})
    taxa = []
    for description in _children(dataset, 'CodedDescription'):
        scope = next((node for node in description.iter() if _local(node.tag) == 'Scope'), None)
        taxon_ref = next((node.attrib.get('ref') for node in scope.iter() if _local(node.tag) == 'TaxonName'), None) if scope is not None else None
        name = taxon_names.get(taxon_ref) or _label(description)
        states = {}
        summary = next((node for node in description.iter() if _local(node.tag) == 'SummaryData'), None)
        if summary is not None:
            for categorical in [node for node in summary if _local(node.tag) == 'Categorical']:
                character_id = categorical.attrib.get('ref')
                refs = [node.attrib.get('ref') for node in categorical.iter() if _local(node.tag) == 'State' and node.attrib.get('ref')]
                if character_id and refs:
                    states[character_id] = refs
        if name and states:
            taxa.append({'name': name, 'states': states})
    if not descriptors or len(taxa) < 2:
        raise KeySourceError('O SDD precisa conter caracteres categóricos e pelo menos dois táxons descritos.')
    return {'type': 'multi_access', 'descriptors': descriptors, 'taxa': taxa}, title, 'Arquivo SDD', language


def _parse_plazi(root):
    steps = []
    for position, node in enumerate(_children(root, 'keyStep'), start=1):
        choices = []
        for lead in [child for child in node.iter() if _local(child.tag) == 'keyLead']:
            taxon_node = next((child for child in lead.iter() if _local(child.tag) == 'taxonomicName'), None)
            full_text = ' '.join(''.join(lead.itertext()).split())
            if taxon_node is not None:
                genus = taxon_node.attrib.get('genus', '')
                species = taxon_node.attrib.get('species', '')
                name = ' '.join(part for part in (genus, species) if part) or ' '.join(''.join(taxon_node.itertext()).split())
                choices.append({'text': _clean_lead(full_text), 'taxon': {'name': name}})
            else:
                target = re.search(r'(\d+)\s*$', full_text)
                if not target:
                    raise KeySourceError('Uma alternativa da chave Plazi não tem destino reconhecível.')
                choices.append({'text': _clean_lead(full_text, has_next=True), 'next': f'plazi-{target.group(1)}'})
        if len(choices) >= 2:
            steps.append({'id': f'plazi-{position}', 'prompt': 'Escolha a alternativa que corresponde à planta.', 'choices': choices})
    if not steps:
        raise KeySourceError('O XML da Plazi não contém passos de chave reconhecíveis.')
    title = root.attrib.get('docTitle') or root.attrib.get('masterDocTitle') or 'Chave Plazi'
    source = ' — '.join(filter(None, [root.attrib.get('docAuthor'), root.attrib.get('masterDocTitle'), root.attrib.get('ID-DOI')]))
    return {'type': 'branching', 'start': 'plazi-1', 'steps': steps}, title, source or 'Plazi TreatmentBank', root.attrib.get('docLanguage', 'und')
