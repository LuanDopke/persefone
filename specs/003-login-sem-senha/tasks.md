# Tarefas: Login sem Senha

**Entrada**: Artefatos de `specs/003-login-sem-senha/`
**Pré-requisitos**: `spec.md`, `plan.md`, `research.md`, `data-model.md` e `contracts/auth-api.md`
**Testes**: O princípio VI da Constituição exige que cada incremento seja validado automaticamente antes de ser concluído.

## Phase 1: Setup

**Wave 1 — independent (different files):**

- [x] **T001** [US1] Criar o aplicativo Django `accounts` e sua configuração de aplicação · `backend/accounts/apps.py`
- [x] **T002** [US1] Registrar o aplicativo `accounts` e a vida útil de JWT de um dia · `backend/core/settings.py`

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T003** [US1] Expor o namespace de autenticação sob `/api/auth/` · `backend/core/urls.py`

## Phase 2: Foundational

**Purpose**: Modelos, persistência e contrato compartilhados que bloqueiam os fluxos de acesso.

**Wave 1 — independent (different files):**

- [x] **T004** [US1] Escrever testes de modelo para unicidade de e-mail, expiração e consumo único · `backend/accounts/tests/test_models.py`
- [x] **T005** [US1] Criar o primitivo reutilizável de entrada com foco acessível do sistema visual · `frontend/src/components/ui/Input.jsx`

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T006** [US1] Implementar `AccountProfile` e `AccessRequest`, com migração inicial · `backend/accounts/models.py`, `backend/accounts/migrations/0001_initial.py`

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T007** [US1] Registrar modelos de autenticação para inspeção administrativa · `backend/accounts/admin.py`

## Phase 3: User Story 1 - Solicitar acesso por e-mail (Priority: P1)

**Goal**: Uma pessoa sem sessão solicita, sem senha, um link temporário para seu e-mail.

**Independent Test**: Com e-mail válido, a tela confirma a solicitação sem mostrar senha; e-mails inválidos são recusados e reenvios recebem resposta neutra limitada.

### Tests

**Wave 1 — independent (different files):**

- [x] **T008** [P] [US1] Escrever testes de contrato para solicitação válida, inválida, limitada e falha de entrega · `backend/accounts/tests/test_auth_api.py`
- [x] **T009** [P] [US1] Escrever testes da tela pública, validação e ausência de fluxo de senha · `frontend/src/pages/__tests__/AccessPage.test.jsx`

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T010** [P] [US1] Implementar serviço de normalização, limite por e-mail, token com hash e envio neutro do link · `backend/accounts/services.py`
- [x] **T011** [P] [US1] Implementar serializer e endpoint `POST /api/auth/access-requests/` · `backend/accounts/serializers.py`, `backend/accounts/views.py`, `backend/accounts/urls.py`

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T012** [US1] Implementar a tela de acesso responsiva com `Input`, `Button` e mensagens de resultado · `frontend/src/pages/AccessPage.jsx`

**⟶ Wait for Wave 3 to finish, then:**

- [x] **T013** [US1] Registrar a rota pública `/access` e redirecionar visitantes sem sessão · `frontend/src/App.jsx`

**⟶ Wait for Wave 4 to finish, then:**

- [x] **T014** [US1] Executar os testes de contrato e interface da solicitação de acesso · `backend/accounts/tests/test_auth_api.py`, `frontend/src/pages/__tests__/AccessPage.test.jsx`

**Checkpoint**: A solicitação de acesso funciona sem senha, informa falhas de formato e não expõe a existência de contas.

## Phase 4: User Story 2 - Entrar e criar conta pelo link recebido (Priority: P1)

**Goal**: Um link válido cria ou recupera a conta e inicia uma sessão de um dia; links não utilizáveis orientam a solicitar outro.

**Independent Test**: Um token válido cria a primeira conta ou abre a existente e um token inválido, expirado ou consumido não autentica a pessoa.

### Tests

**Wave 1 — independent (different files):**

- [x] **T015** [P] [US2] Estender os testes de API para confirmação válida, criação, reutilização, expiração e JWT de um dia · `backend/accounts/tests/test_auth_api.py`
- [x] **T016** [P] [US2] Escrever testes da confirmação de link, redirecionamento e recuperação de erro · `frontend/src/pages/__tests__/ConfirmAccessPage.test.jsx`

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T017** [US2] Implementar confirmação atômica do token, criação/localização da conta e resposta JWT · `backend/accounts/services.py`, `backend/accounts/views.py`, `backend/accounts/serializers.py`

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T018** [US2] Implementar estado de autenticação e persistência/restauração segura de `access_token` · `frontend/src/context/AuthContext.jsx`, `frontend/src/main.jsx`

**⟶ Wait for Wave 3 to finish, then:**

- [x] **T019** [US2] Implementar página `/access/confirm`, confirmação do token e retorno para nova solicitação · `frontend/src/pages/ConfirmAccessPage.jsx`, `frontend/src/App.jsx`

**⟶ Wait for Wave 4 to finish, then:**

- [x] **T020** [US2] Executar os testes de confirmação da API e da interface · `backend/accounts/tests/test_auth_api.py`, `frontend/src/pages/__tests__/ConfirmAccessPage.test.jsx`

**Checkpoint**: Um link válido abre a conta correta e um link inválido, expirado ou usado apresenta recuperação sem criar sessão.

## Phase 5: User Story 3 - Manter e encerrar a sessão (Priority: P2)

**Goal**: A área autenticada persiste por um dia, mostra o identificador derivado do e-mail e permite saída explícita.

**Independent Test**: Após entrar como `ana.silva@example.com`, recarregar preserva a sessão válida, exibe `ana.silva` e sair retorna ao acesso; token expirado protege as rotas.

### Tests

**Wave 1 — independent (different files):**

- [x] **T021** [P] [US3] Adicionar teste de contrato para `POST /api/auth/logout/` com JWT obrigatório · `backend/accounts/tests/test_auth_api.py`
- [x] **T022** [P] [US3] Escrever testes de restauração, expiração, identificação e saída da sessão · `frontend/src/context/__tests__/AuthContext.test.jsx`

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T023** [P] [US3] Implementar endpoint autenticado de saída que retorna 204 · `backend/accounts/views.py`, `backend/accounts/urls.py`
- [x] **T024** [P] [US3] Atualizar o cliente Axios para notificar o estado de sessão ao receber 401 · `frontend/src/services/apiClient.js`

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T025** [US3] Adicionar identificação derivada do e-mail e ação de saída à navegação autenticada · `frontend/src/components/layout/Navbar.jsx`

**⟶ Wait for Wave 3 to finish, then:**

- [x] **T026** [US3] Proteger as rotas existentes, preservar sessão válida e retornar ao acesso quando ela terminar · `frontend/src/App.jsx`, `frontend/src/context/AuthContext.jsx`

**⟶ Wait for Wave 4 to finish, then:**

- [x] **T027** [US3] Executar os testes de logout, estado de autenticação e proteção de rotas · `backend/accounts/tests/test_auth_api.py`, `frontend/src/context/__tests__/AuthContext.test.jsx`

**Checkpoint**: A sessão de um dia é restaurada somente enquanto válida; a pessoa vê seu identificador e consegue sair.

## Phase 6: Polish

**Wave 1 — independent (different files):**

- [x] **T028** [P] Validar a jornada de solicitação, confirmação, expiração e saída contra os critérios de sucesso · `frontend/src/test/e2e_smoke.test.jsx`
- [x] **T029** [P] Executar a suíte Django de autenticação e migrações · `backend/pytest.ini`
- [x] **T030** [P] Executar a suíte Vitest e o build de produção do frontend · `frontend/package.json`

## Dependencies & Execution Order

- Phase 1 → Phase 2; a configuração e o aplicativo devem existir antes de modelos, rotas e telas.
- Phase 2 → US1 → US2 → US3 → Polish; o serviço e a persistência de acesso sustentam os incrementos seguintes.
- Setup: Wave 1 bloqueia Wave 2. Foundational: Wave 1 bloqueia Wave 2 e Wave 3. Em cada história, os testes bloqueiam a implementação, que bloqueia a integração e sua validação. Polish começa após os três checkpoints.
