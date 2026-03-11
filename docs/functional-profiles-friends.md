# Documentación funcional: Perfiles y conexiones (amigos)

Este documento describe el comportamiento funcional de los módulos **Perfiles**, **Conexiones (amigos)** y las reglas de visibilidad asociadas en la Events App.

---

## 1. Módulo de perfiles

### 1.1 Modelo de datos

- **Tabla `profiles`**: un registro por usuario autenticado (`id` = `auth.users.id`).
- **Campos**: `display_name`, `avatar_url`, `bio`, `created_at`, `updated_at`.
- **Lectura**: cualquier usuario (incluido anónimo) puede leer cualquier perfil (perfil público).
- **Escritura**: solo el propio usuario puede crear o actualizar su perfil.

### 1.2 URLs

- **Mi perfil (edición y “Mis próximos eventos”)**: `/profile/me` (ruta protegida; redirige a usuario no logueado a login).
- **Perfil público de un usuario**: `/profile/:userId` (ej. `/profile/550e8400-e29b-41d4-a716-446655440000`).

### 1.3 Comportamiento por tipo de visitante

| Visitante        | Qué ve en el perfil ajeno                                      |
|------------------|-----------------------------------------------------------------|
| No logueado      | Nombre, foto (avatar), descripción (bio). No ve “eventos a los que va” ni asistentes. |
| Yo en mi perfil  | Formulario de edición (nombre, avatar URL, bio) y sección **“Mis próximos eventos”** (eventos a los que voy, ordenados por el primero en ocurrir). |
| Logueado, perfil ajeno | Nombre, foto, descripción; **“Eventos a los que va”** (según reglas de visibilidad más abajo); botón Conectar / estado de conexión; “X conectados”. |

---

## 2. Módulo de conexiones (amigos)

### 2.1 Modelo

- **Tabla `friend_requests`**: una fila por par (remitente, destinatario) con estado.
- **Campos**: `from_user_id`, `to_user_id`, `status` (`pending` | `accepted` | `rejected`), `created_at`.
- **Flujo**: un usuario envía una solicitud (**Conectar**) → el otro la **acepta** o **rechaza**. Una vez aceptada, quedan “conectados” (amigos).

### 2.2 Estados desde el punto de vista del usuario

- **Conectar**: se muestra cuando no hay relación o solicitud previa; envía una solicitud con estado `pending`.
- **Solicitud enviada**: el usuario ya envió una solicitud al otro y está `pending`.
- **Conectado**: existe una fila con `status = accepted` entre los dos usuarios.
- **Solicitud recibida**: el otro usuario me envió una solicitud; se gestiona en la pantalla de solicitudes (aceptar/rechazar).

### 2.3 Pantallas y rutas

- **Perfil ajeno (logueado)**: botón “Conectar” / “Solicitud enviada” / “Conectado” y texto “X conectados” (número de conexiones aceptadas del usuario dueño del perfil).
- **Solicitudes y conexiones**: ruta `/friends` (protegida), con tres pestañas:
  - **Received**: solicitudes **recibidas** (`pending`); cada fila enlaza al perfil del remitente; acciones **Aceptar** y **Rechazar**.
  - **Sent**: solicitudes **enviadas** (`pending`); cada fila enlaza al perfil del destinatario; acción **Cancel** (retira la solicitud).
  - **Connections**: lista de **conectados** (amigos con `status = accepted`); cada fila enlaza al perfil del usuario.

### 2.4 Reglas de negocio

- No se puede enviar solicitud a uno mismo.
- No se permite más de una solicitud activa por par (from, to); si ya existe, se muestra error o estado correspondiente.
- El **remitente** puede **cancelar** (eliminar) su propia solicitud mientras esté en estado `pending` (política RLS correspondiente).

---

## 3. Visibilidad de “eventos a los que va [un usuario]”

En el **perfil público** de un usuario se muestra la sección **“Eventos a los que va”** (eventos en los que tiene RSVP “I’m going”).

- **Usuario no logueado**: en este MVP no se muestra la lista de eventos en el perfil ajeno (solo nombre, foto, descripción).
- **Mi perfil**: “Mis próximos eventos” = eventos a los que yo voy, ordenados por fecha (el primero en ocurrir primero). No hay restricción de visibilidad de los eventos (el usuario ve los suyos).
- **Perfil ajeno (usuario logueado)**:
  - Si **no** somos amigos: solo se muestran los eventos **públicos** a los que va ese usuario.
  - Si **somos amigos**: se muestran eventos **públicos y privados** a los que va ese usuario.
  - Los eventos en estado **borrador** solo los ve quien los crea; no se listan en “eventos a los que va” de otro usuario.

La lógica se aplica en el cliente/servicio al combinar: eventos a los que asiste el usuario (tabla `event_attendees`), visibilidad del evento (`public` / `private` / `draft`) y relación de amistad entre el visitante y el dueño del perfil.

---

## 4. Lista de asistentes a un evento (solo creador)

- **Regla**: solo el **creador del evento** (`events.user_id`) ve la lista completa de asistentes (nombres/avatares de quienes marcaron “I’m going”).
- **Dónde**: en la página de detalle del evento (`/event/:id`), una sección “Attendees” (o equivalente) se muestra únicamente cuando el usuario logueado es el creador del evento.
- **Resto de usuarios**: ven el **contador** “X going” (comportamiento actual). Si en el futuro se decide ocultar también el contador para no creadores, será un cambio posterior (to-do).

---

## 5. Resumen de rutas nuevas

| Ruta               | Descripción                          | Protegida |
|--------------------|--------------------------------------|-----------|
| `/profile/me`      | Mi perfil (edición + próximos eventos) | Sí        |
| `/profile/:userId` | Perfil público de un usuario         | No        |
| `/friends`         | Solicitudes (recibidas/enviadas) y lista de conectados | Sí        |

---

## 6. To-do y mejoras futuras

- **Contador “X going”**: decidir si debe ser público para todos o solo visible para el creador / usuarios con cierto nivel de acceso (actualmente el contador es visible; la lista de asistentes se muestra para eventos públicos y para el creador).
- **Username**: valorar campo `username` y URL tipo `/u/:username` para perfiles más amigables.
- **Lista de conectados** (implementada en pestaña Connections de `/friends`). Antes: pantalla para ver la lista de “conectados” (actualmente solo se muestra el número “X conectados” en el perfil).
