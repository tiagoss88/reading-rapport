

## Remover link mailto do email

### Alteração: `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx` (linha 251)

Substituir o `<a href="mailto:...">` por um `<span>` simples, mantendo o ícone e o texto do email mas sem ser clicável:

```tsx
// De:
<a href={`mailto:${servico.email}`} className="text-primary font-medium hover:underline">{servico.email}</a>

// Para:
<span className="text-sm">{servico.email}</span>
```

Alteração de 1 linha.

