# Pesquisa: Minha Coleção

## Agregação da coleção

**Decisão**: expor uma ação de leitura paginada no `SpecimenViewSet` que agrupe os exemplares por espécie no banco e retorne o resumo pronto para a grade.

**Racional**: a página atual recebe uma lista plana de exemplares. Agregar no servidor evita transferir toda a coleção para calcular quantidades, arquivamento e indicadores no navegador, preservando paginação para 50 ou mais espécies.

**Alternativas consideradas**: agrupar a lista existente no React foi rejeitado porque impede a paginação por espécie e repete regras de domínio no cliente.

## Estado de favorita e arquivamento

**Decisão**: acrescentar estado de favorita à espécie da coleção e um estado ativo ao exemplar; uma espécie sem exemplar ativo é retornada como arquivada após as ativas.

**Racional**: a aplicação existente representa uma coleção pessoal sem modelo de propriedade por usuário. Esses campos mantêm a preferência e o histórico no armazenamento local sem apagar a relação taxonômica.

**Alternativas consideradas**: excluir exemplares removidos, mortos ou doados foi rejeitado, pois perderia a espécie arquivada exigida. Uma tabela de preferência por usuário fica fora do escopo do modelo atual, que ainda não associa `Specimen` a um usuário.

## Cuidados pendentes e interface

**Decisão**: o endpoint receberá os três totais de atenção de um adaptador de regras de vitais; enquanto essas regras não existirem no modelo atual, o adaptador será o único ponto que codifica os limiares. A página trata cada indicador de forma independente e renderiza a proporção como `1 de 3`.

**Racional**: a especificação determina que as regras vêm do módulo de vitais e não devem ser redefinidas na tela. Um adaptador mantém a API estável quando esse módulo for integrado.

**Alternativas consideradas**: inferir atenção diretamente no JSX foi rejeitado por acoplar a apresentação a regras fisiológicas e tornar o resultado divergente do backend.
