## Ajuste

Em `src/components/medicao-terceirizada/PainelUrgencias.tsx`, alterar `getNivel` para que `diasRestantes === 0` (vence hoje) seja classificado como **crítico**, não vencido. Apenas `diasRestantes < 0` permanece como **vencido**.

```ts
function getNivel(diasRestantes: number, _prazoDias: number): NivelUrgencia {
  if (diasRestantes < 0) return 'vencido'
  if (diasRestantes <= 1) return 'critico' // hoje ou amanhã
  return 'atencao'
}
```

Mensagens de `formatarTempoRestante` já cobrem corretamente "Vence hoje" e "Vence amanhã" — sem mudanças.

Resultado: cards "Vence hoje" passam a exibir badge laranja "Crítico" em vez de vermelho "Vencido".
