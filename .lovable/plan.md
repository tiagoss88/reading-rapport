## Objetivo

Na tela do coletor de detalhes do empreendimento (`/coletor/empreendimento/:id`), adicionar uma nova seção para o técnico enviar **fotos do Relatório de Leitura impresso** (várias fotos, pois é um papel com vários clientes), separadas das fotos do "comprovante de sincronização" já existentes.

## Mudanças

### 1. `src/pages/ColetorEmpreendimentoDetalhe.tsx`

- Adicionar segundo estado `fotosRelatorio: FotoItem[]` e novos refs (`cameraRelatorioRef`, `galleryRelatorioRef`).
- Generalizar o handler `handleFotoCapture` para receber qual lista atualizar (`'sincronizacao' | 'relatorio'`) — mesma lógica de compressão.
- Renderizar um **novo Card "Fotos do Relatório de Leitura"** logo abaixo do card de fotos do comprovante, com:
  - Texto explicativo: "Fotos do relatório impresso de leitura do condomínio (pode adicionar várias)."
  - Grid de previews com botão remover.
  - Botões "Tirar Foto" (câmera) e "Galeria" (multi-seleção), no mesmo padrão visual já usado.
- **Não obrigatório** para confirmar coleta (apenas o comprovante de sincronização permanece obrigatório), mas se houver fotos, fazem upload junto.

### 2. Upload e persistência

- No `confirmarColeta`:
  - Fazer upload em paralelo das fotos do relatório para o mesmo bucket `medidor-fotos`, em prefixo `coletas/relatorio/`.
  - Concatenar URLs no campo `observacao` da mesma row de `servicos_nacional_gas`, seguindo o padrão legado já usado no projeto:
    
    ```
    Fotos comprovante: url1, url2 | Fotos relatorio: urlA, urlB | Obs: texto
    ```
  
  Sem mudança de schema — mantém compatibilidade com leitura/parsing atual e respeita a regra de memória sobre o formato legado de `observacao`.

### 3. Sem mudanças de banco

- Bucket `medidor-fotos` já existe e é público.
- RLS de `servicos_nacional_gas` já permite inserção pelo operador.
- Sem migração.

## Critérios de aceite

- Card novo aparece abaixo do card de comprovante de sincronização.
- Técnico consegue tirar/anexar múltiplas fotos do relatório e remover individualmente.
- Confirmação de coleta funciona com 0 ou N fotos de relatório (continua exigindo ≥1 foto de comprovante).
- URLs das fotos do relatório aparecem no campo `observacao` no formato concatenado acima.
