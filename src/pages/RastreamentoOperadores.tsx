import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users } from 'lucide-react';
import LocalizacaoOperadores from '@/components/rastreamento/LocalizacaoOperadores';
import GeoreferenciarClientes from '@/components/rastreamento/GeoreferenciarClientes';

export default function RastreamentoOperadores() {

  return (
    <Layout title="Rastreamento">
      <div className="p-6">
        <Tabs defaultValue="operadores" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="operadores" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Operadores
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operadores">
            <LocalizacaoOperadores />
          </TabsContent>

          <TabsContent value="clientes">
            <GeoreferenciarClientes />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
