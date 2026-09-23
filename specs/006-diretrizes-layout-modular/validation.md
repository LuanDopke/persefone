# Validação responsiva — Feature 006

**Data:** 2026-09-15  
**Navegador:** Google Chrome 152.0.7977.75, modo headless  
**Rota avaliada:** painel autenticado (`/`)  
**Viewport:** altura fixa de 900 px e larguras de 360, 768, 1024 e 1440 px

## Resultado por largura

| Largura | Documento (client/scroll) | Navegação visível | Rota ativa | Alvos móveis | Espaço inferior do conteúdo |
| --- | --- | --- | --- | --- | --- |
| 360 px | 360/360 px | móvel | Painel, com texto e `aria-current` | 90 × 56 px | 80 px |
| 768 px | 768/768 px | móvel | Painel, com texto e `aria-current` | 192 × 56 px | 80 px |
| 1024 px | 1024/1024 px | lateral | Painel, com texto e `aria-current` | não aplicável | 0 px |
| 1440 px | 1440/1440 px | lateral | Painel, com texto e `aria-current` | não aplicável | 0 px |

Em todas as larguras foi encontrada uma única região `main`. A largura rolável do documento permaneceu igual à largura do viewport, sem rolagem horizontal global. Em telas pequenas, os quatro destinos móveis permaneceram disponíveis e excederam o mínimo de 44 × 44 px. O preenchimento inferior de 80 px manteve o conteúdo fora da área ocupada pela navegação fixa. Em telas amplas, a navegação lateral substituiu a navegação móvel conforme o breakpoint definido.

## Teclado, foco e movimento

- A primeira tabulação alcançou o botão “Sair”. O foco apresentou anel de 4 px em verde-limão (`rgba(189, 255, 0, 0.7)`).
- Com `prefers-reduced-motion: reduce`, a consulta de mídia foi reconhecida. Animações e transições ficaram limitadas a 0,01 ms e uma iteração.
- A rota ativa permaneceu identificável por texto, `aria-current="page"`, preenchimento verde-limão e contorno escuro; a indicação não depende apenas de cor ou ícone.

## Critérios de sucesso

- **SC-002 — atendido:** nas quatro larguras avaliadas não houve rolagem horizontal global, ocultação da navegação aplicável ou ação essencial inacessível.
- **SC-007 — evidência estrutural atendida; medição humana pendente:** seção ativa e ação de saída aparecem com rótulos textuais e contraste visual em todas as larguras. O percentual de 90% em até cinco segundos exige teste de usabilidade com participantes e não foi inferido a partir da inspeção automatizada.

## Repetição

Com o frontend disponível em `http://127.0.0.1:5174` e o Chrome expondo o protocolo de depuração na porta 9223, executar:

```bash
node specs/006-diretrizes-layout-modular/validate-responsive.cjs
```

O script registra as dimensões, landmarks, navegação ativa, alvos de toque, espaço contra sobreposição, preferência de movimento reduzido e foco por teclado.
