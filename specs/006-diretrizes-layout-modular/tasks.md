# Tasks: Diretrizes de Layout Modular

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md` e `contracts/ui-system.md`.

**Execution rule**: para cada tarefa, implementar a unidade descrita, executar o teste focado indicado e somente então registrar sua conclusão. Testes de contrato são escritos antes da implementação correspondente.

## Phase 1: Setup

Esta fase estabelece os tokens compartilhados que todas as histórias consomem.

**Wave 1 — independent (different files):**

- [x] **T001** [P] Consolidar paleta semântica, sombras rígidas, escala de espaçamento, tipografia Lexend/monoespaçada e breakpoints, validando pelo build Vite · frontend/tailwind.config.js
- [x] **T002** [P] Normalizar estilos globais, foco de alto contraste, `100dvh`, safe area e redução de movimento, validando pelo build Vite · frontend/src/styles/index.css

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T003** Criar testes dos tokens e estados visuais compartilhados, executando o arquivo para confirmar as expectativas da fundação · frontend/src/components/ui/__tests__/design-system.test.jsx

## Phase 2: Foundational

Esta fase cria os contratos reutilizáveis que bloqueiam a implementação das histórias.

**Wave 1 — independent (different files):**

- [x] **T004** [P] Criar a fonte única de destinos, prioridades móveis e correspondência de rotas, incluindo criação/detalhe de exemplar em Coleção, com teste unitário no próprio módulo · frontend/src/config/navigation.js
- [x] **T005** [P] Criar o componente SVG local `Icon` com nomes estáveis e sem dependência remota, validando nomes acessíveis e modo decorativo · frontend/src/components/ui/Icon.jsx
- [x] **T006** [P] Criar `PageContainer` com margens responsivas de 16/24px, larguras previstas e prevenção de overflow, validando suas variantes com RTL · frontend/src/components/layout/PageContainer.jsx
- [x] **T007** [P] Criar `PageHeader` com título obrigatório e slots opcionais sem lacunas, validando hierarquia e ordem responsiva com RTL · frontend/src/components/layout/PageHeader.jsx
- [x] **T008** [P] Criar `ContentState` para loading, vazio e erro dentro da região de conteúdo, validando nomes e anúncios acessíveis com RTL · frontend/src/components/ui/ContentState.jsx
- [x] **T009** [P] Criar `ResponsiveGrid` com variantes estritamente usadas, ordem de DOM preservada e até 12 colunas desktop, validando a API pública com RTL · frontend/src/components/ui/ResponsiveGrid.jsx
- [x] **T010** [P] Criar `MediaFrame` com `object-fit`, texto alternativo e fallback para URL ausente ou quebrada, validando eventos de erro com RTL (FR-018, FR-025) · frontend/src/components/ui/MediaFrame.jsx
- [x] **T011** [P] Criar `SearchField` com rótulo acessível, limpeza por teclado e estado controlado, validando interação com RTL · frontend/src/components/ui/SearchField.jsx
- [x] **T012** [P] Criar `FormField` para associar rótulo, ajuda e erro sem controlar formulário, validando `aria-describedby` e estado inválido · frontend/src/components/ui/FormField.jsx

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T013** Integrar e testar os contratos das novas primitivas em conjunto, sem ampliar suas variantes além dos usos previstos · frontend/src/components/ui/__tests__/ui_primitives.test.jsx

## Phase 3: User Story 1 — Navegar por uma estrutura visual consistente (P1)

**Goal**: todas as páginas autenticadas compartilham marca, navegação, barra superior, seção ativa e uma única área principal.

**Independent Test**: abrir pelo menos três rotas autenticadas em tela ampla e confirmar estrutura, seção ativa, barra superior persistente e ausência de espaços reservados por ações ausentes.

### Tests

**Wave 1:**

- [x] **T014** Escrever testes de contrato do shell, único `main`, seção ativa e navegações compartilhadas antes da implementação, confirmando falha inicial e posterior aprovação · frontend/src/components/layout/__tests__/AppShell.test.jsx

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T015** [P] Atualizar `Navbar` para barra superior compartilhada com slots de conta e ações sem lacunas, validando T014 · frontend/src/components/layout/Navbar.jsx
- [x] **T016** [P] Atualizar `Sidebar` para consumir `navigationItems`, permanecer no viewport e expor rota ativa por texto, contorno e `aria-current`, validando T014 · frontend/src/components/layout/Sidebar.jsx
- [x] **T017** [P] Criar `MobileNavigation` com os quatro destinos atuais, rótulos visíveis, alvos mínimos de 44px e safe area, validando T014 · frontend/src/components/layout/MobileNavigation.jsx

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T018** Integrar Navbar, Sidebar e MobileNavigation em um shell de `100dvh`, com único `main` e rolagem confinada, validando T014 · frontend/src/components/layout/AppShell.jsx

**Checkpoint**: a estrutura autenticada está funcional e testável de forma independente em desktop e navegação por rotas.

## Phase 4: User Story 2 — Usar o produto em telas menores (P1)

**Goal**: conteúdo, navegação, grades e ações permanecem utilizáveis em celular e tablet sem overflow horizontal global.

**Independent Test**: percorrer as rotas principais em 360, 768, 1024 e 1440px e verificar navegação prevista, uma ou duas colunas quando necessário e ações essenciais não encobertas.

### Tests

**Wave 1:**

- [x] **T019** Escrever testes estruturais dos breakpoints, ordem de leitura, alvos de toque e compensação da navegação móvel antes da migração das páginas · frontend/src/test/layout-responsive.test.jsx

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T020** [P] Migrar catálogo para PageContainer, PageHeader e ResponsiveGrid preservando busca, filtros, favorito, modal, cache e fluxos existentes, validando seus testes de página · frontend/src/pages/SpecimenCatalog.jsx
- [x] **T021** [P] Migrar cadastro para PageContainer, PageHeader e FormField preservando taxonomia, botões físicos de luminosidade, foto AVIF, validação e envio único, validando seus testes de página · frontend/src/pages/SpecimenCreatePage.jsx
- [x] **T022** [P] Migrar detalhe para PageContainer, PageHeader e grade responsiva preservando consulta, refetch, foto e linha do tempo; aplicar a composição de identificação, estado, métricas, registros visuais, ações e histórico das diretrizes (FR-023, FR-025, FR-026) · frontend/src/pages/SpecimenDetailPage.jsx

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T023** Aplicar a composição compartilhada aos placeholders autenticados sem criar ações, dados ou domínios fictícios, validando rotas e único `main` · frontend/src/App.jsx

**Checkpoint**: as rotas autenticadas existentes são utilizáveis nas quatro larguras e mantêm seus fluxos sem rolagem horizontal global.

## Phase 5: User Story 3 — Compreender informações densas com rapidez (P2)

**Goal**: indicadores, estados, imagens e listas utilizam blocos comparáveis e distinguem condições sem depender somente de cor.

**Independent Test**: renderizar catálogo e detalhe com estados ready, loading, empty e error e verificar hierarquia, rótulos semânticos, fallback de imagem e recuperação.

### Tests

**Wave 1 — independent (different files):**

- [x] **T024** [P] Ampliar testes do catálogo para estados, comparação dos cartões, imagem ausente/quebrada e ação de recuperação antes da implementação · frontend/src/pages/__tests__/SpecimenCatalog.test.jsx
- [x] **T025** [P] Criar testes do detalhe para hierarquia, estados de consulta, foto, métricas, ações e histórico antes da implementação (FR-023, FR-024, FR-025, FR-026, FR-027) · frontend/src/pages/__tests__/SpecimenDetailPage.test.jsx

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T026** [P] Criar `CareIndicator` que mapeia dados existentes para tom, símbolo e rótulo sem introduzir cálculo de domínio, validando T024/T025 · frontend/src/components/specimen/CareIndicator.jsx
- [x] **T027** [P] Criar `CollectionCard` com MediaFrame, identificação, metadados e ações não aninhadas, validando T024 · frontend/src/components/specimen/CollectionCard.jsx
- [x] **T028** [P] Criar `Alert` com tons neutral, info, stable, warning, critical e disabled acompanhados de conteúdo textual ou símbolo, validando os testes de primitivas · frontend/src/components/ui/Alert.jsx

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T029** Integrar ContentState, CollectionCard e CareIndicator ao catálogo sem alterar chamadas de API ou query keys, validando T024 · frontend/src/pages/SpecimenCatalog.jsx

**⟶ Wait for T029 to finish, then:**

- [x] **T030** Integrar ContentState, MediaFrame e tons semânticos ao detalhe sem alterar payloads ou permissões, validando T025 e a composição de exemplar (FR-023, FR-024, FR-025, FR-026, FR-027) · frontend/src/pages/SpecimenDetailPage.jsx

**Checkpoint**: estados e informações densas estão visualmente hierarquizados, acessíveis e comparáveis nas páginas de exemplar.

## Phase 6: User Story 4 — Reutilizar padrões sem divergência visual (P2)

**Goal**: padrões equivalentes provêm de módulos compartilhados com variantes limitadas e comportamento interativo consistente.

**Independent Test**: comparar padrões equivalentes em páginas diferentes e confirmar a mesma definição para borda, sombra, foco, pressionamento, disabled e responsividade.

### Tests

**Wave 1:**

- [x] **T031** Escrever testes de regressão para foco, pressed, disabled, modal por teclado, tabela e ausência de controles interativos aninhados antes da consolidação · frontend/src/components/ui/__tests__/ui_primitives.test.jsx

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T032** [P] Consolidar variantes e estados táteis de Button sem deslocar elementos vizinhos, validando T031 · frontend/src/components/ui/Button.jsx
- [x] **T033** [P] Consolidar borda, sombra, densidade e variantes necessárias de Card, validando T031 e os usos nas páginas · frontend/src/components/ui/Card.jsx
- [x] **T034** [P] Consolidar rótulo, foco, erro e disabled de Input para consumo por FormField, validando T031 · frontend/src/components/ui/Input.jsx
- [x] **T035** [P] Implementar contenção de foco, Escape, bloqueio de fundo e retorno de foco em Modal, validando T031 · frontend/src/components/ui/Modal.jsx
- [x] **T036** [P] Confinar overflow no módulo Table e garantir ações acessíveis em linhas, validando T031 · frontend/src/components/ui/Table.jsx

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T037** Remover duplicações visuais remanescentes nas páginas autenticadas somente quando cobertas pelos módulos compartilhados, executando a suíte frontend após a alteração · frontend/src/pages/SpecimenCatalog.jsx

**Checkpoint**: os padrões repetidos têm definição compartilhada e todos os controles avaliados apresentam estados coerentes por teclado e ponteiro.

## Phase 7: Polish & Cross-Cutting Validation

**Wave 1 — independent (different files):**

- [x] **T038** [P] Alinhar WeatherWidget aos tokens e módulos compartilhados sem alterar cache ou comportamento de falha, validando seus cenários existentes · frontend/src/components/dashboard/WeatherWidget.jsx
- [x] **T039** [P] Alinhar CareLogTimeline aos tokens, ordem de leitura, tipo, ocorrência, nota e movimento reduzido sem alterar dados históricos, validando seus cenários existentes (FR-026, FR-027) · frontend/src/components/specimen/CareLogTimeline.jsx
- [x] **T040** [P] Atualizar o smoke test para cobrir estrutura modular, ausência de funcionalidades copiadas do protótipo e regressão das rotas existentes · frontend/src/test/e2e_smoke.test.jsx

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T041** Executar `npm test -- --run` e `npm run build`, corrigir somente regressões desta feature e confirmar SC-001, SC-003 a SC-006, SC-008 e SC-009 · frontend/package.json

**⟶ Wait for T041 to finish, then:**

- [x] **T042** Verificar em navegador real as larguras 360, 768, 1024 e 1440px, documentando overflow, navegação, alvos de toque, foco, conteúdo encoberto, movimento reduzido e ordem da tela de exemplar (SC-002, SC-007, SC-010) · specs/006-diretrizes-layout-modular/validation.md

## Dependencies & Execution Order

- **Phase order**: Setup → Foundational → US1 → US2 → US3 → US4 → Polish.
- **Phase 1**: T001/T002 → T003.
- **Phase 2**: T004–T012 → T013.
- **US1**: T014 → T015/T016/T017 → T018.
- **US2**: T019 → T020/T021/T022 → T023.
- **US3**: T024/T025 → T026/T027/T028 → T029 → T030.
- **US4**: T031 → T032/T033/T034/T035/T036 → T037.
- **Polish**: T038/T039/T040 → T041 → T042.
- Itens marcados `[P]` podem ser executados em qualquer ordem dentro da própria onda; nenhuma onda posterior começa antes do join indicado.
