# Arquitectura de la app móvil

Clean Architecture por features + MVVM, acordada en pareja (Irving y José) en la tarea #310.

## Estructura

```text
src/
├── core/                         # Compartido por todas las features, sin lógica de negocio
│   ├── config/env.ts             # Variables EXPO_PUBLIC_* (todo lo de aquí va en el bundle)
│   ├── errors/AppError.ts        # Error de la app, independiente de HTTP
│   ├── http/httpClient.ts        # Singleton: única instancia que habla con el API e inyecta el JWT
│   ├── di/                       # Dependency Injection: grafo de dependencias + Context/Provider
│   ├── providers/AppProviders.tsx# QueryClientProvider + DependenciesProvider
│   └── monitoring/               # Sentry con filtrado de datos sensibles
├── navigation/                   # Navegador raíz, tabs por rol y RoleGuard (HU-02)
├── shared/presentation/          # Card, ListItem, Badge, QueryState, formatPrice, errorMessage
└── features/
    └── <feature>/                # auth, menu, reservations, orders, notifications, admin
        ├── domain/               # entities/, repositories/ (interfaces), usecases/
        ├── data/                 # datasources/, dtos/, mappers/, repositories/ (implementaciones), gateways/
        └── presentation/         # screens/, components/, viewmodels/ (Custom Hooks)
```

## Regla de dependencias

```mermaid
flowchart LR
    S[Screen] --> VM[ViewModel<br/>Custom Hook] --> UC[Caso de uso] --> RI[[Interfaz de repositorio]]
    RImpl[Repositorio impl.] -.implementa.-> RI
    RImpl --> DS[Datasource] --> HC[httpClient] --> API[(restaurant-management-api)]
```

- `presentation → domain ← data`. El dominio no importa nada de `data/` ni de `presentation/`.
- `domain/` no importa React, Expo, `fetch` ni SDKs externos (Stripe, Expo Notifications). Así los
  casos de uso se prueban con Jest sin mocks de librerías.
- Un **Screen** solo renderiza y llama a su **ViewModel**. Nunca importa un caso de uso, un
  repositorio ni `httpClient` directamente.
- Un **ViewModel** es un Custom Hook (`useLogin`, `useMenu`, ...). Obtiene los casos de uso con
  `useDependencies()` y usa React Query (datos del servidor) o Zustand (estado local).
- Los **DTOs** (forma del JSON del API) no salen de `data/`. El **mapper** los convierte en
  entidades de dominio y descarta los campos que la app no necesita.
- Los errores llegan a dominio y presentación como `AppError` (`kind`: `unauthorized`,
  `validation`, `network`, ...), nunca como `Response` ni como códigos HTTP sueltos.

## Dependency Injection

`src/core/di/dependencies.ts` arma el grafo real de la app. Cada feature agrega ahí sus casos de uso:

```ts
export interface Dependencies {
  httpClient: HttpClient;
  loginUseCase: LoginUseCase; // HU-01
}

export function createDependencies(): Dependencies {
  const authRepository = new AuthRepositoryImpl(new AuthRemoteDataSource(httpClient), secureStorage);
  return { httpClient, loginUseCase: new LoginUseCase(authRepository) };
}
```

En pruebas se inyectan mocks sin tocar componentes:

```tsx
render(
  <AppProviders dependencies={{ ...mocks, loginUseCase: { execute: jest.fn() } }}>
    <LoginScreen />
  </AppProviders>,
);
```

## Manejo de estado

| Herramienta | Para qué | Ejemplo |
|---|---|---|
| React Query | Datos del servidor (caché, reintentos, invalidación) | menú, reservaciones, historial |
| Zustand | Estado local que debe sobrevivir al caché | sesión y rol, pedido en curso, permiso de notificaciones |

## Sesión (HU-01)

```mermaid
sequenceDiagram
    participant App as RootNavigator
    participant Store as sessionStore (Zustand)
    participant Repo as AuthRepositoryImpl
    participant SS as expo-secure-store
    participant HC as httpClient
    App->>Repo: RestoreSessionUseCase (al abrir la app)
    Repo->>SS: load()
    SS-->>App: sesión guardada (si el JWT no ha vencido)
    App->>Store: setSession()
    HC->>Store: selectToken() en cada petición
    HC-->>Store: 401 con token → setSession(null) y borra secure-store
```

- `features/auth/presentation/store/sessionStore.ts` guarda `status` (`checking`,
  `authenticated`, `unauthenticated`) y la sesión (`token` + `user` con su `role`).
- `useLogin` usa `useMutation` solo para la llamada; el resultado va a Zustand y a secure-store.
- `useSessionBootstrap` (en `RootNavigator`) conecta el `httpClient` con el store y lo hidrata al abrir la app.
- No hay refresh token: un 401 en una petición con token cierra la sesión y limpia el caché de React Query.
- Credenciales inválidas siempre muestran `Correo o contraseña incorrectos.` aunque el API
  distinga correo y contraseña. Un usuario con rol 5 (cliente) no puede entrar.

## Navegación por rol (HU-02)

`src/navigation/roleRoutes.ts` mapea cada rol a sus tabs (un objeto, sin patrón extra para 4 roles):

| Rol | Tabs (la primera es su inicio) |
|---|---|
| Administrador | Dashboard · Pedidos · Reservaciones · Menú · Perfil |
| Cajero | Pedidos · Reservaciones · Menú · Perfil |
| Mesero | Menú · Pedidos · Reservaciones · Perfil |
| Cocina | Cocina · Perfil |

- `RootNavigator` lee el rol del mismo `sessionStore` de HU-01 (no se duplica) y monta `RoleTabs`.
  Con `key={role}`, un cambio de rol reinicia la navegación.
- Solo se registran las tabs del rol: las de otro rol no existen en su navegador.
- `RoleGuard` envuelve cada pantalla como segunda barrera: si se llega a una ruta no permitida
  (deep link, error de registro), no la renderiza y lleva al inicio del rol.
- Es control de UI. La autorización real la hace el API con el rol del JWT: cambiar el rol
  guardado en el dispositivo no da acceso a datos.
- Cada historia reemplaza su `ComingSoonScreen` en `RoleTabs.tsx` y, si lo necesita, agrega un
  stack dentro de su tab (p. ej. Menú → detalle del platillo en HU-03).

## Menú (HU-03)

- `GetMenuUseCase` (lista: primero lo disponible, luego por nombre) y `GetDishUseCase` sobre
  `MenuRepository`; sin Facade ni Adapter, es un solo GET.
- `useMenu` y `useDish` usan React Query con `staleTime` de 5 minutos. El detalle muestra al
  instante el platillo que ya está en la lista y lo confirma con `GET /menu/items/:id`; si esa
  llamada falla, se queda con el de la lista.
- La tab Menú es un stack (`MenuStack`): lista → detalle.
- `dishMapper` convierte `precio` (string) a número, descarta `precioCosto` y solo acepta
  imágenes `https://`.
- `shared/presentation/components` (`Card`, `ListItem`, `Badge`, `QueryState`) son los
  componentes que reutilizan reservaciones (HU-04) y pedidos (HU-05).

## Reservaciones (HU-04)

- `reservationRules.validateReservation` repite las reglas del API (`CreateReservationDto` y
  `ReservationsService`): nombre 2–150, teléfono `^[0-9+\-\s()]{8,20}$`, correo, fecha futura con
  al menos 1 hora de anticipación, 1–50 personas, notas ≤ 500. La fecha y la hora se capturan
  como `AAAA-MM-DD` y `HH:MM` en la hora local del dispositivo y se envían en ISO (UTC).
- `CreateReservationUseCase` vuelve a validar: una reservación inválida nunca llega al API.
  Se envía con `canal: 'telefono'`.
- `GetActiveReservationsUseCase` pide desde el inicio de hoy y deja solo `pendiente` y
  `confirmada`, de la más próxima a la más lejana.
- `useReservationForm` usa `useMutation` e invalida `['reservations']` al crear, así la nueva
  reservación aparece de inmediato en el listado (`ReservationsStack`: listado → formulario).

## Pruebas (TDD)

- Las pruebas viven junto al código en `__tests__/` (`src/features/auth/domain/__tests__/LoginUseCase.test.ts`).
- Orden: caso de uso → repositorio/mapper → ViewModel → Screen.
- `httpClient` se prueba con un `fetch` falso (`fetchFn`). Los datasources se prueban con un
  `HttpClient` falso, y los casos de uso con un repositorio falso.

## Seguridad

- `httpClient` rechaza URLs sin HTTPS fuera de desarrollo (MASVS-NETWORK).
- El JWT vive solo en `expo-secure-store` con `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (HU-01) y solo
  `httpClient` lo agrega a los headers. La app no usa AsyncStorage.
- Sentry filtra tokens, correos y datos personales (`src/core/monitoring/scrub.ts`).
- En `EXPO_PUBLIC_*` nunca va un secreto: termina en el bundle del APK.
