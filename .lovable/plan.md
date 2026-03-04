

## Plano: Sistema de Notificações de Substituição de Medidores

### Resumo
Criar um módulo de "Notificações" dentro do menu Medição Terceirizada para registrar notificações emitidas a clientes que precisam substituir medidores travados ou embaçados. O painel admin permite visualizar e criar notificações; o coletor permite apenas criar.

### 1. Migration SQL — criar tabela `notificacoes_medidores`

```sql
CREATE TABLE public.notificacoes_medidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_notificacao DATE NOT NULL,
  empreendimento_id UUID REFERENCES empreendimentos_terceirizados(id),
  condominio_nome TEXT NOT NULL,
  bloco TEXT NOT NULL,
  unidade TEXT NOT NULL,
  fotos TEXT[] DEFAULT '{}',
  operador_id UUID REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notificacoes_medidores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notificacoes"
  ON public.notificacoes_medidores FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notificacoes"
  ON public.notificacoes_medidores FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update notificacoes"
  ON public.notificacoes_medidores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notificacoes"
  ON public.notificacoes_medidores FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### 2. Atualizar types.ts
Adicionar a tabela `notificacoes_medidores` com Row/Insert/Update types.

### 3. Página admin — `src/pages/MedicaoTerceirizada/Notificacoes.tsx`
- Listagem de notificações com filtros (data, condomínio)
- Tabela com colunas: Data, Condomínio, Bloco, Unidade, Fotos, Operador
- Clique para ver detalhes/fotos em lightbox
- Botão "Nova Notificação" abre dialog com:
  - **Data**: DatePicker (editável, padrão hoje)
  - **Condomínio**: Input com autocomplete buscando de `empreendimentos_terceirizados`
  - **Bloco**: Input texto livre
  - **Unidade**: Input texto livre
  - **Fotos**: Upload múltiplo (câmera/galeria) com preview e remoção individual
- Upload de fotos para bucket `medidor-fotos` existente

### 4. Página coletor — `src/pages/ColetorNotificacoes.tsx`
- Formulário simples (sem listagem) para criar notificação:
  - Data (DatePicker, padrão hoje)
  - Condomínio (autocomplete de `empreendimentos_terceirizados`)
  - Bloco (texto)
  - Unidade (texto)
  - Fotos (múltiplas, câmera/galeria, com preview)
  - Botão "Registrar Notificação"
- Usa `smartCompress` para otimizar imagens antes do upload

### 5. Atualizar rotas — `src/App.tsx`
- Adicionar rota admin: `/medicao-terceirizada/notificacoes` → `NotificacoesMedidores` (role admin)
- Adicionar rota coletor: `/coletor/notificacoes` → `ColetorNotificacoes` (permission coletor_leituras)

### 6. Atualizar menus
- **Layout.tsx**: Adicionar "Notificações" em `medicaoTerceirizadaItems` com ícone `Bell`
- **ColetorMenu.tsx**: Adicionar card "Notificações" com ícone `Bell`, cor amarela, navegando para `/coletor/notificacoes`

### Arquivos criados/modificados
- **Criados**: `src/pages/MedicaoTerceirizada/Notificacoes.tsx`, `src/pages/ColetorNotificacoes.tsx`
- **Modificados**: `src/App.tsx`, `src/components/Layout.tsx`, `src/pages/ColetorMenu.tsx`, `src/integrations/supabase/types.ts`
- **Migration**: 1 migration SQL para tabela + RLS

