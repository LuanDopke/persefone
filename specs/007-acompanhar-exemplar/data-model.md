# Modelo de Dados: Acompanhar e Atualizar Meu Exemplar

## Specimen

Planta individual pertencente a uma pessoa e vinculada a uma espécie canônica. A entidade continua sendo a fonte do estado atual; os históricos são relações separadas.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave gerada pelo servidor e identificação pública do exemplar. |
| `owner` | FK para usuário | Obrigatório; nunca aceito do cliente e usado em todas as consultas relacionadas. |
| `species` | FK para `Species`, `PROTECT` | Obrigatório e imutável neste fluxo. |
| `nickname` | texto, máximo 100 | Obrigatório no estado persistido; pode ser atualizado com texto não vazio após normalização. |
| `location_in_home` | texto, máximo 100 | Opcional; pode ser atualizado. |
| `acquired_at` | data | Obrigatória e não futura no fuso do cliente. |
| `initial_soil` | texto | Descrição atual de solo, não vazia após normalização. O nome legado é mantido para compatibilidade. |
| `initial_light` | enum de texto | Condição atual de luz: `Sombra`, `Meia sombra` ou `Sol pleno`. O nome legado é mantido para compatibilidade. |
| `vitality_index` | inteiro de 0 a 100 | Métrica atual de vitalidade, exibida em porcentagem. |
| `soil_moisture` | inteiro de 0 a 100 | Métrica atual de umidade do solo, exibida em porcentagem. |
| `lux_intensity` | inteiro maior ou igual a 0 | Métrica atual de luminosidade, exibida em lux. |
| `metrics_updated_at` | data e hora | Instante da última alteração de qualquer uma das três métricas; preenchido na migração com `updated_at`. |
| `photo` | URL legada | Compatibilidade de leitura quando não houver `VisualEntry`; não recebe novos uploads deste fluxo. |
| `is_active` | booleano | `true` para ativo e `false` para arquivado; a transição é reversível. |
| `created_at` | data e hora | Auditoria gerada pelo servidor. |
| `updated_at` | data e hora | Versão da entidade, renovada após cada atualização aceita. |

### Regras de atualização

- O cliente pode alterar somente `nickname`, `location_in_home`, `acquired_at`, `initial_soil`, `initial_light`, `vitality_index`, `soil_moisture`, `lux_intensity` e `is_active`.
- `owner`, `species`, `id`, `created_at`, `updated_at` e `metrics_updated_at` são somente leitura.
- A atualização recebe `expected_updated_at`; sob bloqueio transacional, o valor precisa corresponder à versão persistida.
- Se qualquer campo for inválido ou a versão divergir, nenhum campo é salvo.
- `metrics_updated_at` muda somente quando ao menos uma métrica recebe valor diferente do persistido.
- A atualização de `is_active` não remove nem altera `CareLog`, `VisualEntry` ou `Species`.
- A API não expõe exclusão permanente de exemplar.

### Transições de estado

```text
ativo (is_active=true) --arquivar--> arquivado (is_active=false)
arquivado (is_active=false) --reativar--> ativo (is_active=true)
```

As duas transições usam o mesmo contrato de PATCH e controle de versão. Repetir o valor atual é uma atualização idempotente sem perda de histórico.

## CareLog

Evento histórico de cuidado ou observação. Depois de criado, não pode ser alterado nem removido pela API desta feature.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave gerada pelo servidor. |
| `specimen` | FK para `Specimen`, `CASCADE` | Obrigatório; o exemplar precisa pertencer à pessoa autenticada. |
| `type` | enum de texto | `watering`, `fertilizing`, `repotting`, `pruning` ou `observation`. |
| `occurred_at` | data e hora | Instante do fato, informado pelo cliente, obrigatório, não futuro e imutável. |
| `created_at` | data e hora | Instante de registro gerado pelo servidor e imutável. |
| `notes` | texto | Opcional; espaços externos são removidos. |

### Ordenação e migração

- A ordem padrão é `occurred_at` decrescente, depois `created_at` decrescente e `id` como desempate estável.
- O campo atual `timestamp` é renomeado para `occurred_at`, preservando todos os valores.
- Para registros anteriores, `created_at` recebe o mesmo valor histórico de `occurred_at` durante a migração.
- A criação rápida usa o instante atual do cliente em ISO 8601 e nota vazia, mas passa pela mesma validação da criação detalhada.

## VisualEntry

Registro visual histórico acrescentado ao exemplar. Não substitui nem remove entradas anteriores.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave gerada pelo servidor. |
| `specimen` | FK para `Specimen`, `CASCADE` | Obrigatório; o exemplar precisa pertencer à pessoa autenticada. |
| `image` | `ImageField` | Obrigatório; conteúdo de imagem, até 10 MB antes da normalização e armazenado em AVIF segundo a configuração existente. |
| `captured_at` | data e hora | Instante da captura, informado pelo cliente, obrigatório, não futuro e imutável. |
| `created_at` | data e hora | Instante de registro gerado pelo servidor e imutável. |
| `notes` | texto | Observação opcional associada à imagem. |

### Ordenação, capa e atomicidade

- A ordem padrão é `captured_at` decrescente, depois `created_at` decrescente e `id` como desempate estável.
- A foto representativa é a entrada visual mais recente; quando não houver entrada, o campo legado `Specimen.photo` pode servir como fallback.
- `initial_visual_entry` continua representando a primeira entrada por `created_at` para compatibilidade com o cadastro existente.
- Validação, processamento do arquivo e criação do registro pertencem a uma unidade transacional; se o banco falhar depois do armazenamento, o arquivo é removido por compensação.
- Entradas visuais não expõem atualização nem exclusão nesta feature.

## Métrica atual

Métrica atual é um conceito de apresentação sobre três campos de `Specimen`, não uma nova tabela.

| Identificador | Fonte | Escala ou unidade |
|---|---|---|
| `vitality_index` | `Specimen.vitality_index` | 0–100% |
| `soil_moisture` | `Specimen.soil_moisture` | 0–100% |
| `lux_intensity` | `Specimen.lux_intensity` | lux, mínimo 0 |

As três métricas compartilham `metrics_updated_at`. A feature não cria séries temporais, gráficos de medição nem recomendações automáticas.

## Relacionamentos e invariantes

```text
User 1 ── N Specimen N ── 1 Species
                  │
                  ├── 0..N CareLog
                  └── 0..N VisualEntry
```

- Toda leitura ou escrita parte de um `Specimen` filtrado por `owner`.
- Um identificador pertencente a outra conta é indistinguível de um inexistente para o cliente e retorna 404.
- Arquivamento não altera os relacionamentos.
- `CareLog.occurred_at` e `VisualEntry.captured_at` podem ser anteriores a `created_at`, nunca futuros no instante da validação.
- Paginação não altera a ordem total; os desempates evitam repetição ou salto quando dois eventos compartilham o mesmo instante.
