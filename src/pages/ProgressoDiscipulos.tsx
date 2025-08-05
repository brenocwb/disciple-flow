import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, BookOpen, CheckCircle, Clock, User, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DiscipuloProgresso {
  discipulo_id: string;
  nome: string;
  planos: PlanoProgresso[];
}

interface PlanoProgresso {
  plano_id: string;
  nome_plano: string;
  nivel_maturidade: string;
  total_etapas: number;
  etapas_concluidas: number;
  progresso_percentual: number;
  status: string;
  data_inicio: string;
  ultima_atividade: string;
}

export default function ProgressoDiscipulos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discipulos, setDiscipulos] = useState<DiscipuloProgresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  useEffect(() => {
    if (user) {
      loadProgressoDiscipulos();
    }
  }, [user]);

  const loadProgressoDiscipulos = async () => {
    setLoading(true);
    try {
      // Buscar todos os discípulos do líder
      const { data: discipulosData, error: discipulosError } = await supabase
        .from('discipulos')
        .select('id, nome')
        .eq('lider_id', user?.id)
        .eq('status', 'Ativo');

      if (discipulosError) throw discipulosError;

      const progressoDiscipulos: DiscipuloProgresso[] = [];

      for (const discipulo of discipulosData || []) {
        // Buscar progresso de cada discípulo
        const { data: progressoData, error: progressoError } = await supabase
          .from('progresso_discipulo')
          .select(`
            *,
            planos_discipulado:plano_id (
              nome,
              nivel_maturidade
            ),
            etapas_plano:etapa_id (
              ordem
            )
          `)
          .eq('discipulo_id', discipulo.id);

        if (progressoError) {
          console.error('Erro ao buscar progresso:', progressoError);
          continue;
        }

        // Agrupar por plano
        const planosMap = new Map<string, any>();
        
        progressoData?.forEach((item: any) => {
          const planoId = item.plano_id;
          
          if (!planosMap.has(planoId)) {
            planosMap.set(planoId, {
              plano_id: planoId,
              nome_plano: item.planos_discipulado.nome,
              nivel_maturidade: item.planos_discipulado.nivel_maturidade,
              etapas: [],
              data_inicio: item.data_inicio,
              ultima_atividade: item.updated_at
            });
          }

          planosMap.get(planoId).etapas.push({
            id: item.id,
            status: item.status,
            data_inicio: item.data_inicio,
            data_conclusao: item.data_conclusao,
            updated_at: item.updated_at
          });
        });

        // Calcular estatísticas de cada plano
        const planosProgresso: PlanoProgresso[] = Array.from(planosMap.values()).map(plano => {
          const totalEtapas = plano.etapas.length;
          const etapasConcluidas = plano.etapas.filter((e: any) => e.status === 'Concluído').length;
          const progressoPercentual = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;
          
          let status = 'Em Andamento';
          if (progressoPercentual === 100) status = 'Concluído';
          else if (progressoPercentual === 0) status = 'Não Iniciado';

          // Encontrar última atividade
          const ultimaAtividade = plano.etapas
            .filter((e: any) => e.updated_at)
            .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at || plano.data_inicio;

          return {
            plano_id: plano.plano_id,
            nome_plano: plano.nome_plano,
            nivel_maturidade: plano.nivel_maturidade,
            total_etapas: totalEtapas,
            etapas_concluidas: etapasConcluidas,
            progresso_percentual: progressoPercentual,
            status,
            data_inicio: plano.data_inicio,
            ultima_atividade: ultimaAtividade
          };
        });

        if (planosProgresso.length > 0) {
          progressoDiscipulos.push({
            discipulo_id: discipulo.id,
            nome: discipulo.nome,
            planos: planosProgresso
          });
        }
      }

      setDiscipulos(progressoDiscipulos);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Concluído': 'bg-green-100 text-green-800 border-green-200',
      'Em Andamento': 'bg-blue-100 text-blue-800 border-blue-200',
      'Não Iniciado': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getNivelColor = (nivel: string) => {
    const colors = {
      'Iniciante': 'bg-green-100 text-green-800 border-green-200',
      'Intermediário': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Avançado': 'bg-blue-100 text-blue-800 border-blue-200',
      'Líder': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[nivel as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const discipulosFiltrados = discipulos.filter(discipulo => {
    if (filtroStatus === 'todos') return true;
    return discipulo.planos.some(plano => plano.status === filtroStatus);
  });

  // Estatísticas gerais
  const totalDiscipulos = discipulos.length;
  const totalPlanos = discipulos.reduce((acc, d) => acc + d.planos.length, 0);
  const planosAtivos = discipulos.reduce((acc, d) => acc + d.planos.filter(p => p.status === 'Em Andamento').length, 0);
  const planosConcluidos = discipulos.reduce((acc, d) => acc + d.planos.filter(p => p.status === 'Concluído').length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Progresso dos Discípulos</h1>
        <p className="text-muted-foreground">Acompanhe o crescimento espiritual dos seus discípulos</p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Discípulos</p>
                <p className="text-2xl font-bold">{totalDiscipulos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Planos</p>
                <p className="text-2xl font-bold">{totalPlanos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{planosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold">{planosConcluidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Não Iniciado">Não Iniciado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {discipulosFiltrados.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum discípulo com planos</h3>
            <p className="text-muted-foreground">
              Atribua planos de discipulado aos seus discípulos para acompanhar o progresso.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {discipulosFiltrados.map((discipulo) => (
            <Card key={discipulo.discipulo_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{discipulo.nome}</CardTitle>
                      <CardDescription>
                        {discipulo.planos.length} plano{discipulo.planos.length !== 1 ? 's' : ''} atribuído{discipulo.planos.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {discipulo.planos.map((plano) => (
                    <Card key={plano.plano_id} className="border-l-4 border-l-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{plano.nome_plano}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getNivelColor(plano.nivel_maturidade)}>
                                {plano.nivel_maturidade}
                              </Badge>
                              <Badge className={getStatusColor(plano.status)}>
                                {plano.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>Última atividade:</p>
                            <p>{formatarData(plano.ultima_atividade)}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progresso</span>
                            <span className="text-sm text-muted-foreground">
                              {plano.etapas_concluidas}/{plano.total_etapas} etapas ({plano.progresso_percentual}%)
                            </span>
                          </div>
                          <Progress value={plano.progresso_percentual} className="w-full" />
                        </div>

                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>Iniciado em: {formatarData(plano.data_inicio)}</span>
                          {plano.progresso_percentual === 0 && (
                            <div className="flex items-center text-orange-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Aguardando início
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}