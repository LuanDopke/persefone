# Implementation Plan: Código de Acesso por E-mail

**Branch**: `[004-codigo-acesso]` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-codigo-acesso/spec.md`

## Summary

Adicionar um código numérico de seis dígitos à solicitação de acesso existente para que a pessoa possa concluir o login na mesma aba, sem remover a confirmação por link. O backend ampliará `AccessRequest` com hash protegido do código, contagem de falhas e bloqueio, compartilhará expiração e consumo entre os dois meios e oferecerá um endpoint específico de confirmação por e-mail e código; o frontend transformará a tela de solicitação em um fluxo de duas etapas e reutilizará o tratamento de sessão atual.

## Technical Context

**Language/Version**: Python 3.13 (Django 5.x) no backend; JavaScript ES modules com React 18 no frontend

**Primary Dependencies**: Django REST Framework 3.15+, Simple JWT 5.3+, React 18.3, React Router 6.24, Axios 1.7, Tailwind CSS 3.4

**Storage**: SQLite no desenvolvimento e PostgreSQL em produção, via Django ORM

**Testing**: pytest 8 + pytest-django 4.8 no backend; Vitest 2 + Testing Library no frontend

**Target Platform**: Servidor web Linux e navegadores modernos responsivos em desktop e mobile

**Project Type**: Aplicação web com backend Django/DRF e frontend React/Vite

**Performance Goals**: Confirmação interativa sem espera perceptível além da requisição; consultas limitadas às solicitações indexadas do e-mail; transições de interface alinhadas ao limite constitucional de 100 ms quando não dependem da rede

**Constraints**: Código de seis dígitos e uso único; validade de 15 minutos; no máximo cinco falhas por solicitação; link existente preservado; respostas sem enumeração de contas; confirmação concorrente protegida por transação; segredos não persistidos em texto puro

**Scale/Scope**: Um modelo e uma migração no app `accounts`, dois contratos públicos de autenticação, serviços/serializers/views/URLs de autenticação e uma tela React com seus testes

## Constitution Check

*GATE: Avaliado antes da pesquisa e novamente após o desenho da Fase 1.*

| Princípio | Avaliação pré-pesquisa | Reavaliação pós-desenho |
|---|---|---|
| I. Chlorophyll Noir | PASS — a alteração reutiliza `Button` e `Input`, mantendo bordas de 4 px, cantos retos, contraste e sombra rígida. | PASS — o contrato de UI exige os mesmos tokens e estados visuais. |
| II. Interface responsiva | PASS — o fluxo permanece em uma coluna, adequado a toque e teclado. | PASS — o desenho mantém a tela responsiva e define foco no campo do código. |
| III. Componentes modulares | PASS — os controles compartilhados existentes serão reutilizados e a lógica de sessão permanece em `AuthContext`. | PASS — nenhum novo padrão de UI exige componente compartilhado adicional. |
| IV. Cache local e resiliência offline | PASS — não há nova consulta externa de catálogo ou clima; autenticação requer rede por natureza. | PASS — a entrega e confirmação degradam com mensagem recuperável e não afetam os caches existentes. |
| V. Integridade de espécimes e taxonomia | PASS — a funcionalidade não altera essas entidades. | PASS — o modelo de acesso é isolado em `accounts`. |
| VI. Tarefa → teste → concluída | PASS — tarefas futuras devem associar cada mudança ao teste correspondente antes de marcar `[X]`. | PASS — `quickstart.md` define validação de backend, frontend e cenários integrados. |

Não há violação constitucional nem questão técnica pendente.

## Project Structure

### Documentation (this feature)

```text
specs/004-codigo-acesso/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── auth-api.openapi.yaml
│   └── ui-flow.md
└── tasks.md                 # criado posteriormente por /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── accounts/
│   ├── migrations/
│   ├── tests/
│   │   ├── test_auth_api.py
│   │   └── test_models.py
│   ├── models.py
│   ├── serializers.py
│   ├── services.py
│   ├── urls.py
│   └── views.py
└── core/
    ├── settings.py
    └── urls.py

frontend/
├── src/
│   ├── components/ui/
│   │   ├── Button.jsx
│   │   └── Input.jsx
│   ├── context/AuthContext.jsx
│   ├── pages/
│   │   ├── __tests__/
│   │   │   ├── AccessPage.test.jsx
│   │   │   └── ConfirmAccessPage.test.jsx
│   │   ├── AccessPage.jsx
│   │   └── ConfirmAccessPage.jsx
│   └── services/apiClient.js
└── package.json
```

**Structure Decision**: Manter a estrutura web existente. A regra de negócio e a transação ficam no app Django `accounts`; contratos HTTP permanecem nos serializers/views/URLs; a etapa de código é incorporada a `AccessPage`; a confirmação por link e o armazenamento de sessão existentes são preservados.

## Complexity Tracking

Não aplicável: o desenho não introduz violações constitucionais.
