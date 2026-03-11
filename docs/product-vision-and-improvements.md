# Visión de producto e ideas de mejora — Events App

Documento de referencia: atractivo de la app, enfoque en el evento como eje, público objetivo (público general: grandes, chicos, jóvenes, adultos), y lista de mejoras priorizadas (fortalezas, debilidades, oportunidades).

---

## Contexto

- La app está diseñada para **ver a dónde voy**, ser **fuente de planes a futuro** y **rememorar** eventos pasados.
- El **evento** es el principal atractivo y la solución a necesidades que existen en el mercado; se busca que ninguna otra app se enfoque tanto en el público general como esta.
- Objetivo: uso **general** (grandes, chicos, jóvenes, adultos), con un **“catch”** que atrape y genere ganas de volver.

---

## Fortalezas actuales

- **Evento como centro:** Todo gira en torno al evento (nombre, fecha, tipo, lugar, mapa, “voy” / “no voy”).
- **Tipos amplios:** Social, musical, baile, bar, cultural, interés general, tercera edad, niños, deporte → encaja con público muy variado.
- **Muro y fotos:** Posts con texto e imágenes por evento dan “memoria” del plan y contenido para rememorar.
- **Chat acotado:** Solo 24h antes y 24h después evita ruido y enfoca en coordinar el plan.
- **Mapa + dirección:** Ver dónde es y abrir Google Maps/Calendar ayuda a “ir” y a planificar.
- **Amigos y perfiles:** “Eventos a los que va [X]” en el perfil conecta planes con personas.
- **Visibilidad:** Público / privado / borrador permite tanto eventos abiertos como más íntimos.

---

## Puntos débiles y gaps

- **No hay descripción del evento:** Solo nombre, fecha, tipo y coordenadas. Falta el “de qué va”, por qué ir, quién organiza (texto libre o campos cortos).
- **Pasado vs futuro poco claro:** La lista mezcla todo por fecha; no hay pestañas/filtros tipo “Próximos” / “Pasados” ni “Mis planes”.
- **Rememorar poco visible:** El muro sirve para recordar, pero no hay una vista “Mis eventos pasados” o “Recuerdos” donde se destaquen fotos y posts.
- **Poco motivo para volver:** Sin notificaciones, recordatorios ni “tu amigo X va a…”, el retorno depende de que el usuario recuerde entrar.
- **Onboarding genérico:** No se explica el valor (“encontrar planes”, “ver quién va”, “guardar recuerdos”) ni se guía el primer uso.
- **Home poco personal:** Muestra “todo lo visible”; no prioriza “eventos a los que vas”, “eventos de tus amigos” o “recomendados”.
- **Evento creado por “user_id”:** No se muestra quién creó el evento en la card o en el detalle (menos confianza y contexto).
- **Sin imagen/portada del evento:** Solo texto y mapa; una imagen por evento mejoraría el atractivo visual y la sensación de “plan”.

---

## Ideas para el “catch” y que quieran volver

### 1. Hacer obvio “planes” y “recuerdos”

- **Vista “Mis planes”** (o “A dónde voy”): solo eventos a los que marqué “Voy”, ordenados por fecha (próximos primero). Acceso rápido en nav o home.
- **Vista “Pasados” o “Recuerdos”:** eventos ya realizados a los que fui, con foco en el muro (fotos y posts) como memoria. Opción “Ver fotos del evento” que lleve al muro.
- **Filtro en Home:** “Próximos” / “Pasados” / “Todos” para que “planes a futuro” y “rememorar” estén a un tap.

### 2. Dar razones para abrir la app

- **Recordatorios:** “Mañana es [evento]. ¿Listo?” (email o notificaciones push si las añades).
- **Social:** “Tu amigo [X] va a [evento]” o “3 amigos van” en la card o en una sección “Con amigos”.
- **Resumen semanal:** “Esta semana tienes 2 planes” o “No tienes planes; aquí hay eventos cerca”.

### 3. Reforzar el evento como producto

- **Descripción del evento:** Campo opcional (o corto + largo) en creación y en detalle. “De qué va” y “por qué ir”.
- **Quién lo crea:** Mostrar creador en card y en detalle (nombre/avatar, link al perfil). Aumenta confianza.
- **Imagen/portada:** Una foto por evento (opcional al crear). En listado y detalle para que se vea como “plan” y no solo texto.
- **Dirección legible:** Guardar dirección (ej. “Calle X, Ciudad”) además de lat/lng; mostrarla en detalle y en cards. Menos coordenadas crudas y más “dónde es”.

### 4. Experiencia para todos (grandes, chicos, jóvenes, adultos)

- **Lenguaje y tono:** Textos claros (“¿Vas?” en vez de solo “I’m going”), copy breve y amigable.
- **Navegación simple:** Un menú estable (Events / Map / Create / Profile / Friends) con íconos y etiquetas claras; “Mis planes” y “Recuerdos” como entradas destacadas.
- **Tipos y filtros:** Mantener tipos como “Children” y “Third age” y que los filtros por tipo sean visibles y fáciles en Home.
- **Privacidad clara:** Explicar qué ve cada quien (ej. “Quién va es visible para…”) según visibilidad.

### 5. Primer uso y retención

- **Onboarding corto:** 2–3 pantallas: “Descubre eventos”, “Dile a tus amigos que vas”, “Guarda fotos y recuerdos del día”.
- **Primera acción guiada:** “Marca tu primer evento como ‘Voy’” o “Crea un evento en 30 segundos”.
- **Empty states útiles:** En “Mis planes” vacío: “Cuando marques ‘Voy’ a un evento, aparecerá aquí” + CTA a Home/Map.

---

## Resumen priorizado (invertir en el evento)

| Prioridad | Qué hacer | Por qué |
|-----------|-----------|--------|
| **Alta** | “Mis planes” / “A dónde voy” | Es el núcleo: ver mis planes a futuro de un vistazo. |
| **Alta** | Próximos vs pasados en Home o filtros | Separa “planes” y “rememorar” sin cambiar mucho el modelo. |
| **Alta** | Descripción del evento (y mostrar creador) | El evento se entiende mejor y genera más confianza. |
| **Media** | “Recuerdos” / eventos pasados + muro | Refuerza “rememorar” y da motivo para volver a ver fotos. |
| **Media** | Imagen/portada por evento | Más atractivo visual y sensación de “plan”. |
| **Media** | Dirección guardada y mostrada | Mejor UX que solo coordenadas. |
| **Media** | Recordatorios o notificaciones | Motivo concreto para abrir la app. |
| **Baja** | Orden de íconos y menús | Mejora usabilidad; no define el “catch” solo. |

---

## Notas

- Este documento se puede actualizar según avances de desarrollo y feedback de usuarios.
- Para detalles técnicos de perfiles y amigos, ver `docs/functional-profiles-friends.md`.
