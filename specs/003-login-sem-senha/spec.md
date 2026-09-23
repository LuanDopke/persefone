# Especificação da Funcionalidade: Login sem Senha

**Objetivo**: Permitir que uma pessoa crie ou acesse sua conta por e-mail, sem usar senha, e use o Persefone em uma sessão de um dia.

## User Scenarios & Testing

### User Story 1 - Solicitar acesso por e-mail (Priority: P1)

Uma pessoa sem sessão aberta informa seu e-mail na tela de acesso. O sistema confirma que o pedido foi recebido e envia uma mensagem para que ela conclua o acesso, sem pedir ou aceitar senha.

**Why this priority**: É o caminho indispensável para que uma pessoa entre no produto ou inicie sua conta.

**Independent Test**: Abrir o produto sem uma sessão, informar um e-mail válido e confirmar que a tela informa o envio da mensagem de acesso, sem apresentar campo de senha.

**Acceptance Scenarios**:

1. **Given** que uma pessoa não possui sessão aberta, **When** informa um e-mail válido e solicita acesso, **Then** recebe a confirmação de que foi enviada uma mensagem para esse endereço.
2. **Given** que uma pessoa informa um e-mail inválido, **When** tenta solicitar acesso, **Then** recebe orientação para corrigir o endereço antes do envio.
3. **Given** que uma pessoa solicita acesso repetidamente para o mesmo e-mail, **When** o pedido é recebido, **Then** o sistema limita os novos envios e informa quando ela poderá tentar novamente.
4. **Given** que uma pessoa não possui sessão aberta, **When** visualiza a tela de acesso, **Then** não encontra campo, ação ou requisito de senha.

### User Story 2 - Entrar e criar conta pelo link recebido (Priority: P1)

Depois de abrir o link recebido por e-mail, a pessoa é identificada e entra no produto. Se ainda não tiver uma conta, ela passa a ter uma vinculada ao endereço confirmado, sem uma etapa separada de cadastro.

**Why this priority**: A confirmação do endereço conclui o acesso de forma segura e permite o primeiro uso.

**Independent Test**: Solicitar acesso com um e-mail que não possui conta, abrir o link recebido e confirmar que a pessoa entra no produto com uma conta associada ao mesmo e-mail.

**Acceptance Scenarios**:

1. **Given** que uma pessoa recebeu um link de acesso ainda válido, **When** o abre, **Then** entra no produto e é direcionada à área principal.
2. **Given** que o e-mail confirmado ainda não está associado a uma conta, **When** a pessoa abre o link válido, **Then** o sistema cria uma conta vinculada a esse e-mail e abre a sessão.
3. **Given** que o e-mail confirmado já está associado a uma conta, **When** a pessoa abre o link válido, **Then** entra na conta existente sem criar outra.
4. **Given** que o link é inválido, expirou ou já foi usado, **When** a pessoa tenta abri-lo, **Then** recebe uma explicação e uma ação para solicitar um novo link.

### User Story 3 - Manter e encerrar a sessão (Priority: P2)

Enquanto a sessão estiver válida, a pessoa continua acessando o produto sem refazer o login. Ela vê um nome de identificação na interface e pode encerrar a sessão por uma ação disponível após entrar.

**Why this priority**: Mantém a experiência contínua e dá à pessoa controle sobre o acesso em dispositivos compartilhados.

**Independent Test**: Entrar com o e-mail `ana.silva@example.com`, recarregar o produto durante a validade da sessão, confirmar a identificação exibida e usar a ação de saída para voltar à tela de acesso.

**Acceptance Scenarios**:

1. **Given** que uma pessoa concluiu o acesso, **When** usa o produto dentro de um dia, **Then** permanece identificada sem precisar solicitar novo link.
2. **Given** que a sessão ultrapassou um dia, **When** a pessoa tenta usar uma área que exige identificação, **Then** é direcionada a solicitar novo acesso.
3. **Given** que uma pessoa entrou com `ana.silva@example.com`, **When** visualiza a interface autenticada, **Then** vê `ana.silva` como seu nome de identificação.
4. **Given** que uma pessoa possui sessão aberta, **When** seleciona a ação de sair, **Then** a sessão é encerrada e a tela de acesso é apresentada.

## Edge Cases

- Um e-mail com espaços antes ou depois do endereço deve ser tratado de modo consistente antes da validação.
- Um link de acesso não pode abrir mais de uma sessão depois de ter sido usado.
- Solicitações sucessivas não podem permitir o envio ilimitado de mensagens para o mesmo endereço.
- Ao recarregar a página com uma sessão válida, a pessoa deve permanecer identificada; com sessão expirada ou encerrada, deve retornar ao acesso.
- Se a entrega da mensagem não puder ser confirmada, a pessoa deve receber uma orientação para tentar novamente sem revelar se o e-mail já possui conta.

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE apresentar uma tela de acesso para pessoas sem sessão, com um campo para e-mail e sem campo ou fluxo de senha.
- **FR-002**: O sistema DEVE aceitar uma solicitação de acesso somente quando o e-mail informado tiver formato válido.
- **FR-003**: O sistema DEVE enviar ao e-mail informado uma mensagem com um link de acesso de uso único e duração limitada.
- **FR-004**: O sistema DEVE criar uma conta para um e-mail confirmado que ainda não esteja associado a uma conta.
- **FR-005**: O sistema DEVE abrir a conta existente quando um link válido confirmar um e-mail já associado a uma conta.
- **FR-006**: O sistema DEVE rejeitar um link de acesso inválido, expirado ou já utilizado e oferecer a solicitação de novo link.
- **FR-007**: O sistema DEVE manter a sessão autenticada por exatamente um dia após a confirmação do acesso.
- **FR-008**: O sistema DEVE permitir que a pessoa encerre a própria sessão por uma ação disponível na interface autenticada.
- **FR-009**: O sistema DEVE exibir na interface autenticada o trecho do e-mail anterior a `@` como nome de identificação da pessoa.
- **FR-010**: O sistema DEVE limitar solicitações repetidas de acesso por e-mail e informar a indisponibilidade temporária sem revelar a existência de uma conta.
- **FR-011**: O sistema DEVE restaurar uma sessão ainda válida após o recarregamento do produto e exigir novo acesso quando ela não for mais válida.

## Key Entities

- **Conta**: Identidade de acesso de uma pessoa, vinculada a um único e-mail confirmado e usada para acessar seus dados no produto.
- **Solicitação de acesso**: Pedido temporário vinculado a um e-mail, que registra o direito de usar um único link de acesso.
- **Link de acesso**: Meio temporário recebido por e-mail para confirmar a posse do endereço e iniciar uma sessão.
- **Sessão**: Período no qual a conta permanece identificada no produto após a confirmação do acesso.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Em 100% dos testes com e-mail válido, a pessoa recebe uma confirmação de solicitação de acesso sem precisar informar senha.
- **SC-002**: Em 100% dos testes com link válido, a pessoa entra na conta correta; em 100% dos testes com link inválido, expirado ou reutilizado, o acesso é recusado.
- **SC-003**: Em 100% dos testes de primeira entrada, uma conta é criada apenas após a confirmação do e-mail e fica vinculada ao endereço confirmado.
- **SC-004**: Em 100% dos testes, a sessão permanece disponível até um dia após a confirmação e exige novo acesso depois desse prazo.
- **SC-005**: Em 100% dos testes de saída, a pessoa retorna à tela de acesso e não consegue abrir áreas identificadas sem solicitar novo acesso.
- **SC-006**: Em 100% dos testes com e-mails contendo um trecho antes de `@`, a interface autenticada mostra exatamente esse trecho como nome de identificação.

## Assumptions

- O link de acesso é o meio padrão para concluir o login; não há um código manual alternativo nesta funcionalidade.
- Um endereço de e-mail identifica no máximo uma conta.
- O nome de identificação é derivado somente do trecho anterior a `@`; não há edição de perfil neste escopo.
- A pessoa solicita novo acesso quando a sessão expira, sem renovação silenciosa.

## Verbatim Constraints

- `1 dia`
- `@`
