# 🗺️ Funcionalitats del Mapa de Supermercats

## Característiques Principals

### 📍 Visualització Interactiva
- **Mapa de Mapbox** amb ubicacions reals de supermercats
- **Coordenades basades en codi postal** de l'usuari
- **Markers diferenciats**:
  - 🛒 Supermercats amb productes per comprar
  - 🏪 Supermercats sense productes assignats

### 🏪 Informació Detallada de Supermercats
- **Popup informatiu** amb:
  - Nom i adreça del supermercat
  - Valoració dels usuaris
  - Llista de productes per comprar
  - Imatges dels productes

### 🎯 Sistema de Recomanacions
- **Top 3 supermercats** amb més productes de la teva llista
- **Ranking automàtic** basat en:
  - Nombre de productes per comprar
  - Distància de l'usuari
  - Valoració del supermercat

### 📊 Estadístiques en Temps Real
- Nombre total de supermercats propers
- Nombre de productes pendents
- Integració amb la llista activa

## Com Utilitzar el Mapa

### 1. Accés al Mapa
```
Navegació → Mapa (al navbar)
o directament a /mapa
```

### 2. Funcionalitats Disponibles
- **Click en markers**: Veure informació del supermercat
- **Zoom interactiu**: Explorar la zona
- **Recomanacions**: Cards clicables amb supermercats suggerits

### 3. Integració amb Llistes
- Els productes assignats específicament apareixen al popup
- Simulació automàtica de productes per a supermercats sense assignacions
- Sincronització amb la llista activa de l'usuari

## Tecnologies Utilitzades

### Frontend
- **Mapbox GL JS**: Renderització del mapa interactiu
- **React Hooks**: Gestió d'estat i efectes
- **TypeScript**: Tipatge segur de dades

### Serveis
- **SupermarketService**: Gestió de dades de supermercats
- **ShoppingListContext**: Integració amb llistes d'usuari
- **AuthContext**: Autenticació i dades d'usuari

### APIs
- **Mapbox Geocoding API**: Conversió codi postal → coordenades
- **Mock Data**: Simulació de supermercats de Barcelona

## Configuració Requerida

### Variables d'Entorn
```env
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

### Dependències
```json
{
  "mapbox-gl": "^3.13.0",
  "@types/mapbox-gl": "^3.4.1"
}
```

## Possibles Millores Futures

### 🔮 Funcionalitats Avançades
- **Rutes optimitzades** entre supermercats
- **Filtre per cadenes** de supermercats
- **Comparació de preus** en temps real
- **Geolocalització** de l'usuari
- **Mode foscar** pel mapa

### 🛒 Integració MongoDB
- Emmagatzematge de supermercats reals
- Històric de compres per ubicació
- Preferències d'usuari per zona

### 📱 Experiència Mòbil
- **Touch gestures** optimitzats
- **Popup responsive** millorat
- **Navegació GPS** integrada

## Troubleshooting

### Token de Mapbox No Trobat
```javascript
// Afegeix al .env.local
VITE_MAPBOX_ACCESS_TOKEN=pk.xxxxxx
```

### Mapa No Carrega
1. Verifica la connexió a internet
2. Comprova el token de Mapbox
3. Revisa la consola per errors de CORS

### Productes No Apareixen
1. Assegura't que tens una llista activa
2. Afegeix productes amb supermercats assignats
3. Recarrega el mapa si cal 