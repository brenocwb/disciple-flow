import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Clock, Users, Search, Home, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface GrupoPublico {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  dia_semana: number;
  horario: string;
  maximo_membros: number;
  observacoes: string;
  _member_count?: number;
  _vagas_disponiveis?: number;
}

const diasSemana = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export default function BuscarGrupos() {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<GrupoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    cidade: '',
    dia_semana: '',
    busca: ''
  });

  useEffect(() => {
    loadGruposPublicos();
  }, []);

  const loadGruposPublicos = async () => {
    setLoading(true);
    try {
      const { data: gruposData, error } = await supabase
        .from('house_groups')
        .select('*')
        .eq('ativo', true)
        .order('cidade');

      if (error) throw error;

      // Carregar contagem de membros para cada grupo
      const gruposComContagem = await Promise.all(
        (gruposData || []).map(async (grupo) => {
          const { data: membersData } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', grupo.id)
            .eq('ativo', true);

          const memberCount = membersData?.length || 0;
          const vagasDisponiveis = grupo.maximo_membros - memberCount;

          return {
            ...grupo,
            _member_count: memberCount,
            _vagas_disponiveis: vagasDisponiveis
          };
        })
      );

      setGrupos(gruposComContagem);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      toast.error('Erro ao carregar grupos familiares');
    } finally {
      setLoading(false);
    }
  };

  const solicitarParticipacao = async (grupoId: string, nomeGrupo: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para solicitar participação');
      return;
    }

    try {
      // Verificar se já é membro do grupo
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', grupoId)
        .eq('member_id', user.id)
        .single();

      if (existingMember) {
        toast.error('Você já faz parte deste grupo');
        return;
      }

      // Buscar o líder do grupo
      const { data: grupoData } = await supabase
        .from('house_groups')
        .select('lider_id')
        .eq('id', grupoId)
        .single();

      if (!grupoData) {
        toast.error('Grupo não encontrado');
        return;
      }

      // Criar solicitação de participação via alerta
      const { error } = await supabase
        .from('alertas')
        .insert([{
          lider_id: grupoData.lider_id,
          discipulo_id: user.id,
          tipo: 'solicitacao_grupo',
          titulo: 'Nova Solicitação de Participação',
          mensagem: `Usuário solicitou participação no grupo "${nomeGrupo}"`,
          data_alerta: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Solicitação enviada! O líder do grupo será notificado.');
    } catch (error: any) {
      console.error('Erro ao solicitar participação:', error);
      toast.error('Erro ao enviar solicitação');
    }
  };

  const gruposFiltrados = grupos.filter(grupo => {
    const matchCidade = !filtros.cidade || 
      grupo.cidade?.toLowerCase().includes(filtros.cidade.toLowerCase()) ||
      grupo.estado?.toLowerCase().includes(filtros.cidade.toLowerCase());
    
    const matchDia = !filtros.dia_semana || grupo.dia_semana.toString() === filtros.dia_semana;
    
    const matchBusca = !filtros.busca || 
      grupo.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      grupo.endereco.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      grupo.observacoes?.toLowerCase().includes(filtros.busca.toLowerCase());

    return matchCidade && matchDia && matchBusca;
  });

  const cidades = [...new Set(grupos.map(g => g.cidade).filter(Boolean))].sort();

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
        <h1 className="text-3xl font-bold">Encontrar Grupos Familiares</h1>
        <p className="text-muted-foreground">Descubra grupos de "Igreja no Lar" próximos a você</p>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do grupo, endereço..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cidade/Estado</label>
              <Select
                value={filtros.cidade}
                onValueChange={(value) => setFiltros({ ...filtros, cidade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as cidades</SelectItem>
                  {cidades.map((cidade) => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Dia da Semana</label>
              <Select
                value={filtros.dia_semana}
                onValueChange={(value) => setFiltros({ ...filtros, dia_semana: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os dias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os dias</SelectItem>
                  {diasSemana.map((dia, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Grupos */}
      {gruposFiltrados.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros para encontrar grupos disponíveis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gruposFiltrados.map((grupo) => (
            <Card key={grupo.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{grupo.nome}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {grupo.cidade && grupo.estado ? `${grupo.cidade}, ${grupo.estado}` : 'Localização não informada'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={grupo._vagas_disponiveis && grupo._vagas_disponiveis > 0 ? "default" : "secondary"}>
                      {grupo._vagas_disponiveis && grupo._vagas_disponiveis > 0 ? `${grupo._vagas_disponiveis} vagas` : 'Cheio'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{diasSemana[grupo.dia_semana]}s às {grupo.horario}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {grupo._member_count || 0} / {grupo.maximo_membros} membros
                    </span>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">
                      {grupo.endereco}
                    </span>
                  </div>

                  {grupo.observacoes && (
                    <div className="border-t pt-3">
                      <p className="text-muted-foreground text-xs">
                        {grupo.observacoes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        disabled={!grupo._vagas_disponiveis || grupo._vagas_disponiveis <= 0}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {grupo._vagas_disponiveis && grupo._vagas_disponiveis > 0 ? 'Solicitar Participação' : 'Grupo Lotado'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Solicitar Participação</DialogTitle>
                        <DialogDescription>
                          Você deseja solicitar participação no grupo "{grupo.nome}"?
                          O líder do grupo será notificado e entrará em contato.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">{grupo.nome}</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><Clock className="h-3 w-3 inline mr-1" />{diasSemana[grupo.dia_semana]}s às {grupo.horario}</p>
                            <p><MapPin className="h-3 w-3 inline mr-1" />{grupo.endereco}</p>
                            <p><Users className="h-3 w-3 inline mr-1" />{grupo._member_count || 0}/{grupo.maximo_membros} membros</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1">
                              Cancelar
                            </Button>
                          </DialogTrigger>
                          <Button 
                            className="flex-1"
                            onClick={() => solicitarParticipacao(grupo.id, grupo.nome)}
                          >
                            Confirmar Solicitação
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}