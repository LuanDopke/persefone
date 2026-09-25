# Fontes e importação de chaves de identificação

Este documento descreve o fluxo implantado no Persefone e serve como ponto de discussão para mudanças futuras.

## Fluxo para usuários

1. Abra **Chaves de identificação** e pesquise um táxon ou título.
2. O Persefone consulta o catálogo local, a KeyBase e a Plazi/TreatmentBank. Falhas externas são mostradas por fonte e não impedem o uso das chaves locais.
3. Uma chave externa pode ser lida em uma página incorporada ao Persefone ou preparada para importação. Se a fonte bloquear a incorporação, a mesma página oferece abertura em nova aba. Para importar, selecione no GBIF a família ou o gênero ao qual ela se aplica e informe a abrangência.
4. Se a fonte não declarar uma licença de redistribuição, informe a licença ou autorização obtida. Sem isso, use o leitor da fonte; o Persefone não copia o conteúdo.
5. A importação vincula os resultados ao GBIF e cria um **rascunho privado**. Nenhuma chave importada é publicada automaticamente.
6. Revise o rascunho no editor. A publicação cria uma versão imutável. Alterações posteriores e sugestões da comunidade criam novas versões.

Também é possível importar um arquivo SDD XML pelo botão **Importar SDD**. URLs são aceitas somente para arquivos HTTPS públicos dos domínios do Xper3; arquivos de outras origens devem ser enviados diretamente. O limite é 5 MB e a licença ou autorização é obrigatória.

## Fontes integradas

| Fonte | Descoberta | Importação | Credencial |
| --- | --- | --- | --- |
| KeyBase | API pública por termo | JSON da API; chaves derivadas de publicação exigem licença ou autorização declarada | Não |
| Plazi/TreatmentBank | API pública por gênero | XML de tratamento quando a publicação e a licença permitem | Não |
| Xper3/SDD | Arquivo ou URL conhecida | SDD 1.1 com caracteres categóricos | Não para arquivos públicos; bases privadas dependem da conta do proprietário |
| TaxonWorks | Não habilitada como catálogo global | O formato JSON poderá ser adicionado por projeto | Token público ou de projeto fornecido pelo responsável |

## Estruturas executadas

- `branching`: chave sequencial com 1 a 1000 passos. Cada passo contém de 2 a 20 alternativas e cada alternativa leva a outro passo ou a um táxon.
- `multi_access`: matriz com até 200 descritores categóricos e 500 táxons. O usuário responde aos descritores disponíveis e o Persefone mantém os táxons compatíveis. Um resultado só é produzido quando resta um táxon.

Os percursos registram respostas, notas, evidências e correções. A versão usada permanece associada ao percurso. O resultado cria uma hipótese na observação e nunca confirma automaticamente a espécie.

## Regras de importação e revisão

- Todos os nomes terminais são vinculados ao GBIF antes da criação do rascunho. Nomes sem correspondência confiável interrompem a importação e são apresentados para revisão na fonte.
- Idioma, URL, identificador externo, licença e tipo da fonte ficam em `source_metadata` e são copiados para cada versão publicada.
- Chaves importadas seguem o mesmo fluxo de autoria, sugestões, relatos, arquivamento e versionamento das chaves criadas manualmente.
- O XML rejeita DTD e entidades externas. Downloads têm limite de tamanho, tempo de resposta e domínios permitidos para URLs SDD.

## Pontos previstos para alteração

Propostas podem partir deste documento e do contrato em `docs/contracts/identification-keys.md`. As extensões com impacto definido são: conector por projeto do TaxonWorks, suporte a caracteres quantitativos do SDD, escolha de vários estados em uma única resposta e fila administrativa separada para revisão editorial.
