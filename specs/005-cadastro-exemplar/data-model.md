# Modelo de Dados: Cadastro de Novo Exemplar

## Species

Entrada taxonômica canônica reutilizada por vários exemplares. O nome público continua em `scientific_name`; registros locais podem não possuir `gbif_key`.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | inteiro | Chave primária existente. |
| `scientific_name` | texto, máximo 255 | Obrigatório; conserva a grafia exibida, inclusive `Begonia sp.`. |
| `normalized_name` | texto, máximo 255 | Obrigatório, indexado e único; derivado de `scientific_name` pela consolidação de espaços e comparação sem distinção de caixa. Não é fornecido pelo cliente. |
| `genus` | texto, máximo 100 | Para a forma de gênero indeterminado, recebe `Begonia`; nos demais casos segue o dado taxonômico conhecido. |
| `gbif_key` | inteiro anulável | Continua único quando presente; permanece nulo para uma entrada criada somente pelo nome. |
| demais campos taxonômicos | campos existentes | Mantêm os defaults atuais quando desconhecidos. |

### Regras e transições

- A criação normaliza o nome após remover espaços nas extremidades e consolidar espaços internos; um resultado vazio é inválido.
- A restrição única de `normalized_name` é a autoridade contra duplicidade. Se duas criações concorrentes usarem o mesmo nome normalizado, uma cria e a outra recebe a entrada persistida.
- `Begonia sp.` é válido e não exige epíteto específico. Sua forma exibida não é reescrita.
- Esta feature cria ou seleciona entradas, mas não corrige, mescla nem remove taxonomia.

## Specimen

Planta física pertencente a um usuário e ligada a uma única entrada taxonômica.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado pelo servidor. |
| `owner` | FK para usuário | Obrigatório, definido por `request.user` e não aceito do cliente. |
| `species` | FK para `Species`, `PROTECT` | Obrigatório; deve existir no momento da transação. |
| `nickname` | texto, máximo 100 | Opcional na entrada; persistido com valor informado sem espaços externos ou com nome padrão gerado pelo servidor. |
| `acquired_at` | data | Obrigatória; deve ser anterior ou igual à data atual no `client_timezone`. |
| `initial_soil` | texto | Obrigatório após remoção de espaços externos. |
| `initial_light` | enum de texto | Obrigatório; somente `Sombra`, `Meia sombra` ou `Sol pleno`. |
| campos vitais e de estado | campos existentes | Conservam os defaults vigentes. |
| `photo` | compatibilidade de leitura | A capa exposta às telas existentes deriva da primeira `VisualEntry`; o campo legado é migrado ou mantido apenas durante a transição definida na implementação. |

### Nome padrão

Quando `nickname` não é informado, o servidor usa o nome taxonômico e acrescenta um diferenciador dentro da coleção do proprietário, por exemplo `Begonia sp. #2`. A geração ocorre dentro da transação de criação e nunca produz texto vazio.

### Regras e transições

- Estado inicial do formulário: sem `species`, com `acquired_at` igual à data local atual, sem apelido ou foto.
- Estado válido para envio: taxonomia selecionada, `initial_soil` não vazio, `initial_light` pertencente ao enum e data não futura.
- Estado de persistência: `pending` existe apenas no cliente; o botão permanece desabilitado até sucesso ou erro.
- Sucesso: exemplar persistido e, quando enviada, exatamente uma `VisualEntry` inicial.
- Falha: nenhum exemplar ou entrada visual parcial permanece; o formulário conserva seus valores no cliente.

## VisualEntry

Registro cronológico de uma imagem na linha do tempo visual do exemplar.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado pelo servidor. |
| `specimen` | FK para `Specimen`, `CASCADE` | Obrigatório; relação reversa ordenada cronologicamente. |
| `image` | `ImageField` | Obrigatório; valida conteúdo de imagem e tamanho máximo definido na configuração do serviço. |
| `captured_at` | data e hora | Definida pelo servidor na criação e imutável nesta feature. |
| `created_at` | data e hora | Auditoria gerada pelo servidor. |

### Relacionamentos e invariantes

- Um `Species` pode identificar vários `Specimen`; cada `Specimen` pertence a um único usuário.
- Um `Specimen` pode ter várias `VisualEntry` ao longo da vida, mas o cadastro aceita no máximo uma.
- Sem arquivo no cadastro, nenhuma `VisualEntry` é criada.
- Com arquivo válido, a criação do `Specimen` e da primeira `VisualEntry` pertence à mesma unidade transacional.
- A primeira entrada visual fornece a imagem de capa usada pela projeção da coleção.
