# Especificação da Funcionalidade: Minha Coleção

**Objetivo**: Permitir que cada usuário acompanhe, por espécie, as plantas que possui e identifique os cuidados que requerem atenção.

## User Scenarios & Testing

### User Story 1 - Consultar a coleção por espécie (Priority: P1)

O usuário abre Minha Coleção e vê uma grade pessoal, separada do catálogo geral Discover, com uma entrada para cada espécie que possui. Cada entrada permite reconhecer a espécie e sua quantidade de exemplares sem precisar percorrer os registros individuais.

**Why this priority**: Esta é a finalidade principal da tela e torna a coleção pessoal consultável.

**Independent Test**: Cadastrar exemplares de duas espécies, incluindo mais de um exemplar de uma delas, abrir Minha Coleção e confirmar que a grade contém duas entradas, com as quantidades corretas.

**Acceptance Scenarios**:

1. **Given** que o usuário possui exemplares de cinco espécies, **When** abre Minha Coleção, **Then** vê cinco cards, um para cada espécie.
2. **Given** que uma espécie possui três exemplares, **When** o usuário visualiza seu card, **Then** vê a quantidade de três exemplares.
3. **Given** que uma espécie não possui foto disponível, **When** o usuário visualiza seu card, **Then** vê uma imagem substituta sem que o card fique incompleto.
4. **Given** que o nome de uma espécie é extenso, **When** o espaço do card não comporta o texto, **Then** o nome é encurtado visualmente e permanece disponível por meio acessível.

---

### User Story 2 - Identificar cuidados pendentes (Priority: P1)

Ao consultar a coleção, o usuário vê em cada espécie um resumo independente de água, nutrientes e luz. O resumo revela quantos exemplares precisam de cada cuidado, permitindo priorizar a rotina diária sem abrir cada exemplar.

**Why this priority**: O resumo de atenção transforma a lista em instrumento de cuidado diário.

**Independent Test**: Criar três exemplares da mesma espécie, fazer apenas um requerer água e abrir a coleção para confirmar o indicador de água com a proporção correta, sem alterar os demais indicadores.

**Acceptance Scenarios**:

1. **Given** que um de três exemplares requer água, **When** o usuário visualiza a espécie, **Then** o indicador de água é destacado e informa `1 de 3`.
2. **Given** que nenhum exemplar requer nutrientes, **When** o usuário visualiza a espécie, **Then** o indicador de nutrientes aparece em estado neutro.
3. **Given** que há exemplares requerendo água e luz, **When** o usuário visualiza a espécie, **Then** os dois indicadores aparecem destacados de forma independente.

---

### User Story 3 - Encontrar e organizar espécies (Priority: P2)

O usuário pesquisa por nome comum ou científico e aplica filtros para reduzir a coleção às espécies relevantes, como favoritas ou que precisam de atenção. Ele também pode marcar uma espécie como favorita diretamente na grade.

**Why this priority**: A organização reduz o tempo de consulta conforme a coleção cresce, sem bloquear a visualização inicial.

**Independent Test**: Com espécies de nomes distintos e estados de cuidado distintos, pesquisar um nome e aplicar o filtro de atenção para confirmar que apenas as espécies correspondentes permanecem visíveis.

**Acceptance Scenarios**:

1. **Given** que a coleção contém nomes comuns e científicos distintos, **When** o usuário pesquisa um termo correspondente, **Then** vê somente as espécies compatíveis.
2. **Given** que uma espécie requer atenção, **When** o usuário aplica o filtro de atenção, **Then** essa espécie é exibida.
3. **Given** que nenhum resultado corresponde à busca ou aos filtros, **When** a filtragem é aplicada, **Then** o usuário vê a opção de limpar os filtros.
4. **Given** que uma espécie não está marcada como favorita, **When** o usuário a marca como favorita no card, **Then** o estado visual é atualizado sem exigir nova abertura da tela.

---

### User Story 4 - Prosseguir para os exemplares (Priority: P2)

Ao selecionar uma espécie da grade, o usuário segue para o detalhe da espécie e pode acessar os seus exemplares individuais. Quando ainda não há espécies, ele recebe orientação para cadastrar o primeiro exemplar.

**Why this priority**: A navegação liga o panorama por espécie ao acompanhamento individual e fornece uma saída útil para uma coleção vazia.

**Independent Test**: Selecionar uma espécie na grade e confirmar a abertura de seu detalhe; em uma conta sem exemplares, confirmar a apresentação da chamada de cadastro.

**Acceptance Scenarios**:

1. **Given** que uma espécie é exibida na grade, **When** o usuário seleciona seu card, **Then** é levado ao detalhe dessa espécie, onde os exemplares podem ser selecionados.
2. **Given** que o usuário não possui espécies, **When** abre Minha Coleção, **Then** vê um estado vazio e uma chamada para cadastrar o primeiro exemplar.
3. **Given** que a coleção está sendo carregada, **When** o usuário abre a tela, **Then** vê uma indicação de carregamento até a conclusão.
4. **Given** que a coleção não pode ser carregada, **When** ocorre a falha, **Then** vê uma explicação e a ação de tentar novamente, preservando a navegação do aplicativo.

### Edge Cases

- Uma espécie cujos exemplares foram todos removidos, mortos ou doados deve permanecer arquivada e ser exibida após as espécies ativas.
- Empates ou combinações de cuidados pendentes devem manter cada indicador agregado de forma independente.
- Coleções com 50 ou mais espécies devem carregar resultados em partes, sem exigir que toda a coleção seja exibida de uma vez.
- A limpeza de busca e filtros deve restaurar a lista de acordo com o estado atual da coleção.
- A indisponibilidade temporária dos dados não deve deixar a tela sem uma ação de recuperação.

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE exibir em Minha Coleção um card por espécie pertencente à coleção do usuário, e não um card por exemplar.
- **FR-002**: Cada card DEVE apresentar nome comum, nome científico, imagem representativa e a quantidade de exemplares quando ela for maior que um.
- **FR-003**: Cada card DEVE apresentar indicadores agregados e independentes para água, nutrientes e luz.
- **FR-004**: O sistema DEVE destacar cada indicador que tenha ao menos um exemplar requerendo atenção e informar a proporção de exemplares afetados.
- **FR-005**: O sistema DEVE apresentar em estado neutro todo indicador para o qual nenhum exemplar requeira atenção.
- **FR-006**: O sistema DEVE permitir que o usuário marque ou desmarque uma espécie como favorita diretamente no card e reflita a alteração imediatamente.
- **FR-007**: O sistema DEVE apresentar no card características de referência da espécie, incluindo necessidades de luz e de rega quando essas informações estiverem disponíveis.
- **FR-008**: O sistema DEVE levar o usuário que seleciona um card ao detalhe da espécie, onde seus exemplares individuais podem ser selecionados.
- **FR-009**: O sistema DEVE filtrar a coleção por correspondência parcial de nome comum ou científico enquanto o usuário informa o termo de busca.
- **FR-010**: O sistema DEVE permitir filtrar a coleção por espécies que requerem atenção, favoritas e características de cuidado.
- **FR-011**: O sistema DEVE apresentar um estado vazio com chamada para cadastrar o primeiro exemplar quando não houver espécies na coleção.
- **FR-012**: O sistema DEVE apresentar um estado de nenhum resultado com ação para limpar busca e filtros quando não houver correspondências.
- **FR-013**: O sistema DEVE apresentar um estado de carregamento enquanto os dados da coleção são obtidos.
- **FR-014**: O sistema DEVE apresentar um estado de erro com ação para tentar novamente quando os dados da coleção não puderem ser obtidos.
- **FR-015**: O sistema DEVE organizar a grade em uma coluna em telas pequenas, duas em telas médias e três em telas grandes.
- **FR-016**: O sistema DEVE oferecer um ponto de entrada para cadastrar um novo exemplar.
- **FR-017**: O sistema DEVE carregar coleções extensas de forma progressiva, por paginação ou carregamento contínuo.
- **FR-018**: O sistema DEVE manter espécies sem exemplares ativos como arquivadas e posicioná-las após as espécies ativas.

### Key Entities

- **Espécie da coleção**: Agrupamento pessoal de exemplares de uma mesma espécie; reúne identificação, imagem de referência, características de cuidado, condição de favorita e o resumo de atenção.
- **Exemplar**: Planta individual vinculada a uma espécie; contribui para a quantidade e para os indicadores de cuidado agregados.
- **Indicador de cuidado**: Resumo por espécie de água, nutrientes ou luz, composto pela condição de atenção e pela proporção de exemplares afetados.
- **Filtro da coleção**: Critério temporário aplicado à grade por atenção, favorita ou característica de cuidado.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Em uma coleção com cinco espécies e exemplares distribuídos entre elas, a tela apresenta exatamente um card para cada espécie em até 3 segundos após a abertura, em condições normais de conexão.
- **SC-002**: Para cada indicador de cuidado, a proporção apresentada corresponde ao número de exemplares que requerem aquele cuidado entre o total da espécie em 100% dos cenários de validação.
- **SC-003**: Em testes de busca por nome comum e científico, 100% das espécies compatíveis são apresentadas e as incompatíveis são ocultadas.
- **SC-004**: Em telas pequenas, médias e grandes, a grade apresenta respectivamente uma, duas e três colunas em 100% das verificações de layout.
- **SC-005**: Em uma coleção vazia, sem resultados, em carregamento ou com falha, o usuário recebe um estado compreensível e pelo menos uma ação aplicável em 100% dos cenários.
- **SC-006**: Em uma coleção com 50 espécies ou mais, o usuário consegue alcançar todas as espécies sem bloquear a interação da tela.

## Assumptions

- O detalhe de espécie, o carrossel de exemplares e o fluxo de cadastro são dependências existentes ou serão entregues em especificações próprias.
- As regras que definem se um exemplar requer água, nutrientes ou luz são fornecidas pelo módulo de vitais e não são redefinidas por esta funcionalidade.
- A imagem representativa prioriza uma imagem disponível da espécie ou de seus exemplares; quando nenhuma estiver disponível, usa-se a imagem substituta.
- A opção de favorita é uma preferência do usuário associada à espécie em sua coleção.
- Espécies arquivadas não entram na contagem de espécies ativas, mas permanecem pesquisáveis e identificáveis.

## Verbatim Constraints

- `Minha Coleção`
- `Discover`
- `1 de 3`
- `sm:grid-cols-2 lg:grid-cols-3`
