import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Users, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Discipulo {
  id: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  grupo_celula?: string;
  maturidade_espiritual: string;
  status: string;
}

export default function Mapa() {
  const { user } = useAuth();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroMaturidade, setFiltroMaturidade] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [grupos, setGrupos] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadDiscipulos();
    }
  }, [user]);

  useEffect(() => {
    if (mapboxToken && discipulos.length > 0) {
      initializeMap();
    }
  }, [mapboxToken, discipulos]);

  const loadDiscipulos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discipulos')
        .select('*')
        .eq('lider_id', user?.id)
        .order('nome');

      if (error) throw error;
      
      const discipulosData = data || [];
      setDiscipulos(discipulosData);
      
      // Extrair grupos únicos
      const gruposUnicos = [...new Set(discipulosData
        .map(d => d.grupo_celula)
        .filter(Boolean))] as string[];
      setGrupos(gruposUnicos);
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-46.6333, -23.5505], // São Paulo como centro padrão
      zoom: 10
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      addDiscipulosToMap();
    });
  };

  const addDiscipulosToMap = () => {
    if (!map.current) return;

    const discipulosFiltrados = getDiscipulosFiltrados();
    const discipulosComLocalizacao = discipulosFiltrados.filter(d => d.latitude && d.longitude);

    // Remover markers existentes
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    if (discipulosComLocalizacao.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum discípulo com localização encontrado. Adicione endereços para visualizar no mapa.",
        variant: "destructive"
      });
      return;
    }

    // Agrupar por coordenadas próximas (mesmo local)
    const grupos: { [key: string]: Discipulo[] } = {};
    discipulosComLocalizacao.forEach(discipulo => {
      const key = `${discipulo.latitude!.toFixed(4)}_${discipulo.longitude!.toFixed(4)}`;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(discipulo);
    });

    // Adicionar markers
    Object.values(grupos).forEach(grupoDiscipulos => {
      const discipulo = grupoDiscipulos[0];
      
      // Criar marker customizado
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.innerHTML = `
        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold border-2 border-white shadow-lg">
          ${grupoDiscipulos.length}
        </div>
      `;

      // Criar popup
      const popupContent = `
        <div class="p-3">
          <h3 class="font-semibold mb-2">
            ${grupoDiscipulos.length === 1 ? discipulo.nome : `${grupoDiscipulos.length} Discípulos`}
          </h3>
          ${grupoDiscipulos.map(d => `
            <div class="mb-2 text-sm">
              <div class="font-medium">${d.nome}</div>
              <div class="text-gray-600">${d.grupo_celula || 'Sem grupo'}</div>
              <div class="text-gray-500">${d.maturidade_espiritual}</div>
            </div>
          `).join('')}
          ${discipulo.endereco ? `<div class="text-xs text-gray-500 mt-2">${discipulo.endereco}</div>` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      new mapboxgl.Marker(markerEl)
        .setLngLat([discipulo.longitude!, discipulo.latitude!])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Ajustar o zoom para mostrar todos os markers
    if (discipulosComLocalizacao.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      discipulosComLocalizacao.forEach(d => {
        bounds.extend([d.longitude!, d.latitude!]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  const getDiscipulosFiltrados = () => {
    return discipulos.filter(discipulo => {
      const matchesSearch = discipulo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (discipulo.endereco && discipulo.endereco.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesGrupo = !filtroGrupo || discipulo.grupo_celula === filtroGrupo;
      const matchesMaturidade = !filtroMaturidade || discipulo.maturidade_espiritual === filtroMaturidade;
      
      return matchesSearch && matchesGrupo && matchesMaturidade;
    });
  };

  const geocodificarEnderecos = async () => {
    if (!mapboxToken) {
      toast({
        title: "Erro",
        description: "Token do Mapbox necessário para geocodificar endereços",
        variant: "destructive"
      });
      return;
    }

    const discipulosSemCoordenadas = discipulos.filter(d => 
      (d.endereco || d.cidade) && (!d.latitude || !d.longitude)
    );

    if (discipulosSemCoordenadas.length === 0) {
      toast({
        title: "Info",
        description: "Todos os discípulos com endereço já possuem coordenadas",
      });
      return;
    }

    toast({
      title: "Geocodificando...",
      description: `Processando ${discipulosSemCoordenadas.length} endereços`
    });

    for (const discipulo of discipulosSemCoordenadas) {
      try {
        const endereco = `${discipulo.endereco || ''} ${discipulo.cidade || ''} ${discipulo.estado || ''}`.trim();
        
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(endereco)}.json?access_token=${mapboxToken}&country=BR`
        );
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const [longitude, latitude] = data.features[0].center;
          
          const { error } = await supabase
            .from('discipulos')
            .update({ latitude, longitude })
            .eq('id', discipulo.id);

          if (error) throw error;
        }
      } catch (error) {
        console.error(`Erro ao geocodificar ${discipulo.nome}:`, error);
      }
    }

    toast({ title: "Geocodificação concluída!" });
    loadDiscipulos();
  };

  const discipulosComLocalizacao = discipulos.filter(d => d.latitude && d.longitude);
  const discipulosFiltrados = getDiscipulosFiltrados();

  useEffect(() => {
    if (map.current) {
      addDiscipulosToMap();
    }
  }, [filtroGrupo, filtroMaturidade, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mapa de Discípulos e Grupos</h1>
          <p className="text-muted-foreground">Visualização geográfica dos discípulos e células</p>
          <div className="flex gap-4 mt-2">
            <Badge variant="secondary">
              {discipulosComLocalizacao.length} com localização
            </Badge>
            <Badge variant="outline">
              {grupos.length} grupos
            </Badge>
          </div>
        </div>
      </div>

      {!mapboxToken ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Configurar Mapbox
            </CardTitle>
            <CardDescription>
              Para usar o mapa, insira seu token público do Mapbox. 
              Obtenha em: <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Token público do Mapbox (pk.eyJ...)"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => toast({ title: "Token configurado!" })}>
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome ou endereço..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="grupo">Grupo/Célula</Label>
                  <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os grupos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os grupos</SelectItem>
                      {grupos.map((grupo) => (
                        <SelectItem key={grupo} value={grupo}>
                          {grupo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maturidade">Maturidade</Label>
                  <Select value={filtroMaturidade} onValueChange={setFiltroMaturidade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="Iniciante">Iniciante</SelectItem>
                      <SelectItem value="Intermediário">Intermediário</SelectItem>
                      <SelectItem value="Avançado">Avançado</SelectItem>
                      <SelectItem value="Líder">Líder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={geocodificarEnderecos} className="w-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    Geocodificar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mapa */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Mapa Interativo</CardTitle>
                  <CardDescription>
                    Mostrando {discipulosFiltrados.filter(d => d.latitude && d.longitude).length} discípulos com localização
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={mapContainer} className="w-full h-96 rounded-lg" />
                </CardContent>
              </Card>
            </div>

            {/* Lista de Discípulos */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Discípulos ({discipulosFiltrados.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {discipulosFiltrados.map((discipulo) => (
                      <div key={discipulo.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{discipulo.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {discipulo.grupo_celula || 'Sem grupo'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {discipulo.maturidade_espiritual}
                          </div>
                          {discipulo.cidade && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {discipulo.cidade}, {discipulo.estado}
                            </div>
                          )}
                        </div>
                        <div>
                          {discipulo.latitude && discipulo.longitude ? (
                            <Badge variant="secondary">
                              <MapPin className="h-3 w-3 mr-1" />
                              Mapeado
                            </Badge>
                          ) : (
                            <Badge variant="outline">Sem local</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}