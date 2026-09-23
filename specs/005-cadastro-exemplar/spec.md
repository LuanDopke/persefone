# Especificação: Cadastro de Novo Exemplar

**Feature Branch**: `005-cadastro-exemplar`  
**Created**: 2026-09-14  
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Cadastrar um exemplar identificado (Priority: P1)

Como usuário do sistema, quero registrar uma planta vinculando-a a uma espécie ou gênero e informando suas condições iniciais, para incluí-la na minha coleção e iniciar seu acompanhamento.

**Why this priority**: Sem o cadastro básico, o exemplar não existe na coleção e nenhum acompanhamento posterior pode ocorrer.

**Independent Test**: Selecionar uma entrada taxonômica existente, informar solo e luminosidade, manter a data sugerida e salvar; o exemplar deve aparecer identificado e disponível para consulta.

**Acceptance Scenarios**:

1. **Given** que o usuário está no cadastro e encontra uma espécie ou gênero no catálogo, **When** seleciona o resultado, informa solo e luminosidade e confirma, **Then** o sistema cria um exemplar vinculado à entrada selecionada.
2. **Given** que a data de aquisição não foi alterada, **When** o usuário salva o cadastro, **Then** o exemplar é registrado com a data atual.
3. **Given** que o usuário informa uma data anterior ou igual à data atual, **When** salva o cadastro, **Then** o exemplar é registrado com a data escolhida.
4. **Given** que o usuário não selecionou uma espécie ou gênero, **When** tenta salvar, **Then** o sistema impede o cadastro e identifica o campo obrigatório.
5. **Given** que o usuário informa uma data futura, **When** tenta salvar, **Then** o sistema impede o cadastro e informa o limite aceito.
6. **Given** que o cadastro é concluído, **When** o salvamento termina, **Then** o usuário é direcionado ao detalhe do exemplar recém-criado.

### User Story 2 - Registrar taxonomia ausente durante o cadastro (Priority: P2)

Como usuário que não encontra sua planta no catálogo, quero criar uma entrada taxonômica somente com o nome conhecido, inclusive no formato de gênero não identificado até espécie, para concluir o cadastro sem abandonar o fluxo.

**Why this priority**: O catálogo incompleto não deve impedir o registro de uma planta, mas o fluxo principal já entrega valor quando a entrada existe.

**Independent Test**: Buscar um nome ausente, cadastrar `Begonia sp.` somente com esse nome e concluir o exemplar; a nova entrada deve permanecer disponível em buscas futuras.

**Acceptance Scenarios**:

1. **Given** que a busca não retorna a planta desejada, **When** o usuário cria uma entrada informando somente o nome, **Then** essa entrada pode ser selecionada no cadastro atual.
2. **Given** que uma nova entrada foi criada durante o cadastro, **When** outro cadastro consulta o mesmo nome, **Then** a entrada está disponível no catálogo.
3. **Given** que já existe uma entrada com o mesmo nome taxonômico, **When** o usuário tenta cadastrá-la novamente, **Then** o sistema evita a duplicidade e permite selecionar a entrada existente.
4. **Given** que o campo de nome da nova entrada está vazio, **When** o usuário tenta confirmá-la, **Then** o sistema não cria a entrada e informa que o nome é obrigatório.

### User Story 3 - Personalizar a identificação e iniciar a linha do tempo (Priority: P3)

Como usuário, quero definir um apelido e adicionar uma foto inicial opcional, para reconhecer o exemplar e começar seu histórico visual no momento do cadastro.

**Why this priority**: Apelido e foto melhoram a identificação, mas não são necessários para registrar e acompanhar o exemplar.

**Independent Test**: Cadastrar um exemplar com apelido e foto e outro sem esses dados; o primeiro deve iniciar com a foto na linha do tempo e o segundo deve receber um nome padrão sem criar registro visual vazio.

**Acceptance Scenarios**:

1. **Given** que o usuário informa um apelido, **When** salva o cadastro, **Then** o exemplar é exibido com o apelido informado.
2. **Given** que o apelido está vazio, **When** o usuário salva, **Then** o sistema atribui automaticamente um nome identificável ao exemplar.
3. **Given** que o usuário anexa uma foto válida, **When** salva o cadastro, **Then** a foto é associada ao exemplar e se torna a primeira entrada de sua linha do tempo visual.
4. **Given** que nenhuma foto foi anexada, **When** o usuário salva, **Then** o exemplar é criado sem uma entrada visual vazia e pode receber fotos posteriormente.
5. **Given** que o arquivo escolhido não é uma foto aceita, **When** o usuário tenta concluir o cadastro, **Then** o sistema rejeita o arquivo, preserva os demais dados preenchidos e explica como corrigir o problema.

### Edge Cases

- Como o sistema preserva os dados preenchidos quando o cadastro do exemplar ou o envio da foto falha?
- O que acontece quando a entrada taxonômica selecionada é removida ou deixa de estar disponível antes da confirmação?
- Como diferenças de maiúsculas, espaços e acentos são tratadas ao detectar nomes taxonômicos duplicados?
- Como o sistema determina a data atual perto da mudança de dia no fuso horário do usuário?
- O que ocorre se o usuário confirmar o formulário mais de uma vez durante um salvamento em andamento?
- Como uma foto válida é tratada quando o exemplar é salvo, mas a criação da entrada visual não pode ser concluída?
- Os valores preenchidos permanecem disponíveis após recarregamento involuntário da página antes da confirmação?

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que o usuário pesquise entradas taxonômicas por espécie ou gênero durante o cadastro do exemplar.
- **FR-002**: O sistema DEVE permitir selecionar uma única entrada taxonômica existente para cada exemplar.
- **FR-003**: O sistema DEVE exigir uma espécie ou gênero antes de criar o exemplar.
- **FR-004**: O sistema DEVE permitir criar, dentro do cadastro do exemplar, uma entrada taxonômica ausente usando somente seu nome.
- **FR-005**: O sistema DEVE aceitar um nome em nível de gênero sem espécie determinada, como `Begonia sp.`.
- **FR-006**: O sistema DEVE impedir a criação de entradas taxonômicas duplicadas e oferecer a entrada existente para seleção.
- **FR-007**: O sistema DEVE exigir uma descrição de solo em texto livre para registrar a condição inicial do exemplar.
- **FR-008**: O sistema DEVE exigir que a luminosidade inicial seja uma entre `Sombra`, `Meia sombra` e `Sol pleno`.
- **FR-009**: O sistema DEVE preencher inicialmente a data de aquisição com a data atual do usuário.
- **FR-010**: O sistema DEVE permitir alterar a data de aquisição para qualquer data anterior ou igual à data atual.
- **FR-011**: O sistema DEVE rejeitar uma data de aquisição posterior à data atual.
- **FR-012**: O sistema DEVE permitir um apelido opcional e gerar um nome padrão identificável quando ele não for informado.
- **FR-013**: O sistema DEVE permitir anexar no máximo uma foto durante o cadastro sem tornar a foto obrigatória.
- **FR-014**: O sistema DEVE transformar a foto anexada em primeira entrada da linha do tempo visual do exemplar após o cadastro bem-sucedido.
- **FR-015**: O sistema DEVE criar o exemplar sem entrada visual quando nenhuma foto for anexada.
- **FR-016**: O sistema DEVE impedir confirmações duplicadas enquanto o cadastro estiver sendo processado.
- **FR-017**: O sistema DEVE direcionar o usuário ao detalhe do exemplar recém-criado após o salvamento bem-sucedido.
- **FR-018**: O sistema DEVE apresentar erros de validação no contexto dos respectivos campos sem apagar os demais dados preenchidos.

### Key Entities

- **Exemplar**: planta física pertencente ao usuário; possui espécie ou gênero, apelido, data de aquisição, condição inicial de solo e luminosidade e pode ter uma foto inicial.
- **Entrada taxonômica**: identificação reutilizável de uma espécie ou gênero no catálogo; possui nome e pode ser relacionada a vários exemplares.
- **Entrada visual**: registro cronológico de uma foto associada a um exemplar; a primeira entrada pode nascer junto com o cadastro.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Pelo menos 95% dos usuários de teste concluem um cadastro com entrada taxonômica existente sem assistência em até 2 minutos.
- **SC-002**: Em 100% dos cadastros válidos, o exemplar aparece no detalhe com espécie ou gênero, solo, luminosidade e data de aquisição iguais aos valores confirmados.
- **SC-003**: Em 100% dos cadastros sem data alterada, a data registrada corresponde à data atual do usuário; nenhuma data futura é aceita.
- **SC-004**: Em 100% dos cadastros sem apelido, o exemplar recebe um nome não vazio e distinguível na coleção.
- **SC-005**: Em 100% dos cadastros com foto aceita, existe exatamente uma primeira entrada visual associada ao exemplar; sem foto, não existe entrada visual vazia.
- **SC-006**: Um usuário de teste consegue criar uma entrada taxonômica ausente e concluir o exemplar no mesmo fluxo, sem navegar para outra área.
- **SC-007**: Tentativas repetidas de confirmação durante o processamento resultam em um único exemplar criado.
- **SC-008**: Todos os cenários de aceitação desta especificação passam antes da disponibilização da funcionalidade.

## Assumptions

- O cadastro é realizado por um usuário já autenticado e associa o exemplar à sua própria coleção.
- Solo é obrigatório e informado como texto livre; a padronização desse conteúdo não faz parte desta feature.
- O nome padrão do exemplar deriva da entrada taxonômica e inclui um diferenciador quando necessário, sem exigir que o usuário conheça uma sequência interna.
- A data atual considera o fuso horário apresentado ao usuário no formulário.
- Correção, enriquecimento e mesclagem posterior de entradas taxonômicas pertencem à manutenção do catálogo, fora deste escopo.
- Alterações posteriores de solo e luminosidade pertencem ao detalhe do exemplar, fora deste escopo.
- Fotos adicionais são incluídas posteriormente pela linha do tempo visual, fora deste escopo.

## Verbatim Constraints

- A feature deve usar o identificador `005-cadastro-exemplar`.
- Um gênero sem espécie determinada deve aceitar a forma `Begonia sp.`.
- As opções de luminosidade devem ser exatamente `Sombra`, `Meia sombra` e `Sol pleno`.
