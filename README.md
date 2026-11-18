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
│   ├── client.ts          Axios + interceptores (JWT, ProblemDetail → ApiError, cierre de sesión solo con 401)
│   ├── esquemas.ts        Zod: valida todo dato externo (backend y localStorage); null → '' u opcional
│   └── services.ts        Un método por endpoint; cada respuesta pasa por su esquema
├── types/
│   ├── api.ts             Tipos de los DTOs (sin null)
│   └── analisis.ts        Análisis de AletheIA (uniones discriminadas: error ≠ resultado)
├── store/authStore.ts     Zustand persistido: token + usuario
├── hooks/
│   ├── useCronometroEstimulo.ts   Mide el tiempo de lectura de cada noticia
│   └── useAnalisisNoticia.ts      Solicita el análisis y lo consulta cada 5 s mientras está PENDIENTE
├── lib/
│   ├── constants.ts       Rutas base, etiquetas, escalas Likert, opciones del registro
│   └── fases.tsx          Configuración PRE/POST (rutas, título de sesión) + contexto useFase()
├── components/
│   ├── routing/Guardias.tsx       RutaProtegida, RutaPublica, GuardiaFlujo, GuardiaPosttest
│   ├── layout/AuthLayout.tsx
│   ├── feed/                      NoticiaCard, PanelVeredicto, ItemFeed
│   ├── analisis/                  PanelAnalisis (informe de AletheIA), NoticiaConAnalisis
│   ├── cuestionario/              EscalaLikert, PreguntaCuestionario (registro de tipos)
│   └── ui/                        Button, Field, Alert, Spinner, BarraProgreso, PantallaEstado
├── mocks/analisis.ts      Informes ficticios para /demo/analisis (solo desarrollo)
└── pages/                 Home, Register, Login, Feed, Questionnaire, Completed, DemoAnalisis
```

## Flujo y reglas

La fase la decide la URL: `/pretest/...` usa `PRE` y `/posttest/...` usa `POST`. Ambas comparten
las mismas pantallas (`lib/fases.tsx`).

| Ruta | Qué hace |
|---|---|
| `/` | Home pública: explica el estudio y da acceso a cada fase |
| `/registro`, `/login` | Tras entrar, vuelven a la fase elegida (o a la Home) |
| `/pretest`, `/posttest` | Consultan `GET /api/participantes/me/estado?fase=` y redirigen al paso que corresponde |
| `/{fase}/noticias` | Noticias del feed, una por pantalla. En `POST`, con el panel de AletheIA |
| `/{fase}/cuestionario` | Sesión idempotente + ítems (`PRE`: 15, `POST`: 30) paginados de 5 en 5 |
| `/{fase}/completado` | Fin de la fase |
| `/demo/analisis` | Solo en desarrollo: el panel de AletheIA con informes de ejemplo, sin backend |

Cada ruta de fase exige sesión y pasa por `GuardiaFlujo`. El post test además exige haber completado
el pretest (`POSTTEST_REQUIERE_PRETEST` en `lib/constants.ts`).

## Análisis con AletheIA (post test)

- El participante pulsa **Analizar con AletheIA** antes de dar su veredicto. El análisis tarda 1–3 min:
  se consulta cada 5 s solo mientras está `PENDIENTE` y la noticia es la activa.
- Al volver a una noticia (o recargar), se consulta si ya se había solicitado (`404` = no).
- Noticias sin entradilla, cuerpo ni cierre: se avisa sin llamar al backend (respondería `400`).
- `503` (AletheIA ocupado): cuenta atrás con `reintentarEnSegundos` y reintento automático.
- Presentación según la guía del backend: veredicto con su etiqueta; "sin veredicto" con su motivo
  (nunca «no verificable»); un error nunca muestra veredicto; limitaciones siempre; evidencias en pestaña
  nueva; solidez como etiqueta, nunca porcentaje; opiniones y predicciones sin veredicto.

## Medición en el feed

- **ordenPresentacion**: posición en el arreglo completo del feed (1..N), aunque se retome a mitad de camino.
- **tiempoRespuestaSeg**: corre solo cuando la noticia es la activa, está visible ≥60% y la pestaña está visible. Se pausa al elegir el veredicto (el tiempo de la pregunta de confianza no cuenta); si el participante pulsa "Cambiar", se reanuda. No corre mientras están abiertas las instrucciones iniciales. Se envía redondeado, con mínimo 1 s.
- **confianzaAutopercibida**: obligatoria (1–5), un solo toque.
- **Navegación**: no hay scroll libre entre noticias; el avance es programático tras guardar la respuesta. Dentro de cada noticia sí hay scroll para leer el texto completo. No se puede volver atrás.
- Los 4 botones de veredicto tienen el mismo estilo para evitar sesgos de color.
- Un `409` al guardar se trata como "ya respondida" y se avanza.

## Errores

`client.ts` convierte toda falla en `ApiError { status, errorType, detail, campos, reintentarEnSegundos }`. La UI muestra `detail`; el registro muestra `campos` junto a cada input. Solo un `401` fuera de `/api/auth/*` cierra la sesión; un `403` (`AccessDenied`) es falta de permiso y la sesión sigue abierta. El token también se revisa localmente (`exp` del JWT).

## Personalización rápida

- Opciones de género, nivel educativo y frecuencia de noticias → `lib/constants.ts`. Deben coincidir exactamente con el backend: no cambiarlas sin cambiarlo también.
- Texto del consentimiento → `pages/RegisterPage.tsx`.
- Nuevo tipo de respuesta en el cuestionario (p. ej. `likert_7`) → agrégalo a `RENDERIZADORES` en `components/cuestionario/PreguntaCuestionario.tsx`.
- Colores y tipografías → bloque `@theme` en `src/index.css`.
