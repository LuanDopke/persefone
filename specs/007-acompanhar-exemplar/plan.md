# Plano de Implementação: Acompanhar e Atualizar Meu Exemplar

## Summary

A página existente em `/specimens/instances/:specimenId` será ampliada para reunir identificação, estado, métricas atuais, ações de cuidado, histórico de atividades, linha do tempo visual e edição do exemplar. O backend separará o detalhe do exemplar dos históricos paginados, preservará os instantes históricos, limitará todas as operações ao proprietário e processará novas fotos com a rotina já usada no cadastro. O frontend organizará consultas e mutações com TanStack Query, reutilizará o sistema modular de interface e manterá formulários e ações recuperáveis em falhas.

## Constitution Check

| Princípio | Avaliação antes da pesquisa | Avaliação após o design |
|---|---|---|
| I. Chlorophyll Noir Aesthetic & Design System | PASS — a página reutiliza os tokens e primitivos existentes, com bordas de 4px, sombras rígidas, cantos retos, cores semânticas e tipografia vigente. | PASS — o contrato de UI restringe os novos módulos aos componentes compartilhados e exige estado textual além da cor. |
| II. Mobile-Responsive & Fluid Interface | PASS — a composição prioriza uma coluna e ações táteis em telas pequenas, com grade analítica nas telas amplas. | PASS — o contrato preserva ordem de leitura, alvos mínimos de 44px e verificação nas quatro larguras do projeto. |
| III. Modular Component Architecture | PASS — métricas, formulários e linhas do tempo serão componentes de domínio com responsabilidade única. | PASS — a página fica responsável pela orquestração e os padrões repetidos permanecem em componentes centrais ou de domínio. |
| IV. Local-First Caching & Offline Resilience | PASS — o acompanhamento usa dados persistidos locais; TanStack Query conserva dados já carregados durante revalidação e falhas. | PASS — nenhuma consulta de acompanhamento depende de serviço externo e as mutações invalidam somente as chaves relacionadas. |
| V. Specimen & Taxonomy Data Integrity | PASS — o exemplar continua ligado à espécie canônica, o proprietário limita todas as consultas e os eventos históricos mantêm ocorrência imutável. | PASS — espécie é somente leitura, históricos não expõem alteração ou exclusão e arquivamento preserva todas as relações. |
| VI. Test-Driven Task Validation | PASS — cada tarefa terá teste de modelo, API, componente, página ou responsividade antes da conclusão. | PASS — os contratos definem casos observáveis e a estratégia exige validação focada antes de marcar cada tarefa. |

Não há violações constitucionais previstas.

## Project Structure

```text
backend/specimens/
├── admin.py
├── migrations/
│   └── 0004_specimen_monitoring.py
├── models.py
├── serializers.py
├── services.py
├── urls.py
├── views.py
└── tests/
    ├── test_api.py
    └── test_models.py
frontend/src/
├── components/specimen/
│   ├── CareActivityForm.jsx
│   ├── CareLogTimeline.jsx
│   ├── SpecimenEditForm.jsx
│   ├── SpecimenMetrics.jsx
│   ├── VisualEntryForm.jsx
│   └── VisualTimeline.jsx
├── pages/
│   ├── SpecimenDetailPage.jsx
│   └── __tests__/SpecimenDetailPage.test.jsx
├── services/
│   ├── apiClient.js
│   └── __tests__/api_cache.test.jsx
└── test/
    └── layout-responsive.test.jsx
```

**Structure Decision**: ampliar o domínio `specimens` e a rota de detalhe existentes, extraindo apenas os módulos de acompanhamento que possuem estado ou responsabilidade próprios, sem criar uma segunda página ou uma camada paralela de dados.

## Technical Context

- **Backend**: Django, Django REST Framework, autenticação JWT/sessão, paginação DRF e armazenamento local de mídia já configurados.
- **Frontend**: React 18, React Router, TanStack Query, Axios e Tailwind CSS.
- **Testes**: pytest/pytest-django no backend e Vitest/React Testing Library no frontend.
- **Dados existentes**: `Specimen`, `CareLog` e `VisualEntry` já pertencem ao app `specimens`; a migração deve conservar eventos e imagens cadastrados.
- **Integração visual**: PageContainer, PageHeader, Card, Button, Modal, FormField, Input, Alert, ContentState, MediaFrame e ResponsiveGrid são a base obrigatória.
- **Estado do repositório**: há alterações não commitadas das features 005 e 006; a implementação deve partir desses arquivos sem sobrescrevê-los.

## Implementation Strategy

### Fase 1 — Integridade e migração de domínio

1. Renomear o instante histórico de `CareLog` para `occurred_at`, criar `created_at`, adicionar o tipo poda e impedir alteração dos campos históricos após a criação.
2. Tornar `VisualEntry.captured_at` informável, criar observação opcional e manter `created_at` como auditoria; dados existentes conservam seus instantes atuais.
3. Acrescentar `metrics_updated_at` ao exemplar e atualizá-lo somente quando uma métrica mudar.
4. Preservar `species` como relação imutável neste fluxo, manter arquivamento reversível e retirar a exclusão permanente da superfície HTTP.
5. Extrair a normalização AVIF para `specimens/services.py`, compartilhada pelo cadastro e pelas novas entradas visuais.

### Fase 2 — Contratos HTTP e propriedade

1. Manter `GET` e `PATCH /api/specimens/{specimenId}/` limitados ao proprietário, com serializer de atualização que aceita apenas os campos previstos.
2. Usar `expected_updated_at` para detectar edição sobre uma versão desatualizada, sob transação e bloqueio da linha, retornando conflito sem alteração parcial.
3. Expor atividades e registros visuais em coleções paginadas, filtradas obrigatoriamente pelo exemplar do proprietário e ordenadas por ocorrência ou captura mais recente.
4. Permitir somente listar, consultar e criar nos históricos; não expor edição ou exclusão de atividade ou foto.
5. Validar datas futuras, tipos, tamanho e conteúdo de imagem antes da persistência; arquivo e linha de banco formam uma única operação compensável.

### Fase 3 — Composição da página

1. Manter o cabeçalho e o contexto do exemplar durante loading, vazio, erro e revalidação.
2. Compor identificação, espécie, descrição ou última observação, foto representativa, situação, placeholder de métricas, ações rápidas e ações de edição em uma grade que preserva a ordem de leitura.
3. Substituir o `CareLogTimeline` atual por um módulo localizado, paginado e separado do formulário de atividade.
4. Criar a linha do tempo visual paginada, com fallback por item e formulário próprio para anexar uma nova foto.
5. Reutilizar Modal e FormField para confirmação rápida, registro detalhado e edição, preservando os valores quando a API falhar.

### Fase 4 — Cache, concorrência e recuperação

1. Centralizar as query keys de detalhe, atividades e registros visuais em `apiClient.js`.
2. Bloquear um segundo envio por ação enquanto a mutação correspondente estiver pendente, inclusive por clique repetido antes da atualização visual.
3. Após sucesso, atualizar ou invalidar detalhe, coleção e somente a primeira página da linha do tempo afetada, evitando duplicação por inserção manual seguida de refetch.
4. Em erro, conservar campos, arquivo selecionado quando o navegador permitir e ação de nova tentativa; em conflito, revalidar o detalhe e informar que os dados mudaram.
5. Carregar páginas adicionais sob ação explícita “Carregar mais”, sem buscar todo o histórico na abertura.

### Fase 5 — Validação

1. Cobrir migração, invariantes, propriedade, ordenação, paginação, datas futuras, atomicidade, conflito e ausência de endpoints destrutivos no backend.
2. Cobrir confirmação, envio único, preservação de formulário, cache, estados de conteúdo e carregamento progressivo no frontend.
3. Validar acessibilidade por nome, papel, foco e mensagens anunciáveis, além da responsividade em 360, 768, 1024 e 1440 pixels.
4. Executar testes focados por tarefa, depois as suítes completas e o build, conforme o princípio VI.

## Test Strategy

- **Modelos e migração**: dados anteriores preservam ocorrência/captura; novos campos possuem defaults coerentes; métricas aceitam somente seus limites; espécie e ocorrência histórica não mudam pelo fluxo.
- **API de exemplar**: proprietário recebe detalhe e altera campos permitidos; outra conta recebe 404; payload inválido não persiste parcialmente; versão desatualizada recebe 409; DELETE não é permitido.
- **API de atividades**: cinco tipos aceitos, data presente ou passada, futuro rejeitado, ordenação estável, paginação, auditoria separada e acesso restrito ao proprietário.
- **API visual**: imagem válida cria um único registro, observação e captura são preservadas, arquivo inválido ou falha de armazenamento não deixa entrada parcial e páginas posteriores são alcançáveis.
- **Página**: renderiza identificação, fallback, métricas, última atualização, arquivamento e vazios; permite confirmação rápida, registro detalhado, foto, edição e reativação sem duplicar itens.
- **Recuperação**: falhas mantêm dados de entrada e oferecem nova tentativa; conflito externo revalida o exemplar sem desmontar a página.
- **Regressão**: cadastro, coleção, autenticação e consulta existentes continuam passando; o build não introduz dependência remota obrigatória.

## Risks and Mitigations

- **Migração de instantes históricos**: usar operações de migração que copiem o valor anterior para ocorrência e auditoria antes de tornar campos obrigatórios.
- **Consultas excessivas no detalhe**: retirar históricos completos do serializer principal e usar endpoints paginados com `select_related` e ordenação indexável.
- **Duplicação após mutação**: escolher uma única estratégia por cache — invalidar/refazer a primeira página — sem também inserir o mesmo item manualmente.
- **Arquivo persistido após rollback**: remover o arquivo por compensação quando a criação do registro visual falhar.
- **Conflito com trabalho em andamento**: editar os arquivos atuais de 005/006 incrementalmente e revisar o diff por arquivo antes da validação.
- **Modal amplo em telas pequenas**: manter formulários em uma coluna, rolagem interna controlada e ações visíveis sem cobrir a navegação.

## Completion Gate

O planejamento estará pronto para geração de tarefas quando este plano, `research.md`, `data-model.md`, `contracts/api.md` e `contracts/ui.md` forem aprovados; os identificadores, códigos de resposta, regras de migração e limites de edição não podem permanecer implícitos.
