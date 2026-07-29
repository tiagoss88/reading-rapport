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
