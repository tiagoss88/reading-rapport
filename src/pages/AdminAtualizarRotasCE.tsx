import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ROTAS: Record<number, string[]> = {
  1: ['LES JARDINS', 'JARDIM DAS TULHERIAS', 'LE LOUVRE', 'VILLA FIORI', 'ANHEMBI', 'VERANO PORTENO', 'PORTO REAL', 'CONDE DE VILLENEUVE', 'JURUA', 'VILLAGE MISAEL PINHEIRO', 'CATAMARÃ', 'ENSEADA DA IRACEMA'],
  2: ['VITRAL DO PARQUE', 'VENTOS ALISIOS', 'NORDESTE', 'ABARANA', 'ALGARVE', 'INOVATTO', 'JARDINS VINÓLIA', 'VALENCA RESIDENCE', 'PREMIER', 'TURMALINA', 'BELLAGIO', 'MARCELA STURDART'],
  3: ['VIVENDAS RIO BRANCO', 'BRAZZAVILLE', 'PALACIO DE FATIMA', 'GIZELA', 'MAISON RIGEL', 'NEBADON', 'SHOPPING BENFICA', 'RESIDENCIAL TERRAZA', 'SPE GRAND IMPERIAL', 'WAI WAI', 'BRISA DO LAGO I'],
  4: ['VIVENDA PARANGABA', 'SOBERANO', 'JOSE ELMAR', 'JARDIM DAS BROMELIAS', 'PARQUE DAS PALMEIRAS', 'PEDRO PILOMENO', 'VILLA DE ROMA', 'MOOV PARANGABA', 'VILLAGE LEONARDO DA VINCI'],
  5: ['VG SUN', 'BONS VENTOS', 'ROYAL EMBASSY', 'ISABEL MARINHO', 'BEATRIZ RESIDENCE', 'REQUINTE', 'DUBAI', 'TOWER RESIDENCE', 'VALE IMPERIAL'],
  6: ['DUETTO DI FATIMA', 'LAGUNA CONDOMINIUM', 'RESIDENCIAL CENTRAL PARK', 'VILLAGE CENTRAL PARK', 'VIA SUL SHOPPING', 'PATIO JACAREY', 'PARQUE FIORE', 'STAR CITY', 'VILA REAL - COCO', 'HYDE PARK', 'PORTAL DO PARQUE'],
  7: ['SONATA', 'BARCELONA', 'POP ESUEBIO', 'TERRAZO SHOPPING EUSÉBIO', 'SOLARIUM RESIDENCE', 'RESIDENCIAL GALILEIA', 'IPANEMA', 'MORADA DA PRAIA', 'SKYVIEW', 'ATOCHA', 'MARIA HELENA'],
  8: ['SOLAR DAS AGUAS', 'COLONIAL SUL', 'PARK DAS FLORES', 'RESERVA CASTELLI', 'PASSAREDO', 'TOPAZIO', 'VALE DOS IPES', 'THIAGO ALBUQUERQUE', 'BELLE VILLE', 'TERLIZZY', 'LA PIAZZA', 'TAMARA', 'JERICOACOARA', 'IRAN RABELO'],
  9: ['PARQUE FLUENCE', 'ITAPERI', 'MARAPONGA RESIDENCE', 'JOÃO NUNES COND', 'MIRANTE CLUBE', 'KHALIL GIBRAN', 'BRUNO AGUIAR PESSOA', 'MACONDO', 'NOTRE DAME', 'CLOVIS NETO', 'SAN JULIANO', 'VANCOUVER', 'QUEIROZ PORTO', 'VICTAR 01 (VISTA MAR GTI)'],
  10: ['MARACANAÚ', 'MARANGUAPE', 'GRAND SHOPPING', 'VILA PITAGUARY', 'FELICITA', 'LUMINOS', 'PLAZA MAYOR', 'DR ANTONIO NERICIO', 'ROGACIANO LEITE I', 'SAN LORENZO', 'JOSE PESSOA DE ARAUJO', 'JARDIM DE HOLANDA', 'PARC DES FLEURS', 'GEMINI', 'LIDIANE', 'VILLA FIRENZE', 'MONTE CARLO', 'VERDI'],
  11: ['SHOPPING IGUATEMI', 'SAINT GILBERT RESIDENCE', 'PALAZZO RIGOLETTO', 'VIENNA', 'VILLA SOLARIUM', 'VENICE CLUBE', 'VILLA FOOD', 'M LAR JACAREY', 'AMERICA DO SUL - TORRE BRASIL', 'NEO HOME CLUB', 'SANTA CRUZ', 'VICTOR V'],
  12: ['CHATELAIN', 'NOVA VIDA', 'MAIZE', 'TOM JOBIM', 'NORDESTE PALACE', 'PARQUE DOS IPES', 'NORTH SHOPPING', 'SHOPPING AEROPORTO', 'PAUL MAURIAT', 'NAUTILUS', 'TAMBAQUI', 'ZARAGOZZA', 'VIENA', 'IBERIA I', 'NERE AMETZA'],
  13: ['TALASSA DUNAS', 'RESERVA DO PARQUE A', 'PATIO COCÓ', 'LIS DU PARC', 'ÂNGELA', 'PLATZ', 'PUERTO MONTT', 'JOSE DE ALENCAR', 'VILLA NOVA', 'DANIEL CARLOS', 'SILVANI SOARES', 'DU LOUVRE', 'JOSE RANDAL DE MESQUITA', 'STRAUSS', 'LUXEMBURGO', 'VALE LIRA'],
  14: ['SOLAR DAS ARVÓRES', 'VILLA REAL - SERRINHA', 'RECANTO DAS ACACIAS II', 'MARBELA', 'SOLAR BEZERRA DE MENEZES', 'PALAZZO DON GIOVANNI', 'SAN PIETRO', 'SHOPPING ALDEOTA', 'SHOPPING DEL PASEO', 'CRISTAL X', 'HENRIQUE JORGE', 'JAVA'],
  15: ['JARDINO PASSEO', 'PARC CEZANNE', 'ONIX E JADE', 'PROMENADE ALDEOTA', 'MARSELHA', 'CIDRAO PALACE', 'LIBERTY PLACE', 'JACARTA', 'ATLANTIS', 'PACO DO BEM', 'PALADIUM', 'MARINO MARINE', 'ASTORIA'],
  16: ['PARQUE DE FATIMA', 'MANUELA MENDES', 'BOSQUE DAS ACACIAS', 'BOSQUES DAS FLORES', 'ARBORE', 'RESIDENCIAL CHRONUS', 'DUO RESIDENCE', 'GRAND PLACE'],
  17: ['AQUARELA CONDOMINIO CLUB', 'FAROL DA COSTA', 'MIRANTE DAS DUNAS', 'ROYAL OAK', 'SAN THOMAS', 'SAINT ANTHONY PLACE', 'JARDIM DE CASTELO', 'PONTAL'],
  18: ['PAÇO DOS PASSAROS', 'KAROL WOTYJLA', 'ABOLIÇÃO', 'SAMBURA', 'MEET ALDEOTA', 'MIRANTE HOME RESORT', 'BRASILIA', 'TERAVIVA', 'TERALUZ'],
  19: ['PABLO PICASSO', 'PORTAL MADRID', 'JARDIM ABAETE', 'MONTE REI', 'DELIVERY MALL', 'MONTE REAL', 'VIVENDAS PASSARÉ', 'PARK CLUB PASSARE'],
  20: ['VICTA 05 BELVEDERE', 'JARDIM DOS PASSAROS'],
}

export default function AdminAtualizarRotasCE() {
  const [log, setLog] = useState<string[]>([])
  const [running, setRunning] = useState(false)

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  const executar = async () => {
    setRunning(true)
    setLog([])
    addLog('Buscando todos os empreendimentos CE...')

    const { data: empreendimentos, error } = await supabase
      .from('empreendimentos_terceirizados')
      .select('id, nome, rota')
      .eq('uf', 'CE')

    if (error) {
      addLog(`ERRO ao buscar: ${error.message}`)
      setRunning(false)
      return
    }

    addLog(`Encontrados ${empreendimentos.length} empreendimentos CE no banco.`)

    // Create lookup: normalized name -> {id, nome, rota}
    const lookup = new Map<string, { id: string; nome: string; rota: number }>()
    for (const emp of empreendimentos) {
      lookup.set(emp.nome.trim().toUpperCase(), emp)
    }

    let totalUpdated = 0
    let totalNotFound = 0
    const notFound: string[] = []

    for (const [rotaStr, nomes] of Object.entries(ROTAS)) {
      const rota = Number(rotaStr)
      addLog(`--- Processando Rota ${rota} (${nomes.length} condomínios) ---`)

      for (const nome of nomes) {
        const key = nome.trim().toUpperCase()
        const emp = lookup.get(key)

        if (!emp) {
          addLog(`  ❌ NÃO ENCONTRADO: "${nome}"`)
          notFound.push(nome)
          totalNotFound++
          continue
        }

        if (emp.rota === rota) {
          addLog(`  ✅ "${emp.nome}" já está na rota ${rota}, sem alteração`)
          continue
        }

        const { error: updateError } = await supabase
          .from('empreendimentos_terceirizados')
          .update({ rota })
          .eq('id', emp.id)

        if (updateError) {
          addLog(`  ⚠️ ERRO ao atualizar "${emp.nome}": ${updateError.message}`)
        } else {
          addLog(`  ✅ "${emp.nome}" atualizado: rota ${emp.rota} → ${rota}`)
          totalUpdated++
        }
      }
    }

    addLog('')
    addLog(`=== RESUMO ===`)
    addLog(`Total atualizados: ${totalUpdated}`)
    addLog(`Já estavam corretos: ${Object.values(ROTAS).flat().length - totalUpdated - totalNotFound}`)
    addLog(`Não encontrados: ${totalNotFound}`)
    if (notFound.length > 0) {
      addLog(`Nomes não encontrados: ${notFound.join(', ')}`)
    }
    addLog('Concluído!')
    setRunning(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Atualizar Rotas CE - Script Único</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este script atualiza o campo "rota" de ~200 empreendimentos do CE conforme a planilha fornecida.
            O match é feito por nome (case-insensitive, trimmed).
          </p>
          <Button onClick={executar} disabled={running}>
            {running ? 'Executando...' : 'Executar Atualização'}
          </Button>
          {log.length > 0 && (
            <div className="bg-muted rounded-md p-4 max-h-[600px] overflow-y-auto font-mono text-xs space-y-0.5">
              {log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
