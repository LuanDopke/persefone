# Observações e identificação progressiva

Todos os endpoints exigem autenticação. Uma observação só pode ser lida ou alterada por seu proprietário; identificadores de outros usuários respondem 404.

## Ficha

- `GET /api/observations/?page=N&search=texto&status=pending|confirmed`: lista paginada, 20 fichas por página, filtrada antes da paginação. `search` procura título, espécie confirmada e nomes das hipóteses. `status` vazio retorna todas; outros valores respondem 400. A lista retorna `id`, `title`, `species_detail`, `image`, `observed_at`, `updated_at` e `active_hypotheses_count`.
- `POST /api/observations/`: `multipart/form-data` com `title` obrigatório (até 160 caracteres), `observed_at`, `initial_notes`, `image`, `latitude` e `longitude` opcionais. Foto e espécie não são obrigatórias. `species` permanece aceito apenas na criação para compatibilidade com clientes anteriores e gera confirmação inicial.
- `GET /api/observations/{id}/`: ficha com `species_detail` nulo enquanto a identificação está aberta, `evidence`, `hypotheses`, `identification_events` e `image` de capa derivada da evidência mais recente com foto.
- `PATCH /api/observations/{id}/`: altera título e localização principal. Espécie não é alterada por PATCH.

Latitude e longitude devem ser fornecidas juntas, nos intervalos de −90 a 90 e −180 a 180. O local é opcional e não é obtido sem uma ação do usuário. O mapa usa mosaicos do OpenStreetMap.

## Evidências

`POST /api/observations/{id}/evidence/` aceita `multipart/form-data` com foto ou nota obrigatória, `observed_at` opcional, `subject` igual a `original` ou `comparison`, e coordenadas opcionais. A data não pode estar no futuro. Fotos seguem a validação e compressão AVIF já usadas no projeto. Evidências de outro indivíduo pertencem à mesma ficha e são identificadas como comparação.

`PATCH /api/observations/{id}/evidence/{evidenceId}/` corrige `notes`, `observed_at`, `subject`, `latitude` e `longitude`. Para remover a localização, envie ambas as coordenadas como `null`. A foto original permanece. Cada alteração efetiva registra `before`, `after` e `created_at` em `revisions`, retornado junto à evidência.

## Hipóteses e decisões

- `POST /api/observations/{id}/hypotheses/`: cria hipótese com `source` `catalog` ou `manual`, `rank` `genus`, `species` ou `unknown`, `name` e `notes`. Uma hipótese de catálogo aponta para `species` local ou `gbif_key`. Texto livre não cria espécie no catálogo.
- `PATCH /api/observations/{id}/hypotheses/{hypothesisId}/` aceita `notes` para corrigir a justificativa e `status` igual a `active` ou `discarded`. Muda o estado sem apagar o registro. A hipótese confirmada só pode ser descartada após reabrir a identificação. Cada alteração efetiva é preservada em `revisions`.
- `POST /api/observations/{id}/confirm/` com `{"hypothesis_id":"...","notes":"..." }`: confirma hipótese ativa de espécie vinculada ao catálogo. Um gênero, texto livre ou entrada local `sp.` não pode ser confirmado. Para candidato GBIF, o servidor consulta e valida o nível taxonômico antes de criar ou reutilizar a entrada local.
- `POST /api/observations/{id}/reopen/` com `{"notes":"..." }`: remove a identificação atual e permite nova confirmação.

Confirmações e reaberturas são preservadas em `identification_events`. A migração dos registros anteriores preserva fotos, marca a espécie existente como confirmada e cria o evento correspondente.

Criar ou corrigir evidências e hipóteses atualiza `updated_at` da ficha, usado para ordenar as observações recentes.

Uma hipótese também pode nascer do resultado de uma chave de identificação comunitária. O percurso, suas respostas e a versão da chave ficam ligados à ficha conforme [o contrato das chaves](identification-keys.md); chegar ao táxon não confirma automaticamente a espécie.
