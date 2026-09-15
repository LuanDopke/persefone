# Plano de Implementação: Diretrizes de Layout Modular

## Summary

O frontend autenticado será reorganizado sobre um sistema visual compartilhado inspirado na composição do protótipo fornecido, sem copiar seu conteúdo nem introduzir funcionalidades de domínio. A implementação consolidará tokens no Tailwind/CSS, adotará um shell de viewport com navegação lateral persistente em telas amplas e navegação inferior em telas menores, criará módulos reutilizáveis para composição e estados de página e migrará as rotas existentes em ondas. Os fluxos, contratos HTTP, cache e permissões atuais serão preservados.

## Project Structure

```text
frontend/
├── index.html
├── tailwind.config.js
└── src/
    ├── App.jsx
    ├── config/
    │   └── navigation.js
    ├── styles/
    │   └── index.css
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.jsx
    │   │   ├── MobileNavigation.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── PageContainer.jsx
    │   │   ├── PageHeader.jsx
    │   │   └── Sidebar.jsx
    │   ├── specimen/
    │   │   ├── CareIndicator.jsx
    │   │   └── CollectionCard.jsx
    │   └── ui/
    │       ├── Alert.jsx
    │       ├── Badge.jsx
    │       ├── Button.jsx
    │       ├── Card.jsx
    │       ├── ContentState.jsx
    │       ├── FormField.jsx
    │       ├── Icon.jsx
    │       ├── IconButton.jsx
    │       ├── Input.jsx
    │       ├── MediaFrame.jsx
    │       ├── Modal.jsx
    │       ├── ResponsiveGrid.jsx
    │       ├── SearchField.jsx
    │       └── Table.jsx
    ├── pages/
    │   ├── SpecimenCatalog.jsx
    │   ├── SpecimenCreatePage.jsx
    │   └── SpecimenDetailPage.jsx
    └── test/
        └── layout-responsive.test.jsx
```

Arquivos de teste próximos aos componentes e páginas existentes também serão atualizados. A relação final de arquivos será refinada durante a geração de tarefas; componentes só serão criados quando houver uso real ou repetição confirmada.

**Structure Decision**: manter a arquitetura React existente e separar quatro níveis: configuração de navegação, estrutura global, primitivas de interface e componentes de domínio. As páginas orquestram dados e módulos, mas não redefinem padrões visuais compartilhados.

## Constitution Check

| Princípio | Avaliação antes da pesquisa | Avaliação após o design |
|---|---|---|
| I. Chlorophyll Noir Aesthetic & Design System | PASS — a especificação mantém verde-limão, carvão, cantos retos, bordas de 4px e sombras rígidas. | PASS — tokens e variantes semânticas ficam centralizados e prevalecem sobre divergências do protótipo. |
| II. Mobile-Responsive & Fluid Interface | PASS — o escopo inclui navegação e grades adaptáveis sem rolagem horizontal global. | PASS — o shell, a navegação inferior, os alvos de 44px e as verificações em quatro larguras estão definidos. |
| III. Modular Component Architecture | PASS — padrões repetidos serão extraídos antes da segunda adoção. | PASS — contratos separam layout, primitivas, estados e componentes de domínio. |
| IV. Local-First Caching & Offline Resilience | PASS — não há mudança de consultas ou política de cache. | PASS — estados compartilhados envolvem os fluxos atuais sem substituir TanStack Query nem dados locais. |
| V. Specimen & Taxonomy Data Integrity | PASS — a mudança é de apresentação e não altera entidades botânicas. | PASS — URLs, payloads, propriedade e ações atuais permanecem inalterados. |
| VI. Test-Driven Task Validation | PASS — cada onda terá validação de contrato e regressão. | PASS — testes unitários, de integração, build e verificação responsiva foram definidos. |

Não há violações constitucionais previstas.

## Technical Context

- **Frontend**: React 18, React Router, TanStack Query, Tailwind CSS 3.4, Vite.
- **Testes existentes**: Vitest, React Testing Library e JSDOM.
- **Persistência/API**: nenhuma alteração de banco de dados ou contrato HTTP.
- **Breakpoints de aceitação**: 360, 768, 1024 e 1440 pixels.
- **Referência visual**: conjunto HTML Plantedex fornecido pelo usuário; usado apenas como orientação de hierarquia, densidade e composição.
- **Estado do repositório**: existem mudanças em andamento da feature 005; a implementação deve integrá-las sem sobrescrever ou refazer o trabalho existente.

## Implementation Strategy

### Fase 1 — Fundação visual

1. Consolidar cores, sombras, bordas, espaçamento, tipografia e movimento em `tailwind.config.js` e `styles/index.css`.
2. Carregar Lexend para leitura e JetBrains Mono somente para metadados técnicos.
3. Normalizar variantes semânticas e estados de interação em Button, Card, Badge, Input, Table e Modal.
4. Introduzir apenas as primitivas compartilhadas exigidas pelas páginas atuais.

### Fase 2 — Shell e navegação

1. Centralizar destinos e correspondência rota-seção em `config/navigation.js`.
2. Transformar `AppShell` em um grid de viewport com único landmark `main` e rolagem confinada ao conteúdo.
3. Manter sidebar persistente a partir de 1024px e usar navegação inferior compartilhada abaixo desse limite.
4. Garantir `aria-current`, alvos de 44px, área segura inferior e destaque ativo com texto, acento e contorno.
5. Tornar Navbar e cabeçalho de página compostos por slots opcionais, sem reservar espaço vazio.

### Fase 3 — Composição e estados reutilizáveis

1. Criar PageContainer e PageHeader para margens, largura, título, descrição e ações.
2. Unificar loading, vazio e erro em ContentState sem remover o contexto da página.
3. Criar SearchField, ResponsiveGrid, MediaFrame e módulos de formulário onde a repetição já existe.
4. Corrigir acessibilidade de Modal, Table e cartões interativos: teclado, Escape, foco inicial, retorno de foco e ações não aninhadas.

### Fase 4 — Migração das páginas

1. Migrar placeholders autenticados em `App.jsx` somente para a estrutura compartilhada, sem criar novas funções.
2. Migrar catálogo preservando busca, filtros, favorito, modal, cache e tratamento de falhas.
3. Migrar cadastro preservando validação, foto, envio único e navegação pós-criação.
4. Migrar detalhe preservando consulta, refetch e dados apresentados.
5. Alinhar widgets e linha do tempo aos tokens apenas quando já fizerem parte de um fluxo existente.

### Fase 5 — Validação e estabilização

1. Validar contratos e acessibilidade com Vitest e React Testing Library.
2. Executar a suíte frontend completa e o build Vite.
3. Verificar as rotas autenticadas em 360, 768, 1024 e 1440px, incluindo overflow global, visibilidade da navegação, alvos de toque, foco, movimento reduzido e conteúdo não encoberto.
4. Comparar capturas das páginas principais com as diretrizes, sem exigir cópia literal do protótipo.

## Test Strategy

- **Tokens e primitivas**: variantes previstas, foco visível, pressionado sem deslocar vizinhos, disabled e tons semânticos acompanhados de texto ou símbolo.
- **Shell**: um único `main`, sidebar e navegação móvel nos breakpoints corretos, rota ativa correta e conteúdo em região rolável.
- **Navegação**: criação e detalhe de exemplar destacam Coleção; catálogo e detalhe de espécie destacam Descobrir; URLs atuais são mantidas.
- **Sobreposições**: Escape, foco inicial, contenção e retorno de foco para modal ou futura gaveta complementar.
- **Páginas**: cenários existentes de catálogo, cadastro e detalhe continuam passando após a migração; PageHeader permanece nos estados loading, vazio e erro.
- **Responsividade**: `scrollWidth <= clientWidth`, grade 1/2/analítica, alvos mínimos de 44px e navegação não cobrindo ações essenciais.
- **Regressão**: chamadas de API, query keys, payloads, autenticação e permissões não mudam.

## Risks and Mitigations

- **Conflito com a feature 005**: trabalhar sobre os arquivos atuais, aplicar alterações pequenas e revisar diff antes de cada migração.
- **Escopo crescer por causa do protótipo**: bloquear rotas e funções inexistentes; usar apenas linguagem visual e composição.
- **Componente abstrato sem uso**: extrair somente padrões usados em duas áreas ou necessários por contrato explícito.
- **Regressão de acessibilidade em navegação/modal**: testes por papel, nome, teclado e foco, não apenas por classes CSS.
- **Falsa cobertura responsiva em JSDOM**: complementar testes estruturais com execução em navegador real ou verificação manual registrada nas quatro larguras.
- **Mudança visual quebrar testes legados por texto/classe**: migrar asserções para semântica e comportamento, preservando critérios funcionais.

## Completion Gate

O planejamento estará pronto para tarefas quando `research.md`, `data-model.md` e `contracts/ui-system.md` estiverem aprovados, sem pendências de esclarecimento, e quando a revisão confirmar que não há funcionalidade de domínio nova nem alteração de backend.
