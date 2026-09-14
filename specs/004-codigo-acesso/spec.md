# Especificação da Funcionalidade: Código de Acesso por E-mail

**Feature Branch**: `[004-codigo-acesso]`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Além do link, enviar um código de acesso para permitir o login na mesma aba."

## User Scenarios & Testing

### User Story 1 - Entrar com código na mesma aba (Priority: P1)

Depois de solicitar acesso por e-mail, a pessoa recebe uma mensagem contendo um código temporário e pode informá-lo na tela que já está aberta para concluir o login sem trocar de aba.

**Why this priority**: Permite concluir o fluxo no contexto em que ele foi iniciado, especialmente quando o e-mail é consultado em outro dispositivo ou aplicativo.

**Independent Test**: Solicitar acesso, copiar o código recebido para a tela de acesso ainda aberta e confirmar que a sessão é iniciada na conta vinculada ao e-mail informado.

**Acceptance Scenarios**:

1. **Given** que uma pessoa solicitou acesso com um e-mail válido, **When** recebe a mensagem, **Then** encontra nela o link e um código temporário.
2. **Given** que a pessoa permanece na tela aberta após solicitar acesso, **When** informa o código válido recebido, **Then** entra na conta correspondente e é direcionada à área principal.
3. **Given** que o e-mail confirmado ainda não pertence a uma conta, **When** a pessoa informa o código válido, **Then** uma conta vinculada ao e-mail é criada e a sessão é iniciada.

---

### User Story 2 - Manter o acesso pelo link (Priority: P2)

A pessoa continua podendo abrir o link recebido por e-mail quando esse caminho for mais conveniente.

**Why this priority**: Preserva o comportamento existente e permite que cada pessoa escolha como concluir a autenticação.

**Independent Test**: Solicitar acesso, abrir o link recebido e confirmar que a conta correta é autenticada sem informar o código manualmente.

**Acceptance Scenarios**:

1. **Given** que uma solicitação possui link e código ainda válidos, **When** a pessoa abre o link, **Then** entra na conta correspondente.
2. **Given** que o acesso foi concluído pelo link, **When** a pessoa tenta usar o código da mesma solicitação, **Then** o sistema recusa a reutilização.

---

### User Story 3 - Recuperar-se de código não utilizável (Priority: P2)

Quando o código estiver incorreto, expirado ou já tiver sido usado, a pessoa recebe uma explicação sem ter a sessão iniciada e pode solicitar um novo acesso.

**Why this priority**: Mantém o fluxo recuperável sem reduzir a proteção do acesso por e-mail.

**Independent Test**: Informar códigos incorretos, expirados e consumidos, confirmar que nenhum deles inicia uma sessão e que a tela oferece uma nova solicitação.

**Acceptance Scenarios**:

1. **Given** que a pessoa informa um código incorreto, **When** tenta confirmar o acesso, **Then** não entra e recebe orientação para revisar o código.
2. **Given** que o código expirou ou já foi usado, **When** a pessoa tenta confirmá-lo, **Then** não entra e pode solicitar um novo acesso.
3. **Given** que uma solicitação acumula cinco tentativas incorretas, **When** ocorre uma nova tentativa, **Then** essa solicitação é bloqueada e a pessoa deve solicitar outro acesso.

### Edge Cases

- Espaços antes ou depois do código devem ser ignorados antes da validação.
- O código deve preservar zeros no início.
- O código e o link de uma mesma solicitação representam uma única permissão de acesso; usar um deles invalida o outro.
- Códigos iguais emitidos para e-mails diferentes não podem permitir acesso à conta errada.
- A tela deve manter o e-mail da solicitação associado à confirmação do código, sem permitir a troca silenciosa de identidade.
- Recarregar a tela de confirmação antes do login não pode autenticar uma pessoa sem nova validação.

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE incluir um código numérico de seis dígitos na mesma mensagem que contém o link de acesso.
- **FR-002**: O sistema DEVE permitir que a pessoa informe o código na mesma tela em que solicitou o acesso.
- **FR-003**: O sistema DEVE validar o código em conjunto com o e-mail usado na solicitação.
- **FR-004**: O código DEVE expirar no mesmo instante que o link da solicitação correspondente.
- **FR-005**: O código e o link DEVEM ser de uso único compartilhado; a confirmação por um meio deve invalidar o outro.
- **FR-006**: Um código válido DEVE criar ou localizar a conta do e-mail confirmado e iniciar uma sessão com as mesmas regras do acesso por link.
- **FR-007**: O sistema DEVE recusar códigos incorretos, expirados, bloqueados ou consumidos sem iniciar uma sessão.
- **FR-008**: O sistema DEVE limitar cada solicitação a cinco tentativas incorretas de código.
- **FR-009**: O sistema DEVE oferecer uma forma de solicitar novo acesso quando o código não puder mais ser usado.
- **FR-010**: As respostas de confirmação DEVEM evitar revelar se um e-mail possui uma conta existente.
- **FR-011**: O sistema DEVE manter o fluxo existente de confirmação por link.
- **FR-012**: O sistema DEVE aceitar somente os seis dígitos do código, ignorando espaços externos e preservando zeros iniciais.

### Key Entities

- **Solicitação de acesso**: Pedido temporário associado a um e-mail, com expiração, estado de consumo e quantidade de tentativas incorretas.
- **Código de acesso**: Identificador numérico temporário vinculado a uma solicitação e validado junto ao e-mail correspondente.
- **Link de acesso**: Caminho alternativo vinculado à mesma solicitação e ao mesmo estado de uso do código.
- **Sessão**: Período autenticado iniciado após uma confirmação válida por código ou link.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Em 100% dos testes de solicitação válida, a mensagem recebida apresenta um link e um código de seis dígitos.
- **SC-002**: Em 100% dos testes com código válido, a pessoa conclui o login na mesma aba e entra na conta vinculada ao e-mail solicitado.
- **SC-003**: Em 100% dos testes, usar o link ou o código impede o uso posterior do outro meio da mesma solicitação.
- **SC-004**: Em 100% dos testes com código incorreto, expirado, bloqueado ou consumido, nenhuma sessão é criada.
- **SC-005**: A confirmação de um código válido pode ser concluída em menos de um minuto após a pessoa consultar a mensagem.
- **SC-006**: Em 100% dos testes, a sexta tentativa de uma mesma solicitação permanece bloqueada após cinco erros.

## Assumptions

- O código possui seis dígitos numéricos para facilitar a digitação sem reduzir a associação obrigatória ao e-mail solicitado.
- O código e o link permanecem válidos por quinze minutos, conforme o prazo atual do login por link.
- A tela conserva localmente o e-mail usado na solicitação enquanto aguarda o código.
- Solicitar um novo acesso continua sujeito ao limite de reenvio existente.
- O envio do código utiliza a mesma mensagem e o mesmo canal de e-mail do link atual.
