# ORBI 2.0

Renovación completa de ORBI en Next.js, manteniendo la base MongoDB y la estructura de datos existente.

## Stack

- Next.js (App Router)
- React + TypeScript
- MongoDB
- Framer Motion
- Lucide Icons
- CSS responsive propio

## Funcionalidad conservada

- Iniciar sesión con contador en 0
- Orbi blanco: +1
- Orbi negro: -1
- Orbi rojo: alterna ×2 / ÷2
- Detener y descartar sesión
- Guardar sesión en historial
- Historial ordenado por fecha más reciente
- Reutiliza la base `OrbiApp` y las colecciones `actual` / `historial`

## Configuración local

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env.local` a partir de `.env.example`:

```env
MONGODB_URI=tu_cadena_de_conexion
```

3. Iniciar desarrollo:

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Vercel

No requiere `vercel.json`. Al desplegar el proyecto, definir `MONGODB_URI` en las variables de entorno del proyecto de Vercel. Si se reutiliza el mismo proyecto de Vercel que la versión anterior, verificar que esa variable siga configurada.

## Seguridad

`.env.local` está excluido del repositorio. El ZIP de entrega no incluye credenciales.
