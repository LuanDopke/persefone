# Contrato de UI: Cadastro de Exemplar

## Rotas

| Rota | Comportamento observável |
|---|---|
| `/specimens/new` | Exibe o formulário autenticado de cadastro. |
| `/specimens/instances/:specimenId` | Exibe o detalhe do exemplar criado; é o destino após sucesso. |

## Campos e identificadores testáveis

| Identificador | Papel |
|---|---|
| `taxonomy-search` | Entrada de busca por espécie ou gênero. |
| `taxonomy-results` | Lista de resultados selecionáveis. |
| `taxonomy-create-name` | Nome usado na criação local quando não há resultado. |
| `initial-soil` | Descrição obrigatória de solo. |
| `initial-light` | Seleção obrigatória com `Sombra`, `Meia sombra` e `Sol pleno`. |
| `acquired-at` | Data iniciada com o dia local e limitada ao dia local atual. |
| `nickname` | Apelido opcional. |
| `initial-photo` | Seletor de no máximo uma imagem. |
| `specimen-submit` | Confirmação desabilitada enquanto a mutação está pendente. |

Os identificadores são valores de `id` ou seletores acessíveis estáveis para testes. Todos os campos possuem rótulo associado e mensagens de erro contextuais referenciadas por `aria-describedby`.

## Estados

- **Inicial**: data local preenchida, nenhum resultado ou arquivo selecionado.
- **Buscando taxonomia**: mantém o termo visível e apresenta indicação de carregamento sem bloquear os demais campos.
- **Taxonomia ausente**: oferece criar a entrada com o nome digitado no mesmo fluxo.
- **Taxonomia selecionada**: mostra uma única seleção e permite trocá-la antes do envio.
- **Enviando**: desabilita `specimen-submit` e não dispara uma segunda mutação.
- **Erro de campo**: posiciona a mensagem junto ao campo e conserva todos os valores e a seleção de arquivo que o navegador permitir conservar.
- **Erro geral**: apresenta aviso de nova tentativa sem desmontar o formulário.
- **Sucesso**: invalida as consultas de coleção e exemplares e navega para `/specimens/instances/:specimenId` usando o `id` retornado.

## Apresentação responsiva

Em telas móveis, as seções e ações ocupam uma coluna e largura disponível. Em telas maiores, os campos podem formar uma grade sem alterar a ordem de leitura. Controles usam bordas de 4px, cantos retos, sombras rígidas, foco de alto contraste e os componentes centrais `Input`, `Button` e `Card`; taxonomia e foto ficam em componentes próprios.
