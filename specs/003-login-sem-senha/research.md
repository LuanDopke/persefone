# Pesquisa: Login sem Senha

## Decisão: preservar o usuário nativo do Django e adicionar `AccountProfile`

**Rationale:** o projeto já usa `django.contrib.auth.models.User` nos testes e não declara um modelo de usuário substituto. Um perfil um-para-um com e-mail único cria a garantia de identidade exigida sem a migração global e incompatível de `AUTH_USER_MODEL`.

**Alternatives considered:** substituir o modelo de usuário por um modelo customizado foi rejeitado porque altera uma configuração fundamental após a estrutura inicial do banco. Usar apenas `User.email` foi rejeitado porque esse campo não oferece unicidade no banco.

## Decisão: armazenar somente o hash de um token aleatório de acesso

**Rationale:** o link transportará um segredo aleatório; o banco registra seu hash, expiração e consumo. Assim, o link pode ser usado uma única vez, expira sem depender do JWT e não deixa o segredo de acesso persistido em texto.

**Alternatives considered:** usar um JWT diretamente como link foi rejeitado porque não oferece registro simples de uso único. Enviar um código manual foi rejeitado pelo escopo, que define o link como único meio de confirmação.

## Decisão: emitir somente o token de acesso SimpleJWT com validade de `1 dia`

**Rationale:** o frontend já injeta `access_token` no Axios e o DRF já valida SimpleJWT. Um token de acesso de 24 horas, sem refresh token, atende a duração exata, restaura a sessão armazenada e impede renovação silenciosa.

**Alternatives considered:** manter o limite atual de 12 horas falha no requisito. Emitir refresh token foi rejeitado porque poderia prolongar a sessão além de um dia.

## Decisão: aplicar limite por e-mail sem revelar existência de conta

**Rationale:** o serviço normalizará o endereço, contará solicitações recentes e, quando exceder o limite configurado, responderá com a mesma mensagem neutra usada para solicitações aceitas. A conta só será criada depois da confirmação válida.

**Alternatives considered:** bloquear por existência de conta foi rejeitado pois revelaria informação de cadastro. Limite apenas no navegador foi rejeitado por ser contornável.
