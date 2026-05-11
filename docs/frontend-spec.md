# Anzu Frontend — Spec Técnica

## Overview

Frontend para la API REST de Anzu (Yu-Gi-Oh! Shared Card Inventory). SPA construída con React 18 + TypeScript.

---

## Stack

| Capa      | Tecnología                        |
| --------- | --------------------------------- |
| Framework | React 18 + Vite                   |
| Lenguaje  | TypeScript strict                 |
| State     | Zustand (auth + UI state)         |
| HTTP      | Axios con interceptors            |
| Routing   | React Router v6                   |
| Forms     | React Hook Form + Zod             |
| UI        | TailwindCSS + Radix UI            |
| Auth      | Token en memory + httpOnly cookie |

---

## Base URL

```
Desarrollo:    http://localhost:3000/api/v1
Producción:     https://api.anzu.com/api/v1
```

---

## Screens y Flows

### 1. Auth

#### Login (`/login`)

```
Pantalla:
  - Email input (email validation)
  - Password input (min 8 chars)
  - Botón "Iniciar sesión"
  - Link "No tenés cuenta? Registrate"
  - Errores inline

Flow:
  POST /auth/login
    → { accessToken, refreshToken, user }
    → Guardar tokens
    → Redirect a /home
```

#### Register (`/register`)

```
Pantalla:
  - Username input (unique, 3-50 chars)
  - Email input (valid email, unique)
  - Password input (min 8 chars, confirmación)
  - Terms checkbox
  - Botón "Crear cuenta"
  - Link "Ya tenés cuenta? Inicia sesión"

Flow:
  POST /auth/register
    → { accessToken, refreshToken, user }
    → Guardar tokens
    → Redirect a /home
```

#### Logout

```
Flow:
  POST /auth/logout (con JWT)
    → Limpiar tokens
    → Redirect a /login
```

---

### 2. Home — Feed Público (`/`)

```
Pantalla:
  - Navbar (logo + nav links + user menu)
  - Hero: "Las cartas más compartidas"
  - Grid de 50 cartas ordenadas por owner_count
  - Cada carta: imagen + nombre + archetype + owner_count
  - Click en carta → /cards/:id

API:
  GET /home
    → [{ id, name, type, archetype, image_url, owner_count }, ...]
```

---

### 3. Catálogo de Cartas (`/cards`)

```
Pantalla:
  - Search bar con input "Buscar por nombre"
  - Filtro por arquetipo (dropdown o autocomplete)
  - Resultados paginados (20 por página)
  - Grid de cartas (imagen + nombre)
  - Paginación below

API:
  GET /cards/search?q=dark&archetype=HERO&page=1&limit=20
    → { data: [...], pagination: { total, page, limit, totalPages } }
```

---

### 4. Detalle de Carta (`/cards/:id`)

```
Pantalla:
  - Imagen grande de la carta
  - Info: nombre, tipo, arquetipo, ATK/DEF, level, attribute
  - Descripción del texto de la carta
  - "Sets" disponibles (tabla con precios)
  - Lista de "Propietarios" (dueños con cantidad y condición)
  - Botón "Agregar a mi inventario" (si auth)

API:
  GET /home/cards/:id/owners
    → {
        card: { id, name, type, archetype, ..., sets: [...] },
        owners: [{ username, cantidad, condicion, idioma, instagram, twitter, discord, whatsapp }, ...]
      }

  POST /inventory (si auth)
    → { card_id, cantidad, condicion, idioma }
```

---

### 5. Mi Inventario (`/inventory`)

```
Pantalla (requiere auth):
  - Header: "Mi Inventario" + count
  - Lista de cartas (table view):
      | Carta | Cantidad | Condición | Idioma | Edición | Notas | Acciones |
      | Dark Magician | 2 | Near Mint | Inglés | 1st Edition | - | Editar / Eliminar |
  - Botón "Agregar carta" (abre modal de búsqueda)
  - Límite: "Tienes X/100 cartas distintas"

Sub-screens:
  - Modal de agregar: búsqueda de carta → seleccion → cantidad/condicion/idioma → guardar
  - Modal de editar: cambiar cantidad, condición, idioma, notas

API:
  GET /inventory/me (JWT)
    → [...]

  POST /inventory (JWT)
    → { card_id, cantidad, condicion, idioma, edicion, notas }

  PATCH /inventory/:id (JWT)
    → { cantidad?, condicion?, idioma?, edicion?, notas? }

  DELETE /inventory/:id (JWT)
```

---

### 6. Perfil Público (`/u/:username`)

```
Pantalla (sin auth):
  - Avatar/Username + rol
  - Links sociales (instagram, twitter, whatsapp, discord)
  - "Conteo de cartas: X"
  - Grid del inventario público
  - Si sos el dueño → botón "Mi inventario"

API:
  GET /u/:username
    → {
        username, role, created_at,
        social: { instagram, twitter, whatsapp, discord, konami_id },
        card_count,
        inventory: [
          { id, card_id, cantidad, condicion, idioma, edicion, card: {...} },
          ...
        ]
      }
```

---

### 7. Mi Perfil (`/profile`) — Auth requerido

```
Pantalla:
  - Username (editable)
  - Email (no editable o solo si se verifica)
  - Redes sociales: instagram, twitter, facebook, whatsapp, discord, konami_id
  - Toggle "Perfil público / privado"
  - Botón "Guardar cambios"

API:
  GET /users/me (JWT)
    → { id, username, email, role, is_public, instagram, twitter, ... }

  PATCH /users/me (JWT)
    → { username?, instagram?, twitter?, facebook?, whatsapp?, discord?, konami_id?, is_public? }
```

---

### 8. Perfil de Otro Usuario (`/users/:username`)

```
Pantalla:
  - Igual que /u/:username pero con botón "Seguir" / "Dejar de seguir"

API:
  GET /users/:username
    → público sin auth

  POST /social/follow/:userId (JWT)
  DELETE /social/unfollow/:userId (JWT)
```

---

### 9. Social — Seguidores (`/users/:username/followers`)

```
Pantalla:
  - Tabs: "Seguidores" | "Siguiendo"
  - Lista de usuarios (avatar + username)
  - Click → /u/:username

API:
  GET /social/followers/:userId
    → { data: [{ id, username, role, is_public, created_at }], pagination }
```

---

### 10. Admin — Sync (`/admin`)

```
Pantalla (auth + rol admin):
  - Estado del último sync: fecha, cards_created, cards_updated, duración
  - Botón "Sincronizar ahora"
  - Warning: "La sync puede tardar varios minutos"

API:
  GET /admin/sync/status
    → { synced_at, cards_created, cards_updated, status, duration_ms }

  POST /admin/sync (JWT + admin role)
    → { cards_created, cards_updated, total_cards, duration_ms }
```

---

## Auth — Implementación

### Interceptors Axios

```typescript
// Axios instance con interceptor
const api = axios.create({ baseURL: API_URL });

// Request: agregar JWT
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response 401: auto-refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshed = await authStore.getState().refreshTokens();
      if (refreshed) {
        // Reintentar request original
        return api.request(error.config);
      }
      // Refresh falló → logout
      authStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
```

### Auth Store (Zustand)

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email, password) => Promise<void>;
  register: (data) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
}
```

---

## Estado Global

| Store            | Contenido                                                |
| ---------------- | -------------------------------------------------------- |
| `authStore`      | user, accessToken, isAuthenticated, login/logout/refresh |
| `inventoryStore` | mi inventario, add/update/delete item                    |
| `uiStore`        | loading states, toasts, modals abiertos                  |

---

## Responsive

| Breakpoint          | Comportamiento                 |
| ------------------- | ------------------------------ |
| Mobile (<640px)     | Stack vertical, grid 1 columna |
| Tablet (640-1024px) | Grid 2 columnas                |
| Desktop (>1024px)   | Grid 3-4 columnas, sidebar nav |

---

## Rate Limiting (frontend side)

El backend tiene 100 req/min global. Si recibís 429:

- Mostrar toast "Demasiadas solicitudes, esperar X segundos"
- Implementar exponential backoff en reintentos

---

## Errores Comunes y UX

| Código | Significado                       | UX                                          |
| ------ | --------------------------------- | ------------------------------------------- |
| 400    | Bad request                       | Mostrar mensaje de validación inline        |
| 401    | No auth / token expirado          | Redirect a /login                           |
| 403    | Prohibido (no admin)              | Toast "No tenés permisos"                   |
| 404    | No encontrado                     | "No se encontró" + redirect                 |
| 409    | Conflicto (username/email en uso) | Inline: "Ya existe"                         |
| 429    | Rate limit                        | Toast "Esperá un momento" + disable botones |
| 500    | Server error                      | Toast "Error del servidor"                  |

---

## SEO / Open Graph

Para rutas públicas (`/u/:username`, `/cards/:id`):

```html
<meta property="og:title" content="Colección de {username}" />
<meta property="og:description" content="Ver colección de cartas Yu-Gi-Oh!" />
<meta property="og:image" content="{card_image}" />
```

---

## Swagger

Documentación interactiva disponible en:

```
/api/docs
```

Todos los DTOs exactos están definidos ahí — usar como source of truth para types del frontend.
