Plano para exportar a tabela de empreendimentos:

1. Usar os dados que a própria tela já carregou de `empreendimentos_terceirizados`, porque a conexão direta de banco disponível nesta sessão retornou vazia, mas o preview tem os registros carregados via app.
2. Gerar um arquivo CSV em `/mnt/documents` com as colunas:
   - Nome
   - UF
   - Quantidade de medidores
   - Endereço
   - Bairro
   - Latitude
   - Longitude
3. Extrair o bairro a partir do campo de endereço, usando o padrão mais comum do cadastro: trecho entre o primeiro ` - ` e o próximo `,` ou ` - `.
4. Validar rapidamente o arquivo gerado para confirmar quantidade de linhas e cabeçalhos.
5. Entregar o CSV para download aqui no chat.

Observação: como você pediu “tabela”, o CSV abre normalmente no Excel/Google Sheets. Se preferir XLSX formatado, também posso gerar nessa versão depois.