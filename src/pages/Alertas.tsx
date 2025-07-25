import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Bell, AlertCircle, Calendar, User, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  data_alerta: string;
  lido: boolean;
  ativo: boolean;
  discipulo_id?: string;
  discipulo_nome?: string;
  created_at: string;
}

interface Discipulo {
  id: string;
  nome: string;
}

export default function Alertas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'lembrete',
    titulo: '',
    mensagem: '',
    data_alerta: '',
    discipulo_id: ''
  });

  useEffect(() => {
    if (user) {
      loadAlertas();
      loadDiscipulos();
    }
  }, [user]);

  const loadAlertas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alertas')
        .select('*')
        .eq('lider_id', user?.id)
        .order('data_alerta', { ascending: false });

      if (error) throw error;
      setAlertas(data || []);
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

  const loadDiscipulos = async () => {
    try {
      const { data, error } = await supabase
        .from('discipulos')
        .select('id, nome')
        .eq('lider_id', user?.id)
        .eq('status', 'Ativo')
        .order('nome');

      if (error) throw error;
      setDiscipulos(data || []);
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
      const alertaData = {
        ...formData,
        lider_id: user?.id,
        discipulo_id: formData.discipulo_id || null
      };

      const { error } = await supabase
        .from('alertas')
        .insert([alertaData]);

      if (error) throw error;
      
      toast({ title: "Alerta criado com sucesso!" });
      resetForm();
      loadAlertas();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const marcarComoLido = async (id: string, lido: boolean) => {
    try {
      const { error } = await supabase
        .from('alertas')
        .update({ lido })
        .eq('id', id);

      if (error) throw error;
      loadAlertas();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('alertas')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
      loadAlertas();
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
      tipo: 'lembrete',
      titulo: '',
      mensagem: '',
      data_alerta: '',
      discipulo_id: ''
    });
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      'lembrete': 'bg-blue-100 text-blue-800 border-blue-200',
      'aniversario': 'bg-green-100 text-green-800 border-green-200',
      'follow-up': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'urgente': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTipoIcon = (tipo: string) => {
    const icons = {
      'lembrete': Bell,
      'aniversario': Calendar,
      'follow-up': User,
      'urgente': AlertCircle
    };
    const Icon = icons[tipo as keyof typeof icons] || Bell;
    return Icon;
  };

  const isAlertaVencido = (dataAlerta: string) => {
    return new Date(dataAlerta) < new Date();
  };

  const alertasNaoLidos = alertas.filter(a => !a.lido && a.ativo);
  const alertasAtivos = alertas.filter(a => a.ativo);

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
          <h1 className="text-3xl font-bold">Alertas e Notificações</h1>
          <p className="text-muted-foreground">Gerencie lembretes, follow-ups e notificações importantes</p>
          <div className="flex gap-4 mt-2">
            <Badge variant="secondary">
              {alertasNaoLidos.length} não lidos
            </Badge>
            <Badge variant="outline">
              {alertasAtivos.length} ativos
            </Badge>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Alerta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Alerta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Alerta</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lembrete">Lembrete</SelectItem>
                      <SelectItem value="aniversario">Aniversário</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discipulo">Discípulo (Opcional)</Label>
                  <Select value={formData.discipulo_id} onValueChange={(value) => setFormData({ ...formData, discipulo_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um discípulo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {discipulos.map((discipulo) => (
                        <SelectItem key={discipulo.id} value={discipulo.id}>
                          {discipulo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="data_alerta">Data e Hora do Alerta</Label>
                <Input
                  id="data_alerta"
                  type="datetime-local"
                  value={formData.data_alerta}
                  onChange={(e) => setFormData({ ...formData, data_alerta: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Alerta</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {alertas.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum alerta criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie alertas para se lembrar de follow-ups, aniversários e outras atividades importantes.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Alerta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alertas.map((alerta) => {
            const Icon = getTipoIcon(alerta.tipo);
            const isVencido = isAlertaVencido(alerta.data_alerta);
            
            return (
              <Card key={alerta.id} className={`transition-all ${!alerta.lido ? 'border-primary shadow-md' : ''} ${!alerta.ativo ? 'opacity-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${alerta.lido ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {alerta.titulo}
                          <Badge className={getTipoColor(alerta.tipo)}>
                            {alerta.tipo.charAt(0).toUpperCase() + alerta.tipo.slice(1)}
                          </Badge>
                          {isVencido && alerta.ativo && (
                            <Badge variant="destructive">Vencido</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {alerta.mensagem}
                        </CardDescription>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            {format(new Date(alerta.data_alerta), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {alerta.discipulo_id && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {discipulos.find(d => d.id === alerta.discipulo_id)?.nome || 'Discípulo'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={alerta.ativo}
                        onCheckedChange={(checked) => toggleAtivo(alerta.id, checked)}
                      />
                      {!alerta.lido ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => marcarComoLido(alerta.id, true)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => marcarComoLido(alerta.id, false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}