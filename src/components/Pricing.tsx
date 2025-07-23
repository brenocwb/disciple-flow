import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para começar seu ministério digital",
    features: [
      "Até 10 discípulos",
      "Funcionalidades básicas",
      "Registro de encontros",
      "Pedidos de oração simples",
      "Suporte por email"
    ],
    buttonText: "Começar Grátis",
    buttonVariant: "outline",
    popular: false
  },
  {
    name: "Premium",
    price: "R$ 19,90",
    period: "/mês",
    description: "Para líderes que querem crescer e impactar mais",
    features: [
      "Discípulos ilimitados",
      "Recursos avançados completos",
      "Relatórios detalhados",
      "Integrações com apps cristãos",
      "Biblioteca de recursos premium",
      "Backup automático",
      "Suporte prioritário"
    ],
    buttonText: "Escolher Premium",
    buttonVariant: "hero",
    popular: true
  },
  {
    name: "Institucional",
    price: "Sob consulta",
    period: "",
    description: "Solução completa para igrejas e organizações",
    features: [
      "Licenças ilimitadas",
      "Configuração personalizada",
      "Treinamento da equipe",
      "Integração com sistemas existentes",
      "Suporte técnico dedicado",
      "Relatórios institucionais",
      "Consultorias especializadas"
    ],
    buttonText: "Falar com Vendas",
    buttonVariant: "default",
    popular: false
  }
];

export const Pricing = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Planos que Crescem com Você
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano ideal para sua jornada de discipulado digital. Comece grátis e evolua conforme sua necessidade.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative overflow-hidden border-0 shadow-card hover:shadow-hero transition-smooth ${plan.popular ? 'ring-2 ring-primary scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button 
                  variant={plan.buttonVariant as any}
                  className="w-full mb-6"
                  size="lg"
                >
                  {plan.buttonText}
                </Button>
                
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Todos os planos incluem 30 dias de teste grátis. Sem compromisso, cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
};