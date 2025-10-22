import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TipoRelatorio } from '@/pages/Relatorios';

interface RelatorioSelectorProps {
  tipoSelecionado: TipoRelatorio | null;
  onTipoChange: (tipo: TipoRelatorio) => void;
}

const relatoriosDisponiveis = [
  { value: 'leituras_periodo', label: 'Leituras por Período', categoria: 'Leituras' },
  { value: 'leituras_empreendimento', label: 'Leituras por Empreendimento', categoria: 'Leituras' },
  { value: 'leituras_operador', label: 'Leituras por Operador', categoria: 'Leituras' },
  { value: 'consumo_medio', label: 'Consumo Médio por Cliente', categoria: 'Leituras' },
  { value: 'leituras_pendentes', label: 'Leituras Pendentes', categoria: 'Leituras' },
  { value: 'leituras_observacoes', label: 'Leituras com Observações', categoria: 'Leituras' },
  { value: 'servicos_agendados_executados', label: 'Serviços Agendados vs Executados', categoria: 'Serviços' },
  { value: 'servicos_periodo', label: 'Serviços por Período', categoria: 'Serviços' },
  { value: 'servicos_operador', label: 'Serviços por Operador', categoria: 'Serviços' },
  { value: 'servicos_tipo', label: 'Serviços por Tipo', categoria: 'Serviços' },
  { value: 'tempo_medio_execucao', label: 'Tempo Médio de Execução', categoria: 'Serviços' },
  { value: 'servicos_externos', label: 'Serviços Externos', categoria: 'Serviços' },
  { value: 'dashboard_executivo', label: 'Dashboard Executivo', categoria: 'Gerencial' },
  { value: 'clientes_empreendimento', label: 'Clientes por Empreendimento', categoria: 'Gerencial' },
  { value: 'produtividade_operadores', label: 'Produtividade de Operadores', categoria: 'Gerencial' },
  { value: 'rastreamento_operadores', label: 'Rastreamento de Operadores', categoria: 'Gerencial' },
  { value: 'consumo_empreendimento', label: 'Consumo por Empreendimento', categoria: 'Gerencial' },
];

export default function RelatorioSelector({ tipoSelecionado, onTipoChange }: RelatorioSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tipo de Relatório</label>
      <Select 
        value={tipoSelecionado || undefined} 
        onValueChange={(value) => onTipoChange(value as TipoRelatorio)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione um tipo de relatório" />
        </SelectTrigger>
        <SelectContent>
          {['Leituras', 'Serviços', 'Gerencial'].map((categoria) => (
            <div key={categoria}>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                {categoria}
              </div>
              {relatoriosDisponiveis
                .filter((r) => r.categoria === categoria)
                .map((relatorio) => (
                  <SelectItem key={relatorio.value} value={relatorio.value}>
                    {relatorio.label}
                  </SelectItem>
                ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
