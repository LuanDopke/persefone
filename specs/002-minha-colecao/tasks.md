# Tarefas: Minha Coleção

**Entrada**: artefatos de planejamento em `specs/002-minha-colecao/`  
**Pré-requisitos**: `spec.md`, `plan.md`, `research.md`, `data-model.md` e `contracts/collection-api.md`

## Fase 1: Preparação

Não há alteração de estrutura ou ferramenta compartilhada antes do trabalho de domínio. As migrações e os contratos são tratados na fase fundacional.

## Fase 2: Fundacional — projeção de coleção e contrato

**Wave 1 — independente (different files):**

- [x] **T001** [P] [US1] Escrever testes de modelo para os estados padrão `is_active` do exemplar e `is_collection_favorite` da espécie · `backend/specimens/tests/test_models.py`
- [x] **T002** [P] [US1] Escrever testes de contrato da coleção para agregação, ordenação ativa/arquivada, paginação e alternativa de imagem · `backend/specimens/tests/test_api.py`

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T003** [US1] Adicionar `is_active` a `Specimen`, `is_collection_favorite` a `Species` e a migração reversível correspondente · `backend/specimens/models.py`, `backend/catalog/models.py`, `backend/specimens/migrations/0002_collection_state.py`

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T004** [US1] Implementar serializers, adaptador de cuidados e ações DRF paginadas `collection` e `favorite` conforme o contrato · `backend/specimens/serializers.py`, `backend/specimens/views.py`

**Checkpoint**: a API fornece uma projeção paginada e persistente por espécie, que as histórias da interface podem consumir.

## Fase 3: User Story 1 — Consultar a coleção por espécie (P1)

**Goal**: apresentar uma grade pessoal por espécie, separada de `Discover`.

**Independent Test**: cadastrar exemplares de duas espécies, incluindo três de uma delas, e confirmar dois cards com as contagens corretas.

### Tests

**Wave 1 — independent (different files):**

- [x] **T005** [P] [US1] Escrever testes de interface para título Minha Coleção, card por espécie, quantidade, imagem alternativa e nome acessível truncado · `frontend/src/pages/__tests__/SpecimenCatalog.test.jsx`
- [x] **T006** [P] [US1] Escrever testes de rotas e navegação para manter `Discover` separado de Minha Coleção · `frontend/src/App.test.jsx`, `frontend/src/components/layout/__tests__/AppShell.test.jsx`

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T007** [US1] Substituir a tabela plana por consulta TanStack Query à coleção e por grade responsiva de cards com identificação, imagem alternativa, quantidade e características disponíveis · `frontend/src/pages/SpecimenCatalog.jsx`

**⟶ Wait for Wave 2 to finish, then:**

- [x] **T008** [US1] Registrar a rota Minha Coleção e sua entrada de navegação sem alterar a rota de catálogo geral Discover · `frontend/src/App.jsx`, `frontend/src/components/layout/Sidebar.jsx`

**Checkpoint**: Minha Coleção mostra uma entrada por espécie, com uma, duas ou três colunas conforme a tela, e pode ser testada sem as histórias seguintes.

## Fase 4: User Story 2 — Identificar cuidados pendentes (P1)

**Goal**: permitir priorização diária por água, nutrientes e luz agregados.

**Independent Test**: criar três exemplares de uma espécie, com atenção apenas para água, e confirmar `1 de 3` para água e estado neutro nos demais indicadores.

### Tests

**Wave 1 — independent (different files):**

- [x] **T009** [P] [US2] Cobrir na API os três indicadores independentes, suas proporções e os casos neutros retornados pelo adaptador · `backend/specimens/tests/test_api.py`
- [x] **T010** [P] [US2] Cobrir no card a apresentação acessível de atenção, proporção e estado neutro · `frontend/src/pages/__tests__/SpecimenCatalog.test.jsx`

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T011** [US2] Renderizar os indicadores agregados de água, nutrientes e luz no card, com destaque e proporção somente quando houver atenção · `frontend/src/pages/SpecimenCatalog.jsx`

**Checkpoint**: cada card mostra de forma independente os cuidados pendentes e os cuidados neutros, podendo ser validado por meio do endpoint da coleção.

## Fase 5: User Story 3 — Encontrar e organizar espécies (P2)

**Goal**: pesquisar, filtrar e favoritar espécies da coleção.

**Independent Test**: pesquisar nomes comum e científico, aplicar atenção e favorita, e confirmar somente espécies compatíveis.

### Tests

**Wave 1 — independent (different files):**

- [x] **T012** [P] [US3] Escrever testes de API para busca parcial, filtros de atenção/favorita/cuidado e PATCH de favorita · `backend/specimens/tests/test_api.py`
- [x] **T013** [P] [US3] Escrever testes de interface para filtros locais, nenhum resultado, limpeza e atualização otimista de favorita · `frontend/src/pages/__tests__/SpecimenCatalog.test.jsx`

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T014** [US3] Implementar controles de busca e filtros, estado de nenhum resultado com limpeza e mutação otimista de favorita que não aciona o card · `frontend/src/pages/SpecimenCatalog.jsx`

**Checkpoint**: o usuário encontra espécies por nome ou critério de cuidado e altera a favorita diretamente no card.

## Fase 6: User Story 4 — Prosseguir para os exemplares (P2)

**Goal**: oferecer navegação a partir do card e estados recuperáveis da coleção.

**Independent Test**: selecionar um card e confirmar o detalhe; em coleção vazia, carregando ou com erro, confirmar ação apropriada.

### Tests

**Wave 1 — independent (different files):**

- [x] **T015** [P] [US4] Escrever testes para carregamento, erro com nova tentativa, coleção vazia, cadastro e navegação por seleção de card · `frontend/src/pages/__tests__/SpecimenCatalog.test.jsx`

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

- [x] **T016** [US4] Implementar estados de carregamento, erro e coleção vazia, ponto de entrada de cadastro e navegação acessível do card ao detalhe existente · `frontend/src/pages/SpecimenCatalog.jsx`, `frontend/src/App.jsx`

**Checkpoint**: a coleção possui estados de recuperação e um caminho funcional para cadastro e detalhe, sem deixar a navegação bloqueada.

## Fase 7: Polimento e validação

**Wave 1 — independent (different files):**

- [x] **T017** [P] [US1] Atualizar a documentação do contrato com exemplos de paginação, filtros e favorita validados pela implementação · `specs/002-minha-colecao/contracts/collection-api.md`

**⟶ Wait for Wave 1 to finish, then:**

- [ ] **T018** [US1] Executar as suítes de backend e frontend, migrações e build para validar SC-001 a SC-006 · `backend/manage.py`, `backend/specimens/tests/`, `frontend/src/pages/__tests__/SpecimenCatalog.test.jsx`, `frontend/package.json`

## Dependencies & Execution Order

- Fase 2 bloqueia as histórias: Wave 1 (testes de modelo e contrato) → Wave 2 (modelo e migração) → Wave 3 (API).
- Fase 3: Wave 1 (testes de interface e rota) → Wave 2 (grade) → Wave 3 (rota e navegação).
- Fase 4: Wave 1 (testes de API e card) → Wave 2 (indicadores).
- Fase 5: Wave 1 (testes de API e interface) → Wave 2 (busca, filtros e favorita).
- Fase 6: Wave 1 (testes de estados e navegação) → Wave 2 (estados e ações).
- Fase 7 ocorre após todas as histórias: Wave 1 (documentação) → Wave 2 (validação única contra os critérios de sucesso).
