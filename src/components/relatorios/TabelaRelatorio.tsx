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
      case 'condominios_competencia':
        return (
          <>
            <TableHead>Condomínio</TableHead>
            <TableHead>UF</TableHead>
            <TableHead>Qtd Medidores</TableHead>
            <TableHead>Data da Coleta</TableHead>
          </>
        );
      case 'rdo_servicos':
        return (
          <>
            <TableHead>Data</TableHead>
            <TableHead>Condomínio</TableHead>
            <TableHead>Tipo Serviço</TableHead>
            <TableHead>Técnico</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Descrição</TableHead>
          </>
        );
      default:
        return <TableHead>Dados</TableHead>;
    }
  };

  const renderLinhas = () => {
    return dados.map((item, index) => {
      switch (tipoRelatorio) {
        case 'condominios_competencia':
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.condominio}</TableCell>
              <TableCell>{item.uf || '-'}</TableCell>
              <TableCell>{item.qtd_medidores}</TableCell>
              <TableCell>
                {item.data_coleta
                  ? format(new Date(item.data_coleta), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </TableCell>
            </TableRow>
          );
        case 'rdo_servicos':
          return (
            <TableRow key={index}>
              <TableCell>
                {item.data
                  ? format(new Date(item.data), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </TableCell>
              <TableCell>{item.condominio || '-'}</TableCell>
              <TableCell>{item.tipo_servico?.toUpperCase()}</TableCell>
              <TableCell>{item.tecnico || '-'}</TableCell>
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
              <TableCell className="max-w-xs truncate">{item.descricao || '-'}</TableCell>
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
