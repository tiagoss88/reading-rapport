

## Reordenar detalhes e adicionar botao de copiar

### O que muda

**1. Reordenar campos na tela de detalhes** para a seguinte ordem:
1. Tipo de servico (titulo, ja esta no topo)
2. Condominio
3. Bloco / APT
4. Morador
5. Telefone
6. E-mail
7. Agendamento
8. Observacao

**2. Adicionar botao de copiar** ao lado de cada informacao, permitindo que o operador copie rapidamente o dado com um toque. Ao copiar, exibe um feedback visual (toast ou icone temporario de "copiado").

### Alteracoes tecnicas

**`src/pages/ColetorServicosTerceirizados.tsx`**

- Importar icone `Copy` e `Check` do lucide-react
- Criar funcao auxiliar `copyToClipboard(text)` que usa `navigator.clipboard.writeText` e mostra toast de confirmacao
- Criar componente inline `CopyButton` que renderiza um botao pequeno com icone de copiar, e ao clicar muda para icone de check por 2 segundos
- Reordenar os blocos JSX na tela de detalhes (linhas 224-295):
  - Mover Condominio + Bloco/APT para logo apos o titulo
  - Morador vem depois
  - Telefone depois
  - Email depois
  - Agendamento e Observacao por ultimo
- Adicionar `CopyButton` ao lado do valor em cada campo (morador, telefone, email, condominio)

Layout de cada campo ficara assim:
```text
[icone]  Label
         Valor    [botao copiar]
```

