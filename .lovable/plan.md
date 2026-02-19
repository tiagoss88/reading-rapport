

## Melhorar icones dos operadores no mapa

### Problema
Os icones atuais usam um SVG complexo com formato de "tecnico com capacete e ferramenta" que fica pequeno e dificil de visualizar no mapa, especialmente em zoom mais distante.

### Solucao
Substituir o SVG complexo por um marcador tipo "pin" maior e mais limpo, com as iniciais do operador dentro. O design sera:

- Marcador estilo "drop pin" com 48x48px (maior que os 40px atuais)
- Circulo colorido com as iniciais do nome do operador (2 letras) em branco
- Cor do circulo baseada no status (verde = online, amarelo = ausente, vermelho/cinza = offline)
- Borda branca grossa para destacar do mapa
- Sombra para dar profundidade
- Remover o circulo de precisao separado (que adiciona ruido visual) e manter apenas o marcador principal
- Tooltip nativo com o nome completo ao passar o mouse

### Detalhes tecnicos

**Arquivo: `src/components/rastreamento/LocalizacaoOperadores.tsx`**

1. Criar funcao `getInitials(nome: string)` que retorna as 2 primeiras iniciais do nome
2. Substituir o SVG do tecnico por um SVG de pin circular com as iniciais dentro
3. Aumentar tamanho para 48x48px
4. Simplificar cores: verde (online), amarelo (ausente), cinza (offline) - sem misturar cor de precisao com cor de status
5. Adicionar `title` no elemento para tooltip com nome
6. Remover os circulos de precisao (refs `circles`) que poluem o mapa
7. Manter a opacidade reduzida para operadores offline

