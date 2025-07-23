-- Criação da tabela users_profiles para informações adicionais dos usuários
CREATE TABLE public.users_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo_lider TEXT NOT NULL DEFAULT 'Discipulador',
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Criação da tabela discipulos
CREATE TABLE public.discipulos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  contato TEXT,
  data_inicio_discipulado DATE,
  maturidade_espiritual TEXT NOT NULL DEFAULT 'Iniciante',
  dons_talentos TEXT,
  dificuldades_areas_crescimento TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  last_contact_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criação da tabela encontros
CREATE TABLE public.encontros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulo_id UUID NOT NULL REFERENCES public.discipulos(id) ON DELETE CASCADE,
  lider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_encontro TIMESTAMP WITH TIME ZONE NOT NULL,
  topico TEXT,
  notas_discussao TEXT,
  proximos_passos TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criação da tabela pedidos_oracao
CREATE TABLE public.pedidos_oracao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulo_id UUID REFERENCES public.discipulos(id) ON DELETE CASCADE,
  lider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pedido TEXT NOT NULL,
  categoria TEXT,
  urgencia TEXT NOT NULL DEFAULT 'Média',
  status TEXT NOT NULL DEFAULT 'Em Oração',
  data_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_conclusao TIMESTAMP WITH TIME ZONE,
  testemunho TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_oracao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users_profiles
CREATE POLICY "Users can view their own profile" 
ON public.users_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.users_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.users_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas RLS para discipulos
CREATE POLICY "Leaders can view their own disciples" 
ON public.discipulos 
FOR SELECT 
USING (auth.uid() = lider_id);

CREATE POLICY "Leaders can create disciples" 
ON public.discipulos 
FOR INSERT 
WITH CHECK (auth.uid() = lider_id);

CREATE POLICY "Leaders can update their own disciples" 
ON public.discipulos 
FOR UPDATE 
USING (auth.uid() = lider_id);

CREATE POLICY "Leaders can delete their own disciples" 
ON public.discipulos 
FOR DELETE 
USING (auth.uid() = lider_id);

-- Políticas RLS para encontros
CREATE POLICY "Leaders can view their own meetings" 
ON public.encontros 
FOR SELECT 
USING (auth.uid() = lider_id);

CREATE POLICY "Leaders can create meetings" 
ON public.encontros 
FOR INSERT 
WITH CHECK (auth.uid() = lider_id);

CREATE POLICY "Leaders can update their own meetings" 
ON public.encontros 
FOR UPDATE 
USING (auth.uid() = lider_id);

CREATE POLICY "Leaders can delete their own meetings" 
ON public.encontros 
FOR DELETE 
USING (auth.uid() = lider_id);

-- Políticas RLS para pedidos_oracao
CREATE POLICY "Leaders can view their own prayer requests" 
ON public.pedidos_oracao 
FOR SELECT 
USING (auth.uid() = lider_id);

CREATE POLICY "Leaders can create prayer requests" 
ON public.pedidos_oracao 
FOR INSERT 
WITH CHECK (auth.uid() = lider_id);

CREATE POLICY "Leaders can update their own prayer requests" 
ON public.pedidos_oracao 
FOR UPDATE 
USING (auth.uid() = lider_id);

CREATE POLICY "Leaders can delete their own prayer requests" 
ON public.pedidos_oracao 
FOR DELETE 
USING (auth.uid() = lider_id);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática de timestamps
CREATE TRIGGER update_users_profiles_updated_at
  BEFORE UPDATE ON public.users_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discipulos_updated_at
  BEFORE UPDATE ON public.discipulos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_oracao_updated_at
  BEFORE UPDATE ON public.pedidos_oracao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profiles (user_id, nome, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();