# Contrato de UI: Acompanhamento de Exemplar

## Rota

| Rota | Comportamento observável |
|---|---|
| `/specimens/instances/:specimenId` | Exibe o acompanhamento autenticado do exemplar, incluindo identificação, situação, métricas, ações, atividades, fotos e edição. |

A feature amplia esta rota; não cria uma página concorrente. Um exemplar arquivado permanece acessível pelo mesmo endereço.

## Hierarquia e módulos

A ordem no DOM e em telas pequenas é:

1. PageHeader com nome, espécie e situação.
2. Resumo com foto representativa, identificação, localização e aquisição.
3. SpecimenMetrics com vitalidade, umidade, luminosidade e última atualização.
4. Ações de cuidado e edição.
5. CareLogTimeline.
6. VisualTimeline.

Em telas amplas, ResponsiveGrid pode posicionar resumo e métricas lado a lado e ampliar as linhas do tempo, sem mudar a ordem de leitura. A página usa PageContainer e os módulos usam Card; nenhum módulo cria outro `main`.

## Identificadores testáveis

| Identificador | Papel |
|---|---|
| `specimen-edit` | Abre a edição dos dados e métricas permitidos. |
| `specimen-archive-toggle` | Abre a confirmação para arquivar ou reativar conforme o estado atual. |
| `quick-care-watering` | Abre confirmação de rega no horário atual. |
| `quick-care-fertilizing` | Abre confirmação de adubação no horário atual. |
| `quick-care-repotting` | Abre confirmação de replante no horário atual. |
| `quick-care-pruning` | Abre confirmação de poda no horário atual. |
| `care-activity-open` | Abre o formulário detalhado de atividade ou observação. |
| `care-type` | Seleciona um dos cinco tipos de atividade. |
| `care-occurred-at` | Informa uma ocorrência presente ou passada. |
| `care-notes` | Informa a nota opcional. |
| `care-submit` | Confirma a criação e fica desabilitado durante o envio. |
| `care-load-more` | Carrega a próxima página de atividades. |
| `visual-entry-open` | Abre o formulário de nova foto. |
| `visual-image` | Seleciona uma imagem dentro dos formatos e tamanho aceitos. |
| `visual-captured-at` | Informa o instante da captura. |
| `visual-notes` | Informa a observação opcional da foto. |
| `visual-submit` | Confirma a entrada visual e fica desabilitado durante o envio. |
| `visual-load-more` | Carrega a próxima página de fotos. |
| `specimen-nickname` | Edita o nome do exemplar. |
| `specimen-location` | Edita a localização. |
| `specimen-acquired-at` | Edita a data de aquisição. |
| `specimen-soil` | Edita a descrição do solo. |
| `specimen-light` | Edita a condição de luz sem permitir troca de espécie. |
| `vitality-index` | Edita vitalidade entre 0 e 100. |
| `soil-moisture` | Edita umidade entre 0 e 100. |
| `lux-intensity` | Edita luminosidade com mínimo 0. |
| `specimen-save` | Confirma a atualização e fica desabilitado durante o envio. |

Os identificadores são valores de `id` ou seletores acessíveis estáveis. Todos os campos possuem label associado, erros ligados por `aria-describedby` e foco visível.

## Estados da página

- **Carregando**: mantém “Detalhe do exemplar” no PageHeader e anuncia o carregamento no conteúdo.
- **Erro inicial**: mantém o contexto da rota, explica que o exemplar não pôde ser carregado e oferece “Tentar novamente”.
- **Pronto**: exibe nome, espécie, UUID, localização, aquisição, situação, foto ou fallback e as três métricas.
- **Arquivado**: apresenta rótulo textual “Arquivado”, conserva os históricos e troca a ação para “Reativar exemplar”.
- **Sem foto representativa**: MediaFrame fornece substituto visual com nome acessível.
- **Revalidando**: mantém os dados anteriores visíveis; não substitui toda a página por loading.
- **Conflito de edição**: informa que o exemplar mudou em outra sessão, fecha qualquer estado de salvamento e oferece revisar os dados recarregados.

## Ações rápidas

- Cada ação possui ícone opcional e rótulo textual em português.
- Acionar uma ação abre Modal com tipo e horário local que serão registrados; nenhuma atividade é criada antes da confirmação.
- O botão de confirmação recebe foco inicial, fica desabilitado durante o envio e ignora ativações repetidas.
- O modal fecha após sucesso; em erro, permanece aberto com os mesmos valores e uma mensagem anunciável.
- Observação usa o formulário detalhado; os outros tipos também podem ser escolhidos nele para informar data passada ou nota.

## Formulários

- SpecimenEditForm, CareActivityForm e VisualEntryForm usam Modal, FormField, Input, Button e Alert.
- Abrir um formulário parte dos dados atuais; cancelar não altera o cache.
- Erros de campo aparecem junto ao controle e erros gerais preservam todos os valores.
- Nenhum formulário oferece seleção de espécie, remoção de atividade, remoção de foto ou exclusão permanente do exemplar.
- A seleção de foto valida tipo e 10 MB antes do envio, apresenta prévia local e conserva o arquivo enquanto o modal continuar montado.
- Datas futuras são bloqueadas no controle quando possível e validadas novamente pela API.

## Linhas do tempo

- CareLogTimeline e VisualTimeline mostram os registros mais recentes primeiro.
- Cada item de atividade mostra tipo em português, ocorrência, nota quando houver e registro como metadado secundário.
- Cada item visual usa MediaFrame; falha de uma imagem preserva data e observação e mostra fallback apenas naquele item.
- Estado vazio mantém o título do módulo e orienta a primeira ação.
- Erro de uma linha do tempo não remove o restante da página e oferece nova tentativa local.
- “Carregar mais” acrescenta a próxima página sem repetir itens e desaparece quando `next` for nulo.
- O carregamento de outra página não bloqueia edição, ações rápidas nem a outra linha do tempo.

## Atualização de cache

- Criação de atividade revalida `queryKeys.careLogs.bySpecimen(specimenId)` e `queryKeys.specimens.detail(specimenId)`.
- Criação visual revalida `queryKeys.visualEntries.bySpecimen(specimenId)`, o detalhe e `queryKeys.collection.all`.
- Edição, arquivamento ou reativação revalida o detalhe, `queryKeys.specimens.all` e `queryKeys.collection.all`.
- A interface não combina inserção otimista com revalidação do mesmo item.

## Acessibilidade e responsividade

- Controles possuem nome textual, alvo mínimo de 44×44px e estado disabled exposto.
- Modal contém o foco, fecha por Escape quando não está salvando e devolve o foco ao acionador.
- Estados de sucesso ou erro relevantes são anunciados; cor não é o único indicador.
- Textos longos quebram linha, imagens não expandem a página e o overflow horizontal global é proibido.
- Em 360 e 768 pixels, módulos e formulários usam uma coluna e ações não cobrem a navegação móvel.
- Em 1024 e 1440 pixels, a grade pode aumentar a densidade sem alterar a ordem semântica.

## Verificação do contrato

- Testes RTL consultam papéis, nomes e estados antes de classes.
- Testes cobrem confirmação, bloqueio de envio, falha com preservação, conflito, paginação e fallbacks.
- A suíte responsiva valida ausência de overflow e alvos de toque nas quatro larguras do projeto.
- Cadastro, coleção, autenticação e a navegação até a rota permanecem funcionais.
