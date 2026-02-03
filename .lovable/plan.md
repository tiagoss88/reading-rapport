

## Objetivo
Remover a seção **"Medição"** do menu lateral, mantendo apenas **"Medição Terceirizada"** para uso exclusivo com clientes da Nacional Gás.

---

## Alterações Necessárias

### 1. Remover do Menu Lateral (Layout.tsx)

Remover completamente o dropdown "Medição" que contém:
- Leituras
- Empreendimentos  
- Clientes

Também será removido:
- O estado `medicaoOpen` e `setMedicaoOpen`
- O array `medicaoItems`
- Os imports de ícones não utilizados (`Gauge`)

### 2. Remover as Rotas do Sistema (App.tsx)

Remover as rotas das páginas de Medição para que não sejam mais acessíveis:
- `/leituras`
- `/empreendimentos`
- `/clientes`

Também remover os imports não utilizados:
- `Leituras`
- `Empreendimentos`
- `Clientes`

---

## Resultado Final

O menu lateral ficará com:
1. Dashboard
2. **Medição Terceirizada** (Nacional Gás)
3. Ordem de Serviço
4. Relatórios
5. Rastreamento
6. Configurações

---

## Seção Técnica

### Arquivo: `src/components/Layout.tsx`

**Remover:**
- Linha 19: Import do ícone `Gauge`
- Linha 35: Estado `const [medicaoOpen, setMedicaoOpen] = useState(false)`
- Linhas 45-49: Array `medicaoItems`
- Linhas 115-152: Bloco JSX do dropdown "Medição"

### Arquivo: `src/App.tsx`

**Remover:**
- Linhas 10-12: Imports das páginas `Empreendimentos`, `Clientes`, `Leituras`
- Linhas 109-129: Rotas `/empreendimentos`, `/clientes`, `/leituras`

