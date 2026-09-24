import { Link, useSearchParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import ContentState from '../components/ui/ContentState';


export default function ExternalKeyReaderPage() {
  const [params] = useSearchParams();
  const source = params.get('source');
  const id = params.get('id') || '';
  let url = '';
  if (source === 'keybase' && /^\d+$/.test(id)) url = `https://keybase.rbg.vic.gov.au/keys/${id}`;
  if (source === 'plazi' && /^[0-9a-f]{32}$/i.test(id)) url = `https://treatment.plazi.org/GgServer/summary/${id}`;
  if (!url) return <PageContainer><ContentState status="error" title="Referência externa inválida." /></PageContainer>;
  return <PageContainer width="full" className="space-y-5"><Link to="/keys" className="font-bold underline">← Voltar às chaves</Link><PageHeader eyebrow={source === 'keybase' ? 'KeyBase' : 'Plazi TreatmentBank'} title="Leitor da fonte" description="O conteúdo abaixo permanece hospedado pela instituição responsável. Use a importação somente quando houver licença ou autorização para manter uma cópia local." />
    <div className="border-4 border-charcoal bg-surface p-2 shadow-hard"><iframe title={`Chave em ${source}`} src={url} sandbox="allow-scripts allow-forms allow-same-origin allow-popups" referrerPolicy="strict-origin-when-cross-origin" className="h-[72vh] w-full bg-white" /></div>
    <p className="text-sm">Se a fonte impedir a exibição incorporada, <a href={url} target="_blank" rel="noreferrer" className="font-bold underline">abra a chave em uma nova aba</a>.</p>
  </PageContainer>;
}
