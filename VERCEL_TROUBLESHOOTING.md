# 🔧 Solución de Problemas en Vercel

## Error 404 en Vercel - Soluciones

### 1. ✅ **Verificar Variables de Entorno en Vercel**

En el dashboard de Vercel, ve a tu proyecto → Settings → Environment Variables y asegúrate de tener:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sprint8?retryWrites=true&w=majority
GEOAPIFY_API_KEY=tu_clave_de_geoapify_aqui
```

⚠️ **IMPORTANTE**: Después de añadir las variables, haz un **Redeploy** del proyecto.

### 2. ✅ **Estructura de Archivos Correcta**

Tu proyecto debe tener esta estructura:

```
Sprint8/
├── api/
│   ├── config/
│   │   └── database.ts
│   ├── models/
│   │   └── Supermarket.ts
│   ├── services/
│   │   └── supermarketService.ts
│   ├── supermarkets/
│   │   └── postal/
│   │       └── [postalCode].ts
│   ├── supermarkets.ts
│   └── health.ts
├── vercel.json
└── package.json
```

### 3. ✅ **URLs Correctas**

Las URLs de tu API en Vercel serán:

```bash
# Health check
https://tu-proyecto.vercel.app/api/health

# Supermercados por código postal (2 formas)
https://tu-proyecto.vercel.app/api/supermarkets/postal/08001
https://tu-proyecto.vercel.app/api/supermarkets/postal/08001?forceRefresh=true

# Supermercados generales
https://tu-proyecto.vercel.app/api/supermarkets
```

### 4. ✅ **Verificar en Vercel Dashboard**

1. Ve a tu proyecto en Vercel
2. Ve a la pestaña **Functions**
3. Deberías ver las funciones listadas:
   - `api/health.ts`
   - `api/supermarkets.ts`
   - `api/supermarkets/postal/[postalCode].ts`

### 5. ✅ **Testing Local vs Producción**

#### Local (desarrollo):
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend: Las llamadas van directamente a Vercel o localhost:3000 si tienes backend local
```

#### Producción:
```bash
# El frontend automáticamente detecta que está en producción
# y usa las URLs de Vercel para las llamadas a la API
```

### 6. ✅ **Logs de Vercel**

Para debuggear errores:

1. Ve a tu proyecto en Vercel
2. Ve a la pestaña **Functions**
3. Haz clic en cualquier función
4. Ve a **View Function Logs**
5. Haz una petición y mira los logs en tiempo real

### 7. ✅ **Common Issues y Soluciones**

#### Error: "Function not found"
- Asegúrate de que `vercel.json` esté correctamente configurado
- Verifica que los archivos `.ts` estén en la carpeta `api/`

#### Error: "MongoDB connection failed"
- Verifica que `MONGODB_URI` esté correctamente configurado
- Asegúrate de que tu IP esté en la whitelist de MongoDB (usa `0.0.0.0/0` para Vercel)

#### Error: "CORS"
- Los headers CORS ya están configurados en cada función
- Si persiste, verifica que el frontend esté usando las URLs correctas

### 8. ✅ **Test Rápido**

Para probar que todo funciona:

```bash
# 1. Test health check
curl https://tu-proyecto.vercel.app/api/health

# 2. Test supermercados
curl https://tu-proyecto.vercel.app/api/supermarkets/postal/08001
```

### 9. ✅ **Redeploy Forzado**

Si nada funciona:

1. Ve a Vercel Dashboard
2. Ve a la pestaña **Deployments**
3. Encuentra el último deployment exitoso
4. Haz clic en "**Redeploy**"
5. Selecciona "**Use existing Build Cache**" = NO

---

## 🆘 Si aún tienes problemas:

1. **Verifica las variables de entorno** en Vercel Dashboard
2. **Haz un redeploy completo** sin cache
3. **Revisa los logs** en la pestaña Functions
4. **Testea las URLs** directamente en el navegador
5. **Comprueba que MongoDB Atlas** permita conexiones desde Vercel (IP whitelist) 