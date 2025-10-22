import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TipoRelatorio } from '@/pages/Relatorios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TabelaRelatorioProps {
  tipoRelatorio: TipoRelatorio;
  dados: any[];
}

export default function TabelaRelatorio({ tipoRelatorio, dados }: TabelaRelatorioProps) {
  const renderColunas = () => {
    switch (tipoRelatorio) {
      case 'leituras_periodo':
        return (
          <>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Empreendimento</TableHead>
            <TableHead>Operador</TableHead>
            <TableHead>Leitura Anterior</TableHead>
            <TableHead>Leitura Atual</TableHead>
            <TableHead>Consumo</TableHead>
          </>
        );
      case 'leituras_operador':
        return (
          <>
            <TableHead>Operador</TableHead>
            <TableHead>Total de Leituras</TableHead>
            <TableHead>Dias Trabalhados</TableHead>
            <TableHead>Média por Dia</TableHead>
          </>
        );
      case 'servicos_periodo':
      case 'servicos_agendados_executados':
        return (
          <>
            <TableHead>Data Agendamento</TableHead>
            <TableHead>Cliente/Local</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Operador</TableHead>
            <TableHead>Data Execução</TableHead>
          </>
        );
      case 'servicos_operador':
        return (
          <>
            <TableHead>Operador</TableHead>
            <TableHead>Total Agendados</TableHead>
            <TableHead>Concluídos</TableHead>
            <TableHead>Em Andamento</TableHead>
            <TableHead>Taxa de Conclusão</TableHead>
          </>
        );
      default:
        return <TableHead>Dados</TableHead>;
    }
  };

  const renderLinhas = () => {
    return dados.map((item, index) => {
      switch (tipoRelatorio) {
        case 'leituras_periodo':
          return (
            <TableRow key={index}>
              <TableCell>
                {format(new Date(item.data_leitura), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell>{item.cliente_nome}</TableCell>
              <TableCell>{item.empreendimento}</TableCell>
              <TableCell>{item.operador}</TableCell>
              <TableCell>{item.leitura_anterior?.toFixed(2) || '-'}</TableCell>
              <TableCell>{item.leitura_atual?.toFixed(2)}</TableCell>
              <TableCell>{item.consumo?.toFixed(2) || '-'}</TableCell>
            </TableRow>
          );
        case 'leituras_operador':
          return (
            <TableRow key={index}>
              <TableCell>{item.nome}</TableCell>
              <TableCell>{item.total_leituras}</TableCell>
              <TableCell>{item.dias_trabalhados}</TableCell>
              <TableCell>{item.leituras_por_dia}</TableCell>
            </TableRow>
          );
        case 'servicos_periodo':
        case 'servicos_agendados_executados':
          return (
            <TableRow key={index}>
              <TableCell>
                {format(new Date(item.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell>{item.cliente_nome || item.nome_cliente}</TableCell>
              <TableCell>{item.tipo_servico}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    item.status === 'concluido'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'em_andamento'
                      ? 'bg-blue-100 text-blue-800'
                      : item.status === 'agendado'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.status}
                </span>
              </TableCell>
              <TableCell>{item.operador_nome || '-'}</TableCell>
              <TableCell>
                {item.data_execucao
                  ? format(new Date(item.data_execucao), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </TableCell>
            </TableRow>
          );
        case 'servicos_operador':
          return (
            <TableRow key={index}>
              <TableCell>{item.operador_nome}</TableCell>
              <TableCell>{item.total_agendados}</TableCell>
              <TableCell>{item.concluidos}</TableCell>
              <TableCell>{item.em_andamento}</TableCell>
              <TableCell>{item.taxa_conclusao}%</TableCell>
            </TableRow>
          );
        default:
          return (
            <TableRow key={index}>
              <TableCell>{JSON.stringify(item)}</TableCell>
            </TableRow>
          );
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Resultado ({dados.length} {dados.length === 1 ? 'registro' : 'registros'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>{renderColunas()}</TableRow>
            </TableHeader>
            <TableBody>{renderLinhas()}</TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
