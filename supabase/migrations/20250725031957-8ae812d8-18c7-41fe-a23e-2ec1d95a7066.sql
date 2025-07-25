-- Tabela para Planos de Discipulado
CREATE TABLE public.planos_discipulado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lider_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  duracao_estimada_dias INTEGER,
  nivel_maturidade TEXT NOT NULL DEFAULT 'Iniciante',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Etapas dos Planos
CREATE TABLE public.etapas_plano (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  duracao_estimada_dias INTEGER,
  recursos_necessarios TEXT,
  versiculos_chave TEXT,
  atividades_sugeridas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Progresso dos Discípulos
CREATE TABLE public.progresso_discipulo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulo_id UUID NOT NULL,
  plano_id UUID NOT NULL,
  etapa_id UUID NOT NULL,
  lider_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em Andamento',
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Alertas/Notificações
CREATE TABLE public.alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lider_id UUID NOT NULL,
  discipulo_id UUID,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  data_alerta TIMESTAMP WITH TIME ZONE NOT NULL,
  lido BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos de localização na tabela discipulos
ALTER TABLE public.discipulos 
ADD COLUMN endereco TEXT,
ADD COLUMN cidade TEXT,
ADD COLUMN estado TEXT,
ADD COLUMN cep TEXT,
ADD COLUMN latitude DECIMAL(10,8),
ADD COLUMN longitude DECIMAL(11,8),
ADD COLUMN grupo_celula TEXT;

-- Enable RLS em todas as novas tabelas
ALTER TABLE public.planos_discipulado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_discipulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

-- RLS Policies para planos_discipulado
CREATE POLICY "Leaders can manage their own discipleship plans" 
ON public.planos_discipulado 
FOR ALL 
USING (auth.uid() = lider_id)
WITH CHECK (auth.uid() = lider_id);

-- RLS Policies para etapas_plano
CREATE POLICY "Leaders can manage stages of their plans" 
ON public.etapas_plano 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.planos_discipulado 
  WHERE id = etapas_plano.plano_id AND lider_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.planos_discipulado 
  WHERE id = etapas_plano.plano_id AND lider_id = auth.uid()
));

-- RLS Policies para progresso_discipulo
CREATE POLICY "Leaders can manage their disciples progress" 
ON public.progresso_discipulo 
FOR ALL 
USING (auth.uid() = lider_id)
WITH CHECK (auth.uid() = lider_id);

-- RLS Policies para alertas
CREATE POLICY "Leaders can manage their own alerts" 
ON public.alertas 
FOR ALL 
USING (auth.uid() = lider_id)
WITH CHECK (auth.uid() = lider_id);

-- Triggers para updated_at
CREATE TRIGGER update_planos_discipulado_updated_at
BEFORE UPDATE ON public.planos_discipulado
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_progresso_discipulo_updated_at
BEFORE UPDATE ON public.progresso_discipulo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar foreign keys
ALTER TABLE public.etapas_plano
ADD CONSTRAINT fk_etapas_plano_plano_id 
FOREIGN KEY (plano_id) REFERENCES public.planos_discipulado(id) ON DELETE CASCADE;

ALTER TABLE public.progresso_discipulo
ADD CONSTRAINT fk_progresso_plano_id 
FOREIGN KEY (plano_id) REFERENCES public.planos_discipulado(id) ON DELETE CASCADE;

ALTER TABLE public.progresso_discipulo
ADD CONSTRAINT fk_progresso_etapa_id 
FOREIGN KEY (etapa_id) REFERENCES public.etapas_plano(id) ON DELETE CASCADE;

ALTER TABLE public.progresso_discipulo
ADD CONSTRAINT fk_progresso_discipulo_id 
FOREIGN KEY (discipulo_id) REFERENCES public.discipulos(id) ON DELETE CASCADE;