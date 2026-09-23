# Contrato de API: Cadastro de Exemplar

Todos os endpoints exigem autenticação. Dados de exemplar são sempre limitados ao usuário autenticado.

## Pesquisar taxonomia

`GET /api/species/?search={term}`

Retorna a paginação DRF existente. Cada resultado selecionável contém ao menos `id`, `scientific_name`, `common_name`, `family`, `genus` e `is_owned`. A pesquisa aceita espécie ou gênero e consulta o catálogo local persistido.

## Criar taxonomia local

`POST /api/species/local/`

Corpo JSON:

```json
{
  "scientific_name": "Begonia sp."
}
```

Respostas:

- `201 Created`: cria e retorna a entrada taxonômica.
- `200 OK`: uma entrada equivalente já existe; retorna essa entrada para seleção e inclui `created: false`.
- `400 Bad Request`: `scientific_name` vazio ou inválido, no formato de erro de campo do DRF.

O identificador `Begonia sp.` deve ser aceito exatamente como escrito. A detecção de duplicidade ignora diferenças de caixa e espaços redundantes sem alterar a grafia já persistida.

## Criar exemplar

`POST /api/specimens/`

Conteúdo `multipart/form-data`:

| Campo | Obrigatório | Contrato |
|---|---|---|
| `species` | sim | Identificador inteiro de uma entrada taxonômica existente. |
| `nickname` | não | Texto de até 100 caracteres; vazio aciona o nome padrão. |
| `acquired_at` | sim | Data ISO `YYYY-MM-DD`, não posterior à data atual no fuso informado. |
| `client_timezone` | sim no frontend | Nome IANA, por exemplo `America/Sao_Paulo`; usado apenas na validação e não persistido. |
| `initial_soil` | sim | Texto livre não vazio. |
| `initial_light` | sim | Exatamente `Sombra`, `Meia sombra` ou `Sol pleno`. |
| `initial_photo` | não | No máximo um arquivo de imagem aceito. |

Resposta `201 Created`:

```json
{
  "id": "9fb42a7a-d374-4d30-84dc-3883c334d4bf",
  "species": 42,
  "species_detail": {
    "id": 42,
    "scientific_name": "Begonia sp."
  },
  "nickname": "Begonia sp. #1",
  "acquired_at": "2026-09-15",
  "initial_soil": "Substrato drenante",
  "initial_light": "Meia sombra",
  "initial_visual_entry": {
    "id": "a8909cf9-8a99-4a73-8850-14a9eb6cdf09",
    "image": "/media/specimens/...",
    "captured_at": "2026-09-15T10:45:00-03:00"
  }
}
```

`initial_visual_entry` é `null` quando nenhuma foto é enviada. O proprietário não aparece como campo gravável.

Erros `400 Bad Request` usam chaves iguais aos campos do formulário, preservando a associação de mensagens no cliente. Uma espécie removida antes da confirmação retorna erro em `species`; data futura retorna erro em `acquired_at`; arquivo inválido retorna erro em `initial_photo`. Nenhum erro cria um exemplar parcial.

## Consultar exemplar criado

`GET /api/specimens/{specimenId}/`

Retorna o detalhe somente se o exemplar pertencer ao usuário autenticado; caso contrário responde `404 Not Found`. O detalhe inclui taxonomia, apelido, data de aquisição, condições iniciais e entradas visuais.

