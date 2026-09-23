# Pesquisa: Código de Acesso por E-mail

## Decisão 1: Representar link e código na mesma solicitação

**Decision**: Ampliar `accounts.AccessRequest` com `code_hash`, `failed_code_attempts` e `locked_at`, mantendo `token_hash`, `expires_at` e `used_at` como estado compartilhado entre os dois meios de confirmação.

**Rationale**: Uma única linha de banco garante a mesma expiração e o consumo mútuo exigidos pela especificação. O bloqueio por erros afeta apenas a confirmação por código; o link permanece utilizável enquanto a solicitação não expirar nem for consumida.

**Alternatives considered**: Criar uma entidade separada para o código exigiria sincronização transacional de expiração e consumo. Bloquear também o link após cinco erros reduziria a recuperação sem ser exigido pela especificação.

## Decisão 2: Gerar e armazenar o código com proteção contra leitura do banco

**Decision**: Gerar seis dígitos com `secrets.randbelow(1_000_000)`, formatar com zeros à esquerda e persistir somente um HMAC-SHA-256 derivado do código, e-mail normalizado e identificador da solicitação, usando uma chave de aplicação. Comparar os hashes em tempo constante.

**Rationale**: O espaço de um código de seis dígitos é pequeno e um SHA-256 simples pode ser enumerado fora do sistema. O HMAC impede essa enumeração sem a chave e a inclusão do e-mail e da solicitação separa códigos numericamente iguais.

**Alternatives considered**: Armazenar texto puro facilitaria vazamento do código. Hash sem chave não protege adequadamente um espaço de apenas um milhão de valores. Códigos alfanuméricos foram rejeitados porque FR-001 e FR-012 exigem seis dígitos.

## Decisão 3: Confirmar código por contrato próprio

**Decision**: Preservar `POST /api/auth/access-confirmations/` para links e adicionar `POST /api/auth/code-confirmations/` com `{ email, code }`. Ambos chamam uma rotina transacional comum que bloqueia a solicitação, valida seu estado, grava `used_at` e cria ou localiza a conta antes de emitir o JWT.

**Rationale**: Contratos separados mantêm compatibilidade com o link atual e permitem erros e regras de tentativa específicos do código sem tornar ambíguo o serializer existente.

**Alternatives considered**: Um único endpoint com campos opcionais ou união de esquemas reduziria uma rota, mas aumentaria a ambiguidade de validação e o risco de alterar clientes do link.

## Decisão 4: Resolver códigos por e-mail e comparação segura

**Decision**: Para uma confirmação por código, normalizar o e-mail, aparar apenas espaços externos do código, validar o padrão `^[0-9]{6}$` e examinar solicitações ainda não consumidas desse e-mail em ordem recente, sob transação e bloqueio. Uma tentativa que não corresponde incrementa somente a solicitação utilizável mais recente; a quinta falha registra `locked_at`, e tentativas posteriores permanecem recusadas.

**Rationale**: O e-mail faz parte obrigatória da credencial, zeros iniciais permanecem intactos e códigos iguais entre pessoas não cruzam identidades. O bloqueio transacional evita que confirmações concorrentes ultrapassem o limite ou consumam a mesma solicitação duas vezes.

**Alternatives considered**: Tornar `code_hash` globalmente único impediria colisões legítimas entre e-mails. Consultar somente pelo código exigiria indexar ou armazenar um segredo de baixa entropia de forma inadequada.

## Decisão 5: Manter o e-mail apenas no estado da tela aberta

**Decision**: Após uma solicitação aceita, `AccessPage` muda para um formulário de seis dígitos e mantém o e-mail normalizado no estado React daquela tela. Um recarregamento volta ao formulário de solicitação, e a confirmação só ocorre quando e-mail e código são enviados novamente ao backend.

**Rationale**: Isso atende ao fluxo na mesma aba e à exigência de não autenticar após recarga sem nova validação, sem persistir um identificador de autenticação no navegador antes da sessão.

**Alternatives considered**: `localStorage` sobreviveria à recarga, mas ampliaria a persistência de dados pré-autenticação. Colocar o e-mail na URL o exporia no histórico e em registros intermediários.

## Decisão 6: Respostas neutras e mensagens recuperáveis

**Decision**: Manter a resposta neutra da solicitação e retornar uma resposta genérica de confirmação inválida para código incorreto, expirado, consumido ou bloqueado. A interface orienta revisar o código e oferece uma nova solicitação sem indicar se a conta já existia.

**Rationale**: O contrato preserva FR-010 e evita transformar estados internos em sinais de enumeração. A recuperação continua disponível pela própria tela.

**Alternatives considered**: Expor motivos distintos ajudaria diagnóstico, mas revelaria estado da solicitação e permitiria inferências sobre e-mails e tentativas.

## Decisão 7: Testar serviço, API e fluxo de interface

**Decision**: Cobrir o backend com pytest/pytest-django, incluindo geração, mensagem, expiração, consumo compartilhado, associação por e-mail, bloqueio na quinta falha e concorrência lógica; cobrir a interface com Vitest e Testing Library, incluindo transição de formulário, preservação de zeros, sucesso, erro e nova solicitação.

**Rationale**: A funcionalidade cruza persistência, e-mail, autenticação e estado de UI. Testes nas três fronteiras verificam as regras sem depender de entrega SMTP real.

**Alternatives considered**: Somente testes de API não validariam a permanência na mesma aba nem a acessibilidade do formulário. Um teste ponta a ponta isolado seria mais lento e menos preciso para falhas de concorrência e estado.
