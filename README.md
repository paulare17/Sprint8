# 🛒 Shopping List App - React + TypeScript + Vite + MongoDB + Vercel

Una aplicació per a gestió de llista de la compra entre usuaris, vinculat a un codi postal.

## 🏗️ Arquitectura

### Frontend (React + Vite)
- ⚛️ **React 19** amb TypeScript
- 🎨 **Material-UI** per a components
- 🔥 **Firebase** per a autenticació i dades de l'usuari en temps real
- 🗺️ **Mapbox GL** per a 

### Backend (API Serverless en Vercel)
- 🚀 **Vercel Functions** con TypeScript
- 🍃 **MongoDB** para persistencia de datos
- 🌍 **Geoapify API** para datos de supermercados
- 🔄 **Cache inteligente** para optimizar consultas

## ✨ Funcionalidades principales

### 🗺️ **Sistema de Mapas Inteligente**
- Mapa interactivo con supermercados cercanos
- Cache automático de datos de supermercados
- Búsqueda geoespacial optimizada
- Marcadores personalizados por tipo de supermercado

### 🏪 **Gestión de Supermercados**
- Base de datos propia con datos enriquecidos
- Ratings de usuarios y contador de visitas
- Posibilidad de añadir supermercados manualmente
- Búsqueda avanzada por nombre, cadena o ubicación

### 📋 **Listas de Compra Colaborativas**
- Creación y gestión de listas compartidas
- Asignación de productos a supermercatos específicos
- Sincronización en tiempo real
- Historial completo de compras

### 📅 **Calendario y Recordatorios**
- Programación de recordatorios
- Integración con listas y productos
- Vista de calendario personalizada

## 🚀 Configuración y Despliegue

### Requisitos previos
- Node.js 18+ 
- Cuenta de MongoDB Atlas
- Cuenta de Vercel
- API Key de Geoapify
- Proyecto de Firebase configurado

### Variables de entorno

#### En Vercel (para el backend):
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sprint8?retryWrites=true&w=majority
GEOAPIFY_API_KEY=tu_clave_de_geoapify_aqui
```

#### En desarrollo local (archivo .env en la raíz):
```bash
# Backend
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sprint8?retryWrites=true&w=majority
GEOAPIFY_API_KEY=tu_clave_de_geoapify_aqui

# Frontend (opcional - se detecta automáticamente)
VITE_BACKEND_URL=http://localhost:3000
```

### 📦 Instalación local

```bash
# Clonar el repositorio
git clone [tu-repo]
cd sprint8

# Instalar dependencias
npm install

# Desarrollo (solo frontend)
npm run dev

# Desarrollo (frontend + backend local)
npm run dev:fullstack

# Build de producción
npm run build
```

### 🌐 Despliegue en Vercel

1. **Conectar repositorio a Vercel**
2. **Configurar variables de entorno en Vercel:**
   - `MONGODB_URI`: Tu string de conexión de MongoDB Atlas
   - `GEOAPIFY_API_KEY`: Tu clave de API de Geoapify

3. **Configuración automática:** El archivo `vercel.json` ya está configurado

4. **Deploy automático:** Cada push a main despliega automáticamente

### 🗃️ Configuración de MongoDB

1. Crear cluster en MongoDB Atlas
2. Configurar IP whitelist (0.0.0.0/0 para Vercel)
3. Crear usuario de base de datos
4. Obtener connection string

### 🔑 Configuración de APIs externas

#### Geoapify (obligatorio)
1. Registrarse en [Geoapify](https://www.geoapify.com/)
2. Obtener API key gratuita
3. Añadir a variables de entorno

#### Firebase (para autenticación)
1. Crear proyecto en Firebase Console
2. Configurar Authentication
3. Añadir configuración en `src/services/firebaseConfig.ts`

## 📱 Scripts disponibles

```bash
npm run dev              # Desarrollo frontend
npm run dev:server       # Desarrollo backend local
npm run dev:fullstack    # Desarrollo completo
npm run build           # Build completo (frontend + backend)
npm run build:client    # Build solo frontend
npm run build:server    # Build solo backend
npm run vercel-build    # Build para Vercel
```

## 🔧 Estructura del proyecto

```
Sprint8/
├── api/                     # Backend serverless
│   ├── config/             # Configuración DB
│   ├── models/             # Modelos MongoDB
│   ├── services/           # Lógica de negocio
│   ├── index.ts           # Handler principal Vercel
│   ├── supermarkets.ts    # API supermercados
│   └── health.ts          # Health check
├── src/                    # Frontend React
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas
│   ├── services/         # Servicios frontend
│   ├── contexts/         # Contextos React
│   └── hooks/           # Custom hooks
├── vercel.json           # Configuración Vercel
└── package.json         # Dependencias
```

## 🔄 Flujo de datos

1. **Frontend** solicita datos de supermercados
2. **API Backend** verifica cache en MongoDB
3. Si no hay cache, consulta **Geoapify**
4. Guarda resultados en **MongoDB** para futuras consultas
5. Devuelve datos optimizados al frontend

## 🛠️ Tecnologías utilizadas

- **Frontend:** React 19, TypeScript, Vite, Material-UI, Firebase
- **Backend:** Vercel Functions, MongoDB, Mongoose, Axios
- **APIs:** Geoapify, Mapbox GL, Firebase, OpenFoodFacts
- **Deploy:** Vercel (serverless)
