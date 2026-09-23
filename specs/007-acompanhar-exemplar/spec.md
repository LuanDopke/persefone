# Especificação: Acompanhar e Atualizar Meu Exemplar

**Feature Branch**: `007-acompanhar-exemplar`  
**Created**: 2026-09-15  
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Acompanhar o estado do exemplar (Priority: P1)

Como pessoa responsável por uma planta, quero abrir o exemplar e reconhecer sua identificação, localização, condição atual e histórico recente, para decidir rapidamente qual cuidado precisa ser realizado.

**Why this priority**: A visão consolidada é o ponto de entrada para todas as ações de acompanhamento e entrega valor mesmo antes de qualquer novo registro.

**Independent Test**: Abrir um exemplar com dados, fotos e atividades existentes e confirmar que identificação, estado, descrição ou última observação, última atividade e linhas do tempo aparecem em uma composição única e compreensível.

**Acceptance Scenarios**:

1. **Given** que o exemplar pertence à pessoa autenticada, **When** ela abre seu detalhe, **Then** vê nome, espécie, identificação, localização, situação ativa ou arquivada, data de aquisição e foto representativa.
2. **Given** que as métricas futuras ainda dependem da taxonomia, **When** o detalhe é exibido, **Then** a página apresenta um placeholder para esse quadro e não exibe os valores atuais de vitalidade, umidade do solo ou luminosidade.
3. **Given** que existem fotos e atividades registradas, **When** a pessoa consulta o detalhe, **Then** os eventos mais recentes ficam visíveis primeiro e o histórico completo permanece alcançável.
4. **Given** que o exemplar não possui foto ou atividade, **When** seu detalhe é aberto, **Then** a página mantém sua estrutura e oferece uma orientação para produzir o primeiro registro.

---

### User Story 2 - Registrar cuidados e observações (Priority: P1)

Como pessoa cuidando de um exemplar, quero registrar rapidamente rega, adubação, replante, poda ou uma observação, para manter um diário cronológico confiável sem interromper a rotina de cuidado.

**Why this priority**: O registro de atividades é a ação recorrente central da página e já possui base de domínio no produto.

**Independent Test**: Registrar uma rega por ação rápida e uma observação com texto e horário informado, recarregar a página e confirmar que ambos aparecem no histórico do exemplar correto.

**Acceptance Scenarios**:

1. **Given** que a pessoa acabou de regar o exemplar, **When** aciona o registro rápido de rega e confirma, **Then** a atividade é salva com o horário atual e aparece no início do histórico.
2. **Given** que a pessoa deseja contextualizar uma atividade, **When** informa tipo, data e hora de ocorrência e uma nota, **Then** o histórico apresenta esses dados juntos.
3. **Given** que a atividade aconteceu anteriormente, **When** a pessoa informa uma data e hora passadas válidas, **Then** o registro ocupa sua posição cronológica correta.
4. **Given** que o salvamento falha, **When** a pessoa tenta registrar a atividade, **Then** recebe uma explicação, pode tentar novamente e não perde a nota informada.
5. **Given** que um registro foi concluído, **When** a página atualiza seu conteúdo, **Then** a nova atividade aparece sem duplicação e a ação de envio volta a ficar disponível.

---

### User Story 3 - Construir uma linha do tempo visual (Priority: P2)

Como pessoa acompanhando o desenvolvimento da planta, quero acrescentar fotos ao longo do tempo com contexto opcional, para comparar visualmente mudanças de crescimento e saúde.

**Why this priority**: O histórico visual amplia o acompanhamento, mas a página e o registro textual continuam úteis sem ele.

**Independent Test**: Anexar uma foto válida com data e observação, voltar ao exemplar e confirmar que ela aparece na linha do tempo em ordem cronológica com alternativa acessível.

**Acceptance Scenarios**:

1. **Given** que a pessoa possui uma foto válida, **When** registra a imagem no exemplar, **Then** ela é acrescentada à linha do tempo sem substituir as imagens anteriores.
2. **Given** que a pessoa acrescenta uma foto, **When** informa uma observação e a data da captura, **Then** esses dados aparecem associados à imagem.
3. **Given** que o arquivo é inválido ou excede o limite permitido, **When** a pessoa tenta enviá-lo, **Then** vê uma mensagem contextual antes de qualquer registro incompleto.
4. **Given** que uma imagem está ausente ou não pode ser carregada, **When** a linha do tempo é exibida, **Then** um substituto visual preserva a data e a descrição do registro.
5. **Given** que há muitas imagens, **When** a pessoa percorre a linha do tempo, **Then** consegue acessar todas progressivamente sem carregar todo o acervo de uma vez.

---

### User Story 4 - Atualizar os dados do exemplar (Priority: P2)

Como pessoa proprietária do exemplar, quero corrigir seus dados e arquivar ou reativar a planta, para manter seu registro coerente com a situação atual.

**Why this priority**: Dados atualizados tornam o acompanhamento confiável, mas dependem da identificação e do histórico já acessíveis.

**Independent Test**: Alterar nome, localização e condições, arquivar o exemplar, recarregar a página e confirmar que as mudanças permanecem enquanto fotos e atividades anteriores são preservadas.

**Acceptance Scenarios**:

1. **Given** que a pessoa abre a edição, **When** altera nome, localização, data de aquisição, descrição do solo ou condição de luz e salva, **Then** o detalhe passa a apresentar os valores atualizados.
2. **Given** que o quadro de métricas ainda aguarda a definição da taxonomia, **When** a pessoa abre a edição, **Then** a interface mantém apenas a indicação de que essas métricas serão definidas futuramente e não oferece campos para alterá-las.
3. **Given** que algum valor é inválido, **When** a pessoa tenta salvar, **Then** cada problema aparece junto ao campo correspondente e nenhuma alteração parcial é aplicada.
4. **Given** que o exemplar não está mais sob cuidado, **When** a pessoa o arquiva, **Then** ele fica identificado como arquivado sem perder fotos, atividades ou vínculo taxonômico.
5. **Given** que um exemplar arquivado volta ao cuidado, **When** a pessoa o reativa, **Then** ele volta ao estado ativo com todo o histórico preservado.

### Edge Cases

- Como impedir registros duplicados quando a pessoa toca repetidamente em uma ação rápida ou a conexão demora?
- Como ordenar atividades criadas agora que representam ocorrências em horários anteriores?
- O que acontece quando uma foto é selecionada e a sessão expira antes do envio?
- Como apresentar datas em torno de mudanças de fuso horário sem alterar o instante histórico registrado?
- Como preservar a nota e os campos alterados quando o salvamento falha?
- Como lidar com nomes, localizações e observações extensos sem provocar rolagem horizontal?
- Como evitar que uma pessoa consulte ou altere um exemplar, foto ou atividade pertencente a outra conta?
- Como a página informa que um exemplar foi arquivado em outra sessão enquanto estava aberto para edição?
- Como as ações rápidas permanecem acessíveis sem cobrir conteúdo ou a navegação móvel?

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE apresentar uma página individual para acompanhar cada exemplar pertencente à pessoa autenticada.
- **FR-002**: A página DEVE apresentar nome do exemplar, espécie vinculada, identificação, localização, data de aquisição e situação ativa ou arquivada.
- **FR-003**: A página DEVE apresentar a foto representativa e um substituto visual quando nenhuma imagem puder ser exibida.
- **FR-004**: A página DEVE reservar um bloco de métricas para futura integração com dados da taxonomia e NÃO DEVE exibir, nesta entrega, os valores atuais de vitalidade, umidade do solo ou luminosidade.
- **FR-005**: A página DEVE reunir linha do tempo visual, ações de cuidado e histórico de atividades em uma hierarquia que permaneça compreensível em telas pequenas e amplas.
- **FR-006**: O sistema DEVE listar as atividades do exemplar por data e hora de ocorrência, da mais recente para a mais antiga.
- **FR-007**: O sistema DEVE permitir registrar atividades dos tipos rega, adubação, replante, poda e observação.
- **FR-008**: Cada atividade DEVE manter o exemplar relacionado, o tipo, a data e hora de ocorrência, a data e hora de registro e uma nota opcional.
- **FR-009**: O sistema DEVE oferecer ações rápidas para os tipos recorrentes e solicitar confirmação antes de concluir o registro.
- **FR-010**: O sistema DEVE permitir informar uma ocorrência passada, mas NÃO DEVE permitir data e hora futuras.
- **FR-011**: A data e hora de ocorrência de uma atividade DEVE permanecer imutável após sua criação para preservar a integridade histórica.
- **FR-012**: O sistema DEVE impedir envios duplicados enquanto uma atividade ou alteração estiver sendo salva.
- **FR-013**: Após registrar uma atividade, o sistema DEVE atualizar o histórico e as informações derivadas sem duplicar entradas.
- **FR-014**: O sistema DEVE preservar os dados informados e oferecer nova tentativa quando o registro de atividade falhar.
- **FR-015**: O sistema DEVE permitir anexar novas fotos ao exemplar sem substituir nem remover automaticamente os registros visuais anteriores.
- **FR-016**: Cada registro visual DEVE manter imagem, data da captura, data do registro e uma observação opcional.
- **FR-017**: O sistema DEVE validar tipo e tamanho da imagem antes de concluir o registro visual e NÃO DEVE criar entrada parcial após uma falha.
- **FR-018**: O sistema DEVE carregar progressivamente linhas do tempo extensas de fotos e atividades.
- **FR-019**: O sistema DEVE permitir alterar nome, localização, data de aquisição, descrição do solo e condição de luz do exemplar.
- **FR-020**: A interface NÃO DEVE oferecer edição dos campos de vitalidade, umidade do solo ou luminosidade; os campos de backend podem permanecer preservados para integração futura com a taxonomia.
- **FR-021**: O sistema DEVE validar todas as alterações antes de aplicá-las e NÃO DEVE persistir uma atualização parcial quando algum campo for inválido.
- **FR-022**: O sistema DEVE permitir arquivar e reativar o exemplar sem apagar seu histórico, suas fotos ou seu vínculo com a espécie.
- **FR-023**: A espécie vinculada NÃO DEVE ser alterada por esta página para evitar troca acidental de identidade taxonômica.
- **FR-024**: Somente a pessoa proprietária DEVE poder visualizar ou alterar o exemplar e criar ou consultar seus registros relacionados.
- **FR-025**: A página DEVE apresentar estados de carregamento, ausência de dados, falha e salvamento sem remover o contexto ou as ações de recuperação aplicáveis.
- **FR-026**: As ações interativas DEVEM possuir rótulos textuais, foco visível, retorno de estado e alvos adequados para interação por toque.
- **FR-027**: A apresentação DEVE reutilizar as diretrizes e os módulos compartilhados do Persefone, preservando bordas retas, contraste, tipografia, cores semânticas e comportamento responsivo.
- **FR-028**: A atualização DEVE preservar os fluxos existentes de cadastro, coleção, autenticação e consulta de exemplares.

### Key Entities

- **Exemplar**: Planta individual pertencente à pessoa autenticada e vinculada a uma espécie; reúne identificação pessoal, localização, aquisição, condições, campos de métricas preservados para futura integração e situação ativa ou arquivada.
- **Registro de atividade**: Evento histórico relacionado ao exemplar; possui tipo de cuidado ou observação, instante de ocorrência imutável, instante de registro e nota opcional.
- **Registro visual**: Fotografia histórica vinculada ao exemplar; possui arquivo de imagem, instante de captura, instante de registro e observação opcional.
- **Métrica futura de taxonomia**: Leitura definida pela taxonomia da espécie, a ser integrada posteriormente à página e apresentada com escala ou unidade apropriada.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Em 100% dos exemplares avaliados, a pessoa identifica nome, espécie, situação e cuidado registrado mais recentemente em até cinco segundos após a página estar pronta.
- **SC-002**: Uma atividade recorrente pode ser registrada em até três interações ou dez segundos em uma tela móvel, desconsiderando o tempo de rede.
- **SC-003**: Em 100% dos registros validados, fotos e atividades permanecem associadas ao exemplar correto e aparecem na ordem cronológica esperada após recarregar a página.
- **SC-004**: Em 100% das tentativas duplicadas durante um salvamento em andamento, somente um registro é criado.
- **SC-005**: Em 100% das falhas simuladas de salvamento, notas e alterações ainda não concluídas permanecem disponíveis para nova tentativa.
- **SC-006**: Em verificações com 0, 1, 20 e 100 registros, a página mantém estados compreensíveis e permite alcançar todo o histórico sem bloquear outras ações.
- **SC-007**: Nas larguras de 360, 768, 1024 e 1440 pixels, nenhuma ação essencial fica encoberta e não ocorre rolagem horizontal da página.
- **SC-008**: Em 100% das tentativas realizadas por outra conta, o exemplar e seus registros não são exibidos nem alterados.
- **SC-009**: Em 100% das atualizações inválidas avaliadas, nenhum campo do exemplar é persistido parcialmente.
- **SC-010**: Todos os critérios existentes de cadastro, coleção, autenticação e consulta continuam atendidos após a entrega.

## Assumptions

- A página amplia o detalhe individual de exemplar já existente; não cria uma segunda tela concorrente para o mesmo registro.
- As atividades contempladas nesta entrega são rega, adubação, replante, poda e observação; lembretes agendados e automações não fazem parte do escopo.
- Uma ação rápida registra o horário atual por padrão e sempre apresenta uma confirmação explícita antes do envio.
- Uma atividade concluída é histórica: esta entrega não inclui editar ou apagar registros de atividade, apenas criar e consultar.
- A edição abrange dados pessoais e condições do exemplar, mas não troca sua espécie vinculada nem edita as métricas reservadas para a taxonomia.
- Arquivar é a alternativa segura para retirar uma planta da coleção ativa; exclusão definitiva não faz parte do escopo.
- Os campos de métricas existentes no backend permanecem preservados, mas não são exibidos nem editados no frontend desta entrega; futuras métricas serão definidas pela taxonomia.
- A linha do tempo visual aceita várias fotos e amplia o registro inicial já existente; remoção de fotos não faz parte do escopo.
- O limite e os formatos de imagem seguem as regras já adotadas no cadastro de exemplar.
- O template fornecido orienta composição, hierarquia, métricas, ações rápidas e linhas do tempo; nomes, dados de exemplo, imagens externas e navegação própria do template não serão copiados.
- A página seguirá as diretrizes modulares definidas na especificação de layout do Persefone, sem manter uma implementação visual paralela.
