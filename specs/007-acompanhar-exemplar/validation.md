# Matriz de validação: Acompanhar e Atualizar Meu Exemplar

| Requisitos | Evidência automatizada ou manual |
|---|---|
| FR-001–FR-005 | Testes de API e RTL do detalhe; verificação manual de composição com e sem dados. |
| FR-006–FR-014 | Testes de serializer/viewset e RTL de atividades, confirmação, ordenação, retry e bloqueio de envio. |
| FR-015–FR-018 | Testes de upload, atomicidade, fallback e paginação visual; verificação responsiva com 0/1/20/100 itens. |
| FR-019–FR-024 | Testes de PATCH, limites, conflito, arquivamento, espécie protegida e isolamento por usuário. |
| FR-025–FR-028 | Testes de estados, acessibilidade, componentes compartilhados, regressão de rotas e build. |
| SC-001–SC-005 | Testes de detalhe/mutações e avaliação manual de tempo/interação; registrar tempo observado. |
| SC-006–SC-007 | Harness responsivo em 360, 768, 1024 e 1440 px com volumes 0, 1, 20 e 100. |
| SC-008–SC-010 | Testes de propriedade, atualização atômica e regressão das suítes backend/frontend. |

## Critérios de conclusão

Cada tarefa deve registrar teste focado aprovado antes de ser marcada. A validação final executará uma única vez as suítes backend, frontend, build e o verificador responsivo, registrando avisos e limitações sem ocultar falhas.

## Execução final — 2026-09-16

- Backend: `backend/venv/bin/python -m pytest backend` — **76 passed**.
- Migrações: `backend/venv/bin/python backend/manage.py makemigrations --check --dry-run` — **No changes detected**.
- Frontend: `npm test -- --run` — **18 arquivos, 92 testes aprovados**.
- Build: `npm run build` — **concluído**, 170 módulos transformados.
- Harness: `node specs/007-acompanhar-exemplar/validate-responsive.cjs` — não executado até o navegador porque não havia Chrome DevTools ativo em `localhost:9223`; o script foi validado estaticamente e permanece documentado no quickstart.

Os critérios de tempo de identificação em cinco segundos e cuidado em três interações/dez segundos permanecem sujeitos a avaliação com participantes; os testes automatizados validam a estrutura e o fluxo, não medição humana.
