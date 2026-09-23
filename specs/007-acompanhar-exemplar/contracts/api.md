# Contrato de API: Acompanhamento de Exemplar

Todos os endpoints exigem autenticação. Um exemplar ou registro de outra conta responde como recurso não encontrado. Datas e horas usam ISO 8601 com deslocamento; respostas seguem o fuso configurado pelo serviço e o cliente formata para o fuso local.

## Consultar o exemplar

`GET /api/specimens/{specimenId}/`

Resposta `200 OK`:

```json
{
  "id": "9fb42a7a-d374-4d30-84dc-3883c334d4bf",
  "species": 42,
  "species_detail": {
    "id": 42,
    "scientific_name": "Begonia maculata",
    "common_name": "Begônia maculata"
  },
  "nickname": "Begônia da sala",
  "location_in_home": "Janela leste",
  "acquired_at": "2026-08-01",
  "initial_soil": "Substrato drenante",
  "initial_light": "Meia sombra",
  "vitality_index": 86,
  "soil_moisture": 54,
  "lux_intensity": 1200,
  "metrics_updated_at": "2026-09-15T10:30:00-03:00",
  "is_active": true,
  "representative_visual_entry": {
    "id": "43a954b6-5460-43a3-9dd7-c1875ebfbd0d",
    "image": "/media/specimens/initial/2026/09/15/photo.avif",
    "captured_at": "2026-09-14T15:00:00-03:00",
    "notes": "Folha nova"
  },
  "initial_visual_entry": {
    "id": "a8909cf9-8a99-4a73-8850-14a9eb6cdf09",
    "image": "/media/specimens/initial/2026/08/01/initial.avif",
    "captured_at": "2026-08-01T12:00:00-03:00"
  },
  "latest_care_log": {
    "id": "bcfe8bb2-945f-44b6-9b4a-8fd8efcccf27",
    "type": "watering",
    "type_display": "Rega",
    "occurred_at": "2026-09-15T09:00:00-03:00",
    "created_at": "2026-09-15T09:02:00-03:00",
    "notes": ""
  },
  "created_at": "2026-08-01T12:00:00-03:00",
  "updated_at": "2026-09-15T10:30:00-03:00"
}
```

Os históricos completos não são incorporados neste payload. `representative_visual_entry`, `initial_visual_entry` e `latest_care_log` podem ser `null`.

Respostas:

- `404 Not Found`: identificador inexistente ou pertencente a outra conta.

## Atualizar o exemplar

`PATCH /api/specimens/{specimenId}/`

Corpo JSON parcial:

```json
{
  "nickname": "Begônia da janela",
  "location_in_home": "Quarto",
  "acquired_at": "2026-08-01",
  "initial_soil": "Substrato drenante",
  "initial_light": "Meia sombra",
  "vitality_index": 90,
  "soil_moisture": 62,
  "lux_intensity": 1300,
  "is_active": true,
  "expected_updated_at": "2026-09-15T10:30:00-03:00"
}
```

`expected_updated_at` é obrigatório para uma alteração originada pela página. `species`, `owner`, `metrics_updated_at`, `created_at` e `updated_at` não são graváveis. A resposta `200 OK` usa o mesmo formato do detalhe.

Respostas de erro:

- `400 Bad Request`: erros por campo; nenhum valor do payload é persistido.
- `404 Not Found`: exemplar inexistente ou pertencente a outra conta.
- `409 Conflict`: `expected_updated_at` não corresponde à versão atual. O corpo contém `detail` e `updated_at` atuais para orientar a revalidação.
- `405 Method Not Allowed`: tentativa de `DELETE` ou substituição por `PUT`.

## Listar atividades

`GET /api/care-logs/?specimen_id={specimenId}&page={page}`

`specimen_id` é obrigatório. A resposta usa paginação DRF, com 20 itens por padrão e no máximo 50:

```json
{
  "count": 27,
  "next": "http://localhost:8000/api/care-logs/?specimen_id=...&page=2",
  "previous": null,
  "results": [
    {
      "id": "bcfe8bb2-945f-44b6-9b4a-8fd8efcccf27",
      "specimen": "9fb42a7a-d374-4d30-84dc-3883c334d4bf",
      "type": "watering",
      "type_display": "Rega",
      "occurred_at": "2026-09-15T09:00:00-03:00",
      "created_at": "2026-09-15T09:02:00-03:00",
      "notes": ""
    }
  ]
}
```

Resultados são ordenados por `occurred_at`, `created_at` e `id`, todos decrescentes.

Respostas de erro:

- `400 Bad Request`: `specimen_id` ausente ou malformado.
- `404 Not Found`: exemplar inexistente ou pertencente a outra conta.

## Registrar atividade

`POST /api/care-logs/`

Corpo JSON:

```json
{
  "specimen": "9fb42a7a-d374-4d30-84dc-3883c334d4bf",
  "type": "pruning",
  "occurred_at": "2026-09-14T16:20:00-03:00",
  "notes": "Retirada de folha danificada"
}
```

- `type` aceita somente `watering`, `fertilizing`, `repotting`, `pruning` ou `observation`.
- `occurred_at` é obrigatório e não pode ser futuro.
- `notes` é opcional.
- `created_at` é gerado pelo servidor.

Respostas:

- `201 Created`: retorna a atividade criada.
- `400 Bad Request`: erro de campo; nenhum registro é criado.
- `404 Not Found`: exemplar inexistente ou pertencente a outra conta.
- `405 Method Not Allowed`: tentativa de alterar ou excluir uma atividade existente.

## Listar registros visuais

`GET /api/visual-entries/?specimen_id={specimenId}&page={page}`

O filtro, a paginação e os erros seguem o contrato de atividades. A ordem é `captured_at`, `created_at` e `id`, todos decrescentes.

Cada resultado contém `id`, `specimen`, `image`, `captured_at`, `created_at` e `notes`.

## Registrar foto

`POST /api/visual-entries/`

Conteúdo `multipart/form-data`:

| Campo | Obrigatório | Contrato |
|---|---|---|
| `specimen` | sim | UUID de exemplar pertencente à pessoa autenticada. |
| `image` | sim | JPEG, PNG, WebP ou AVIF com até 10 MB; armazenado após normalização AVIF. |
| `captured_at` | sim | Data e hora ISO 8601 não futura. |
| `notes` | não | Observação textual associada à imagem. |

Respostas:

- `201 Created`: retorna a entrada visual criada.
- `400 Bad Request`: arquivo, data ou campo inválido; nenhum registro ou arquivo parcial permanece.
- `404 Not Found`: exemplar inexistente ou pertencente a outra conta.
- `405 Method Not Allowed`: tentativa de alterar ou excluir uma entrada existente.

## Regras comuns de mutação

- O servidor valida o conjunto antes de salvar e usa transação para cada operação.
- O cliente não dispara uma segunda solicitação da mesma ação enquanto a primeira permanece pendente.
- Após sucesso, o cliente revalida o detalhe, a coleção e a primeira página do histórico afetado.
- Após falha, o cliente conserva os dados informados e oferece nova tentativa.
