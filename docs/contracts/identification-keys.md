# Chaves de identificação colaborativas

Todos os endpoints exigem autenticação. Chaves publicadas são visíveis aos usuários; rascunhos e decisões sobre sugestões pertencem ao autor. Percursos só podem ser lidos ou alterados pelo proprietário da observação.

## Chaves e versões

- `GET /api/identification-keys/` retorna 20 chaves públicas não arquivadas por página. Aceita `search`, `scope_rank=family|genus`, `scope_gbif_key` e `page`. `mine=1` retorna as chaves do autor, incluindo rascunhos e arquivadas.
- `GET /api/identification-keys/discover/?search=` consulta KeyBase e Plazi. A resposta separa `results` e `errors`, para que a indisponibilidade de uma fonte não oculte as demais.
- `POST /api/identification-keys/imports/` aceita uma referência KeyBase/Plazi ou arquivo/URL SDD, além do grupo GBIF, abrangência e eventual licença declarada. A importação resolve os táxons no GBIF e cria rascunho privado; conteúdo sem licença ou autorização não é copiado.
- `POST /api/identification-keys/` cria rascunho com `title`, `scope_rank`, `scope_gbif_key`, `scope_name`, `coverage`, `source`, `source_metadata` e `draft_graph`. Fonte pode ser “Elaboração própria”. `GET /api/identification-keys/{id}/` expõe a versão publicada; o autor também recebe o rascunho. `PATCH` permite que apenas o autor edite o rascunho. O grupo taxonômico de uma chave já publicada não muda.
- `POST /api/identification-keys/{id}/publish/` valida o grafo e os táxons no GBIF e publica nova versão imutável. Grafos `branching` aceitam 1 a 1000 passos e 2 a 20 alternativas por passo. Grafos `multi_access` aceitam 1 a 200 descritores categóricos e 2 a 500 táxons. Uma chave de família termina em gênero; uma chave de gênero termina em espécie. Referências inválidas, ciclos, passos inalcançáveis e táxons fora do grupo são rejeitados. Indisponibilidade do GBIF responde 503 e preserva o rascunho.
- `POST /api/identification-keys/{id}/archive/` arquiva a chave para novos percursos. Autor ou administrador pode arquivar. Percursos existentes continuam legíveis.

## Colaboração

- `POST /api/identification-keys/{id}/suggestions/` recebe um grafo proposto e uma nota. `GET` lista sugestões apenas ao autor, incluindo o grafo da versão de base.
- `POST /api/identification-keys/{id}/suggestions/{suggestionId}/decision/` com `decision=accepted|rejected` decide a sugestão. Aceitar publica uma nova versão após validar o grafo. Se a versão de base mudou ou houver rascunho do autor diferente da versão publicada, responde 409.
- `POST /api/identification-keys/{id}/reports/` registra um problema para análise administrativa. O painel administrativo permite arquivar chaves relatadas.

## Percursos de uma observação

- `GET /api/observations/{id}/key-runs/` lista percursos com grafo e versão usados, respostas, passo atual, resultado, hipótese criada e revisões.
- `POST /api/observations/{id}/key-runs/` inicia percurso com `version_id` da versão pública atual. `parent_run` opcional permite continuar uma chave de família concluída com uma chave do gênero encontrado.
- `POST /api/observations/{id}/key-runs/{runId}/answers/` recebe `step_id` e `choice_index` para chaves sequenciais, ou `descriptor_id` e `state_ids` para múltiplo acesso, além de `evidence_id` e `note` opcionais. Uma escolha nula pausa o percurso e guarda a nota como pendência; a próxima resposta o retoma. O resultado cria ou reutiliza uma hipótese ativa do catálogo, sem confirmar a espécie.
- `PATCH` no mesmo endpoint recebe `index` de uma resposta existente, `step_id` e nova `choice_index`. Respostas posteriores são removidas do percurso e preservadas em revisão. Percursos descendentes tornam-se substituídos. Corrigir um resultado confirmado exige reabrir antes a identificação.

O guia de uso, fontes, licenças e pontos de extensão está em [Fontes e importação de chaves](../identification-key-sources.md).
