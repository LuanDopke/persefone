# Tarefas: Cadastro de Novo Exemplar

**Entrada**: artefatos de design em `specs/005-cadastro-exemplar/`  
**Testes**: obrigatórios por tarefa, conforme o Princípio VI da constituição. Cada implementação deve executar o teste focado indicado antes de ser concluída.

## Phase 1: Setup

**Objetivo**: preparar a configuração compartilhada para uploads de imagens sem alterar o fluxo funcional existente.

**Wave 1 — single task:**

- [x] **T001** Definir a redução da qualidade da foto inicial para um nível ainda aceitável para visualização no navegador, comprimi-la e armazená-la como dado binário no SQLite; validar com `backend/venv/bin/python manage.py check` · backend/core/settings.py

---

## Phase 2: Foundational

**Objetivo**: estabelecer o modelo persistente, a propriedade por usuário e as migrações que bloqueiam todas as histórias.

**Wave 1 — independent (different files):**

- [x] **T002** [P] Escrever testes de modelo para normalização única de taxonomia, incluindo caixa, espaços e `Begonia sp.`; executar e confirmar que falham antes da implementação · backend/catalog/tests/test_models.py
- [x] **T003** [P] Escrever testes de modelo para proprietário, condições iniciais, escolhas de luminosidade, nome padrão e `VisualEntry`; executar e confirmar que falham antes da implementação · backend/specimens/tests/test_models.py

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T004** [P] Implementar `Species.normalized_name`, normalização determinística e unicidade, validando com os testes de modelo do catálogo · backend/catalog/models.py
- [x] **T005** [P] Implementar `Specimen.owner`, `initial_soil`, `initial_light`, compatibilidade da capa e o modelo `VisualEntry`, validando com os testes de modelo de exemplares · backend/specimens/models.py

**⟶ Wait for Wave 2 to finish, then:**

**Wave 3 — independent (different files):**

- [x] **T006** [P] Criar migração de catálogo que preencha e restrinja `normalized_name` sem introduzir duplicidades, validando com `migrate` e `makemigrations --check --dry-run` · backend/catalog/migrations/0003_species_normalized_name.py
- [x] **T007** [P] Criar migração de exemplares para proprietário, condições iniciais e `VisualEntry`, incluindo estratégia para dados existentes, validando com `migrate` e `makemigrations --check --dry-run` · backend/specimens/migrations/0003_specimen_registration_fields.py

**⟶ Wait for Wave 3 to finish, then:**

**Wave 4 — single task:**

- [x] **T008** Restringir exemplares, coleção e registros de cuidado ao usuário autenticado, preservando o cálculo de `is_owned`; validar com os testes de API de exemplares · backend/specimens/views.py

---

## Phase 3: User Story 1 — Cadastrar um exemplar identificado (Priority: P1) — MVP

**Goal**: cadastrar um exemplar com taxonomia existente, solo, luminosidade e data válida e abrir seu detalhe.

**Independent Test**: selecionar uma taxonomia existente, preencher as condições, manter ou alterar a data para um dia permitido e confirmar que somente o exemplar do usuário é criado e exibido no detalhe.

### Tests

**Wave 1 — independent (different files):**

- [x] **T009** [P] [US1] Escrever testes de contrato para criação autenticada, campos obrigatórios, enum de luminosidade, data no fuso do cliente, nome padrão e isolamento entre usuários; executar e confirmar que falham antes da implementação · backend/specimens/tests/test_api.py
- [x] **T010** [P] [US1] Escrever testes da página para estado inicial, busca/seleção única, validação contextual, bloqueio de reenvio e navegação ao detalhe; executar e confirmar que falham antes da implementação · frontend/src/pages/__tests__/SpecimenCreatePage.test.jsx

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T011** [P] [US1] Implementar o serializer de criação e detalhe com taxonomia obrigatória, condições iniciais, nome padrão e validação de data pelo fuso IANA; validar com os testes focados de API · backend/specimens/serializers.py
- [x] **T012** [P] [US1] Implementar busca e seleção acessível de uma única entrada taxonômica, com estados de carregamento e ausência; validar com os testes da página · frontend/src/components/specimen/TaxonomyField.jsx
- [x] **T013** [P] [US1] Adicionar operações e chaves de cache para busca de taxonomia, criação de exemplar multipart e invalidação da coleção; validar com os testes de cache e da página · frontend/src/services/apiClient.js

**⟶ Wait for Wave 2 to finish, then:**

**Wave 3 — single task:**

- [x] **T014** [US1] Integrar o serializer de criação ao viewset, definir o proprietário pelo request e retornar erros DRF por campo; validar com os testes focados de API · backend/specimens/views.py

**⟶ Wait for Wave 3 to finish, then:**

**Wave 4 — single task:**

- [x] **T015** [US1] Construir o formulário responsivo com `Input`, `Button` e `Card`, data local inicial/máxima, preservação dos valores e submissão única; validar com os testes da página · frontend/src/pages/SpecimenCreatePage.jsx

**⟶ Wait for Wave 4 to finish, then:**

**Wave 5 — single task:**

- [x] **T016** [US1] Substituir o placeholder de `/specimens/new` pela página de cadastro e registrar `/specimens/instances/:specimenId` como destino protegido; validar com o smoke test de rotas · frontend/src/App.jsx

**Checkpoint**: a User Story 1 está funcional e pode ser testada de forma independente como o MVP.

---

## Phase 4: User Story 2 — Registrar taxonomia ausente durante o cadastro (Priority: P2)

**Goal**: criar uma taxonomia local ausente, inclusive `Begonia sp.`, evitando duplicidades e selecioná-la sem sair do cadastro.

**Independent Test**: buscar um nome ausente, criar `Begonia sp.`, usá-lo no exemplar e verificar que nova tentativa com variação de caixa ou espaços retorna a entrada existente.

### Tests

**Wave 1 — independent (different files):**

- [x] **T017** [P] [US2] Escrever testes de contrato para criação local, nome vazio, `Begonia sp.`, reutilização normalizada e conflito concorrente; executar e confirmar que falham antes da implementação · backend/catalog/tests/test_api.py
- [x] **T018** [P] [US2] Ampliar os testes da página para criar e selecionar taxonomia ausente e manter o formulário em erros de nome; executar e confirmar que falham antes da implementação · frontend/src/pages/__tests__/SpecimenCreatePage.test.jsx

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — single task:**

- [x] **T019** [US2] Implementar serializer de criação local por nome, inferência de gênero e resposta que distingue criação de reutilização; validar com os testes focados do catálogo · backend/catalog/serializers.py

**⟶ Wait for Wave 2 to finish, then:**

**Wave 3 — single task:**

- [x] **T020** [US2] Implementar a operação atômica que cria ou recupera a entrada normalizada em conflitos de unicidade; validar com os testes focados do catálogo · backend/catalog/views.py

**⟶ Wait for Wave 3 to finish, then:**

**Wave 4 — single task:**

- [x] **T021** [US2] Expor `POST /api/species/local/` antes das rotas do viewset e validar a resolução da URL nos testes de contrato · backend/catalog/urls.py

**⟶ Wait for Wave 4 to finish, then:**

**Wave 5 — single task:**

- [x] **T022** [US2] Integrar criação local e seleção imediata ao estado de `TaxonomyField`, exibindo erros junto ao nome sem desmontar o formulário; validar com os testes da página · frontend/src/components/specimen/TaxonomyField.jsx

**Checkpoint**: a User Story 2 está funcional e pode ser testada de forma independente sobre a base do MVP.

---

## Phase 5: User Story 3 — Personalizar a identificação e iniciar a linha do tempo (Priority: P3)

**Goal**: aceitar apelido e uma foto opcional, criando exatamente uma primeira entrada visual quando houver imagem.

**Independent Test**: cadastrar um exemplar com apelido e foto e outro sem ambos; verificar apelido informado ou padrão, uma entrada visual no primeiro e nenhuma entrada vazia no segundo.

### Tests

**Wave 1 — independent (different files):**

- [x] **T023** [P] [US3] Ampliar testes de API para upload válido, ausência de foto, arquivo inválido, limite de tamanho e rollback de arquivo/transação; executar e confirmar que falham antes da implementação · backend/specimens/tests/test_api.py
- [x] **T024** [P] [US3] Ampliar testes da página para apelido opcional, uma única foto, erro contextual e preservação dos demais campos; executar e confirmar que falham antes da implementação · frontend/src/pages/__tests__/SpecimenCreatePage.test.jsx

### Implementation

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T025** [P] [US3] Criar o seletor acessível de uma única imagem com prévia, remoção e validação de tipo/tamanho; validar com os testes da página · frontend/src/components/specimen/InitialPhotoField.jsx
- [x] **T026** [P] [US3] Implementar criação transacional de `Specimen` e `VisualEntry`, compensação de arquivo e projeção de `initial_visual_entry`; validar com os testes focados de API · backend/specimens/serializers.py

**⟶ Wait for Wave 2 to finish, then:**

**Wave 3 — independent (different files):**

- [x] **T027** [P] [US3] Integrar apelido e `InitialPhotoField` ao multipart sem limpar o formulário em falhas; validar com os testes da página · frontend/src/pages/SpecimenCreatePage.jsx
- [x] **T028** [P] [US3] Derivar a imagem da coleção da primeira `VisualEntry` e fazer prefetch da linha do tempo sem consultas por item; validar com os testes de coleção · backend/specimens/views.py

**Checkpoint**: a User Story 3 está funcional e pode ser testada de forma independente com e sem foto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Objetivo**: fechar acessibilidade, regressões e os critérios de sucesso da feature.

**Wave 1 — independent (different files):**

- [x] **T029** [P] Revisar foco visível, rótulos, `aria-describedby`, alvos táteis, coluna móvel e estética Chlorophyll Noir; validar com a suíte da página · frontend/src/pages/SpecimenCreatePage.jsx
- [x] **T030** [P] Atualizar o smoke test para cobrir acesso autenticado ao cadastro e o destino de detalhe após sucesso · frontend/src/test/e2e_smoke.test.jsx

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — single task:**

- [x] **T031** Validar os critérios SC-002 a SC-008 executando `backend/venv/bin/python -m pytest`, `npm test -- --run` e `npm run build`, e registrar separadamente qualquer falha não relacionada · specs/005-cadastro-exemplar/checklists/requirements.md

## Dependencies & Execution Order

- **Phase dependencies**: Setup → Foundational → User Story 1 (MVP) → User Story 2 → User Story 3 → Polish.
- **Phase 1**: Wave 1 conclui a configuração comum.
- **Phase 2**: testes da Wave 1 → modelos da Wave 2 → migrações da Wave 3 → isolamento por usuário da Wave 4.
- **Phase 3 / US1**: testes da Wave 1 → serializer, componente e cliente da Wave 2 → viewset da Wave 3 → página da Wave 4 → rotas da Wave 5.
- **Phase 4 / US2**: testes da Wave 1 → serializer da Wave 2 → operação da Wave 3 → URL da Wave 4 → integração do campo da Wave 5.
- **Phase 5 / US3**: testes da Wave 1 → foto e transação da Wave 2 → integrações de página e coleção da Wave 3.
- **Phase 6**: revisão e smoke test da Wave 1 → validação integral da Wave 2.
- Dentro de cada wave marcada como independente, as tarefas `[P]` podem ser executadas em qualquer ordem; os join points devem ser respeitados.
