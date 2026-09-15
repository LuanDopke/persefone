# Pesquisa: Acompanhar e Atualizar Meu Exemplar

## Instantes históricos e tipos de atividade

**Decision**: representar o momento informado pelo usuário como `occurred_at` em `CareLog` e `captured_at` em `VisualEntry`, mantendo `created_at` separado como auditoria gerada pelo servidor. Atividades serão somente de criação e leitura e aceitarão `watering`, `fertilizing`, `repotting`, `pruning` e `observation`.

**Rationale**: o modelo atual usa `timestamp` com `auto_now_add`, que não permite registrar uma ocorrência passada nem distinguir ocorrência de registro. A restrição da superfície HTTP torna a imutabilidade observável e o novo tipo cobre poda sem reinterpretar outro evento.

**Alternatives considered**: manter um único instante foi rejeitado por perder a diferença exigida; permitir PATCH e validar apenas o campo de ocorrência foi rejeitado porque a feature não inclui edição de eventos históricos; modelar os tipos em tabela foi rejeitado porque o conjunto é fechado neste escopo.

## Históricos progressivos

**Decision**: retirar históricos completos do payload principal e consultar atividades e registros visuais em endpoints paginados, com `specimen_id` obrigatório, ordem decrescente estável e ação explícita para carregar a próxima página.

**Rationale**: o serializer de detalhe atual incorpora todos os `care_logs` e apenas a primeira imagem, o que não atende a duas linhas do tempo nem ao carregamento progressivo. Endpoints independentes permitem falha, vazio e paginação separados e evitam aumentar continuamente o custo do detalhe.

**Alternatives considered**: uma linha do tempo polimórfica foi rejeitada porque imagens e atividades possuem contratos e mutações diferentes; paginação dentro do detalhe foi rejeitada por acoplar três ciclos de consulta; rolagem infinita automática foi rejeitada porque o botão “Carregar mais” é previsível, acessível e testável.

## Foto representativa e novas entradas visuais

**Decision**: derivar a foto representativa da entrada visual mais recente, com fallback para o campo legado `photo`, e reutilizar em `specimens/services.py` a validação e conversão AVIF do cadastro. A criação recebe `image`, `captured_at` e `notes` em multipart e compensa o arquivo se a transação falhar.

**Rationale**: a linha do tempo precisa acrescentar fotos sem substituir registros anteriores, enquanto coleção e detalhe ainda dependem de uma capa. Compartilhar o processamento evita limites divergentes e mantém os formatos e tamanho já adotados.

**Alternatives considered**: sobrescrever `Specimen.photo` foi rejeitado por destruir a progressão histórica; duplicar a rotina de imagem em outro serializer foi rejeitado por criar duas regras; aceitar URL remota foi rejeitado porque o fluxo é de anexo local validado.

## Atualização, métricas e concorrência

**Decision**: usar um serializer específico de atualização para `nickname`, `location_in_home`, `acquired_at`, `initial_soil`, `initial_light`, `vitality_index`, `soil_moisture`, `lux_intensity` e `is_active`. O cliente envia `expected_updated_at`; o servidor bloqueia a linha, compara a versão e responde 409 em conflito. `metrics_updated_at` muda somente quando ao menos uma métrica é alterada.

**Rationale**: uma lista explícita impede troca de espécie e alteração acidental de campos históricos. A versão evita que uma edição aberta antes de um arquivamento em outra sessão sobrescreva silenciosamente o estado atual. Um instante próprio para métricas permite informar sua atualização real sem usar qualquer alteração cadastral como aproximação.

**Alternatives considered**: usar `updated_at` apenas para exibição foi rejeitado porque alteração de nome pareceria nova medição; último escritor vencer foi rejeitado por não tratar a edição concorrente; criar histórico completo de métricas foi rejeitado porque a especificação limita o escopo ao estado atual.

## Arquivamento e exclusão

**Decision**: representar arquivamento e reativação por `is_active` no PATCH do exemplar e remover DELETE do viewset público. Exemplar arquivado continua consultável pelo proprietário, com fotos, atividades e espécie intactas.

**Rationale**: o modelo já possui o estado reversível e a especificação exclui remoção permanente. Manter a consulta do arquivado é necessário para reativação e para acesso ao histórico.

**Alternatives considered**: criar endpoints separados de arquivar e reativar foi rejeitado porque ambos são transições do mesmo campo e usam a mesma regra de versão; soft delete adicional foi rejeitado por duplicar o estado existente; esconder arquivados no detalhe foi rejeitado porque impediria sua recuperação.

## Envios únicos, cache e recuperação

**Decision**: cada formulário ou ação rápida mantém um bloqueio síncrono local além do estado `isPending`; a confirmação rápida fecha somente após sucesso. O frontend conserva o estado em erro e, após sucesso, invalida as query keys relacionadas sem inserir manualmente o mesmo evento no cache.

**Rationale**: o padrão já usado no cadastro fecha a janela entre dois eventos de clique antes de React refletir a mutação. Invalidar e refazer evita duplicação no histórico, e manter o formulário montado oferece nova tentativa com os mesmos dados.

**Alternatives considered**: limpar o formulário antes da resposta foi rejeitado por perder dados; combinar atualização otimista e invalidação foi rejeitado por poder exibir a mesma entrada duas vezes; adicionar chave de idempotência persistida foi rejeitado porque a regra é impedir novo envio enquanto a mutação da própria interface está em andamento, não deduplicar solicitações deliberadas futuras.

## Composição responsiva

**Decision**: manter uma única rota e uma única ordem semântica: cabeçalho, resumo/estado, métricas, ações, atividade e linha visual. Em telas amplas, ResponsiveGrid distribui os módulos; em telas pequenas, os mesmos elementos permanecem em uma coluna e as ações ficam no fluxo, sem barra flutuante.

**Rationale**: os módulos e tokens definidos pela feature 006 já resolvem shell, margens, estados e mídia. A ordem única preserva leitura, teclado e testes entre breakpoints, e ações no fluxo não cobrem conteúdo ou navegação móvel.

**Alternatives considered**: abas exclusivas para cada histórico foram rejeitadas por ocultar contexto; ações fixas sobre o conteúdo foram rejeitadas pelo risco de encobrir a navegação; copiar a estrutura do template fornecido foi rejeitado porque ele é referência de hierarquia, não contrato de navegação ou dados.
