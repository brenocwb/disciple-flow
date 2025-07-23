import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Users2, Building } from "lucide-react";

const benefits = [
  {
    icon: Crown,
    title: "Para Líderes",
    description: "Pastoreio mais eficaz com acompanhamento próximo e personalizado",
    features: [
      "Organização centralizada de todas as informações",
      "Visão abrangente do crescimento espiritual",
      "Comunicação facilitada com lembretes automáticos",
      "Redução do estresse ministerial"
    ],
    color: "spiritual"
  },
  {
    icon: Users2,
    title: "Para Discípulos",
    description: "Crescimento espiritual acompanhado e recursos sempre acessíveis",
    features: [
      "Acompanhamento personalizado às necessidades",
      "Progresso visível e celebração de conquistas",
      "Recursos de estudo sempre disponíveis",
      "Comunidade fortalecida e conectada"
    ],
    color: "primary"
  },
  {
    icon: Building,
    title: "Para Igrejas",
    description: "Sistematização do discipulado e suporte à multiplicação",
    features: [
      "Identificação e desenvolvimento de novos líderes",
      "Processo organizado e replicável",
      "Métricas ministeriais para decisões estratégicas",
      "Foco no crescimento qualitativo genuíno"
    ],
    color: "default"
  }
];

export const Benefits = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Benefícios Transformadores
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Descubra como o Pastor Digital pode impactar positivamente sua comunidade de fé.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-card hover:shadow-hero transition-smooth group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {benefit.title}
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  {benefit.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {benefit.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground leading-relaxed">{feature}</p>
                  </div>
                ))}
                <div className="pt-4">
                  <Button 
                    variant={benefit.color as any} 
                    className="w-full"
                  >
                    Saiba Mais
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};