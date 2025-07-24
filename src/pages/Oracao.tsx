import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Edit, Trash2, Users, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PedidoOracao {
  id: string;
  discipulo_id: string | null;
  pedido: string;
  categoria: string;
  urgencia: string;
  status: string;
  data_pedido: string;
  data_conclusao: string | null;
  testemunho: string | null;
  created_at: string;
  discipulo?: {
    nome: string;
  };
}

interface Discipulo {
  id: string;
  nome: string;
}

export default function Oracao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<PedidoOracao[]>([]);
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<PedidoOracao | null>(null);
  const [formData, setFormData] = useState({
    discipulo_id: '',
    pedido: '',
    categoria: '',
    urgencia: 'Média',
    status: 'Em Oração',
    testemunho: ''
  });

  useEffect(() => {
    if (user) {
      loadPedidos();
      loadDiscipulos();
    }
  }, [user]);

  const loadPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos_oracao')
        .select(`
          *,
          discipulos(nome)
        `)
        .eq('lider_id', user!.id)
        .order('data_pedido', { ascending: false });

      if (error) throw error;
      
      const pedidosFormatted = data?.map(pedido => ({
        ...pedido,
        discipulo: pedido.discipulos ? { nome: pedido.discipulos.nome } : undefined
      })) || [];
      
      setPedidos(pedidosFormatted);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos de oração.",
        variant: "destructive",
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
        .eq('lider_id', user!.id)
        .eq('status', 'Ativo')
        .order('nome');

      if (error) throw error;
      setDiscipulos(data || []);
    } catch (error) {
      console.error('Erro ao carregar discípulos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        discipulo_id: formData.discipulo_id || null,
        data_conclusao: formData.status === 'Concluído' ? new Date().toISOString() : null
      };

      if (editingPedido) {
        const { error } = await supabase
          .from('pedidos_oracao')
          .update(submitData)
          .eq('id', editingPedido.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Pedido de oração atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('pedidos_oracao')
          .insert([{ ...submitData, lider_id: user!.id }]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Pedido de oração registrado com sucesso!",
        });
      }
      
      resetForm();
      setDialogOpen(false);
      loadPedidos();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pedido de oração.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido de oração?')) return;
    
    try {
      const { error } = await supabase
        .from('pedidos_oracao')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Pedido de oração removido com sucesso!",
      });
      loadPedidos();
    } catch (error) {
      console.error('Erro ao deletar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover pedido de oração.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      discipulo_id: '',
      pedido: '',
      categoria: '',
      urgencia: 'Média',
      status: 'Em Oração',
      testemunho: ''
    });
    setEditingPedido(null);
  };

  const openEditDialog = (pedido: PedidoOracao) => {
    setEditingPedido(pedido);
    setFormData({
      discipulo_id: pedido.discipulo_id || '',
      pedido: pedido.pedido,
      categoria: pedido.categoria || '',
      urgencia: pedido.urgencia,
      status: pedido.status,
      testemunho: pedido.testemunho || ''
    });
    setDialogOpen(true);
  };

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'Baixa': return 'bg-green-100 text-green-800';
      case 'Média': return 'bg-yellow-100 text-yellow-800';
      case 'Alta': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Oração': return 'bg-blue-100 text-blue-800';
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Atualizado': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Centro de Oração
            </h1>
            <p className="text-muted-foreground">
              Gerencie pedidos de oração e acompanhe as respostas de Deus
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPedido ? 'Editar Pedido de Oração' : 'Novo Pedido de Oração'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discipulo">Discípulo (Opcional)</Label>
                    <Select
                      value={formData.discipulo_id}
                      onValueChange={(value) => setFormData({...formData, discipulo_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pedido pessoal/geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Pedido pessoal/geral</SelectItem>
                        {discipulos.map((discipulo) => (
                          <SelectItem key={discipulo.id} value={discipulo.id}>
                            {discipulo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      placeholder="Ex: Saúde, Família, Finanças..."
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="pedido">Pedido de Oração *</Label>
                  <Textarea
                    id="pedido"
                    value={formData.pedido}
                    onChange={(e) => setFormData({...formData, pedido: e.target.value})}
                    placeholder="Descreva o pedido de oração..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="urgencia">Urgência</Label>
                    <Select
                      value={formData.urgencia}
                      onValueChange={(value) => setFormData({...formData, urgencia: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({...formData, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em Oração">Em Oração</SelectItem>
                        <SelectItem value="Atualizado">Atualizado</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(formData.status === 'Concluído' || formData.status === 'Atualizado') && (
                  <div>
                    <Label htmlFor="testemunho">Testemunho/Resposta</Label>
                    <Textarea
                      id="testemunho"
                      value={formData.testemunho}
                      onChange={(e) => setFormData({...formData, testemunho: e.target.value})}
                      placeholder="Como Deus respondeu a este pedido..."
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingPedido ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-primary" />
                      {pedido.discipulo ? (
                        <span className="font-medium">{pedido.discipulo.nome}</span>
                      ) : (
                        <span className="font-medium text-muted-foreground">Pedido Pessoal</span>
                      )}
                      {pedido.categoria && (
                        <span className="text-sm text-muted-foreground">• {pedido.categoria}</span>
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Badge className={getUrgenciaColor(pedido.urgencia)}>
                        {pedido.urgencia}
                      </Badge>
                      <Badge className={getStatusColor(pedido.status)}>
                        {pedido.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}
                      </div>
                      {pedido.data_conclusao && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Concluído em {new Date(pedido.data_conclusao).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(pedido)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pedido.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <strong className="text-sm font-medium">Pedido:</strong>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{pedido.pedido}</p>
                  </div>
                  {pedido.testemunho && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <strong className="text-sm font-medium text-green-800">Testemunho/Resposta:</strong>
                      <p className="text-green-700 mt-1 whitespace-pre-wrap">{pedido.testemunho}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pedidos.length === 0 && (
          <Card className="border-0 shadow-card text-center py-12">
            <CardContent>
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum pedido de oração encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece registrando pedidos de oração para você e seus discípulos.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Pedido
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}