// Formatação de documentos brasileiros

export const formatCPF = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara conforme a quantidade de dígitos
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }
}

export const formatCNPJ = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara conforme a quantidade de dígitos
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
  }
}

export const formatCEP = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara conforme a quantidade de dígitos
  if (numbers.length <= 5) {
    return numbers
  } else {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }
}

export const removeMask = (value: string): string => {
  return value.replace(/\D/g, '')
}

// ===== Formatação para exibição (valores já finalizados) =====

/** Aplica máscara de CPF (11 dígitos) ou CNPJ (14 dígitos) automaticamente. */
export const formatCpfCnpj = (value?: string | null): string => {
  if (!value) return ''
  const n = value.replace(/\D/g, '')
  if (n.length === 11) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
  if (n.length === 14) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`
  return value
}

const FORMAS_PAGAMENTO: Record<string, string> = {
  fatura: 'Fatura',
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
}

/** Converte o código da forma de pagamento em rótulo legível. */
export const formatFormaPagamento = (value?: string | null): string => {
  if (!value) return ''
  const key = value.trim().toLowerCase()
  if (FORMAS_PAGAMENTO[key]) return FORMAS_PAGAMENTO[key]
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/** Aplica máscara de telefone brasileiro (10 ou 11 dígitos). */
export const formatTelefone = (value?: string | null): string => {
  if (!value) return ''
  const n = value.replace(/\D/g, '')
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return value
}
