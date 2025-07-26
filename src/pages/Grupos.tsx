import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Users, MapPin, Clock, Home } from 'lucide-react';
import { toast } from 'sonner';

interface HouseGroup {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  dia_semana: number;
  horario: string;
  lider_id: string;
  maximo_membros: number;
  ativo: boolean;
  observacoes: string;
  created_at: string;
  _member_count?: number;
}

interface GroupMember {
  id: string;
  group_id: string;
  member_id: string;
  data_ingresso: string;
  ativo: boolean;
  funcao: string;
  discipulo?: {
    nome: string;
    contato: string;
  };
}

const diasSemana = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export default function Grupos() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<HouseGroup[]>([]);
  const [members, setMembers] = useState<{ [key: string]: GroupMember[] }>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<HouseGroup | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    dia_semana: 0,
    horario: '19:00',
    maximo_membros: 15,
    observacoes: ''
  });

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      const { data: groupsData, error } = await supabase
        .from('house_groups')
        .select('*')
        .eq('lider_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (groupsData) {
        setGroups(groupsData);
        
        // Load member count for each group
        for (const group of groupsData) {
          await loadGroupMembers(group.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      toast.error('Erro ao carregar grupos familiares');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('ativo', true);

      if (error) throw error;

      // Get disciple names separately
      const membersWithNames = [];
      if (data) {
        for (const member of data) {
          const { data: discipuloData } = await supabase
            .from('discipulos')
            .select('nome, contato')
            .eq('id', member.member_id)
            .single();
          
          membersWithNames.push({
            ...member,
            discipulo: discipuloData || { nome: 'Nome não encontrado', contato: '' }
          });
        }
      }

      setMembers(prev => ({
        ...prev,
        [groupId]: membersWithNames
      }));
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const groupData = {
        ...formData,
        lider_id: user?.id
      };

      if (editingGroup) {
        const { error } = await supabase
          .from('house_groups')
          .update(groupData)
          .eq('id', editingGroup.id);

        if (error) throw error;
        toast.success('Grupo familiar atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('house_groups')
          .insert([groupData]);

        if (error) throw error;
        toast.success('Grupo familiar criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadGroups();
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      toast.error('Erro ao salvar grupo familiar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo familiar?')) return;

    try {
      const { error } = await supabase
        .from('house_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Grupo familiar excluído com sucesso!');
      loadGroups();
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      toast.error('Erro ao excluir grupo familiar');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      dia_semana: 0,
      horario: '19:00',
      maximo_membros: 15,
      observacoes: ''
    });
    setEditingGroup(null);
  };

  const openEditDialog = (group: HouseGroup) => {
    setFormData({
      nome: group.nome,
      endereco: group.endereco,
      cidade: group.cidade || '',
      estado: group.estado || '',
      cep: group.cep || '',
      dia_semana: group.dia_semana,
      horario: group.horario,
      maximo_membros: group.maximo_membros,
      observacoes: group.observacoes || ''
    });
    setEditingGroup(group);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grupos Familiares</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus grupos de "Igreja no Lar"
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Home className="mr-2 h-4 w-4" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Editar Grupo Familiar' : 'Novo Grupo Familiar'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações do grupo de "Igreja no Lar"
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Grupo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Grupo Jerusalém"
                  required
                />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço da Reunião</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({...formData, cep: e.target.value})}
                  placeholder="00000-000"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dia_semana">Dia da Semana</Label>
                  <Select 
                    value={formData.dia_semana.toString()} 
                    onValueChange={(value) => setFormData({...formData, dia_semana: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {diasSemana.map((dia, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {dia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="horario">Horário</Label>
                  <Input
                    id="horario"
                    type="time"
                    value={formData.horario}
                    onChange={(e) => setFormData({...formData, horario: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maximo_membros">Máximo de Membros</Label>
                <Input
                  id="maximo_membros"
                  type="number"
                  min="5"
                  max="30"
                  value={formData.maximo_membros}
                  onChange={(e) => setFormData({...formData, maximo_membros: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Informações adicionais sobre o grupo"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingGroup ? 'Atualizar' : 'Criar'} Grupo
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo familiar criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando seu primeiro grupo de "Igreja no Lar"
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Home className="mr-2 h-4 w-4" />
              Criar Primeiro Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{group.nome}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {group.cidade && group.estado ? `${group.cidade}, ${group.estado}` : 'Localização não informada'}
                    </CardDescription>
                  </div>
                  <Badge variant={group.ativo ? "default" : "secondary"}>
                    {group.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span>{diasSemana[group.dia_semana]}s às {group.horario}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span>
                      {members[group.id]?.length || 0} / {group.maximo_membros} membros
                    </span>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-3 w-3 mr-2 text-muted-foreground mt-0.5" />
                    <span className="text-xs text-muted-foreground">
                      {group.endereco}
                    </span>
                  </div>

                  {group.observacoes && (
                    <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                      {group.observacoes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(group)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(group.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}