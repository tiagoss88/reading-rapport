/**
 * Utilitários para lidar com as fotos dos serviços da Nacional Gás.
 *
 * Historicamente as fotos eram concatenadas dentro do campo `observacao`
 * no formato "Fotos comprovante: url1, url2 | Obs: texto".
 * Hoje elas ficam na coluna dedicada `fotos_urls`, mas mantemos o parse
 * legado como fallback para registros antigos que não foram migrados.
 */

export function extrairFotosLegado(obs: string | null | undefined): string[] {
  if (!obs) return []
  if (!/fotos?\s+comprovante/i.test(obs)) return []
  const matches = obs.match(/https?:\/\/[^\s,|\])]+/g)
  return matches ? matches.map(u => u.trim()).filter(Boolean) : []
}

export function extrairTextoObservacao(obs: string | null | undefined): string {
  if (!obs) return ''
  if (!/fotos?\s+comprovante/i.test(obs)) return obs.trim()
  const m = obs.match(/\|\s*Obs:\s*([\s\S]*)$/i)
  return m ? m[1].trim() : ''
}

/**
 * Resolve as fotos de um serviço priorizando a coluna dedicada
 * e caindo para o formato legado quando necessário.
 */
export function resolverFotos(
  fotosUrls: string[] | null | undefined,
  observacao: string | null | undefined
): string[] {
  if (fotosUrls && fotosUrls.length > 0) return fotosUrls
  return extrairFotosLegado(observacao)
}

/**
 * Monta a observação no formato legado, usada quando a coluna
 * `fotos_urls` ainda não existe no banco.
 */
export function montarObservacaoLegado(
  fotos: string[],
  texto: string | null | undefined
): string | null {
  const t = (texto || '').trim()
  if (!fotos.length) return t || null
  const base = `Fotos comprovante: ${fotos.join(', ')}`
  return t ? `${base} | Obs: ${t}` : base
}

function colunaFotosInexistente(error: any): boolean {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return error?.code === 'PGRST204' || msg.includes('fotos_urls')
}

/**
 * Atualiza um serviço gravando as fotos na coluna dedicada; se o banco
 * ainda não tiver `fotos_urls`, refaz o update no formato legado.
 */
export async function updateServicoComFotos(
  supabase: any,
  id: string,
  payload: Record<string, any>,
  fotos: string[]
): Promise<void> {
  const { error } = await supabase
    .from('servicos_nacional_gas')
    .update({ ...payload, fotos_urls: fotos })
    .eq('id', id)

  if (!error) return
  if (!colunaFotosInexistente(error)) throw error

  const { error: legacyError } = await supabase
    .from('servicos_nacional_gas')
    .update({
      ...payload,
      observacao: montarObservacaoLegado(fotos, payload.observacao)
    })
    .eq('id', id)

  if (legacyError) throw legacyError
}

/**
 * Lê as fotos atualmente gravadas no serviço, direto do banco,
 * evitando depender de estado em tela (que pode estar desatualizado).
 */
export async function lerFotosAtuais(
  supabase: any,
  id: string
): Promise<{ fotos: string[]; observacao: string | null }> {
  const { data, error } = await supabase
    .from('servicos_nacional_gas')
    .select('fotos_urls, observacao')
    .eq('id', id)
    .single()

  if (error) throw error
  return {
    fotos: resolverFotos(data?.fotos_urls, data?.observacao),
    observacao: data?.observacao ?? null,
  }
}

/**
 * Anexa novas fotos ao serviço somando-as às já gravadas no banco
 * (relidas na hora), sem duplicar URLs. Retorna a lista final.
 */
export async function anexarFotosServico(
  supabase: any,
  id: string,
  novasFotos: string[]
): Promise<string[]> {
  const { fotos: atuais, observacao } = await lerFotosAtuais(supabase, id)
  const texto = extrairTextoObservacao(observacao)
  const finais = Array.from(new Set([...atuais, ...novasFotos]))

  await updateServicoComFotos(supabase, id, { observacao: texto || null }, finais)
  return finais
}

/** Gera um caminho único no storage preservando a extensão do arquivo. */
export function caminhoFotoServico(nomeArquivo: string): string {
  const ext = (nomeArquivo.match(/\.[a-z0-9]+$/i)?.[0] || '.jpg').toLowerCase()
  const uid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `servicos/${Date.now()}_${uid}${ext}`
}

