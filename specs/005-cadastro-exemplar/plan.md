# Plano de Implementação: Cadastro de Novo Exemplar

## Summary

O cadastro será implementado como um formulário responsivo em `/specimens/new`, com busca e criação controlada de taxonomia, condições iniciais, data, apelido e uma foto opcional. O backend ampliará os modelos e contratos existentes para associar cada exemplar ao usuário autenticado, validar os dados no servidor e criar o exemplar e sua primeira entrada visual em uma única transação. O frontend usará TanStack Query para busca e mutação, preservará o estado do formulário em falhas e navegará para `/specimens/instances/:specimenId` após a criação.

## Constitution Check

| Princípio | Avaliação antes da pesquisa | Avaliação após o design |
|---|---|---|
| I. Chlorophyll Noir Aesthetic & Design System | PASS — a tela reutiliza os primitivos centrais e mantém bordas de 4px, sombras rígidas, cantos retos, paleta e tipografia vigentes. | PASS — o contrato de UI explicita os estados visuais, foco e componentes compartilhados. |
| II. Mobile-Responsive & Fluid Interface | PASS — o fluxo será de uma coluna em telas móveis e organizado em seções em telas maiores. | PASS — formulário, busca, erros e seletor de foto mantêm alvos táteis e resposta imediata. |
| III. Modular Component Architecture | PASS — campos compostos de taxonomia e foto serão componentes de responsabilidade única. | PASS — a página orquestra componentes reutilizáveis, sem duplicar primitivas. |
| IV. Local-First Caching & Offline Resilience | PASS — a pesquisa consulta primeiro o catálogo persistido e a criação não depende do GBIF. | PASS — TanStack Query mantém cache da consulta; falhas preservam os dados do formulário. |
| V. Specimen & Taxonomy Data Integrity | PASS — cada exemplar continuará ligado a `Species`; `Begonia sp.` será uma entrada canônica local com gênero conhecido. | PASS — integridade, propriedade, normalização de nomes e transação de criação estão definidas no modelo e no contrato. |
| VI. Test-Driven Task Validation | PASS — cada tarefa terá validação unitária, de integração ou de contrato antes de ser concluída. | PASS — os artefatos identificam contratos e estados testáveis para a geração das tarefas. |

Não há violações constitucionais previstas.

## Project Structure

```text
backend/
├── catalog/
│   ├── migrations/0003_species_normalized_name.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests/test_api.py
│   ├── urls.py
│   └── views.py
└── specimens/
    ├── migrations/0003_specimen_registration_fields.py
    ├── models.py
    ├── serializers.py
    ├── tests/test_api.py
    └── views.py
frontend/src/
├── App.jsx
├── components/specimen/
│   ├── InitialPhotoField.jsx
│   └── TaxonomyField.jsx
├── pages/
│   ├── SpecimenCreatePage.jsx
│   └── __tests__/SpecimenCreatePage.test.jsx
└── services/apiClient.js
```

**Structure Decision**: ampliar os módulos `catalog` e `specimens` existentes e manter a composição do fluxo no frontend, sem criar uma camada paralela de domínio.
