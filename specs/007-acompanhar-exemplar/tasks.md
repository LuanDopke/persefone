# Tarefas: Acompanhar e Atualizar Meu Exemplar

**Contexto**: `specs/007-acompanhar-exemplar/` · porte `oversized` · 31 tarefas · 7 fases.

## Regras de execução

As tarefas partem dos arquivos atuais das features 005 e 006, sem sobrescrever alterações existentes. Os identificadores e contratos de `contracts/api.md` e `contracts/ui.md` são obrigatórios.

Para cada tarefa: escrever ou ampliar o teste correspondente, confirmar a falha esperada, implementar, executar a validação focada e somente então registrar a conclusão pelo writer do Companion. Os testes descritos em cada fase fazem parte das tarefas de implementação, não são tarefas separadas concluídas com testes ainda falhando. As checkboxes permanecem abertas até validação aprovada; o script controla sua atualização.

`[P]` indica independência dentro da mesma onda, considerando arquivos de implementação e de teste. Não autoriza delegação automática. As ondas são locais a cada fase e nenhum trabalho começa antes do join indicado.

## Phase 1: Setup

Preparar a rastreabilidade da entrega sem instalar dependências ou alterar ferramentas desnecessariamente.

**Wave 1 — tarefa única:**

- [x] **T001** Criar a matriz de validação de FR-001–FR-028 e SC-001–SC-010, com comandos, casos, evidências previstas e distinção entre testes automatizados e avaliação de uso; validar que nenhum critério ficou sem método de verificação · specs/007-acompanhar-exemplar/validation.md

## Phase 2: Foundational

Esta fase bloqueia todas as histórias. Sua validação usa pytest de modelos, serviços, migração e cadastro, além de Vitest dos helpers HTTP; não inicia a execução das suítes completas.

**Wave 1 — independent (different files):**

- [x] **T002** [P] Separar `CareLog.occurred_at` de `created_at`, adicionar `pruning`, tornar captura informável em `VisualEntry`, incluir `notes` e `metrics_updated_at`, definir defaults, limites e ordenação com desempates; cobrir preservação dos instantes históricos e defaults no modelo (FR-007, FR-008, FR-011, FR-016, FR-020) · backend/specimens/models.py; backend/specimens/tests/test_models.py
- [x] **T003** [P] Extrair validação de conteúdo/formato e normalização AVIF com limite de 10 MB e configurações existentes, sem dependência de novos modelos; testar formatos permitidos, tamanho, orientação e resultado otimizado (FR-017, FR-028) · backend/specimens/services.py; backend/specimens/tests/test_services.py

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T004** [P] Criar a migração 0004 preservando `timestamp` em `occurred_at`, copiando-o para a auditoria de atividades antigas e preenchendo a atualização de métricas com `updated_at`; testar ida da migração 0003 para 0004 com dados existentes, arquivos e relações intactos (FR-008, FR-011, FR-016, FR-028) · backend/specimens/migrations/0004_specimen_monitoring.py; backend/specimens/tests/test_migrations.py
- [x] **T005** [P] Fazer o cadastro existente usar o serviço compartilhado e defaults de captura, mantendo transação, compensação de arquivos e `initial_visual_entry` como primeira entrada por registro; passar os testes de cadastro com e sem foto e rollback (FR-017, FR-028) · backend/specimens/serializers.py; backend/specimens/tests/test_api.py

**⟶ Wait for Wave 2 to finish, then:**

**Wave 3 — independent (different files):**

- [x] **T006** [P] Adaptar o admin aos novos campos e tornar os instantes históricos somente leitura após criação, mantendo a curadoria habilitada; testar registro dos modelos e campos protegidos (FR-011, FR-028) · backend/specimens/admin.py; backend/specimens/tests/test_admin.py
- [x] **T007** [P] Centralizar helpers de detalhe, PATCH, listas paginadas e criações, acrescentar `queryKeys.visualEntries.bySpecimen` e preservar as query keys existentes; testar payloads, filtros, cabeçalhos multipart e chamadas autenticadas (FR-018, FR-024, FR-028) · frontend/src/services/apiClient.js; frontend/src/services/__tests__/api_cache.test.jsx

**Checkpoint**: esquema, processamento compartilhado e helpers estão disponíveis; cadastro anterior permanece válido. Aplicar a migração no ambiente de teste e executar `makemigrations --check --dry-run` antes das histórias.

## Phase 3: User Story 1 — Acompanhar o estado do exemplar (P1)

**Goal**: consultar identificação, situação, descrição ou última observação, último cuidado e históricos existentes sem carregar todo o acervo.

**Independent Test**: abrir exemplares com e sem dados, acessar páginas adicionais de atividades e fotos e confirmar isolamento entre contas.

### Tests

Escrever antes de implementar: contratos de detalhe e listas em `backend/specimens/tests/test_api.py`; testes por papel, nome, unidade e estado nos arquivos RTL indicados abaixo. Incluir 0, 1, 20 e 100 registros, empates de horário, erro em uma linha do tempo e revalidação com dados anteriores visíveis.

### Implementation

**Wave 1 — tarefa única:**

- [x] **T008** [US1] Definir serializers de leitura com situação, atualização de métricas, capa mais recente, primeira imagem e último cuidado; remover históricos completos do detalhe e expor ocorrência/auditoria nos itens; testar o formato público e valores nulos (FR-002, FR-003, FR-004, FR-008, FR-016) · backend/specimens/serializers.py; backend/specimens/tests/test_api.py

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — tarefa única:**

- [x] **T009** [US1] Implementar detalhe enxuto e leitura paginada de atividades/fotos com filtro obrigatório `specimen_id`, página padrão 20, máximo 50 e ordenação decrescente estável; limitar consultas ao proprietário, retornar 400/404 conforme contrato e bloquear alterações/exclusões dos históricos; testar custo limitado do detalhe, empates, páginas e acesso por outra conta (FR-001, FR-006, FR-011, FR-018, FR-024) · backend/specimens/views.py; backend/specimens/tests/test_api.py

**⟶ Wait for Wave 2 to finish, then:**

**Wave 3 — independent (different files):**

- [x] **T010** [P] [US1] Registrar `/api/visual-entries/` mantendo os nomes das rotas de exemplar e atividades; validar resolução e métodos públicos sem nova rota concorrente (FR-001, FR-018, FR-028) · backend/specimens/urls.py; backend/specimens/tests/test_urls.py
- [x] **T011** [P] [US1] Criar o painel reservado de métricas como placeholder da futura taxonomia, sem exibir vitalidade, umidade ou luminosidade; testar a ausência dos valores e a semântica acessível (FR-004, FR-026, FR-027) · frontend/src/components/specimen/SpecimenMetrics.jsx; frontend/src/components/specimen/__tests__/SpecimenMetrics.test.jsx
- [x] **T012** [P] [US1] Separar a leitura de atividades das ações de criação no `CareLogTimeline`, localizar rótulos, mostrar ocorrência e auditoria e implementar vazio, erro, retry e “Carregar mais” sem duplicar IDs; testar páginas e preservação do conteúdo em falha (FR-006, FR-018, FR-025, FR-026, FR-027) · frontend/src/components/specimen/CareLogTimeline.jsx; frontend/src/components/specimen/__tests__/CareLogTimeline.test.jsx
- [x] **T013** [P] [US1] Criar `VisualTimeline` paginada com captura, registro, observação, MediaFrame e fallback por item; testar vazio, imagem quebrada, falha local e próxima página sem duplicação (FR-003, FR-016, FR-018, FR-025, FR-026, FR-027) · frontend/src/components/specimen/VisualTimeline.jsx; frontend/src/components/specimen/__tests__/VisualTimeline.test.jsx

**⟶ Wait for Wave 3 to finish, then:**

**Wave 4 — tarefa única:**

- [x] **T014** [US1] Compor o detalhe na rota existente com nome, espécie, UUID, descrição ou última observação, localização, aquisição, situação, capa/fallback, placeholder de métricas, último cuidado e dois históricos; preservar PageHeader e dados carregados durante falha/revalidação e manter ordem responsiva; testar estados e ausência de consultas externas (FR-001–FR-005, FR-025, FR-027, FR-028) · frontend/src/pages/SpecimenDetailPage.jsx; frontend/src/pages/__tests__/SpecimenDetailPage.test.jsx

**Checkpoint**: US1 funciona com registros pré-existentes, independentemente das novas mutações de US2–US4.

## Phase 4: User Story 2 — Registrar cuidados e observações (P1)

**Goal**: registrar os cinco tipos, por confirmação rápida ou formulário, com ocorrência presente/passada e recuperação de falhas.

**Independent Test**: confirmar uma rega e registrar uma observação passada com nota; recarregar e verificar horário, posição cronológica e ausência de duplicação.

### Tests

Escrever antes de implementar: testes API para tipos, passado/futuro, auditoria, propriedade e métodos proibidos; RTL para confirmação, dois cliques antes de render, rede pendente, nota preservada e sucesso/refetch com páginas já carregadas.

### Implementation

**Wave 1 — tarefa única:**

- [x] **T015** [US2] Implementar validação de criação de atividade para os cinco tipos, `occurred_at` não futuro e nota opcional, resolvendo exemplar pelo proprietário e protegendo campos gerados; testar erros e nenhuma entrada parcial (FR-007, FR-008, FR-010, FR-011, FR-024) · backend/specimens/serializers.py; backend/specimens/tests/test_api.py

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T016** [P] [US2] Habilitar POST transacional de atividades com resposta 201 e 404 para exemplar de outra conta, mantendo PATCH/PUT/DELETE proibidos; testar persistência e consulta após criação (FR-007, FR-008, FR-011, FR-024) · backend/specimens/views.py; backend/specimens/tests/test_api.py
- [x] **T017** [P] [US2] Criar `CareActivityForm` com modo rápido de confirmação e modo detalhado, tipos localizados, conversão de horário local para ISO, validação contextual, bloqueio síncrono de envio e dados preservados em falha; testar foco, confirmação, futuro e retry (FR-007, FR-009, FR-010, FR-012, FR-014, FR-026, FR-027) · frontend/src/components/specimen/CareActivityForm.jsx; frontend/src/components/specimen/__tests__/CareActivityForm.test.jsx

**⟶ Wait for Wave 2 to finish, then:**

**Wave 3 — tarefa única:**

- [x] **T018** [US2] Integrar ações rápidas e registro detalhado à página, fechar modal somente no sucesso e revalidar detalhe/primeira página de atividades sem inserção otimista duplicada; testar rega em até três interações, evento passado, cliques repetidos e recuperação (FR-005, FR-009, FR-012, FR-013, FR-014, FR-025) · frontend/src/pages/SpecimenDetailPage.jsx; frontend/src/pages/__tests__/SpecimenDetailPage.test.jsx; frontend/src/services/__tests__/api_cache.test.jsx

**Checkpoint**: o incremento MVP US1 + US2 permite acompanhar e registrar cuidados sem depender de upload ou edição.

## Phase 5: User Story 3 — Construir uma linha do tempo visual (P2)

**Goal**: acrescentar fotos históricas com captura e observação, preservando o acervo anterior.

**Independent Test**: enviar foto válida, recarregar e verificar capa/linha do tempo; enviar arquivo inválido e simular falha sem registro ou arquivo parcial.

### Tests

Escrever antes de implementar: testes de upload nos quatro formatos, limite de 10 MB, captura futura, compensação após falha de banco/armazenamento e propriedade; RTL de prévia, nota/arquivo preservados, falha 401 sem sucesso parcial e invalidation sem duplicação.

### Implementation

**Wave 1 — tarefa única:**

- [x] **T019** [US3] Criar serializer multipart para imagem, captura não futura e nota, usando serviço compartilhado e criação transacional com compensação de arquivo; testar preservação das fotos anteriores, formatos, tamanho e rollback (FR-015, FR-016, FR-017, FR-024) · backend/specimens/serializers.py; backend/specimens/tests/test_api.py

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T020** [P] [US3] Habilitar POST de entradas visuais, mantendo propriedade e métodos históricos protegidos, e atualizar projeção de capa da coleção para a entrada mais recente; testar upload, 404, capa e compatibilidade da primeira foto (FR-003, FR-015, FR-016, FR-024, FR-028) · backend/specimens/views.py; backend/specimens/tests/test_api.py
- [x] **T021** [P] [US3] Criar `VisualEntryForm` com seleção/previsão local, validação de formatos e tamanho, captura, observação, bloqueio de envio e retry sem limpar os dados; revogar URLs de prévia e testar acessibilidade, futuro, falha e envio repetido (FR-015, FR-016, FR-017, FR-025, FR-026, FR-027) · frontend/src/components/specimen/VisualEntryForm.jsx; frontend/src/components/specimen/__tests__/VisualEntryForm.test.jsx

**⟶ Wait for Wave 2 to finish, then:**

**Wave 3 — tarefa única:**

- [x] **T022** [US3] Integrar nova foto à página e revalidar primeira página visual, detalhe e coleção após sucesso, preservando as demais ações e o formulário em falha; testar nova capa, acervo anterior, sessão expirada e ausência de entradas duplicadas (FR-003, FR-015, FR-017, FR-025, FR-028) · frontend/src/pages/SpecimenDetailPage.jsx; frontend/src/pages/__tests__/SpecimenDetailPage.test.jsx; frontend/src/services/__tests__/api_cache.test.jsx

**Checkpoint**: a linha visual aceita novas fotos sem substituir nenhuma anterior e permanece progressivamente consultável.

## Phase 6: User Story 4 — Atualizar os dados do exemplar (P2)

**Goal**: editar campos permitidos e arquivar/reativar sem mudar espécie ou perder histórico; manter as métricas reservadas para integração futura da taxonomia.

**Independent Test**: atualizar dados, arquivar, recarregar e reativar; confirmar que o frontend não oferece edição das métricas reservadas e que não há alteração parcial em payload inválido ou versão desatualizada.

### Tests

Escrever antes de implementar: API para limites, campo protegido, aquisição futura, `metrics_updated_at`, arquivamento, 409 e 405; RTL para formulário preservado, versão carregada, confirmação, foco e aviso de alteração por outra sessão. Validar concorrência real também em PostgreSQL quando esse ambiente estiver disponível, sem tratar `select_for_update` em SQLite como prova de bloqueio.

### Implementation

**Wave 1 — tarefa única:**

- [x] **T023** [US4] Criar serializer de PATCH com lista explícita de campos, versão esperada, aquisição não futura e limites das métricas, mantendo espécie/proprietário somente leitura e instante de métricas renovado apenas quando valores mudam; testar payload completo inválido e campos protegidos (FR-019, FR-020, FR-021, FR-023) · backend/specimens/serializers.py; backend/specimens/tests/test_api.py

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — independent (different files):**

- [x] **T024** [P] [US4] Aplicar PATCH sob transação e comparação de `expected_updated_at` na linha bloqueada, responder 409 com versão atual, arquivar/reativar por `is_active` e retirar PUT/DELETE de exemplar; testar conflito sem sobrescrita, 404 e preservação de espécie/fotos/atividades (FR-021, FR-022, FR-023, FR-024) · backend/specimens/views.py; backend/specimens/tests/test_api.py
- [x] **T025** [P] [US4] Criar `SpecimenEditForm` com somente os campos previstos, placeholder das métricas futuras, erros por campo, bloqueio síncrono, versão carregada e preservação de alterações em falha; testar ausência de campos de métricas, seletor taxonômico e foco (FR-012, FR-019, FR-020, FR-023, FR-025, FR-026, FR-027) · frontend/src/components/specimen/SpecimenEditForm.jsx; frontend/src/components/specimen/__tests__/SpecimenEditForm.test.jsx

**⟶ Wait for Wave 2 to finish, then:**

**Wave 3 — tarefa única:**

- [x] **T026** [US4] Integrar edição e confirmação de arquivar/reativar, revalidar detalhe/exemplares/coleção e informar conflito sem descartar silenciosamente alterações locais; testar estado arquivado, reativação, dados persistidos, envio único e histórico intacto (FR-012, FR-019–FR-023, FR-025, FR-028) · frontend/src/pages/SpecimenDetailPage.jsx; frontend/src/pages/__tests__/SpecimenDetailPage.test.jsx; frontend/src/services/__tests__/api_cache.test.jsx

**Checkpoint**: as quatro histórias funcionam e o exemplar pode ser atualizado e recuperado sem operação destrutiva.

## Phase 7: Polish — Validação transversal

Esta fase é a proprietária única da execução final das suítes, porque não há hook de implementação marcado com `owns: validation`. Testes focados por tarefa continuam obrigatórios e não constituem uma segunda execução final.

**Wave 1 — independent (different files):**

- [x] **T027** [P] Cobrir contratos responsivos e acessíveis de módulos e modais, ordem do DOM, alvos táteis, textos longos, estados anunciáveis e navegação não encobrindo ações; executar o teste focado (FR-005, FR-025, FR-026, FR-027; SC-007) · frontend/src/test/layout-responsive.test.jsx
- [x] **T028** [P] Ampliar regressão dos fluxos autenticados de cadastro, coleção e consulta até acompanhamento, ajustando fixtures ao contrato e mantendo asserções funcionais; executar o teste focado (FR-024, FR-028; SC-008, SC-010) · frontend/src/test/e2e_smoke.test.jsx
- [x] **T029** [P] Criar verificador de navegador para detalhe/modais em 360, 768, 1024 e 1440 pixels, com 0, 1, 20 e 100 registros e imagens/textos problemáticos; verificar overflow, ações visíveis e paginação alcançável, validando o próprio harness com cenário de falha conhecido (FR-005, FR-018, FR-026, FR-027; SC-006, SC-007) · specs/007-acompanhar-exemplar/validate-responsive.cjs
- [x] **T030** [P] Documentar execução dos testes, migração, limites de foto, instantes/fusos, ações e recuperação de conflitos, sem credenciais nem dependências externas novas; validar comandos e referências contra arquivos reais (FR-017, FR-028) · specs/007-acompanhar-exemplar/quickstart.md

**⟶ Wait for Wave 1 to finish, then:**

**Wave 2 — tarefa única:**

- [x] **T031** Executar uma vez a validação final: `backend/venv/bin/python -m pytest backend`, `backend/venv/bin/python backend/manage.py makemigrations --check --dry-run`, testes frontend completos e build a partir de `frontend`, e verificador responsivo; registrar evidências de SC-001–SC-010, incluindo avaliação de identificação em cinco segundos e cuidado em três interações/dez segundos, separando limitações ou falhas anteriores (FR-001–FR-028) · specs/007-acompanhar-exemplar/validation.md

**Checkpoint**: critérios avaliados com evidência, suítes aprovadas e limitações explícitas; conclusão da feature somente após o lifecycle de implementação e `mark-complete`.

## Dependencies & Execution Order

Setup → Foundational → US1 → US2 → US3 → US4 → Polish. A sequência das histórias é deliberada: todas integram a mesma página e compartilham serializers, viewsets e testes API. Não executar histórias simultaneamente nesses arquivos.

- **Setup**: T001 precede toda a entrega.
- **Foundational**: T002/T003 → T004/T005 → T006/T007; T004 depende do modelo e T005 do processamento compartilhado.
- **US1**: T008 → T009 → T010/T011/T012/T013 → T014; componentes e rotas encontram os contratos prontos antes da integração.
- **US2**: T015 → T016/T017 → T018.
- **US3**: T019 → T020/T021 → T022.
- **US4**: T023 → T024/T025 → T026.
- **Polish**: T027/T028/T029/T030 → T031.

As tarefas `[P]` de cada onda podem ser executadas em qualquer ordem. Nenhuma onda contém dois escritores do mesmo arquivo. US1 é a consulta independente; US1 + US2 formam o MVP. “Orientação para primeiro registro” em US1 não cria atividade ou foto antes das respectivas histórias.

O próximo passo é revisar esta lista antes de solicitar implementação. Nenhuma tarefa está concluída nesta geração.
