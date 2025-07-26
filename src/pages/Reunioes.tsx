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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, FileText, CheckSquare, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HouseGroup {
  id: string;
  nome: string;
}

interface GroupMeeting {
  id: string;
  group_id: string;
  data_reuniao: string;
  tema_estudo: string;
  versiculo_base: string;
  anotacoes_reuniao: string;
  total_presentes: number;
  total_visitantes: number;
  decisoes_fe: number;
  observacoes: string;
  house_group?: {
    nome: string;
  };
}

interface GroupMember {
  id: string;
  member_id: string;
  funcao: string;
  discipulo: {
    id: string;
    nome: string;
  };
}

interface MeetingAttendance {
  id: string;
  meeting_id: string;
  member_id: string;
  presente: boolean;
  visitante: boolean;
  motivo_ausencia: string;
}

export default function Reunioes() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<HouseGroup[]>([]);
  const [meetings, setMeetings] = useState<GroupMeeting[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: MeetingAttendance[] }>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<GroupMeeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<GroupMeeting | null>(null);
  const [formData, setFormData] = useState({
    group_id: '',
    data_reuniao: new Date().toISOString().split('T')[0],
    tema_estudo: '',
    versiculo_base: '',
    anotacoes_reuniao: '',
    total_visitantes: 0,
    decisoes_fe: 0,
    observacoes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('house_groups')
        .select('id, nome')
        .eq('lider_id', user?.id)
        .eq('ativo', true);

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Load meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('group_meetings')
        .select(`
          *,
          house_group:house_groups(nome)
        `)
        .eq('lider_id', user?.id)
        .order('data_reuniao', { ascending: false });

      if (meetingsError) throw meetingsError;
      setMeetings(meetingsData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados das reuniões');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('id, member_id, funcao')
        .eq('group_id', groupId)
        .eq('ativo', true);

      if (error) throw error;

      // Get disciple names separately
      const membersWithNames = [];
      if (data) {
        for (const member of data) {
          const { data: discipuloData } = await supabase
            .from('discipulos')
            .select('id, nome')
            .eq('id', member.member_id)
            .single();
          
          membersWithNames.push({
            ...member,
            discipulo: discipuloData || { id: '', nome: 'Nome não encontrado' }
          });
        }
      }

      setMembers(membersWithNames);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  const loadMeetingAttendance = async (meetingId: string) => {
    try {
      const { data, error } = await supabase
        .from('meeting_attendance')
        .select('*')
        .eq('meeting_id', meetingId);

      if (error) throw error;

      setAttendance(prev => ({
        ...prev,
        [meetingId]: data || []
      }));
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const meetingData = {
        ...formData,
        lider_id: user?.id,
        total_presentes: 0 // Will be updated when attendance is recorded
      };

      if (editingMeeting) {
        const { error } = await supabase
          .from('group_meetings')
          .update(meetingData)
          .eq('id', editingMeeting.id);

        if (error) throw error;
        toast.success('Reunião atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('group_meetings')
          .insert([meetingData]);

        if (error) throw error;
        toast.success('Reunião criada com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar reunião:', error);
      toast.error('Erro ao salvar reunião');
    }
  };

  const openAttendanceDialog = async (meeting: GroupMeeting) => {
    setSelectedMeeting(meeting);
    await loadGroupMembers(meeting.group_id);
    await loadMeetingAttendance(meeting.id);
    setIsAttendanceDialogOpen(true);
  };

  const handleAttendanceChange = async (memberId: string, presente: boolean) => {
    if (!selectedMeeting) return;

    try {
      const existingAttendance = attendance[selectedMeeting.id]?.find(
        a => a.member_id === memberId
      );

      if (existingAttendance) {
        const { error } = await supabase
          .from('meeting_attendance')
          .update({ presente, visitante: false })
          .eq('id', existingAttendance.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meeting_attendance')
          .insert([{
            meeting_id: selectedMeeting.id,
            member_id: memberId,
            presente,
            visitante: false
          }]);

        if (error) throw error;
      }

      // Reload attendance and update total_presentes
      await loadMeetingAttendance(selectedMeeting.id);
      await updateMeetingTotals(selectedMeeting.id);
      
    } catch (error) {
      console.error('Erro ao salvar presença:', error);
      toast.error('Erro ao salvar presença');
    }
  };

  const updateMeetingTotals = async (meetingId: string) => {
    try {
      const { data: attendanceData, error } = await supabase
        .from('meeting_attendance')
        .select('presente')
        .eq('meeting_id', meetingId);

      if (error) throw error;

      const totalPresentes = attendanceData?.filter(a => a.presente).length || 0;

      await supabase
        .from('group_meetings')
        .update({ total_presentes: totalPresentes })
        .eq('id', meetingId);

      loadData();
    } catch (error) {
      console.error('Erro ao atualizar totais:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta reunião?')) return;

    try {
      const { error } = await supabase
        .from('group_meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Reunião excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir reunião:', error);
      toast.error('Erro ao excluir reunião');
    }
  };

  const resetForm = () => {
    setFormData({
      group_id: '',
      data_reuniao: new Date().toISOString().split('T')[0],
      tema_estudo: '',
      versiculo_base: '',
      anotacoes_reuniao: '',
      total_visitantes: 0,
      decisoes_fe: 0,
      observacoes: ''
    });
    setEditingMeeting(null);
  };

  const openEditDialog = (meeting: GroupMeeting) => {
    setFormData({
      group_id: meeting.group_id,
      data_reuniao: meeting.data_reuniao,
      tema_estudo: meeting.tema_estudo || '',
      versiculo_base: meeting.versiculo_base || '',
      anotacoes_reuniao: meeting.anotacoes_reuniao || '',
      total_visitantes: meeting.total_visitantes,
      decisoes_fe: meeting.decisoes_fe,
      observacoes: meeting.observacoes || ''
    });
    setEditingMeeting(meeting);
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
          <h1 className="text-3xl font-bold text-foreground">Reuniões de Grupos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie reuniões e presenças dos grupos familiares
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={groups.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Reunião
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMeeting ? 'Editar Reunião' : 'Nova Reunião'}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes da reunião do grupo familiar
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="group_id">Grupo Familiar</Label>
                <Select 
                  value={formData.group_id} 
                  onValueChange={(value) => setFormData({...formData, group_id: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data_reuniao">Data da Reunião</Label>
                <Input
                  id="data_reuniao"
                  type="date"
                  value={formData.data_reuniao}
                  onChange={(e) => setFormData({...formData, data_reuniao: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tema_estudo">Tema do Estudo</Label>
                <Input
                  id="tema_estudo"
                  value={formData.tema_estudo}
                  onChange={(e) => setFormData({...formData, tema_estudo: e.target.value})}
                  placeholder="Ex: O Amor de Deus"
                />
              </div>

              <div>
                <Label htmlFor="versiculo_base">Versículo Base</Label>
                <Input
                  id="versiculo_base"
                  value={formData.versiculo_base}
                  onChange={(e) => setFormData({...formData, versiculo_base: e.target.value})}
                  placeholder="Ex: João 3:16"
                />
              </div>

              <div>
                <Label htmlFor="anotacoes_reuniao">Anotações da Reunião</Label>
                <Textarea
                  id="anotacoes_reuniao"
                  value={formData.anotacoes_reuniao}
                  onChange={(e) => setFormData({...formData, anotacoes_reuniao: e.target.value})}
                  placeholder="Principais pontos discutidos"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="total_visitantes">Visitantes</Label>
                  <Input
                    id="total_visitantes"
                    type="number"
                    min="0"
                    value={formData.total_visitantes}
                    onChange={(e) => setFormData({...formData, total_visitantes: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="decisoes_fe">Decisões de Fé</Label>
                  <Input
                    id="decisoes_fe"
                    type="number"
                    min="0"
                    value={formData.decisoes_fe}
                    onChange={(e) => setFormData({...formData, decisoes_fe: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações adicionais"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingMeeting ? 'Atualizar' : 'Criar'} Reunião
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
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo familiar encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Você precisa criar pelo menos um grupo familiar antes de agendar reuniões
            </p>
            <Button asChild>
              <a href="/grupos">Criar Grupo Familiar</a>
            </Button>
          </CardContent>
        </Card>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma reunião registrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece registrando a primeira reunião do seu grupo familiar
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Primeira Reunião
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {meeting.house_group?.nome}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(meeting.data_reuniao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAttendanceDialog(meeting)}
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Presença
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(meeting)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(meeting.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    {meeting.tema_estudo && (
                      <div>
                        <h4 className="font-medium text-sm">Tema do Estudo</h4>
                        <p className="text-sm text-muted-foreground">{meeting.tema_estudo}</p>
                      </div>
                    )}
                    {meeting.versiculo_base && (
                      <div className="mt-2">
                        <h4 className="font-medium text-sm">Versículo Base</h4>
                        <p className="text-sm text-muted-foreground">{meeting.versiculo_base}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{meeting.total_presentes} presentes</span>
                      </div>
                      {meeting.total_visitantes > 0 && (
                        <Badge variant="secondary">{meeting.total_visitantes} visitantes</Badge>
                      )}
                      {meeting.decisoes_fe > 0 && (
                        <Badge variant="default">{meeting.decisoes_fe} decisões</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {meeting.anotacoes_reuniao && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Anotações da Reunião</h4>
                      <p className="text-sm text-muted-foreground">{meeting.anotacoes_reuniao}</p>
                    </div>
                  </>
                )}

                {meeting.observacoes && (
                  <div className="mt-2">
                    <h4 className="font-medium text-sm mb-1">Observações</h4>
                    <p className="text-xs text-muted-foreground">{meeting.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Attendance Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lista de Presença</DialogTitle>
            <DialogDescription>
              {selectedMeeting?.house_group?.nome} - {selectedMeeting && format(new Date(selectedMeeting.data_reuniao), "dd/MM/yyyy")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {members.map((member) => {
              const memberAttendance = selectedMeeting && attendance[selectedMeeting.id]?.find(
                a => a.member_id === member.member_id
              );
              
              return (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={member.id}
                    checked={memberAttendance?.presente || false}
                    onCheckedChange={(checked) => 
                      handleAttendanceChange(member.member_id, checked as boolean)
                    }
                  />
                  <Label htmlFor={member.id} className="flex-1 cursor-pointer">
                    {member.discipulo.nome}
                    {member.funcao !== 'membro' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {member.funcao}
                      </Badge>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsAttendanceDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}