import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, Calendar, Heart, BarChart3, Shield } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestão Inteligente de Discípulos",
    description: "Cadastro detalhado, sistema de níveis e crescimento, acompanhamento personalizado de cada discípulo.",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    icon: MessageCircle,
    title: "Comunicação Integrada",
    description: "Chat individual e de grupo, lembretes inteligentes, biblioteca de recursos e calendário compartilhado.",
    gradient: "from-green-500 to-green-600"
  },
  {
    icon: Calendar,
    title: "Gestão de Reuniões",
    description: "Agenda inteligente, controle de presença, templates para diferentes tipos de encontro.",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    icon: Heart,
    title: "Centro de Oração",
    description: "Gestão centralizada de pedidos, categorização por urgência, acompanhamento de respostas.",
    gradient: "from-red-500 to-red-600"
  },
  {
    icon: BarChart3,
    title: "Análise e Relatórios",
    description: "Métricas de crescimento, relatórios automáticos, identificação de padrões e tendências.",
    gradient: "from-yellow-500 to-yellow-600"
  },
  {
    icon: Shield,
    title: "Segurança Robusta",
    description: "Dados criptografados, conformidade LGPD, funcionalidade offline-first com sincronização.",
    gradient: "from-indigo-500 to-indigo-600"
  }
];

export const Features = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Funcionalidades Principais
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Uma plataforma completa para revolucionar a forma como você conduz o discipulado no século XXI.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden hover:shadow-card transition-smooth group cursor-pointer border-0 shadow-card">
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};