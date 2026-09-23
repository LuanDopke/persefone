# Quickstart: acompanhar exemplar

## Pré-requisitos

- Backend com o ambiente virtual em `backend/venv`.
- Dependências do frontend instaladas em `frontend/node_modules`.
- Banco local migrado.

## Executar localmente

```bash
backend/venv/bin/python backend/manage.py migrate
backend/venv/bin/python backend/manage.py runserver
```

Em outro terminal:

```bash
cd frontend
npm run dev
```

Acesse `/specimens/instances/<id-do-exemplar>` após autenticar. A página apresenta o resumo, métricas, histórico de cuidados, linha do tempo visual e ações de edição, arquivamento e reativação.

## Validar a implementação

```bash
backend/venv/bin/python -m pytest backend/specimens/tests
cd frontend
npm test -- --run
npm run build
```

O harness opcional de responsividade usa o Chrome DevTools Protocol. Com o frontend em `http://127.0.0.1:5174` e o Chrome expondo `localhost:9223`, execute na raiz:

```bash
node specs/007-acompanhar-exemplar/validate-responsive.cjs
```

O comando verifica 360, 768, 1024 e 1440 pixels, rolagem horizontal, ações do detalhe e presença das timelines. Nenhuma credencial deve ser incluída nos comandos ou arquivos desta feature.
