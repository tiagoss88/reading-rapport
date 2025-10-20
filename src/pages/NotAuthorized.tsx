import Layout from '@/components/Layout'

export default function NotAuthorized() {
  return (
    <Layout title="Acesso não autorizado">
      <div className="max-w-xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Você não tem permissão para acessar esta página.</h1>
        <p className="text-muted-foreground">Se você acredita que isso é um engano, entre em contato com o administrador do sistema.</p>
      </div>
    </Layout>
  )
}
