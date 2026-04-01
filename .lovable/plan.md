

## Simplificar cards de serviços no coletor

### Alteração: `src/pages/ColetorServicosTerceirizados.tsx` (linhas 438-471)

Reduzir o conteúdo de cada card na lista para exibir apenas:
- **Linha 1:** Tipo do serviço (título, ex: "RELIGAÇÃO") + badge de status
- **Linha 2:** Nome do condomínio + bloco e unidade na mesma linha (ex: "Monte Carlo - Bloco A, Apto 101")

Remover do card:
- Badge de UF
- Linha do nome do morador (`morador_nome`)

O card ficará mais compacto, com apenas 2 linhas de informação. A seta (`ChevronRight`) permanece para indicar que é clicável. Padding `p-4` mantido conforme design system.

