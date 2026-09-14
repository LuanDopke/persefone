# Plano de Implementação: Login sem Senha

## Summary

O produto passará a aceitar solicitações de acesso por e-mail e concluirá a autenticação somente após a confirmação de um link de uso único. O backend conservará a identidade no usuário nativo do Django, acrescentará um perfil que garante a unicidade do e-mail e emitirá um JWT de duração exata de `1 dia`. O frontend passará a decidir entre a tela pública de acesso, a confirmação do link e a área autenticada, preservando a sessão no recarregamento e oferecendo saída explícita.

## Project Structure

```text
backend/
├── accounts/
│   ├── models.py
│   ├── services.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   ├── migrations/0001_initial.py
│   └── tests/test_auth_api.py
├── core/settings.py
└── core/urls.py
frontend/src/
├── components/ui/Input.jsx
├── components/layout/AppShell.jsx
├── components/layout/Navbar.jsx
├── context/AuthContext.jsx
├── pages/AccessPage.jsx
├── pages/ConfirmAccessPage.jsx
├── pages/__tests__/AccessPage.test.jsx
├── services/apiClient.js
├── App.jsx
└── test/e2e_smoke.test.jsx
```

**Structure Decision:** a responsabilidade de autenticação ficará no novo aplicativo Django `accounts` e no `AuthContext` do frontend; páginas e componentes somente consomem esse contrato.

## Constitution Check

| Princípio | Avaliação | Evidência no plano |
|---|---|---|
| I. Chlorophyll Noir Aesthetic & Design System | PASS | A tela de acesso reutiliza `Button` e cria `Input` como primitivo compartilhado com bordas, sombra e foco definidos pelo sistema. |
| II. Mobile-Responsive & Fluid Interface | PASS | As telas públicas e a ação de saída serão projetadas para coluna única e controles acionáveis por toque. |
| III. Modular Component Architecture | PASS | O estado de sessão fica em `AuthContext`; o campo de e-mail é um componente de UI reutilizável. |
| IV. Local-First Caching & Offline Resilience | PASS | A funcionalidade não consulta fonte externa; falhas de entrega retornam mensagem neutra e recuperável. |
| V. Specimen & Taxonomy Data Integrity | PASS | A mudança não altera modelos de espécies, exemplares ou registros de cuidado. |
| VI. Test-Driven Task Validation | PASS | Cada alteração terá testes de API ou interface executados antes do respectivo item ser concluído. |

## Complexity Tracking

Nenhuma violação constitucional é necessária.
