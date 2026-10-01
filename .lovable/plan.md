# Fazer a aba Armazéns aparecer

## Causa (confirmada)
O script funcionou: o banco já tem o armazém "Principal" e os saldos por armazém, e a tela já lê esses dados. O que faltou foi colocar a própria aba "Armazéns" na página de Estoque. A tela de cadastro de armazéns já existe, só não foi ligada à página. Por isso aparecem só três abas.

## O que vai ser feito
- Adicionar a 4ª aba **Armazéns** ao lado de "Baixa por serviço", com a mesma proteção das outras abas (se der erro, só ela mostra aviso).
- Conferir na pré-visualização que as quatro abas aparecem e que a aba Armazéns lista o "Principal".

## Depois disso, você
1. Abre Armazéns, renomeia "Principal" para o estado certo (ex.: Armazém BA, UF BA) e cria o Armazém CE (UF CE).
2. Testa uma transferência em Movimentações > Transferir.
3. Pede para publicar quando quiser no site oficial.

## Detalhes técnicos
- `src/pages/Operacao/Estoque.tsx`: importar `ArmazensTab` de `@/components/estoque/ArmazensTab`, adicionar `<TabsTrigger value="armazens">Armazéns</TabsTrigger>` e o `<TabsContent value="armazens">` envolto em `ErrorBoundary area="a aba Armazéns"`.
- Nenhuma mudança no banco nem nas outras abas.
