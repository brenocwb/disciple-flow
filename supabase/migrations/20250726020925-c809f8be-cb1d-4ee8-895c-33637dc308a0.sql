-- Create house_groups table for "Igreja no Lar"
CREATE TABLE public.house_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  igreja_id UUID, -- Para futuro multi-tenant
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Domingo, 6=Sábado
  horario TIME NOT NULL,
  lider_id UUID NOT NULL,
  maximo_membros INTEGER DEFAULT 15,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.house_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL, -- Referencia discipulos.id
  data_ingresso DATE NOT NULL DEFAULT CURRENT_DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  funcao TEXT DEFAULT 'membro', -- membro, vice-lider, intercessor, etc
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_id)
);

-- Create group_meetings table for attendance and weekly meetings
CREATE TABLE public.group_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.house_groups(id) ON DELETE CASCADE,
  data_reuniao DATE NOT NULL,
  tema_estudo TEXT,
  versiculo_base TEXT,
  anotacoes_reuniao TEXT,
  total_presentes INTEGER DEFAULT 0,
  total_visitantes INTEGER DEFAULT 0,
  decisoes_fe INTEGER DEFAULT 0,
  observacoes TEXT,
  lider_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table for individual presence tracking
CREATE TABLE public.meeting_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.group_meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL, -- Referencia discipulos.id
  presente BOOLEAN NOT NULL DEFAULT false,
  visitante BOOLEAN NOT NULL DEFAULT false,
  motivo_ausencia TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, member_id)
);

-- Enable RLS on all tables
ALTER TABLE public.house_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for house_groups
CREATE POLICY "Leaders can manage their own groups" 
ON public.house_groups 
FOR ALL 
USING (auth.uid() = lider_id)
WITH CHECK (auth.uid() = lider_id);

-- RLS Policies for group_members
CREATE POLICY "Group leaders can manage their group members" 
ON public.group_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.house_groups 
    WHERE id = group_members.group_id 
    AND lider_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.house_groups 
    WHERE id = group_members.group_id 
    AND lider_id = auth.uid()
  )
);

-- RLS Policies for group_meetings
CREATE POLICY "Group leaders can manage their group meetings" 
ON public.group_meetings 
FOR ALL 
USING (auth.uid() = lider_id)
WITH CHECK (auth.uid() = lider_id);

-- RLS Policies for meeting_attendance
CREATE POLICY "Leaders can manage attendance of their group meetings" 
ON public.meeting_attendance 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.group_meetings 
    WHERE id = meeting_attendance.meeting_id 
    AND lider_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_meetings 
    WHERE id = meeting_attendance.meeting_id 
    AND lider_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_house_groups_lider ON public.house_groups(lider_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_member ON public.group_members(member_id);
CREATE INDEX idx_group_meetings_group ON public.group_meetings(group_id);
CREATE INDEX idx_group_meetings_data ON public.group_meetings(data_reuniao);
CREATE INDEX idx_meeting_attendance_meeting ON public.meeting_attendance(meeting_id);
CREATE INDEX idx_meeting_attendance_member ON public.meeting_attendance(member_id);

-- Add triggers for updated_at
CREATE TRIGGER update_house_groups_updated_at
  BEFORE UPDATE ON public.house_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at
  BEFORE UPDATE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_meetings_updated_at
  BEFORE UPDATE ON public.group_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();