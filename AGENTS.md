# Persefone: orientações para Codex

## Fonte de verdade

- O código, os testes e os contratos em `docs/contracts/` definem o comportamento público.
- Antes de alterar uma rota, payload, estado de interface ou chave de cache, consulte o contrato aplicável e a implementação atual.
- Atualize o contrato correspondente quando uma mudança de comportamento público for solicitada e implementada.
- Não use nem crie fluxo de especificação rígido, diretórios de tarefas ou checklists de ferramenta externa.

## Arquitetura

- Backend: Django e Django REST Framework. Mantenha Django Admin para curadoria. SQLite é usado localmente e PostgreSQL em produção.
- Frontend: React, Vite, Tailwind, React Router e TanStack Query.
- Cada `Specimen` pertence a uma conta e referencia uma `Species` canônica. Dados de outra conta respondem como não encontrados.
- `Species.is_owned` é derivado da existência de exemplares. Registros de cuidado preservam o instante histórico da ocorrência.
- Dados externos de taxonomia e clima usam cache local e devem degradar para o cache quando a fonte externa falhar.
- Reutilize componentes em `frontend/src/components/ui/`. Não crie um segundo `main`, shells de página paralelos ou regras de domínio dentro de componentes de apresentação.

## Interface


- Verifique visualmente as mudanças responsivas em 360, 768, 1024 e 1440px. Testes unitários e build não substituem essa verificação.

## Forma de trabalho

- Para mudanças não triviais, apresente um plano conciso com objetivo, arquivos, riscos e validação; em seguida implemente a solicitação do usuário sem converter o plano em tarefas rígidas.
- Para UI, prefira ciclos pequenos: implementar uma parte, inspecionar no navegador, comparar com a referência e ajustar antes de ampliar o escopo.
- Preserve alterações não relacionadas no diretório de trabalho.
- Execute a validação proporcional à mudança: testes focados, build quando frontend mudar, `makemigrations --check --dry-run` quando modelos Django mudarem e `git diff --check` ao final.
