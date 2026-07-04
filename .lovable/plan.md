## Problema

O input "Meta de medidores por rota" tem clamping (`Math.max(500, Math.min(1200, ...))`) e fallback (`|| 750`) no `onChange`. Isso quebra a digitação:

- Apagar o campo → volta a 750 imediatamente.
- Digitar "8" (para começar "800") → vira 500 na hora.
- Qualquer valor intermediário abaixo de 500 é sobrescrito antes do usuário terminar.

O mesmo problema existe no campo "Nº de técnicos" que adicionei.

## Correção

Trocar a estratégia: aceitar qualquer entrada durante a digitação e só validar/clampar no `onBlur` (ou quando o valor é usado no cálculo). Usar string local para permitir o campo ficar vazio enquanto o usuário digita.

**Arquivo**: `src/components/medicao-terceirizada/Roteirizador.tsx`

**Mudanças**:
1. `metaPorRota` e `tecnicos` continuam como número (usados no cálculo).
2. Adicionar estados de string espelho (`metaPorRotaInput`, `tecnicosInput`) para o `value` do Input.
3. `onChange` só atualiza a string (sem clamp).
4. `onBlur` faz o parse + clamp e sincroniza o estado numérico. Se ficar inválido/vazio, volta ao último válido.
5. Manter `min`/`max` como dica visual do browser, sem forçar via JS durante a digitação.

Sem mudanças de layout, backend ou lógica de cálculo.
