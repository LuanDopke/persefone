# Contrato do Sistema de Interface

## Escopo

Este contrato define as fronteiras públicas dos módulos compartilhados. É um contrato de frontend; nenhuma rota HTTP é criada ou alterada.

## Estrutura global

### `AppShell`

```jsx
<AppShell>{routeContent}</AppShell>
```

- Renderiza marca, conta, navegação desktop, navegação móvel e o único `<main>` autenticado.
- Usa viewport dinâmica, rolagem confinada e compensação inferior para a navegação móvel.
- Não conhece regras de dados das páginas.

### `Sidebar` e `MobileNavigation`

```jsx
<Sidebar items={navigationItems} pathname={pathname} />
<MobileNavigation items={navigationItems} pathname={pathname} />
```

- Consomem a mesma configuração.
- Aplicam `aria-current="page"` ao destino ativo.
- Mantêm rótulo textual visível.
- MobileNavigation exibe no máximo cinco itens, com alvos mínimos de 44×44px e suporte a safe area.

## Composição de página

### `PageContainer`

```jsx
<PageContainer width="wide">...</PageContainer>
```

- Usa margem interna de 16px em telas pequenas e 24px a partir de telas médias.
- Impede overflow horizontal global e aceita larguras documentadas.
- Renderiza elemento neutro, nunca outro `<main>`.

### `PageHeader`

```jsx
<PageHeader
  title="Minha coleção"
  description="Exemplares sob seus cuidados"
  search={<SearchField ... />}
  primaryAction={<Button ... />}
/>
```

- `title` é obrigatório e renderiza `h1`.
- Slots ausentes não deixam colunas ou espaços vazios.
- Em telas pequenas, ações seguem o título na ordem de leitura.

### `ResponsiveGrid`

```jsx
<ResponsiveGrid variant="cards">...</ResponsiveGrid>
```

- Variantes iniciais: `cards` e `analytics`, somente se ambas forem usadas.
- A ordem do DOM continua sendo a ordem de leitura.
- O consumidor pode definir spans desktop documentados, não posições absolutas.

### Composição do detalhe de exemplar

A tela de detalhe de exemplar é a composição de referência para páginas autenticadas com informação densa. Ela deve seguir esta ordem no DOM:

1. identificação e situação do exemplar;
2. foto representativa, resumo e métricas atuais;
3. linha do tempo visual;
4. ações de cuidado;
5. histórico de crescimento e cuidados.

Em telas amplas, a identificação pode compartilhar a faixa superior com o painel de métricas. A área de ações e histórico pode usar uma relação aproximada de 1/3 para 2/3 quando os dois blocos permanecerem legíveis. Em telas estreitas, todos os blocos passam a uma coluna na mesma ordem de leitura.

- O cabeçalho exibe identificador técnico, situação textual, nome do exemplar, contexto da espécie e ações da página.
- O painel de métricas exibe rótulo, valor, unidade ou escala e atualização; barras de progresso são complemento visual, nunca a única comunicação do valor.
- A linha do tempo visual usa um título colorido em bloco retangular, divisor horizontal, cartões de mídia quadrados com data de captura e uma ação explícita para adicionar registro quando permitida; não usa um Card externo.
- Ações rápidas de cuidado exibem tipo e última ocorrência; o histórico exibe instante de ocorrência, tipo e nota quando existente.
- Ações de cuidado, resumo e histórico usam títulos em blocos retangulares com cores distintas e divisores diretamente na página; Cards ficam restritos às ações, ao resumo interno quando necessário e aos registros individuais. A data de cada cuidado fica fora do registro, acima do quadro, junto ao eixo da timeline.
- A linha do tempo preserva a ordem cronológica no DOM e pode mudar de grade para uma coluna sem rolagem horizontal global.
- Os módulos reutilizam `Card`, `MediaFrame`, `ResponsiveGrid`, `ContentState`, `Button`, `Modal` e `FormField`; não criam um shell, um `main` ou um Card externo paralelo para cada seção.
- O conteúdo real do exemplar substitui nomes, datas, identificadores, imagens e funções apresentados em qualquer arquivo de referência.

## Estados e conteúdo

### `ContentState`

```jsx
<ContentState status="error" title="Não foi possível carregar" action={retryButton} />
```

- Estados: `loading`, `empty`, `error`.
- Fornece nome acessível durante loading e região anunciável para erro.
- Ocupa a mesma região do conteúdo pronto; não substitui PageHeader.

### `Alert` e `Badge`

```jsx
<Alert tone="warning">Requer atenção</Alert>
<Badge tone="stable">Saudável</Badge>
```

- Tons: neutral, info, stable, warning, critical e disabled.
- Estado nunca é comunicado somente por cor.
- Aliases de domínio precisam mapear para um tom existente.

### `MediaFrame`

```jsx
<MediaFrame src={photoUrl} alt={plantName} aspect="card" fallback={fallback} />
```

- Trata URL ausente e erro de carregamento.
- Usa `object-fit` sem deformação.
- Não aceita imagem remota do protótipo como dado do produto.

### `SpecimenMetrics`

- Recebe as métricas atuais do exemplar e apresenta valores, unidades, escala e instante da atualização.
- Pode usar barras ou outros indicadores visuais, desde que o valor também esteja disponível como texto.
- Usa os tons semânticos existentes; não cria uma paleta por métrica sem necessidade documentada.

### `VisualTimeline` e `CareLogTimeline`

- São regiões independentes: falha ou carregamento de uma não desmonta a outra nem o cabeçalho do exemplar.
- Preservam estados de loading, vazio, erro e paginação dentro do próprio cartão.
- A entrada visual informa captura e descrição acessível; a atividade informa ocorrência, tipo e nota quando houver.
- Em telas estreitas, os cartões formam uma coluna e as ações permanecem alcançáveis sem cobrir o conteúdo.

## Controles

### `Button` e `IconButton`

- Estados públicos: normal, hover, focus-visible, pressed e disabled.
- O estado pressed desloca apenas a representação visual e reduz a sombra.
- IconButton exige `aria-label`; Button mantém texto visível.

### `SearchField`

```jsx
<SearchField label="Buscar coleção" value={value} onChange={setValue} onClear={clear} />
```

- Rótulo acessível obrigatório, mesmo quando visualmente oculto.
- Limpar busca é uma ação nomeada e acionável por teclado.
- Não controla filtros ou consulta remota por conta própria.

### `FormField`

```jsx
<FormField id="nickname" label="Apelido" error={errors.nickname}>
  <Input id="nickname" ... />
</FormField>
```

- Associa label, ajuda e erro ao controle.
- Não armazena o estado do formulário.

### `Modal`

- Ao abrir: bloqueia a rolagem de fundo e move foco para título, controle inicial ou botão de fechar.
- Enquanto aberto: contém a navegação por Tab.
- Fecha por Escape e ação explícita quando permitido.
- Ao fechar: retorna foco ao elemento que abriu a sobreposição.
- Possui nome acessível e não depende do clique no backdrop.

### `Table`

- Mantém semântica de tabela.
- Overflow horizontal, quando necessário, fica no módulo, não na página.
- Linha acionável deve conter link ou botão acessível; `onClick` na linha não é o único mecanismo.

## Componentes de domínio

### `CollectionCard`

- Recebe exemplar, ação principal e ação de favorito por propriedades.
- Link principal e favorito não formam controles interativos aninhados.
- Nome completo permanece acessível em toque e teclado.
- Usa MediaFrame e CareIndicator compartilhados.

### `CareIndicator`

- Mapeia estado do exemplar para SemanticTone, rótulo e símbolo.
- Não introduz regra de cálculo de cuidado no componente visual.

## Compatibilidade

- As URLs autenticadas existentes permanecem válidas.
- Chamadas de API, query keys, payloads, autenticação e permissões não mudam.
- Placeholders atuais podem adotar PageContainer/PageHeader, mas não ganham dados ou ações fictícias.
- A implantação pode ocorrer por página desde que cada padrão compartilhado seja criado antes da segunda adoção.

## Verificação do contrato

- Testes RTL por papel, nome, teclado e estado; classes são evidência complementar.
- Suíte funcional existente deve permanecer verde.
- Build Vite deve concluir sem dependências remotas obrigatórias.
- Verificação em navegador real nas larguras 360, 768, 1024 e 1440px deve confirmar ausência de overflow global e de conteúdo encoberto.
