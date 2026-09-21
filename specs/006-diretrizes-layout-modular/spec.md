# Especificação: Diretrizes de Layout Modular

**Feature Branch**: `006-diretrizes-layout-modular`  
**Created**: 2026-09-15  
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Navegar por uma estrutura visual consistente (Priority: P1)

Como pessoa autenticada, quero encontrar a mesma estrutura de navegação, hierarquia e ações principais em todas as áreas do Persefone, para reconhecer rapidamente onde estou e como seguir para outra tarefa.

**Why this priority**: A estrutura compartilhada sustenta todas as telas autenticadas e reduz reaprendizado entre coleção, descoberta, taxonomia, diário e cuidados.

**Independent Test**: Abrir três áreas autenticadas em uma tela ampla e verificar que marca, navegação lateral, barra superior, indicação da seção ativa e área de conteúdo mantêm posição, proporção e comportamento consistentes.

**Acceptance Scenarios**:

1. **Given** que a pessoa usa uma tela ampla, **When** alterna entre áreas autenticadas, **Then** encontra navegação lateral persistente, barra superior fixa durante a rolagem e destaque visível da seção atual.
2. **Given** que uma página possui título, descrição, busca e ação principal, **When** ela é exibida, **Then** esses elementos seguem uma hierarquia comum e não deslocam a estrutura global.
3. **Given** que uma área não disponibiliza determinada ação global, **When** a página é aberta, **Then** o espaço remanescente se reorganiza sem lacunas ou desalinhamento.

---

### User Story 2 - Usar o produto em telas menores (Priority: P1)

Como pessoa usando celular ou tablet, quero que navegação, conteúdo e ações se adaptem ao espaço disponível, para concluir as mesmas tarefas sem rolagem horizontal nem controles difíceis de acionar.

**Why this priority**: O produto é usado durante o cuidado das plantas, situação em que telas menores e interação por toque são recorrentes.

**Independent Test**: Percorrer as rotas principais em larguras pequenas, médias e grandes e confirmar que a navegação muda de forma previsível, os blocos se reorganizam e todas as ações permanecem acessíveis.

**Acceptance Scenarios**:

1. **Given** que a largura não comporta a navegação lateral, **When** a interface é exibida, **Then** as rotas principais ficam disponíveis em uma navegação móvel compartilhada e o conteúdo ocupa uma única coluna.
2. **Given** que uma página usa cartões ou painéis em grade, **When** a largura diminui, **Then** os blocos passam de uma composição analítica para duas colunas e depois uma coluna, preservando a ordem de leitura.
3. **Given** que uma ação é importante para o fluxo atual, **When** a pessoa usa uma tela pequena, **Then** a ação permanece visível ou alcançável sem encobrir campos e conteúdo essencial.
4. **Given** que textos, identificadores ou nomes são extensos, **When** o espaço horizontal é limitado, **Then** o layout quebra ou resume o conteúdo sem ultrapassar a largura da tela e sem esconder a informação completa de forma inacessível.

---

### User Story 3 - Compreender informações densas com rapidez (Priority: P2)

Como pessoa acompanhando sua coleção, quero distinguir resumo, alertas, estado, histórico, imagens e ações por blocos visuais claros, para avaliar prioridades sem percorrer uma página sem hierarquia.

**Why this priority**: A linguagem de painéis e cartões do arquivo de referência torna dados botânicos e operacionais mais fáceis de examinar, depois que a navegação básica está estabelecida.

**Independent Test**: Exibir uma página com indicadores, conteúdo principal e informações secundárias e verificar que a ordem visual, os contrastes e os rótulos permitem identificar o estado prioritário, a ação principal e o histórico relacionado.

**Acceptance Scenarios**:

1. **Given** que uma página apresenta indicadores de estado, **When** existem condições normais, de atenção e críticas, **Then** cada condição possui combinação consistente de cor, rótulo textual e hierarquia, sem depender somente da cor.
2. **Given** que uma página reúne conteúdo principal e informações auxiliares, **When** é exibida em tela ampla, **Then** os blocos podem formar uma composição assimétrica mantendo alinhamento, espaçamento e ordem de leitura.
3. **Given** que uma lista contém imagem, identificação, metadados e ações, **When** vários itens são exibidos, **Then** todos usam o mesmo padrão de cartão ou linha e permitem comparação visual direta.
4. **Given** que não há dados, o carregamento está em andamento ou ocorreu uma falha, **When** a área de conteúdo é exibida, **Then** o estado correspondente ocupa o mesmo contexto do conteúdo e oferece orientação ou recuperação adequada.

---

### User Story 4 - Reutilizar padrões sem divergência visual (Priority: P2)

Como equipe responsável pelo produto, queremos compor novas telas usando módulos compartilhados, para preservar as diretrizes visuais e corrigir um padrão em um único lugar.

**Why this priority**: A referência contém padrões repetidos de navegação, cartões, indicadores, filtros, históricos e ações; centralizá-los reduz inconsistências entre funcionalidades.

**Independent Test**: Comparar padrões equivalentes em páginas diferentes e confirmar que estrutura, estados, espaçamento, foco e comportamento responsivo provêm da mesma definição compartilhada, variando somente conteúdo e opções documentadas.

**Acceptance Scenarios**:

1. **Given** que um padrão aparece em duas ou mais páginas, **When** as páginas são inspecionadas, **Then** elas reutilizam o mesmo módulo e escolhem apenas variantes previstas.
2. **Given** que uma nova variação visual é necessária, **When** ela é introduzida, **Then** a variação é adicionada ao módulo compartilhado e documentada antes de ser usada pela página.
3. **Given** que um módulo interativo possui estados normal, foco, pressionado e indisponível, **When** esses estados são acionados em páginas diferentes, **Then** apresentam o mesmo retorno visual e semântico.

### Referência de composição — tela de detalhe de exemplar

A tela de detalhe de exemplar estabelece a composição de referência para páginas de acompanhamento com informação densa. A referência visual deve orientar hierarquia, densidade e ritmo de leitura, sem transferir para o produto seu conteúdo, nomes, imagens remotas ou funções que não existam no domínio Persefone.

1. O cabeçalho reúne identificador técnico, situação textual, nome do exemplar, espécie ou contexto relacionado e ações da página.
2. O resumo e as métricas atuais formam o primeiro bloco analítico; cada métrica exibe rótulo, valor, unidade ou escala e momento da atualização.
3. A linha do tempo visual usa cartões quadrados, datas de captura e uma ação explícita para adicionar foto quando disponível.
4. Ações rápidas de cuidado aparecem antes do histórico na ordem de leitura; em telas amplas podem ocupar a coluna de apoio enquanto o histórico ocupa a área principal.
5. O histórico apresenta registros cronológicos com tipo, ocorrência e nota, distinguindo estados por texto, símbolo e estrutura além da cor.
6. A composição se reorganiza para uma coluna em telas estreitas, preserva a ordem do DOM e não cria rolagem horizontal global.

### Edge Cases

- Como o layout preserva a ordem de leitura quando um painel lateral passa para baixo do conteúdo principal?
- Como cartões com imagens se comportam quando a imagem está ausente, quebrada ou possui proporção muito diferente do espaço disponível?
- Como a navegação móvel acomoda mais destinos do que o limite visual sem reduzir os alvos de toque?
- Como tabelas e diagramas densos permanecem utilizáveis em telas estreitas sem impor rolagem horizontal à página inteira?
- Como títulos, nomes científicos, traduções e identificadores extensos são apresentados sem sobreposição?
- Como ações fixas ou flutuantes evitam cobrir mensagens, campos, navegação móvel e áreas seguras do dispositivo?
- Como animações decorativas, indicadores pulsantes e faixas contínuas respeitam a preferência por movimento reduzido?
- Como o foco retorna ao elemento adequado depois de fechar menus, gavetas ou diálogos?

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE aplicar uma estrutura compartilhada a todas as páginas autenticadas, composta por marca, navegação principal, barra superior e área de conteúdo.
- **FR-002**: Em telas amplas, o sistema DEVE apresentar navegação lateral persistente com largura consistente e barra superior que permaneça visível durante a rolagem do conteúdo.
- **FR-003**: Em telas pequenas, o sistema DEVE substituir a navegação lateral por uma navegação móvel compartilhada com alvos de toque de pelo menos 44 por 44 pixels.
- **FR-004**: O sistema DEVE destacar a rota ativa com cor de acento, contorno escuro e rótulo textual, sem depender somente de cor ou ícone.
- **FR-005**: O conteúdo de cada página DEVE usar margens externas de 24 pixels em telas médias e grandes e uma margem reduzida consistente em telas pequenas.
- **FR-006**: O sistema DEVE oferecer uma grade responsiva que suporte até doze colunas em telas amplas e preserve a ordem de leitura ao reduzir para duas ou uma coluna.
- **FR-007**: Painéis, cartões, controles e regiões estruturadas DEVEM usar bordas sólidas de 4 pixels, cantos retos e sombras rígidas de 4 ou 6 pixels sem desfoque.
- **FR-008**: O sistema DEVE usar verde-limão como acento principal, superfícies claras, texto e contornos em carvão, verde botânico para estados estáveis, âmbar para atenção e vermelho para condições críticas.
- **FR-009**: O sistema DEVE usar Lexend na leitura principal e pode usar tipografia monoespaçada somente em códigos, datas, identificadores e valores técnicos.
- **FR-010**: A escala de espaçamento DEVE partir de incrementos de 4 pixels e oferecer níveis consistentes para proximidade, agrupamento, separação de painéis e margens de página.
- **FR-011**: Títulos de página, títulos de seção, rótulos técnicos e corpo de texto DEVEM seguir uma escala tipográfica compartilhada com contraste e ordem hierárquica verificáveis.
- **FR-012**: O sistema DEVE disponibilizar módulos compartilhados para navegação, cabeçalho de página, busca, filtros, cartões, indicadores, estados de conteúdo, listas, tabelas, históricos, ações e diálogos.
- **FR-013**: Todo padrão visual usado em duas ou mais páginas DEVE ser extraído para um módulo compartilhado antes da conclusão da segunda página.
- **FR-014**: Cada módulo compartilhado DEVE declarar somente as variantes necessárias de aparência, densidade, estado e comportamento responsivo, evitando personalizações locais que dupliquem o padrão.
- **FR-015**: Controles interativos DEVEM apresentar estados consistentes de repouso, foco, passagem do ponteiro, pressionado e indisponível.
- **FR-016**: O estado pressionado de uma ação com sombra DEVE deslocar visualmente o controle e reduzir ou remover sua sombra sem alterar a posição dos elementos vizinhos.
- **FR-017**: Estados normal, informativo, estável, atenção, crítico e indisponível DEVEM combinar cor com texto ou símbolo compreensível.
- **FR-018**: Imagens editoriais ou botânicas DEVEM preencher seu quadro sem deformação, possuir descrição acessível e apresentar substituto visual quando indisponíveis.
- **FR-019**: Toda região que carrega dados DEVE prever estados de carregamento, vazio e erro dentro da mesma composição usada pelo conteúdo concluído.
- **FR-020**: A interface DEVE manter foco visível de alto contraste, ordem de teclado coerente e retorno de foco após o fechamento de sobreposições.
- **FR-021**: Animações não essenciais DEVEM ser discretas e desativadas quando a pessoa indicar preferência por movimento reduzido.
- **FR-022**: A atualização das diretrizes DEVE preservar os fluxos, dados e permissões existentes, sem criar funcionalidades de domínio presentes apenas no arquivo de referência.
- **FR-023**: A composição de detalhe de exemplar DEVE organizar identificação, situação, resumo, métricas atuais, linha do tempo visual, ações de cuidado e histórico em uma hierarquia única e documentada.
- **FR-024**: Cada métrica do exemplar DEVE combinar rótulo, valor, unidade ou escala e momento de atualização; qualquer barra ou indicador gráfico DEVE ser complementar ao texto.
- **FR-025**: A linha do tempo visual DEVE usar cartões de mídia com proporção consistente, data de captura, descrição acessível e ação explícita para novo registro quando disponível.
- **FR-026**: As ações de cuidado e o histórico DEVERÃO manter relação de apoio e conteúdo principal em telas amplas e formar uma sequência de uma coluna em telas estreitas, sem encobrir ações ou registros.
- **FR-027**: Os registros cronológicos DEVEM apresentar tipo, instante de ocorrência e nota quando existente, mantendo distinção textual e estrutural entre registros.

### Key Entities

- **Token visual**: valor compartilhado de cor, tipografia, espaçamento, borda, sombra ou movimento que mantém a identidade entre módulos.
- **Estrutura de aplicação**: composição comum de navegação, barra superior, conteúdo e navegação móvel usada pelas páginas autenticadas.
- **Módulo de interface**: padrão reutilizável com responsabilidade única, conteúdo configurável e variantes limitadas para estado, densidade e contexto.
- **Composição de página**: arranjo responsivo de módulos em hierarquia principal, secundária e auxiliar, sem redefinir internamente os padrões compartilhados.
- **Estado visual**: representação combinada de cor, texto, símbolo e interação para comunicar condição normal, estável, de atenção, crítica ou indisponível.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Em 100% das páginas autenticadas avaliadas, marca, navegação principal, barra superior e área de conteúdo seguem a mesma estrutura compartilhada.
- **SC-002**: Em verificações nas larguras de 360, 768, 1024 e 1440 pixels, nenhuma página apresenta rolagem horizontal global ou ação essencial inacessível.
- **SC-003**: Em 100% dos padrões presentes em duas ou mais páginas, a inspeção confirma uma única definição compartilhada para estrutura e estados.
- **SC-004**: Em 100% dos controles interativos avaliados, foco, pressionamento e indisponibilidade possuem retorno visual perceptível e consistente.
- **SC-005**: Em 100% dos estados de atenção e críticos avaliados, a condição pode ser identificada sem depender exclusivamente da cor.
- **SC-006**: Em 100% das páginas que carregam dados, os estados de carregamento, vazio e erro mantêm a estrutura da página e oferecem informação adequada.
- **SC-007**: Pelo menos 90% das pessoas em avaliação identificam a seção ativa e a ação principal de uma página em até cinco segundos.
- **SC-008**: Uma alteração em borda, sombra, espaçamento ou cor compartilhada pode ser aplicada a todos os módulos correspondentes por meio de uma única definição.
- **SC-009**: Todas as funções existentes continuam passando pelos seus critérios de aceitação após a adoção das novas diretrizes.
- **SC-010**: Em 100% das larguras de validação, a tela de detalhe de exemplar mantém a ordem identificação → estado e métricas → registros visuais → ações → histórico, sem conteúdo encoberto ou rolagem horizontal global.

## Assumptions

- O arquivo fornecido é uma referência de linguagem visual e composição, não uma exigência de copiar conteúdo, nomes, imagens ou funcionalidades literalmente.
- As regras da Constituição Persefone prevalecem quando a referência diverge, especialmente bordas de 4 pixels, sombras entre 4 e 6 pixels e cantos sem arredondamento.
- A atualização abrange inicialmente todas as páginas autenticadas; telas públicas de acesso reutilizam tokens e módulos adequados, mas não precisam adotar a navegação autenticada.
- A navegação móvel prioriza até cinco destinos e oferece acesso complementar quando houver mais rotas.
- Diagramas, tabelas e linhas do tempo podem usar tratamento responsivo próprio dentro de seus módulos, sem alterar a largura da página inteira.
- A tela de detalhe de exemplar usa como composição de referência uma faixa de identificação, um bloco de métricas, uma grade de registros visuais e uma área dividida entre ações de cuidado e histórico, com colapso para uma coluna.
- O idioma e os termos de negócio continuam definidos pelas funcionalidades correspondentes; esta especificação trata da apresentação e da composição.
- Controle de pragas, relatórios, lembretes, leitura por câmera e demais funções mostradas no arquivo não entram no escopo somente por aparecerem na referência.
