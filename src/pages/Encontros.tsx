import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, Trash2, Users, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Encontro {
  id: string;
  discipulo_id: string;
  data_encontro: string;
  topico: string;
  notas_discussao: string;
  proximos_passos: string;
  created_at: string;
  discipulo?: {
    nome: string;
  };
}

interface Discipulo {
  id: string;
  nome: string;
}

export default function Encontros() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [encontros, setEncontros] = useState<Encontro[]>([]);
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEncontro, setEditingEncontro] = useState<Encontro | null>(null);
  const [formData, setFormData] = useState({
    discipulo_id: '',
    data_encontro: '',
    topico: '',
    notas_discussao: '',
    proximos_passos: ''
  });

  useEffect(() => {
    if (user) {
      loadEncontros();
      loadDiscipulos();
    }
  }, [user]);

  const loadEncontros = async () => {
    try {
      const { data, error } = await supabase
        .from('encontros')
        .select(`
          *,
          discipulos!inner(nome)
        `)
        .eq('lider_id', user!.id)
        .order('data_encontro', { ascending: false });

      if (error) throw error;
      
      const encontrosFormatted = data?.map(encontro => ({
        ...encontro,
        discipulo: { nome: encontro.discipulos.nome }
      })) || [];
      
      setEncontros(encontrosFormatted);
    } catch (error) {
      console.error('Erro ao carregar encontros:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar encontros.",
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
      if (editingEncontro) {
        const { error } = await supabase
          .from('encontros')
          .update(formData)
          .eq('id', editingEncontro.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Encontro atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('encontros')
          .insert([{ ...formData, lider_id: user!.id }]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Encontro registrado com sucesso!",
        });
      }
      
      resetForm();
      setDialogOpen(false);
      loadEncontros();
    } catch (error) {
      console.error('Erro ao salvar encontro:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar encontro.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este encontro?')) return;
    
    try {
      const { error } = await supabase
        .from('encontros')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Encontro removido com sucesso!",
      });
      loadEncontros();
    } catch (error) {
      console.error('Erro ao deletar encontro:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover encontro.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      discipulo_id: '',
      data_encontro: '',
      topico: '',
      notas_discussao: '',
      proximos_passos: ''
    });
    setEditingEncontro(null);
  };

  const openEditDialog = (encontro: Encontro) => {
    setEditingEncontro(encontro);
    setFormData({
      discipulo_id: encontro.discipulo_id,
      data_encontro: encontro.data_encontro.split('T')[0],
      topico: encontro.topico || '',
      notas_discussao: encontro.notas_discussao || '',
      proximos_passos: encontro.proximos_passos || ''
    });
    setDialogOpen(true);
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
              Registro de Encontros
            </h1>
            <p className="text-muted-foreground">
              Documente reuniões e momentos importantes do discipulado
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Encontro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEncontro ? 'Editar Encontro' : 'Novo Encontro'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discipulo">Discípulo *</Label>
                    <Select
                      value={formData.discipulo_id}
                      onValueChange={(value) => setFormData({...formData, discipulo_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um discípulo" />
                      </SelectTrigger>
                      <SelectContent>
                        {discipulos.map((discipulo) => (
                          <SelectItem key={discipulo.id} value={discipulo.id}>
                            {discipulo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="data_encontro">Data do Encontro *</Label>
                    <Input
                      id="data_encontro"
                      type="datetime-local"
                      value={formData.data_encontro}
                      onChange={(e) => setFormData({...formData, data_encontro: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="topico">Tópico/Tema</Label>
                  <Input
                    id="topico"
                    value={formData.topico}
                    onChange={(e) => setFormData({...formData, topico: e.target.value})}
                    placeholder="Ex: Oração, Estudo Bíblico, Aconselhamento..."
                  />
                </div>

                <div>
                  <Label htmlFor="notas">Notas da Discussão</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas_discussao}
                    onChange={(e) => setFormData({...formData, notas_discussao: e.target.value})}
                    placeholder="Principais pontos discutidos, perguntas feitas, insights compartilhados..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="proximos_passos">Próximos Passos</Label>
                  <Textarea
                    id="proximos_passos"
                    value={formData.proximos_passos}
                    onChange={(e) => setFormData({...formData, proximos_passos: e.target.value})}
                    placeholder="Tarefas, leituras, ações a serem tomadas até o próximo encontro..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingEncontro ? 'Atualizar' : 'Registrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {encontros.map((encontro) => (
            <Card key={encontro.id} className="border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {encontro.discipulo?.nome}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(encontro.data_encontro).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(encontro.data_encontro).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(encontro)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(encontro.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {encontro.topico && (
                    <div>
                      <strong className="text-sm font-medium">Tópico:</strong>
                      <p className="text-muted-foreground mt-1">{encontro.topico}</p>
                    </div>
                  )}
                  {encontro.notas_discussao && (
                    <div>
                      <strong className="text-sm font-medium">Notas da Discussão:</strong>
                      <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{encontro.notas_discussao}</p>
                    </div>
                  )}
                  {encontro.proximos_passos && (
                    <div>
                      <strong className="text-sm font-medium">Próximos Passos:</strong>
                      <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{encontro.proximos_passos}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {encontros.length === 0 && (
          <Card className="border-0 shadow-card text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum encontro registrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece documentando seus encontros de discipulado para acompanhar o progresso dos seus discípulos.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primeiro Encontro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}