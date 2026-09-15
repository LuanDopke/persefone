# Pesquisa: Cadastro de Novo Exemplar

## Propriedade do exemplar

**Decision**: adicionar uma relação obrigatória de `Specimen` com o usuário autenticado e limitar listagem, detalhe, alteração e criação ao proprietário.

**Rationale**: a especificação determina que o exemplar pertence à coleção do usuário, enquanto o modelo e o viewset atuais operam globalmente. Persistir o proprietário no mesmo trabalho evita vazamento entre contas e permite gerar nomes padrão distinguíveis dentro da coleção correta.

**Alternatives considered**: manter o modelo global foi rejeitado por não cumprir a regra de propriedade; inferir propriedade apenas por sessão foi rejeitado porque não persiste a relação de domínio.

## Entrada taxonômica local e duplicidade

**Decision**: permitir criação autenticada de uma entrada local por um endpoint dedicado, persistindo `scientific_name`, `genus` inferido e uma chave normalizada única baseada em espaços consolidados e comparação sem distinção de caixa. A operação deve retornar a entrada existente quando houver conflito de unicidade, inclusive sob concorrência.

**Rationale**: o catálogo atual só permite leitura e a busca GBIF não cobre a necessidade de registrar um nome conhecido sem abandonar o fluxo. Uma chave persistida e protegida pelo banco evita a condição de corrida que uma verificação apenas na aplicação deixaria aberta. `Begonia sp.` permanece exatamente aceito como nome exibido e é representado como registro canônico local com gênero `Begonia`.

**Alternatives considered**: transformar todo o viewset de espécies em CRUD foi rejeitado por ampliar a superfície de edição; depender apenas do GBIF foi rejeitado por contrariar o fluxo local e o requisito de gênero indeterminado; unicidade apenas sobre `scientific_name` foi rejeitada por aceitar variantes de caixa e espaços.

## Condições iniciais e nome padrão

**Decision**: persistir `initial_soil` como texto obrigatório e `initial_light` como escolha de domínio no `Specimen`; manter `nickname` preenchido no banco, gerando no serializer um nome baseado na taxonomia e um diferenciador estável quando o cliente o omitir.

**Rationale**: as condições são parte do estado inicial do exemplar e precisam aparecer no detalhe com os valores confirmados. Gerar o apelido no servidor mantém a regra consistente para qualquer consumidor da API.

**Alternatives considered**: converter solo ou luminosidade em `CareLog` foi rejeitado porque esse modelo descreve eventos imutáveis de cuidado, não o estado inicial; gerar o nome somente no frontend foi rejeitado porque permitiria registros inconsistentes por outros clientes.

## Data no fuso do usuário

**Decision**: o frontend calcula a data inicial e o limite máximo no calendário local do navegador; o backend recebe também o fuso IANA resolvido pelo cliente e valida `acquired_at` contra a data atual nesse fuso, com fallback para o fuso configurado no servidor quando ausente ou inválido.

**Rationale**: uma `DateField` não conserva fuso, e a regra se refere à data apresentada ao usuário. A validação duplicada fornece resposta imediata sem retirar a autoridade do servidor.

**Alternatives considered**: usar exclusivamente UTC foi rejeitado porque pode mudar o dia perto da meia-noite local; confiar apenas no atributo `max` do campo HTML foi rejeitado por não proteger a API.

## Foto inicial e atomicidade

**Decision**: substituir o uso de URL externa como entrada de criação por upload multipart de no máximo um arquivo validado como imagem, armazenado por `ImageField`, e criar uma entidade `VisualEntry` vinculada ao exemplar. O serializer executará exemplar e entrada visual dentro de `transaction.atomic`; se a entrada visual falhar, o cadastro inteiro falha e o arquivo parcial é removido por compensação.

**Rationale**: a especificação exige exatamente uma primeira entrada visual quando há foto e nenhuma entrada vazia quando não há. A transação preserva essa invariável e permite que o frontend mantenha os demais campos para nova tentativa.

**Alternatives considered**: manter apenas `Specimen.photo` foi rejeitado porque não cria uma linha do tempo; criar a entrada visual depois da resposta foi rejeitado porque expõe sucesso parcial; aceitar URL informada pelo cliente foi rejeitado porque o requisito é anexar uma foto.

## Controle de confirmação e falhas de validação

**Decision**: usar uma única mutação no frontend, desabilitar o envio enquanto ela estiver pendente e mapear os erros de campo do DRF sem limpar o estado local. O servidor continua sendo a barreira de integridade; repetição após uma resposta concluída é uma nova solicitação deliberada.

**Rationale**: isso impede cliques duplicados no fluxo descrito e conserva os dados quando a API rejeita taxonomia, data ou imagem.

**Alternatives considered**: limpar o formulário antes da resposta foi rejeitado por perder dados; introduzir chave de idempotência persistida foi rejeitado por não ser necessário para impedir confirmações concorrentes na interface especificada e por ampliar o contrato.

