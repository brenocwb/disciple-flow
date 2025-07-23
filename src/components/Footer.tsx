export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Pastor Digital</h3>
            <p className="text-background/80 mb-4 leading-relaxed">
              Capacitando líderes cristãos a pastorear discípulos de forma mais intencional, 
              organizada e próxima através da tecnologia.
            </p>
            <p className="text-background/60 text-sm">
              "Usar a tecnologia para aproximar pessoas de Jesus e equipar líderes para um pastoreio mais eficaz e amoroso."
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Segurança</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Roadmap</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Documentação</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Treinamentos</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Contato</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-8 pt-8 text-center">
          <p className="text-background/60">
            © 2024 Pastor Digital. Todos os direitos reservados. Feito com ❤️ para o Reino de Deus.
          </p>
        </div>
      </div>
    </footer>
  );
};