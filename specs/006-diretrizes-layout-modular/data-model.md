# Modelo de Dados de Interface: Diretrizes de Layout Modular

Esta feature não altera modelos persistidos, migrações ou contratos HTTP. Os modelos abaixo descrevem configuração e estado de apresentação no frontend.

## NavigationItem

Representa um destino compartilhado pelas navegações desktop e móvel.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string | Identificador estável e único. |
| `to` | string | URL existente da aplicação. |
| `label` | string | Rótulo visível; nunca substituído apenas por ícone. |
| `icon` | IconName | Ícone local do conjunto compartilhado. |
| `match` | função | Determina a seção ativa, inclusive em rotas filhas. |
| `mobilePriority` | inteiro | Ordem móvel; no máximo cinco destinos visíveis. |

### Regras

- Sidebar e MobileNavigation consomem a mesma coleção.
- Uma URL ativa resulta em exatamente uma seção principal ativa.
- Rotas de criação e detalhe de exemplar pertencem a Coleção.
- Detalhe de espécie pertence a Descobrir.

## PageHeaderModel

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `title` | string | sim | Um `h1` por página. |
| `description` | string/node | não | Não reserva espaço quando ausente. |
| `eyebrow` | string | não | Metadado curto, não substitui o título. |
| `primaryAction` | node | não | Permanece alcançável em telas menores. |
| `secondaryActions` | node[] | não | Reorganiza sem criar overflow. |
| `search` | node | não | Usa SearchField quando aplicável. |

## ContentStateModel

| Campo | Tipo | Regra |
|---|---|---|
| `status` | `loading \| empty \| error \| ready` | Estados mutuamente exclusivos. |
| `title` | string | Obrigatório em empty e error. |
| `message` | string | Orienta a pessoa sem expor detalhes internos. |
| `action` | node | Retry ou próxima ação quando aplicável. |
| `busyLabel` | string | Nome acessível durante loading. |

### Transições

```text
loading -> ready
loading -> empty
loading -> error
error -> loading (retry)
ready -> loading (refetch)
```

O PageHeader não é desmontado durante essas transições.

## SemanticTone

Enumeração compartilhada: `neutral`, `info`, `stable`, `warning`, `critical`, `disabled`.

Cada tom define:

- cor de superfície, borda e texto;
- símbolo opcional;
- rótulo textual obrigatório quando comunica estado;
- contraste compatível com foco e leitura.

Os aliases de domínio `owned` e `missing` podem mapear para tons semânticos sem duplicar CSS.

## ComponentVariant

Contrato comum das primitivas interativas.

| Dimensão | Valores iniciais |
|---|---|
| aparência | `primary`, `secondary`, `danger`, `ghost` quando aplicável |
| tamanho | `sm`, `md`, `lg` somente quando há uso confirmado |
| densidade | `default`, `compact` somente para listas/tabelas |
| estado | repouso, hover, focus-visible, pressed, disabled |

Novos valores são adicionados no módulo compartilhado antes de uso por página.

## ResponsiveGridModel

| Campo | Tipo | Regra |
|---|---|---|
| `mobileColumns` | inteiro | Padrão 1. |
| `tabletColumns` | inteiro | Até 2. |
| `desktopColumns` | inteiro | Até 12; composição definida pelo consumidor. |
| `gap` | token | Usa a escala de 4px. |
| `readingOrder` | DOM order | Não depende de posicionamento visual para significado. |

## MediaFrameModel

| Campo | Tipo | Regra |
|---|---|---|
| `src` | URL opcional | Pode falhar ou estar ausente. |
| `alt` | string | Descrição acessível; vazia somente para imagem decorativa. |
| `aspect` | token | Razão prevista pelo módulo. |
| `fit` | `cover \| contain` | Nunca deforma a imagem. |
| `fallback` | node | Exibido em ausência e erro de carregamento. |

## FormFieldModel

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string | Liga label, controle, ajuda e erro. |
| `label` | string | Visível. |
| `required` | boolean | Indicação textual/semântica. |
| `hint` | string | Opcional e associado por `aria-describedby`. |
| `error` | string | Associado ao controle e anunciado. |

## Invariantes

- Há um único `<main>` por página autenticada.
- A página não redefine tokens de borda, sombra, cor semântica ou foco.
- A navegação móvel não encobre conteúdo ou ação essencial.
- Imagens quebradas e estados de dados permanecem dentro da composição prevista.
- Nenhum modelo desta feature contém dados novos de pragas, lembretes, câmera, diário ou relatórios.
