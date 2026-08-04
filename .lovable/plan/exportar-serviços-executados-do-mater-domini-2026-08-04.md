# Exportar serviços executados do Mater Domini

## Objetivo
Gerar uma planilha (Excel) com os serviços com status "executado" do Condomínio Mater Domini, contendo:

Protocolo | Data | Apartamento | Bloco | Nome do cliente | E-mail | Telefone | CPF/CNPJ | Tipo de serviço | Valor

## Como os dados serão obtidos
A base conectada a este ambiente de desenvolvimento está vazia (uma consulta por "mater" retorna 0 registros), então os dados serão lidos do sistema em execução usando a sessão autenticada do preview — a mesma abordagem já usada em exportações anteriores. Nenhum dado é alterado; é apenas leitura.

Passos:
1. Abrir o preview autenticado e consultar os serviços do Mater Domini com status executado (todas as competências, sem recorte de data).
2. Normalizar CPF/CNPJ e telefone com as máscaras já usadas no sistema (formatCpfCnpj / formatTelefone).
3. Ordenar por apartamento e data.
4. Gerar o arquivo .xlsx com cabeçalho em negrito, colunas dimensionadas e células vazias como "-".
5. Conferir a planilha gerada antes de entregar (contagem de linhas e amostragem dos campos).

## Observações
- Serviços sem e-mail, telefone ou CPF cadastrado aparecerão com "-".
- Se preferir também os não executados (pendentes/agendados), é só avisar que incluo uma coluna de status com todos.
