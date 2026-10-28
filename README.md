# Frontend del pre test — Detección de noticias falsas

React 19 + TypeScript + Vite · React Router · Axios · Zustand · React Hook Form + Zod · Tailwind CSS v4

## Puesta en marcha

```bash
npm install
cp .env.example .env      # opcional
npm run dev               # http://localhost:5173
```

En desarrollo, Vite redirige `/api/*` a `http://localhost:8080` (ver `vite.config.ts`), así que **no necesitas configurar CORS** en Spring Boot. Para producción, define `VITE_API_URL` con la URL pública del backend y entonces sí habilita CORS para el dominio del frontend.

```bash
npm run build     # verifica tipos y genera dist/
npm run preview
```

## Estructura

```
src/
├── api/
│   ├── client.ts          Axios + interceptores (JWT, ProblemDetail → ApiError, sesión vencida)
│   └── services.ts        Un método por endpoint del backend
├── types/api.ts           Tipos de todos los DTOs
├── store/authStore.ts     Zustand persistido: token + usuario
├── hooks/
│   └── useCronometroEstimulo.ts   Mide el tiempo de lectura de cada noticia
├── lib/constants.ts       Rutas, etiquetas, escalas Likert, opciones del registro
├── components/
│   ├── routing/Guardias.tsx       RutaProtegida, RutaPublica, GuardiaFlujo
│   ├── layout/AuthLayout.tsx
│   ├── feed/                      NoticiaCard, PanelVeredicto, ItemFeed
│   ├── cuestionario/              EscalaLikert, PreguntaCuestionario (registro de tipos)
│   └── ui/                        Button, Field, Alert, Spinner, BarraProgreso, PantallaEstado
└── pages/                 Register, Login, Feed, Questionnaire, Completed
```

## Flujo y reglas

| Ruta | Qué hace |
|---|---|
| `/registro` | Registro + consentimiento → login automático → `/inicio` |
| `/login` | Login → `/inicio` |
| `/inicio` | Llama a `GET /api/participantes/me/estado?fase=PRE` y redirige |
| `/feed` | 20 noticias, una por pantalla |
| `/cuestionario` | Sesión idempotente + ítems paginados de 5 en 5 |
| `/completado` | Fin. Cualquier otra ruta redirige aquí una vez completado |

Cada ruta protegida pasa por `GuardiaFlujo`, que consulta el estado y redirige si el participante intenta entrar a una pantalla que no le corresponde (volver al feed, repetir el cuestionario, etc.).

## Medición en el feed

- **ordenPresentacion**: posición en el arreglo completo del feed (1..20), aunque se retome a mitad de camino.
- **tiempoRespuestaSeg**: corre solo cuando la noticia es la activa, está visible ≥60% y la pestaña está visible. Se pausa al elegir el veredicto (el tiempo de la pregunta de confianza no cuenta); si el participante pulsa "Cambiar", se reanuda. No corre mientras están abiertas las instrucciones iniciales. Se envía redondeado, con mínimo 1 s.
- **confianzaAutopercibida**: obligatoria (1–5), un solo toque.
- **Navegación**: no hay scroll libre entre noticias; el avance es programático tras guardar la respuesta. Dentro de cada noticia sí hay scroll para leer el texto completo. No se puede volver atrás.
- Los 4 botones de veredicto tienen el mismo estilo para evitar sesgos de color.
- Un `409` al guardar se trata como "ya respondida" y se avanza.

## Errores

`client.ts` convierte toda falla en `ApiError { status, errorType, detail }`. La UI muestra `detail`. Si llega `401` o `errorType === "AuthError"` fuera de `/api/auth/*`, se cierra la sesión y se manda al login con aviso. El token también se revisa localmente (`exp` del JWT).

## Personalización rápida

- Opciones de género, nivel educativo y frecuencia de noticias → `lib/constants.ts` (ajústalas a los valores exactos que espera el backend).
- Texto del consentimiento → `pages/RegisterPage.tsx`.
- Nuevo tipo de respuesta en el cuestionario (p. ej. `likert_7`) → agrégalo a `RENDERIZADORES` en `components/cuestionario/PreguntaCuestionario.tsx`.
- Colores y tipografías → bloque `@theme` en `src/index.css`.
