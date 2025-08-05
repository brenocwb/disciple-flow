import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, Clock, Play, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PlanoAtivo {
  id: string;
  plano_id: string;
  discipulo_id: string;
  status: string;
  data_inicio: string;
  data_conclusao: string | null;
  plano: {
    nome: string;
    descricao: string;
    nivel_maturidade: string;
    duracao_estimada_dias: number;
  };
  progresso?: ProgressoEtapa[];
}

interface ProgressoEtapa {
  id: string;
  etapa_id: string;
  status: string;
  data_inicio: string | null;
  data_conclusao: string | null;
  etapa: {
    nome: string;
    descricao: string;
    ordem: number;
    versiculos_chave: string;
    atividades_sugeridas: string;
  };
}

export default function MeusPlanos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [planosAtivos, setPlanosAtivos] = useState<PlanoAtivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMeusPlanos();
    }
  }, [user]);

  const loadMeusPlanos = async () => {
    setLoading(true);
    try {
      // Buscar planos ativos do discípulo atual
      const { data: progressData, error } = await supabase
        .from('progresso_discipulo')
        .select(`
          *,
          planos_discipulado:plano_id (
            nome,
            descricao,
            nivel_maturidade,
            duracao_estimada_dias
          ),
          etapas_plano:etapa_id (
            nome,
            descricao,
            ordem,
            versiculos_chave,
            atividades_sugeridas
          )
        `)
        .eq('discipulo_id', user?.id);

      if (error) throw error;

      // Agrupar por plano
      const planosMap = new Map<string, PlanoAtivo>();
      
      progressData?.forEach((item: any) => {
        const planoId = item.plano_id;
        
        if (!planosMap.has(planoId)) {
          planosMap.set(planoId, {
            id: item.id,
            plano_id: planoId,
            discipulo_id: item.discipulo_id,
            status: item.status,
            data_inicio: item.data_inicio,
            data_conclusao: item.data_conclusao,
            plano: item.planos_discipulado,
            progresso: []
          });
        }

        const plano = planosMap.get(planoId)!;
        plano.progresso!.push({
          id: item.id,
          etapa_id: item.etapa_id,
          status: item.status,
          data_inicio: item.data_inicio,
          data_conclusao: item.data_conclusao,
          etapa: item.etapas_plano
        });
      });

      // Ordenar etapas por ordem
      Array.from(planosMap.values()).forEach(plano => {
        plano.progresso?.sort((a, b) => a.etapa.ordem - b.etapa.ordem);
      });

      setPlanosAtivos(Array.from(planosMap.values()));
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

  const marcarEtapaConcluida = async (progressoId: string) => {
    try {
      const { error } = await supabase
        .from('progresso_discipulo')
        .update({
          status: 'Concluído',
          data_conclusao: new Date().toISOString()
        })
        .eq('id', progressoId);

      if (error) throw error;
      
      toast({ title: "Etapa concluída com sucesso!" });
      loadMeusPlanos();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const solicitarRemocaoPlano = async (planoId: string) => {
    if (!confirm('Deseja solicitar a remoção deste plano ao seu discipulador?')) return;
    
    try {
      // Criar alerta para o líder
      const { error } = await supabase
        .from('alertas')
        .insert([{
          lider_id: user?.id, // Será atualizado para o líder correto
          discipulo_id: user?.id,
          tipo: 'solicitacao_remocao_plano',
          titulo: 'Solicitação de Remoção de Plano',
          mensagem: `Discípulo solicitou a remoção do plano de discipulado`,
          data_alerta: new Date().toISOString()
        }]);

      if (error) throw error;
      
      toast({ title: "Solicitação enviada ao seu discipulador!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calcularProgresso = (progresso: ProgressoEtapa[]) => {
    if (!progresso.length) return 0;
    const concluidas = progresso.filter(p => p.status === 'Concluído').length;
    return Math.round((concluidas / progresso.length) * 100);
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
        <h1 className="text-3xl font-bold">Meus Planos de Discipulado</h1>
        <p className="text-muted-foreground">Acompanhe seu crescimento espiritual</p>
      </div>

      {planosAtivos.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum plano ativo</h3>
            <p className="text-muted-foreground">
              Seu discipulador ainda não atribuiu nenhum plano de discipulado para você.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {planosAtivos.map((planoAtivo) => {
            const progresso = calcularProgresso(planoAtivo.progresso || []);
            
            return (
              <Card key={planoAtivo.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{planoAtivo.plano.nome}</CardTitle>
                      <CardDescription className="mt-2">
                        {planoAtivo.plano.descricao}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getNivelColor(planoAtivo.plano.nivel_maturidade)}>
                        {planoAtivo.plano.nivel_maturidade}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => solicitarRemocaoPlano(planoAtivo.plano_id)}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Solicitar Remoção
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progresso Geral</span>
                        <span className="text-sm text-muted-foreground">{progresso}%</span>
                      </div>
                      <Progress value={progresso} className="w-full" />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Etapas</h4>
                      {planoAtivo.progresso?.map((progressoEtapa) => (
                        <Card key={progressoEtapa.id} className="border-l-4 border-l-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                    {progressoEtapa.etapa.ordem}
                                  </span>
                                  <h5 className="font-medium">{progressoEtapa.etapa.nome}</h5>
                                  {progressoEtapa.status === 'Concluído' && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-3">
                                  {progressoEtapa.etapa.descricao}
                                </p>
                                
                                {progressoEtapa.etapa.versiculos_chave && (
                                  <div className="mb-2">
                                    <span className="text-xs font-medium text-primary">Versículos:</span>
                                    <p className="text-xs text-muted-foreground">
                                      {progressoEtapa.etapa.versiculos_chave}
                                    </p>
                                  </div>
                                )}
                                
                                {progressoEtapa.etapa.atividades_sugeridas && (
                                  <div>
                                    <span className="text-xs font-medium text-primary">Atividades:</span>
                                    <p className="text-xs text-muted-foreground">
                                      {progressoEtapa.etapa.atividades_sugeridas}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="ml-4">
                                {progressoEtapa.status === 'Em Andamento' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => marcarEtapaConcluida(progressoEtapa.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Marcar como Concluída
                                  </Button>
                                ) : progressoEtapa.status === 'Pendente' ? (
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Aguardando
                                  </Badge>
                                ) : (
                                  <Badge variant="default">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Concluída
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}