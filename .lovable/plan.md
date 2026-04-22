
## Importação de planilha: definir Origem dos serviços

### Comportamento

Antes de processar a planilha (Excel ou colar), o sistema pergunta ao usuário qual a **Origem** desses serviços. A origem escolhida é aplicada a **todos** os registros importados naquela operação.

### Opções de Origem
- **NGD** (padrão — Nacional Gás Distribuidora)
- **Síndico**
- **Administradora**
- **Outro** (campo de texto livre)

A coluna FONTE da planilha é ignorada — a origem escolhida no diálogo prevalece, garantindo consistência.

### Fluxo

```text
[Botão Importar]
      ↓
[Tela 1: Escolher Origem]   ← NOVA
   • Select com 4 opções
   • Input de texto se "Outro"
   • Botão "Continuar"
      ↓
[Tela 2: Upload/Colar]      ← atual
      ↓
[Tela 3: Preview]           ← atual (mostra Origem aplicada)
      ↓
[Tela 4: Sucesso]           ← atual
```

### Mudanças

**Arquivo único:** `src/components/medicao-terceirizada/ImportarPlanilhaDialog.tsx`

1. Adicionar novo step `'origem'` como passo inicial (antes de `'upload'`).
2. Adicionar estado `origemSelecionada: string` (default `'NGD'`) e `origemCustomizada: string`.
3. Renderizar nova tela com `Select` (NGD / Síndico / Administradora / Outro) + `Input` condicional para "Outro".
4. Em `parseFile` e `parseTextData`: substituir leitura da coluna FONTE por `fonte: origemFinal` (onde `origemFinal` = valor escolhido ou texto customizado).
5. No header da tela de Preview, mostrar badge: `Origem: NGD` para reforçar visualmente o que será gravado.
6. Resetar `origemSelecionada` no `handleClose`.

### Resultado
- Toda importação solicita a origem antes de processar.
- Padrão NGD com 1 clique → fluxo rápido para o caso mais comum.
- Flexibilidade para outras origens (Síndico, Administradora, livre).
- Coluna FONTE da planilha deixa de ser fonte de inconsistência.

Nenhum schema, migration, edge function ou outro arquivo afetado.
