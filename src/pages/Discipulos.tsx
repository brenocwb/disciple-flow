import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, Phone, Mail, Calendar, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Discipulo {
  id: string;
  nome: string;
  contato: string;
  data_inicio_discipulado: string;
  maturidade_espiritual: string;
  dons_talentos: string;
  dificuldades_areas_crescimento: string;
  status: string;
  last_contact_at: string;
  created_at: string;
}

export default function Discipulos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscipulo, setEditingDiscipulo] = useState<Discipulo | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    contato: '',
    data_inicio_discipulado: '',
    maturidade_espiritual: 'Iniciante',
    dons_talentos: '',
    dificuldades_areas_crescimento: '',
    status: 'Ativo'
  });

  useEffect(() => {
    if (user) {
      loadDiscipulos();
    }
  }, [user]);

  const loadDiscipulos = async () => {
    try {
      const { data, error } = await supabase
        .from('discipulos')
        .select('*')
        .eq('lider_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscipulos(data || []);
    } catch (error) {
      console.error('Erro ao carregar discípulos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar discípulos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDiscipulo) {
        const { error } = await supabase
          .from('discipulos')
          .update(formData)
          .eq('id', editingDiscipulo.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Discípulo atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('discipulos')
          .insert([{ ...formData, lider_id: user!.id }]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Discípulo adicionado com sucesso!",
        });
      }
      
      resetForm();
      setDialogOpen(false);
      loadDiscipulos();
    } catch (error) {
      console.error('Erro ao salvar discípulo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar discípulo.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este discípulo?')) return;
    
    try {
      const { error } = await supabase
        .from('discipulos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Discípulo removido com sucesso!",
      });
      loadDiscipulos();
    } catch (error) {
      console.error('Erro ao deletar discípulo:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover discípulo.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      contato: '',
      data_inicio_discipulado: '',
      maturidade_espiritual: 'Iniciante',
      dons_talentos: '',
      dificuldades_areas_crescimento: '',
      status: 'Ativo'
    });
    setEditingDiscipulo(null);
  };

  const openEditDialog = (discipulo: Discipulo) => {
    setEditingDiscipulo(discipulo);
    setFormData({
      nome: discipulo.nome,
      contato: discipulo.contato || '',
      data_inicio_discipulado: discipulo.data_inicio_discipulado || '',
      maturidade_espiritual: discipulo.maturidade_espiritual,
      dons_talentos: discipulo.dons_talentos || '',
      dificuldades_areas_crescimento: discipulo.dificuldades_areas_crescimento || '',
      status: discipulo.status
    });
    setDialogOpen(true);
  };

  const getMaturidadeColor = (maturidade: string) => {
    switch (maturidade) {
      case 'Iniciante': return 'bg-yellow-100 text-yellow-800';
      case 'Intermediário': return 'bg-blue-100 text-blue-800';
      case 'Multiplicador': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800';
      case 'Inativo': return 'bg-red-100 text-red-800';
      case 'Concluído': return 'bg-blue-100 text-blue-800';
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
              Gestão de Discípulos
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o crescimento espiritual dos seus discípulos
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Discípulo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDiscipulo ? 'Editar Discípulo' : 'Novo Discípulo'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contato">Contato</Label>
                    <Input
                      id="contato"
                      value={formData.contato}
                      onChange={(e) => setFormData({...formData, contato: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_inicio">Data de Início</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={formData.data_inicio_discipulado}
                      onChange={(e) => setFormData({...formData, data_inicio_discipulado: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maturidade">Maturidade Espiritual</Label>
                    <Select
                      value={formData.maturidade_espiritual}
                      onValueChange={(value) => setFormData({...formData, maturidade_espiritual: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Iniciante">Iniciante</SelectItem>
                        <SelectItem value="Intermediário">Intermediário</SelectItem>
                        <SelectItem value="Multiplicador">Multiplicador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="dons">Dons e Talentos</Label>
                  <Textarea
                    id="dons"
                    value={formData.dons_talentos}
                    onChange={(e) => setFormData({...formData, dons_talentos: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="dificuldades">Dificuldades/Áreas de Crescimento</Label>
                  <Textarea
                    id="dificuldades"
                    value={formData.dificuldades_areas_crescimento}
                    onChange={(e) => setFormData({...formData, dificuldades_areas_crescimento: e.target.value})}
                  />
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
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingDiscipulo ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discipulos.map((discipulo) => (
            <Card key={discipulo.id} className="border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{discipulo.nome}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getMaturidadeColor(discipulo.maturidade_espiritual)}>
                        {discipulo.maturidade_espiritual}
                      </Badge>
                      <Badge className={getStatusColor(discipulo.status)}>
                        {discipulo.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(discipulo)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(discipulo.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {discipulo.contato && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {discipulo.contato}
                    </div>
                  )}
                  {discipulo.data_inicio_discipulado && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Início: {new Date(discipulo.data_inicio_discipulado).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {discipulo.dons_talentos && (
                    <div className="text-sm">
                      <strong>Dons/Talentos:</strong>
                      <p className="text-muted-foreground mt-1">{discipulo.dons_talentos}</p>
                    </div>
                  )}
                  {discipulo.dificuldades_areas_crescimento && (
                    <div className="text-sm">
                      <strong>Áreas de Crescimento:</strong>
                      <p className="text-muted-foreground mt-1">{discipulo.dificuldades_areas_crescimento}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {discipulos.length === 0 && (
          <Card className="border-0 shadow-card text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum discípulo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando seus primeiros discípulos para acompanhar o crescimento espiritual deles.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Discípulo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}