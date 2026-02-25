import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TipoRelatorio } from '@/pages/Relatorios';

interface RelatorioSelectorProps {
  tipoSelecionado: TipoRelatorio | null;
  onTipoChange: (tipo: TipoRelatorio) => void;
}

const relatoriosDisponiveis = [
  { value: 'condominios_competencia', label: 'Condomínios Coletados por Competência', categoria: 'Leituras' },
  { value: 'cadastro_condominios_uf', label: 'Cadastro de Condomínios por UF', categoria: 'Leituras' },
  { value: 'rdo_servicos', label: 'RDO - Relatório Diário de Obra', categoria: 'Serviços' },
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
          <div>
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Leituras</div>
            {relatoriosDisponiveis.filter(r => r.categoria === 'Leituras').map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </div>
          <div>
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Serviços</div>
            {relatoriosDisponiveis.filter(r => r.categoria === 'Serviços').map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
