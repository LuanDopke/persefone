# Modelo de Dados: Minha Coleção

## Campos alterados

### `Species`

| Campo | Tipo | Regras | Finalidade |
|---|---|---|---|
| `is_collection_favorite` | BooleanField | padrão `false` | Preferência de favorita da coleção pessoal. |

### `Specimen`

| Campo | Tipo | Regras | Finalidade |
|---|---|---|---|
| `is_active` | BooleanField | padrão `true` | Distingue exemplares ativos dos removidos, mortos ou doados, sem apagar seu vínculo com a espécie. |

## Projeção de leitura: espécie da coleção

O endpoint não cria uma tabela de agrupamento. Cada item é projetado de `Species` e de seus `Specimen` relacionados:

| Campo | Origem e validação |
|---|---|
| `species_id`, `common_name`, `scientific_name`, `image_url` | Dados da espécie ou imagem substituta quando não houver foto. |
| `specimen_count` | Contagem de exemplares ativos; é positiva para espécies ativas. |
| `is_archived` | `true` quando a espécie não tem exemplares ativos, mas tem histórico de exemplares. |
| `is_favorite` | Preferência persistida em `Species.is_collection_favorite`. |
| `care.water`, `care.nutrients`, `care.light` | Cada indicador contém `needs_attention`, `affected_count` e `total_count`; `affected_count` deve estar entre zero e `total_count`. |
| `care_reference` | Luz e rega de referência quando estiverem disponíveis no catálogo ou no adaptador de vitais. |

## Transições

1. Um exemplar novo inicia ativo e torna sua espécie ativa na coleção.
2. Ao ficar inativo, a espécie continua visível como arquivada se não restar exemplar ativo.
3. Alternar favorita altera apenas `is_collection_favorite` e é refletido imediatamente após atualização otimista e invalidação da consulta.
