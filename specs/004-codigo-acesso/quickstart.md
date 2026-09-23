# Quickstart de Validação: Código de Acesso por E-mail

## Pré-requisitos

- Ambiente Python do backend disponível em `backend/venv`.
- Dependências do frontend instaladas em `frontend/node_modules`.
- Para validação manual, usar e-mail de console ou `locmem`; não é necessário SMTP real.

Consulte [contracts/auth-api.openapi.yaml](contracts/auth-api.openapi.yaml), [contracts/ui-flow.md](contracts/ui-flow.md) e [data-model.md](data-model.md).

## 1. Validar o backend

```bash
cd backend
venv/bin/pytest accounts/tests -q
venv/bin/pytest -q
```

Resultado esperado: os testes comprovam mensagem com link e código, seis dígitos inclusive com zero inicial, associação ao e-mail, criação/localização de conta, expiração, consumo compartilhado e bloqueio após cinco erros.

## 2. Validar o frontend

```bash
cd frontend
npm test -- --run
npm run build
```

Resultado esperado: a tela muda para a entrada do código sem navegar, mantém zeros iniciais, conclui a sessão em sucesso, oferece recuperação em erro e o build termina sem falhas.

## 3. Validar o fluxo integrado

Em terminais separados:

```bash
cd backend
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend venv/bin/python manage.py runserver
```

```bash
cd frontend
npm run dev
```

1. Acesse `http://localhost:5173/access` e solicite acesso para um e-mail válido.
2. Confirme no terminal do backend que a mesma mensagem contém o link e um código de seis dígitos.
3. Sem trocar de aba, informe o código e confirme que a área autenticada é aberta.
4. Tente abrir o link da mesma mensagem e confirme que ele é recusado.
5. Solicite novo acesso, abra o link primeiro e confirme que o código correspondente é recusado.
6. Solicite novamente, informe cinco códigos incorretos e confirme que o código correto posterior não inicia sessão; use a ação de nova solicitação.
7. Verifique em viewport estreita e por teclado que campos, foco, mensagens e ações permanecem acessíveis.

## 4. Verificar migrações e configuração

```bash
cd backend
venv/bin/python manage.py makemigrations --check --dry-run
venv/bin/python manage.py check
```

Resultado esperado: nenhuma migração não registrada e nenhuma falha de configuração.
