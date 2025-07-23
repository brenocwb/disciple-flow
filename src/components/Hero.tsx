import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative bg-hero-gradient overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Pastor Digital
            </h1>
            <h2 className="text-xl lg:text-2xl text-white/90 mb-8 font-light">
              Gerenciador de Discipulado do Século XXI
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              A plataforma que capacita líderes cristãos a pastorear discípulos de forma mais 
              intencional, organizada e próxima. Use a tecnologia para aproximar pessoas de Jesus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="group">
                Começar Agora
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Play className="w-5 h-5" />
                Ver Demonstração
              </Button>
            </div>
          </div>
          <div className="relative">
            <img 
              src={heroImage} 
              alt="Pastor Digital - Discipulado Moderno"
              className="rounded-2xl shadow-hero w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};