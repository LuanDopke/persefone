# Contrato de Autenticação

## `POST /api/auth/access-requests/`

Solicita um link de acesso. Não requer autenticação.

Entrada:

```json
{ "email": "ana.silva@example.com" }
```

Resposta aceita, limitada ou com falha de entrega: status 202 e uma mensagem neutra que não revela se existe conta. Endereço inválido retorna status 400 com o erro do campo `email`.

## `POST /api/auth/access-confirmations/`

Confirma o segredo recebido pelo link. Não requer autenticação.

Entrada:

```json
{ "token": "segredo-do-link" }
```

Resposta válida:

```json
{
  "access": "jwt",
  "email": "ana.silva@example.com",
  "display_name": "ana.silva"
}
```

Token inválido, expirado ou já usado retorna status 400 com mensagem que permite solicitar novo link. O JWT `access` expira após `1 dia`.

## `POST /api/auth/logout/`

Exige JWT válido e retorna status 204. A revogação local é concluída pelo cliente ao remover `access_token`; não há refresh token para manter a sessão.

## Contrato de interface

As rotas públicas são `/access` e `/access/confirm`; a área existente permanece protegida. A tela sem sessão contém somente o campo `email`, uma ação de solicitação e mensagens de resultado. A confirmação inválida exibe uma ação para retornar a `/access`.
