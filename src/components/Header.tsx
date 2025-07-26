import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = user ? [
    { name: "Dashboard", href: "/" },
    { name: "Discípulos", href: "/discipulos" },
    { name: "Grupos", href: "/grupos" },
    { name: "Reuniões", href: "/reunioes" },
    { name: "Encontros", href: "/encontros" },
    { name: "Oração", href: "/oracao" },
    { name: "Planos", href: "/planos" },
    { name: "Alertas", href: "/alertas" },
    { name: "Mapa", href: "/mapa" }
  ] : [
    { name: "Funcionalidades", href: "#features" },
    { name: "Benefícios", href: "#benefits" },
    { name: "Preços", href: "#pricing" },
    { name: "Contato", href: "#contact" }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">Pastor Digital</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  if (user && !item.href.startsWith('#')) {
                    e.preventDefault();
                    window.location.href = item.href;
                  }
                }}
              >
                {item.name}
              </a>
            ))}
          </nav>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Olá, {user.email}
                </span>
                <Button variant="outline" onClick={signOut}>
                  Sair
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={() => window.location.href = '/auth'}>Entrar</Button>
                <Button variant="default" onClick={() => window.location.href = '/auth'}>Começar Grátis</Button>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-border">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block text-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  if (user && !item.href.startsWith('#')) {
                    e.preventDefault();
                    window.location.href = item.href;
                  }
                }}
              >
                {item.name}
              </a>
            ))}
            <div className="flex flex-col space-y-2 pt-4">
              {user ? (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground block">
                    Olá, {user.email}
                  </span>
                  <Button variant="outline" className="w-full" onClick={signOut}>
                    Sair
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" onClick={() => window.location.href = '/auth'}>Entrar</Button>
                  <Button variant="default" className="w-full" onClick={() => window.location.href = '/auth'}>Começar Grátis</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};