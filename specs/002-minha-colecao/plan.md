# Plano de Implementação: Minha Coleção

**Branch**: `master` | **Data**: 2026-09-14 | **Especificação**: [spec.md](./spec.md)

## Summary

A tela `Minha Coleção` substituirá a visualização por exemplar por uma grade pessoal agrupada por espécie, mantendo-a separada de `Discover`. Um endpoint DRF agregará exemplares ativos, cuidados pendentes, espécies arquivadas e a preferência de favorita; a página React o consumirá com TanStack Query, filtros locais e paginação progressiva. A tela reutilizará os componentes visuais existentes e aplicará a grade `sm:grid-cols-2 lg:grid-cols-3`.

## Project Structure

```text
backend/specimens/
├── models.py                         # estado ativo do exemplar e favorita da coleção
├── migrations/0002_collection_state.py
├── serializers.py                    # contrato de espécie agregada
├── views.py                          # ação paginada de coleção
└── tests/test_api.py                 # agregação, filtros e favorita

frontend/src/
├── App.jsx                           # rota de Minha Coleção
├── components/layout/Sidebar.jsx     # entrada de navegação
├── pages/SpecimenCatalog.jsx         # grade, filtros e estados da coleção
└── pages/__tests__/SpecimenCatalog.test.jsx

specs/002-minha-colecao/
├── research.md
├── data-model.md
└── contracts/collection-api.md
```

**Decisão de estrutura**: o domínio de coleção permanece em `specimens`, pois agrega instâncias pessoais já pertencentes a esse aplicativo; não será criado um aplicativo Django paralelo.

## Constitution Check

| Princípio | Avaliação | Fundamentação |
|---|---|---|
| I. Chlorophyll Noir | PASS | Cards, botões, indicadores e estados usarão borda de 4px, sombra rígida, geometria reta, Lexend e cores já definidas. |
| II. Interface responsiva | PASS | A grade terá uma, duas e três colunas; filtros e ações terão alvo utilizável em telas pequenas. |
| III. Arquitetura modular | PASS | A página reutilizará `Card`, `Button` e `Badge`; o card específico será extraído se sua composição passar a ser reutilizada. |
| IV. Cache local e resiliência offline | PASS | A consulta usa dados locais do Django e o cache de cinco minutos do TanStack Query; falhas terão recuperação explícita. |
| V. Integridade de espécime e taxonomia | PASS | A agregação parte do vínculo existente `Specimen.species`; registros arquivados permanecem vinculados e não são removidos. |
| VI. Validação guiada por testes | PASS | Cada tarefa futura incluirá teste de API ou de interface antes de ser marcada como concluída. |

## Phase Output Artifacts

- Pesquisa: [research.md](./research.md)
- Modelo de dados: [data-model.md](./data-model.md)
- Contrato: [contracts/collection-api.md](./contracts/collection-api.md)
