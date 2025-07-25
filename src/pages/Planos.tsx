import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, BookOpen, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  duracao_estimada_dias: number;
  nivel_maturidade: string;
  ativo: boolean;
  created_at: string;
}

interface Etapa {
  id: string;
  plano_id: string;
  nome: string;
  descricao: string;
  ordem: number;
  duracao_estimada_dias: number;
  recursos_necessarios: string;
  versiculos_chave: string;
  atividades_sugeridas: string;
}

export default function Planos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEtapaDialogOpen, setIsEtapaDialogOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>('');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    duracao_estimada_dias: '',
    nivel_maturidade: 'Iniciante'
  });
  const [etapaFormData, setEtapaFormData] = useState({
    nome: '',
    descricao: '',
    ordem: '',
    duracao_estimada_dias: '',
    recursos_necessarios: '',
    versiculos_chave: '',
    atividades_sugeridas: ''
  });

  useEffect(() => {
    if (user) {
      loadPlanos();
    }
  }, [user]);

  const loadPlanos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('planos_discipulado')
        .select('*')
        .eq('lider_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlanos(data || []);
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

  const loadEtapas = async (planoId: string) => {
    try {
      const { data, error } = await supabase
        .from('etapas_plano')
        .select('*')
        .eq('plano_id', planoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setEtapas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planoData = {
        ...formData,
        duracao_estimada_dias: parseInt(formData.duracao_estimada_dias),
        lider_id: user?.id
      };

      if (editingPlano) {
        const { error } = await supabase
          .from('planos_discipulado')
          .update(planoData)
          .eq('id', editingPlano.id);

        if (error) throw error;
        toast({ title: "Plano atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('planos_discipulado')
          .insert([planoData]);

        if (error) throw error;
        toast({ title: "Plano criado com sucesso!" });
      }

      resetForm();
      loadPlanos();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEtapaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const etapaData = {
        ...etapaFormData,
        plano_id: selectedPlanoId,
        ordem: parseInt(etapaFormData.ordem),
        duracao_estimada_dias: parseInt(etapaFormData.duracao_estimada_dias)
      };

      const { error } = await supabase
        .from('etapas_plano')
        .insert([etapaData]);

      if (error) throw error;
      
      toast({ title: "Etapa criada com sucesso!" });
      resetEtapaForm();
      loadEtapas(selectedPlanoId);
      setIsEtapaDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('planos_discipulado')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Plano excluído com sucesso!" });
      loadPlanos();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      duracao_estimada_dias: '',
      nivel_maturidade: 'Iniciante'
    });
    setEditingPlano(null);
  };

  const resetEtapaForm = () => {
    setEtapaFormData({
      nome: '',
      descricao: '',
      ordem: '',
      duracao_estimada_dias: '',
      recursos_necessarios: '',
      versiculos_chave: '',
      atividades_sugeridas: ''
    });
  };

  const openEditDialog = (plano: Plano) => {
    setFormData({
      nome: plano.nome,
      descricao: plano.descricao || '',
      duracao_estimada_dias: plano.duracao_estimada_dias?.toString() || '',
      nivel_maturidade: plano.nivel_maturidade
    });
    setEditingPlano(plano);
    setIsDialogOpen(true);
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Planos de Discipulado</h1>
          <p className="text-muted-foreground">Crie e gerencie jornadas estruturadas de crescimento espiritual</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPlano ? 'Editar Plano' : 'Novo Plano de Discipulado'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Plano</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duracao">Duração Estimada (dias)</Label>
                  <Input
                    id="duracao"
                    type="number"
                    value={formData.duracao_estimada_dias}
                    onChange={(e) => setFormData({ ...formData, duracao_estimada_dias: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="nivel">Nível de Maturidade</Label>
                  <Select value={formData.nivel_maturidade} onValueChange={(value) => setFormData({ ...formData, nivel_maturidade: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Iniciante">Iniciante</SelectItem>
                      <SelectItem value="Intermediário">Intermediário</SelectItem>
                      <SelectItem value="Avançado">Avançado</SelectItem>
                      <SelectItem value="Líder">Líder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlano ? 'Atualizar' : 'Criar'} Plano
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {planos.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum plano criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro plano de discipulado para estruturar a jornada de crescimento espiritual.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => (
            <Card key={plano.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plano.nome}</CardTitle>
                    <CardDescription className="mt-2">{plano.descricao}</CardDescription>
                  </div>
                  <Badge className={getNivelColor(plano.nivel_maturidade)}>
                    {plano.nivel_maturidade}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {plano.duracao_estimada_dias ? `${plano.duracao_estimada_dias} dias` : 'Duração não definida'}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPlanoId(plano.id);
                        loadEtapas(plano.id);
                      }}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Etapas
                    </Button>
                  </div>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(plano)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(plano.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPlanoId && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Etapas do Plano</h2>
            <Dialog open={isEtapaDialogOpen} onOpenChange={setIsEtapaDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetEtapaForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Etapa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova Etapa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEtapaSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="etapa-nome">Nome da Etapa</Label>
                      <Input
                        id="etapa-nome"
                        value={etapaFormData.nome}
                        onChange={(e) => setEtapaFormData({ ...etapaFormData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ordem">Ordem</Label>
                      <Input
                        id="ordem"
                        type="number"
                        value={etapaFormData.ordem}
                        onChange={(e) => setEtapaFormData({ ...etapaFormData, ordem: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="etapa-descricao">Descrição</Label>
                    <Textarea
                      id="etapa-descricao"
                      value={etapaFormData.descricao}
                      onChange={(e) => setEtapaFormData({ ...etapaFormData, descricao: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="etapa-duracao">Duração Estimada (dias)</Label>
                    <Input
                      id="etapa-duracao"
                      type="number"
                      value={etapaFormData.duracao_estimada_dias}
                      onChange={(e) => setEtapaFormData({ ...etapaFormData, duracao_estimada_dias: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="versiculos">Versículos Chave</Label>
                    <Textarea
                      id="versiculos"
                      value={etapaFormData.versiculos_chave}
                      onChange={(e) => setEtapaFormData({ ...etapaFormData, versiculos_chave: e.target.value })}
                      placeholder="Ex: João 3:16, Romanos 10:9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="atividades">Atividades Sugeridas</Label>
                    <Textarea
                      id="atividades"
                      value={etapaFormData.atividades_sugeridas}
                      onChange={(e) => setEtapaFormData({ ...etapaFormData, atividades_sugeridas: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recursos">Recursos Necessários</Label>
                    <Textarea
                      id="recursos"
                      value={etapaFormData.recursos_necessarios}
                      onChange={(e) => setEtapaFormData({ ...etapaFormData, recursos_necessarios: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsEtapaDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Criar Etapa</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4">
            {etapas.map((etapa) => (
              <Card key={etapa.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                      {etapa.ordem}
                    </span>
                    {etapa.nome}
                  </CardTitle>
                  <CardDescription>{etapa.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {etapa.versiculos_chave && (
                      <div>
                        <strong>Versículos Chave:</strong>
                        <p className="mt-1">{etapa.versiculos_chave}</p>
                      </div>
                    )}
                    {etapa.atividades_sugeridas && (
                      <div>
                        <strong>Atividades:</strong>
                        <p className="mt-1">{etapa.atividades_sugeridas}</p>
                      </div>
                    )}
                    {etapa.recursos_necessarios && (
                      <div>
                        <strong>Recursos:</strong>
                        <p className="mt-1">{etapa.recursos_necessarios}</p>
                      </div>
                    )}
                    {etapa.duracao_estimada_dias && (
                      <div>
                        <strong>Duração:</strong>
                        <p className="mt-1">{etapa.duracao_estimada_dias} dias</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}