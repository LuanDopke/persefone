# Contrato de Interface: Acesso na Mesma Aba

## Estado inicial

- Rota: `/access`.
- Exibir campo de e-mail e ação “Solicitar acesso”.
- Validar o formato antes da requisição.
- Não exibir campo de senha.

## Solicitação aceita

- Permanecer em `/access`, sem navegação ou recarga.
- Manter o e-mail normalizado somente no estado da página aberta.
- Exibir a mensagem neutra da API.
- Exibir campo de código com rótulo explícito, `inputMode="numeric"`, preenchimento de uma única vez quando suportado e limite visual de seis dígitos.
- Exibir “Confirmar código” e uma ação para solicitar novo acesso.
- Mover o foco para o campo do código.

## Confirmação

- Remover espaços externos sem converter o código em número.
- Enviar `{ email, code }` a `/api/auth/code-confirmations/`.
- Em sucesso, chamar `completeAccess` e navegar para `/`, como no fluxo por link.
- Em erro, não criar sessão, manter a tela e exibir orientação genérica para revisar o código ou solicitar novo acesso.
- Depois de cinco falhas, a mesma resposta genérica continua sendo usada.

## Reinício e recarga

- A ação de nova solicitação volta ao formulário de e-mail e limpa código, mensagens e e-mail mantido na página.
- Uma recarga também volta ao estado inicial; nenhum envio automático de confirmação ocorre.

## Acessibilidade e sistema visual

- Reutilizar `components/ui/Input.jsx` e `components/ui/Button.jsx`.
- Manter borda sólida de 4 px, cantos sem arredondamento, sombra rígida e ação principal em lima.
- Associar rótulos e descrições aos campos e usar `role="status"` para sucesso e `role="alert"` para falha.
- Preservar foco de alto contraste e área de toque adequada em viewport estreita.

