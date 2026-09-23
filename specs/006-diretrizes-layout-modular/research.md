# Pesquisa: Diretrizes de Layout Modular

## Decisão 1 — Constituição prevalece sobre diferenças do protótipo

**Decisão**: usar a referência para hierarquia, densidade, navegação e composição; manter bordas de 4px, cantos retos e sombras rígidas de 4 ou 6px conforme a Constituição Persefone.

**Motivo**: o protótipo alterna espessuras, arredondamentos e sombras que conflitam com o sistema já adotado pelo projeto.

**Alternativas rejeitadas**: copiar o CSS literalmente, pois criaria dois sistemas visuais; adaptar a Constituição à referência, pois ampliaria o escopo sem necessidade funcional.

## Decisão 2 — Tokens centralizados no Tailwind e CSS global

**Decisão**: estender os tokens existentes com superfícies e tons semânticos, mantendo utilitários locais apenas para composição.

**Motivo**: o projeto já centraliza lime, carvão, bordas retas e sombras no Tailwind; ampliar essa fonte reduz literais de cor e divergências por página.

**Alternativas rejeitadas**: variáveis isoladas em cada componente; biblioteca de tema nova; CSS copiado do arquivo de referência.

## Decisão 3 — Shell com sidebar em `lg` e navegação inferior abaixo de `lg`

**Decisão**: manter 1024px como transição, usar sidebar persistente em telas amplas e uma barra inferior com os quatro destinos atuais em telas menores.

**Motivo**: em 768px a sidebar fixa reduz a área útil; quatro destinos cabem com rótulos e alvos de 44px. A navegação inferior mantém as rotas visíveis e corresponde ao padrão predominante na referência.

**Alternativas rejeitadas**: manter a gaveta atual como navegação primária, por reduzir a descoberta das rotas; exibir sidebar desde 768px, por comprimir formulários e grades; adicionar item “Mais” agora, pois não há mais de cinco destinos.

## Decisão 4 — Fonte única para destinos e seção ativa

**Decisão**: definir destinos, rótulos, ícones e função de correspondência de rota em `config/navigation.js`, consumida por Sidebar e MobileNavigation.

**Motivo**: evita divergência entre navegações e corrige o destaque atual de rotas `/specimens/new` e `/specimens/instances/:id`, que pertencem a Coleção, não a Descobrir.

**Alternativas rejeitadas**: arrays duplicados por componente; inferir a seção somente pelo primeiro segmento da URL.

## Decisão 5 — Composição compartilhada sem transferir domínio para primitivas

**Decisão**: PageContainer, PageHeader, ContentState, ResponsiveGrid e primitivas tratam estrutura e estado visual; páginas continuam responsáveis por dados e regras de negócio. CollectionCard e CareIndicator ficam no domínio `specimen`.

**Motivo**: permite reuso sem criar componentes com muitas opções ou acoplar API ao sistema visual.

**Alternativas rejeitadas**: componente genérico que recebe a página inteira por configuração; abstrair cada conjunto de classes; manter cabeçalhos e estados copiados nas páginas.

## Decisão 6 — Ícones locais atrás de um único componente

**Decisão**: usar SVGs locais expostos por `Icon`, marcados como decorativos quando acompanhados de texto e nomeados quando constituírem o único rótulo.

**Motivo**: remove dependência de CDN e padroniza tamanho, traço, cor e acessibilidade.

**Alternativas rejeitadas**: Material Symbols por CDN; glifos Unicode; nova biblioteca de ícones antes de existir necessidade comprovada.

## Decisão 7 — Um único landmark principal e rolagem confinada

**Decisão**: somente AppShell renderiza `<main>`; páginas usam PageContainer ou `section`. O shell ocupa `100dvh`, mantém navegação persistente e limita a rolagem à região de conteúdo.

**Motivo**: hoje há `<main>` aninhado e a combinação `min-h-screen`/`overflow-auto` não garante que a sidebar permaneça no viewport.

**Alternativas rejeitadas**: cada página controlar sua própria rolagem; sidebar apenas visualmente longa, sem estrutura de viewport.

## Decisão 8 — Testes existentes mais validação em navegador real

**Decisão**: manter Vitest/RTL para contratos e regressão e registrar verificações responsivas em navegador real nas quatro larguras. A inclusão de Playwright será decidida nas tarefas conforme custo e infraestrutura do repositório.

**Motivo**: JSDOM não calcula layout, overflow nem posicionamento sticky; o arquivo `e2e_smoke.test.jsx` atual não é um teste de navegador.

**Alternativas rejeitadas**: considerar classes responsivas como prova visual completa; introduzir de imediato uma dependência sem avaliar o pipeline.

## Decisão 9 — Migração incremental preservando a feature 005

**Decisão**: implementar fundação, shell e módulos antes de migrar catálogo, cadastro e detalhe, revisando as mudanças existentes nesses arquivos.

**Motivo**: o worktree contém trabalho não consolidado da feature 005 em App, Button, páginas de exemplar e testes.

**Alternativas rejeitadas**: reescrever páginas em uma única alteração; substituir arquivos inteiros pelo protótipo.
