

### Diagnóstico (por que o fix anterior não resolveu)
O `useEffect` de cleanup que foi adicionado roda **somente quando a página inteira** `GeorreferenciamentoTerceirizado` é desmontada (ex.: sair da rota).  
Quando você troca entre as abas “Roteirizador” e “Georreferenciamento”, **a página continua montada**; quem “some” é o conteúdo do `TabsContent` (o DOM do mapa some), mas a referência `map.current` continua existindo. Assim, ao voltar para a aba, o `initializeMap()` encontra `map.current` preenchido e não recria o mapa.

Além disso, o `Roteirizador` também cria um Mapbox map e hoje **não tem cleanup no unmount**, o que pode causar vazamento de WebGL/context e piorar o comportamento ao alternar abas várias vezes.

---

## Objetivo
Garantir que ao alternar abas:
1) o mapa “antigo” seja destruído antes do DOM ser removido, e  
2) ao voltar para a aba, o mapa seja criado novamente (ou redimensionado corretamente) e os marcadores reapareçam.

---

## Mudanças propostas

### 1) Controlar o estado da aba e executar cleanup no momento da troca
**Arquivo:** `src/pages/MedicaoTerceirizada/Georreferenciamento.tsx`

- Transformar as `Tabs` em **controladas**:
  - Criar `activeTab` em state (ex.: `'geo' | 'roteirizador'`)
  - Usar `<Tabs value={activeTab} onValueChange={handleTabChange} ...>`

- Implementar `handleTabChange(nextTab)`:
  - Se está saindo da aba `geo` (ex.: `activeTab === 'geo' && nextTab !== 'geo'`), executar um `destroyGeoMap()` **antes** de atualizar o state:
    - `markersRef.current.forEach(m => m.remove())`
    - `markersRef.current = []`
    - `map.current?.remove()`
    - `map.current = null`
    - `setMapReady(false)`
    - (Opcional) `setSelectedEmpreendimento(null)` e limpar lat/lng editáveis para evitar estado “fantasma”

Isso garante que o `map.current` não fique “travado” entre trocas de aba.

---

### 2) Recriar/ajustar o mapa ao voltar para a aba “Georreferenciamento”
**Arquivo:** `src/pages/MedicaoTerceirizada/Georreferenciamento.tsx`

- Adicionar um `useEffect` que observa `activeTab`:
  - Quando `activeTab === 'geo'`, agendar (com `requestAnimationFrame` ou `setTimeout(0)`) a chamada de `initializeMap()` para garantir que o `<div ref={mapContainer}>` já exista no DOM.
  - Após criar o mapa (ou quando ele carregar), chamar `map.current?.resize()` para evitar mapa em branco caso o container tenha acabado de “voltar” à tela.

Observação: Mesmo que a estratégia seja “destroy e recriar”, o `resize()` ajuda em casos de renderização/medição de tamanho do container.

---

### 3) Adicionar cleanup no componente `Roteirizador` para evitar vazamento de mapa
**Arquivo:** `src/components/medicao-terceirizada/Roteirizador.tsx`

- Adicionar um `useEffect(() => () => cleanup, [])` com:
  - Remover markers
  - `map.current?.remove()`
  - `map.current = null`

Isso impede que o mapa do Roteirizador fique “pendurado” em memória ao trocar para a aba Georreferenciamento.

---

## Critérios de aceite (como vamos validar)
1) Entrar em **Georreferenciamento**, ver o mapa e os marcadores.  
2) Trocar para **Roteirizador**, ver o mapa.  
3) Voltar para **Georreferenciamento** e confirmar:
   - o mapa aparece (não fica em branco)
   - os marcadores voltam
4) Repetir a alternância 5–10 vezes para confirmar que não volta a sumir.

---

## Risco/impacto
- Mudança de `Tabs` para controlada é pequena e local.
- Adição de cleanup no Roteirizador é segura e recomendada (evita vazamento de recursos).
- Caso ainda haja “mapa em branco”, o `resize()` pós-ativação cobre o cenário de container com dimensão inválida.

---

<lov-actions>
  <lov-suggestion message="Teste de ponta a ponta: alterne entre as abas Roteirizador e Georreferenciamento (várias vezes) e confirme que o mapa e os marcadores sempre reaparecem.">Verificar fim-a-fim (troca de abas)</lov-suggestion>
  <lov-suggestion message="Adicionar no Georreferenciamento um indicador de status do mapa (ex.: 'Carregando mapa...' / 'Mapa pronto') e logs opcionais para facilitar diagnóstico quando o mapa ficar em branco.">Status/diagnóstico do mapa</lov-suggestion>
  <lov-suggestion message="Otimizar performance do Georreferenciamento com clustering (agrupamento) de marcadores quando houver muitos empreendimentos na tela.">Clustering de marcadores</lov-suggestion>
  <lov-suggestion message="Adicionar no Roteirizador uma legenda fixa das cores das rotas e um resumo por rota (medidores + quantidade de empreendimentos) diretamente no mapa.">Legenda e resumo no mapa</lov-suggestion>
  <lov-suggestion message="Adicionar um botão para exportar a simulação do Roteirizador (CSV/PDF) com rotas e totais de medidores por rota.">Exportar simulação</lov-suggestion>
</lov-actions>

