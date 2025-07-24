import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Heart, Plus, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalDiscipulos: number;
  encontrosEsteAno: number;
  pedidosOracaoAtivos: number;
  ultimoEncontro: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDiscipulos: 0,
    encontrosEsteAno: 0,
    pedidosOracaoAtivos: 0,
    ultimoEncontro: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      // Total de discípulos ativos
      const { count: totalDiscipulos } = await supabase
        .from('discipulos')
        .select('*', { count: 'exact', head: true })
        .eq('lider_id', user!.id)
        .eq('status', 'Ativo');

      // Encontros este ano
      const currentYear = new Date().getFullYear();
      const { count: encontrosEsteAno } = await supabase
        .from('encontros')
        .select('*', { count: 'exact', head: true })
        .eq('lider_id', user!.id)
        .gte('data_encontro', `${currentYear}-01-01`)
        .lte('data_encontro', `${currentYear}-12-31`);

      // Pedidos de oração ativos
      const { count: pedidosOracaoAtivos } = await supabase
        .from('pedidos_oracao')
        .select('*', { count: 'exact', head: true })
        .eq('lider_id', user!.id)
        .eq('status', 'Em Oração');

      // Último encontro
      const { data: ultimoEncontroData } = await supabase
        .from('encontros')
        .select('data_encontro')
        .eq('lider_id', user!.id)
        .order('data_encontro', { ascending: false })
        .limit(1)
        .single();

      setStats({
        totalDiscipulos: totalDiscipulos || 0,
        encontrosEsteAno: encontrosEsteAno || 0,
        pedidosOracaoAtivos: pedidosOracaoAtivos || 0,
        ultimoEncontro: ultimoEncontroData?.data_encontro || null
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo ao Pastor Digital
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o crescimento espiritual dos seus discípulos
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Discípulos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDiscipulos}</div>
              <p className="text-xs text-muted-foreground">Ativos no discipulado</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Encontros Este Ano</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.encontrosEsteAno}</div>
              <p className="text-xs text-muted-foreground">
                {stats.ultimoEncontro 
                  ? `Último: ${formatDate(stats.ultimoEncontro)}`
                  : 'Nenhum encontro registrado'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos de Oração</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pedidosOracaoAtivos}</div>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{Math.floor(stats.encontrosEsteAno / 12)}%</div>
              <p className="text-xs text-muted-foreground">Média mensal</p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-card hover:shadow-hero transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Gerenciar Discípulos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Adicione novos discípulos e acompanhe o crescimento espiritual de cada um.
              </p>
              <Button className="w-full" onClick={() => window.location.href = '/discipulos'}>
                <Plus className="w-4 h-4 mr-2" />
                Acessar Gestão
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover:shadow-hero transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Registrar Encontros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Documente reuniões, estudos e momentos importantes do discipulado.
              </p>
              <Button className="w-full" onClick={() => window.location.href = '/encontros'}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Encontro
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover:shadow-hero transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Centro de Oração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gerencie pedidos de oração e acompanhe as respostas de Deus.
              </p>
              <Button className="w-full" onClick={() => window.location.href = '/oracao'}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Pedido
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}