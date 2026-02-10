

## Tela de Detalhes do Empreendimento no Coletor

### Resumo
Ao clicar em um empreendimento na lista de Leituras, abrir uma tela de detalhes simplificada mostrando informacoes do condominio, endereco clicavel para navegacao GPS, campo de foto para comprovante de sincronizacao, e botao para confirmar a coleta.

---

### O que o operador vera

1. **Header** com nome do empreendimento e botao voltar
2. **Card de informacoes**:
   - Quantidade de medidores existentes no condominio
   - Endereco completo, clicavel (abre Waze ou Google Maps)
3. **Campo de foto** para capturar/enviar print de sincronizacao sem pendencia
4. **Botao "Confirmar Coleta"** que registra a confirmacao no banco

---

### Alteracoes

#### 1. Criar: `src/pages/ColetorEmpreendimentoDetalhe.tsx`

Nova pagina com:
- Recebe `empreendimentoId` via parametro de rota
- Busca dados do empreendimento na tabela `empreendimentos_terceirizados`
- Exibe quantidade de medidores em destaque
- Endereco clicavel: ao tocar, abre um menu com opcoes "Abrir no Waze" e "Abrir no Google Maps"
  - Waze: `https://waze.com/ul?q={endereco}`
  - Google Maps: `https://www.google.com/maps/search/?api=1&query={endereco}`
- Campo de foto usando `<input type="file" accept="image/*" capture="environment">` com compressao via `imageCompression.ts` (mesmo padrao do ColetorLeitura)
- Upload da foto para o bucket `medidor-fotos` no Supabase Storage (pasta `coletas/`)
- Botao "Confirmar Coleta" que:
  - Busca o operador logado
  - Insere registro na tabela `servicos_nacional_gas` com tipo_servico = 'leitura' e status = 'executado', ou atualiza registro existente (a definir conforme necessidade)
  - Salva a URL da foto no registro
- Apos confirmar, mostra feedback de sucesso e volta para a lista

#### 2. Modificar: `src/pages/ColetorLeiturasTerceirizadas.tsx`
- Alterar a navegacao ao clicar no card: de `/coletor/unidades/${emp.id}` para `/coletor/empreendimento/${emp.id}`

#### 3. Modificar: `src/App.tsx`
- Adicionar rota `/coletor/empreendimento/:empreendimentoId` apontando para `ColetorEmpreendimentoDetalhe`
- Manter dentro de `ColetorProtectedRoute` e `PermissionRoute`

---

### Secao Tecnica

#### Estrutura do componente ColetorEmpreendimentoDetalhe

```text
ColetorEmpreendimentoDetalhe
+-- Header (botao voltar + nome do empreendimento)
+-- Card Informacoes
|   +-- Icone + "120 medidores"
|   +-- Endereco clicavel (link externo Waze/Maps)
+-- Card Foto
|   +-- Preview da foto (se capturada)
|   +-- Botao "Tirar Foto" / "Trocar Foto"
+-- Botao "Confirmar Coleta" (sticky no rodape)
```

#### Endereco clicavel
- Usar `encodeURIComponent(endereco)` para montar as URLs
- Exibir dois botoes/links: icone do Waze e icone do Google Maps
- Ambos abrem em nova aba (`target="_blank"`)

#### Upload de foto
- Reutilizar `compressImage`, `isValidImageFile`, `getOptimalCompressionOptions` de `@/lib/imageCompression`
- Upload para `supabase.storage.from('medidor-fotos').upload('coletas/{timestamp}.{ext}', file)`
- Obter URL publica com `getPublicUrl`

#### Registro da coleta
- Buscar operador logado via `supabase.auth.getUser()` + tabela `operadores`
- Inserir/atualizar na tabela `servicos_nacional_gas`:
  - `empreendimento_id`: id do empreendimento
  - `tipo_servico`: 'leitura'
  - `status`: 'executado'
  - `data_execucao`: data atual
  - `foto_comprovante`: URL da foto (campo pode precisar ser adicionado -- se nao existir, usaremos `observacoes` ou criaremos uma tabela auxiliar `coletas_leitura`)
- Invalidar queries relacionadas para atualizar status na lista

#### Verificacao de campo para foto
- A tabela `servicos_nacional_gas` sera verificada para confirmar se existe campo adequado para armazenar a URL da foto. Caso nao exista, sera criada uma nova tabela `coletas_leitura` com: `id`, `empreendimento_id`, `operador_id`, `foto_url`, `data_coleta`, `created_at`

