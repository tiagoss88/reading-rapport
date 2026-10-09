# Rota do Dia: respeitar o print "sem pendência" já enviado

## Problema
O relatório **Coletas Sem Pendência** e a **Rota do Dia** usam regras diferentes para saber se um condomínio já foi coletado:

- **Relatório:** considera qualquer coleta executada no **mês**. Quando a coleta não está ligada ao cadastro do condomínio, ele usa o **nome digitado**. Por isso o ABARANA aparece lá.
- **Rota do Dia:** só marca como concluído se houver coleta **no mesmo dia exato** da rota **e** ligada ao cadastro do condomínio. Se o técnico enviou o print em 03/10 e a rota está em outra data, ou se a coleta ficou só com o nome, o condomínio continua "Pendente".

Ainda não sei qual das duas situações aconteceu com o ABARANA, porque não consigo consultar o banco do sistema oficial. A correção abaixo resolve os dois casos.

## O que muda
1. **Rota do Dia:** o condomínio fica **Concluído** quando já existe coleta executada (print sem pendência) **no mesmo mês** da data da rota, mesmo que tenha sido enviada em outro dia.
2. **Ligação pelo nome:** quando a coleta não está ligada ao cadastro, o sistema compara o nome do condomínio. A comparação ignora acentos, maiúsculas, "Cond./Residencial" e o prefixo "BA ", igual à regra já usada na importação.
3. **Data da coleta visível:** ao lado do status "Concluído", aparece a data do print (ex.: "coletado em 03/10"). Assim fica claro quando a coleta foi feita em outro dia.
4. **Aba Pendentes e "Copiar resumo":** passam a usar essa mesma regra. Nenhuma tela vai mostrar como pendente um condomínio que aparece no relatório.

Nada muda no banco, nos relatórios nem no coletor.

## Detalhes técnicos
- Em `src/pages/MedicaoTerceirizada/Leituras.tsx`, trocar a consulta `servicos-executados-dia` (que filtra `eq data_agendamento`) por coletas executadas com `tipo_servico='leitura'` dentro do mês da data selecionada (`gte início` / `lte fim`), buscando `empreendimento_id, condominio_nome_original, uf, data_agendamento`.
- Criar uma função de normalização no cliente, equivalente a `ng_norm_condo`: remover acentos, conteúdo entre parênteses, o prefixo `ba` e as palavras condominio/cond/residencial/resid/edificio/ed, e manter só `[a-z0-9]`.
- Montar um mapa `empId -> data` e outro `uf|nomeNormalizado -> data`. Em `rotasAgrupadas`, `statusEfetivo = 'concluido'` se `rota.status === 'concluido'`, se houver coleta pelo id ou se houver coleta pelo nome normalizado. Guardar também `dataColeta`.
- Em `pendentes`, aplicar a mesma regra, com fallback pelo nome sobre `coletasRealizadas`.
- Mostrar `dataColeta` em `dd/MM` no badge de status e no resumo copiado.
