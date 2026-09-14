# Modelo de Dados: Código de Acesso por E-mail

## Visão geral

O desenho amplia a entidade existente `AccessRequest`. Link e código são duas credenciais da mesma solicitação e compartilham expiração e consumo.

## AccountProfile

| Campo | Tipo | Regras |
|---|---|---|
| `id` | chave primária | Gerada pelo Django. |
| `user` | relação um-para-um | Obrigatória; remoção em cascata. |
| `email` | e-mail | Obrigatório e único, armazenado normalizado. |
| `created_at` | data/hora | Imutável após criação. |

Uma conta pode ser o destino de várias solicitações históricas pelo mesmo e-mail, sem chave estrangeira direta.

## AccessRequest

| Campo | Tipo | Regras |
|---|---|---|
| `id` | chave primária | Gerada pelo Django; participa do domínio do HMAC do código. |
| `email` | e-mail indexado | Obrigatório, normalizado com `strip().lower()`. |
| `token_hash` | string de 64 caracteres | SHA-256 do token de link; obrigatório e único. |
| `code_hash` | string de 64 caracteres | HMAC-SHA-256 do identificador, e-mail e código; obrigatório; não precisa ser globalmente único. |
| `expires_at` | data/hora | Exatamente 15 minutos após a criação. |
| `used_at` | data/hora anulável | Preenchido uma vez quando link ou código é confirmado. |
| `failed_code_attempts` | inteiro não negativo | Inicia em zero; incrementa atomicamente em falha atribuída à solicitação. |
| `locked_at` | data/hora anulável | Preenchido junto à quinta tentativa incorreta. |
| `created_at` | data/hora | Imutável após criação. |

### Regras de validação

- O código apresentado corresponde a `^[0-9]{6}$`; espaços externos são removidos antes da validação.
- O valor formatado mantém zeros iniciais.
- O segredo em texto puro existe somente durante a geração e montagem do e-mail.
- Uma solicitação é utilizável pelo link quando `used_at IS NULL` e `expires_at > now()`.
- Uma solicitação é utilizável pelo código quando, além das regras do link, `locked_at IS NULL` e `failed_code_attempts < 5`.
- A busca por código inclui obrigatoriamente o e-mail normalizado.
- Confirmação, incremento de falha, bloqueio e consumo ocorrem em `transaction.atomic()` com `select_for_update()`.
- Uma falha é atribuída somente à solicitação utilizável mais recente do e-mail. Solicitações expiradas, consumidas ou bloqueadas não mudam de estado.

### Estados e transições

```text
CRIADA
  ├─ link correto antes da expiração ───────────────> CONSUMIDA
  ├─ código correto antes da expiração/bloqueio ───> CONSUMIDA
  ├─ código incorreto (tentativas 1 a 4) ──────────> CRIADA
  ├─ quinto código incorreto ───────────────────────> BLOQUEADA_PARA_CODIGO
  └─ relógio alcança expires_at ────────────────────> EXPIRADA

BLOQUEADA_PARA_CODIGO
  ├─ link correto antes da expiração ───────────────> CONSUMIDA
  └─ relógio alcança expires_at ────────────────────> EXPIRADA
```

`CONSUMIDA` e `EXPIRADA` são terminais. O bloqueio do código não consome a permissão do link.

## Sessão

A sessão não requer novo modelo. Após confirmação válida, o serviço cria ou localiza `AccountProfile` pelo e-mail da solicitação e emite o mesmo JWT do fluxo por link.

| Atributo | Regra |
|---|---|
| `access` | JWT emitido para `AccountProfile.user`. |
| `email` | E-mail normalizado da solicitação confirmada. |
| `display_name` | Parte anterior ao `@`, seguindo o comportamento existente. |

