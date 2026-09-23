# Modelo de Dados: Login sem Senha

## `AccountProfile`

Representa a identidade confirmada da conta e estende o usuário nativo do Django.

| Campo | Tipo | Regras |
|---|---|---|
| `user` | OneToOne para `auth.User` | obrigatório; uma conta por perfil |
| `email` | e-mail único | obrigatório, normalizado antes da persistência; identifica no máximo uma conta |
| `created_at` | data e hora | criado automaticamente |

O nome de identificação não é persistido: é calculado do trecho de `email` anterior a `@`.

## `AccessRequest`

Registra um convite temporário para confirmar a posse de um e-mail.

| Campo | Tipo | Regras |
|---|---|---|
| `email` | e-mail | obrigatório e normalizado; indexado para limite de solicitações |
| `token_hash` | texto | obrigatório, único e derivado do segredo enviado no link |
| `expires_at` | data e hora | obrigatório; o serviço define prazo limitado de 15 minutos |
| `used_at` | data e hora anulável | nulo enquanto disponível; definido atomicamente na confirmação |
| `created_at` | data e hora | criado automaticamente; usado no limite de reenvios |

### Transições

`criada` → `confirmada`: o token corresponde ao hash, ainda não foi usado e não expirou; cria ou localiza `AccountProfile`, define `used_at` e emite a sessão.

`criada` → `expirada`: `expires_at` é ultrapassado; a confirmação é recusada e oferece nova solicitação.

`criada` → `consumida`: a primeira confirmação define `used_at`; novas tentativas são recusadas.
