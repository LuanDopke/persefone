# Contrato de Interface: Minha Coleção

## Rota de coleção

`GET /api/specimens/collection/`

Parâmetros opcionais: `page`, `page_size`, `search`, `attention`, `favorite`, `light`, `water` e `archived`.

O resultado é paginado por espécie e tem a forma:

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "species_id": 12,
      "common_name": "Costela-de-adão",
      "scientific_name": "Monstera deliciosa",
      "image_url": null,
      "specimen_count": 3,
      "is_archived": false,
      "is_favorite": true,
      "care": {
        "water": { "needs_attention": true, "affected_count": 1, "total_count": 3 },
        "nutrients": { "needs_attention": false, "affected_count": 0, "total_count": 3 },
        "light": { "needs_attention": false, "affected_count": 0, "total_count": 3 }
      },
      "care_reference": { "light": null, "water": null }
    }
  ]
}
```

Espécies ativas precedem as arquivadas. A busca corresponde parcialmente aos nomes comum e científico. `attention=true` conserva espécies com pelo menos um indicador em atenção.

### Paginação e filtros validados

- `GET /api/specimens/collection/?page=2&page_size=20` retorna a página seguinte, com no máximo 50 itens por página.
- `search=monstera` procura nos nomes comum e científico; `attention=true`, `favorite=true`, `water=true` e `light=true` podem ser combinados.
- `archived=true` mostra somente espécies sem exemplar ativo. Sem esse parâmetro, as ativas são retornadas antes das arquivadas.

## Ação de favorita

`PATCH /api/specimens/collection/{species_id}/favorite/`

Corpo: `{ "is_favorite": true }`. A resposta retorna o item atualizado, incluindo `is_favorite`.

## Contrato de interface React

- A rota visível é `Minha Coleção`; a navegação `Discover` continua separada.
- A grade deve incluir a classe `sm:grid-cols-2 lg:grid-cols-3`.
- Um indicador em atenção apresenta sua proporção no formato `1 de 3`; um indicador sem atenção é neutro.
- O card é selecionável para o detalhe da espécie, mas o controle de favorita não deve acionar essa navegação.
- Carregamento, erro com nova tentativa, coleção vazia e nenhum resultado oferecem estado explícito e ação aplicável.
