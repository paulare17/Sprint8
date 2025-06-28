# 🛒 Shopping List App - React + TypeScript + Vite + MongoDB

**Tecnologies utilitzades:** React, TypeScript, Vite, Material-UI, MongoDB, Firebase, Express.js

**APIs externes:** 
- 🗺️ Mapbox (visualització de mapes)
- 🌍 Geoapify (dades geoespacials de supermercats)
- 🥫 OpenFoodFacts (informació de productes)
- 🔥 Firebase (autenticació i dades d'usuari en temps real)

## 🏗️ Arquitectura Híbrida

Aquest projecte utilitza una **arquitectura híbrida innovadora**:

### Frontend (React + Vite)
- 🔥 **Firebase Firestore**: Gestió d'usuaris, llistes compartides, calendari i sincronització en temps real
- 🏪 **MongoDB via API**: Cache intel·ligent de supermercats, dades geoespacials i analítiques

### Backend (Express + MongoDB)
- 📊 **Cache intel·ligent**: Les dades de supermercats es guarden a MongoDB per evitar crides constants a APIs externes
- 🌍 **Capacitats geoespacials**: Queries eficients per trobar supermercats propers
- 📈 **Analítiques**: Seguiment de visites, ratings d'usuaris i estadístiques

## ✨ Funcionalitats principals

### 🗺️ **Sistema de Mapes Intel·ligent**
- Mapa interactiu amb Mapbox
- **Cache automàtic**: Primera cerca crida a Geoapify → Guarda a MongoDB → Següents cerques des de MongoDB
- Marcadors diferents per supermercats amb/sense productes assignats
- Cerca geoespacial per proximitat

### 🏪 **Gestió de Supermercats**
- Base de dades pròpia amb dades enriquides
- Ratings d'usuaris i comptador de visites
- Possibilitat d'afegir supermercats manualment
- Cerca per nom, cadena o ubicació

### 📋 **Llistes de Compra Col·laboratives**
- Creació i gestió de llistes compartides
- Assignació de productes a supermercats específics
- Sincronització en temps real entre usuaris
- Històrial de compres

### 📅 **Calendari i Recordatoris**
- Programació de recordatoris de compra
- Integració amb les llistes i productes
- Vista de calendari amb esdeveniments personalitzats


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
