# El Quijote – App móvil

App móvil (Expo / React Native) de **uso interno** para el personal operativo del Restaurante El Quijote. Consume la API de [`restaurant-management-api`](https://github.com/IJ-Studio/restaurant-management-api).

## Para quién es

Para el personal del restaurante, no para comensales. No hay registro público: las cuentas las crea el Administrador desde el panel web, y cada persona solo ve las pantallas de su rol.

| Rol | Uso principal |
|---|---|
| Mesero | Consultar el menú, registrar reservaciones, tomar pedidos |
| Cocina | Ver pedidos en tiempo real y marcarlos como listos |
| Cajero | Cobrar con Stripe y consultar el historial de pedidos |
| Administrador | Ver los indicadores del día en gráficas |

Las notificaciones push coordinan al equipo: Cocina → Mesero (pedido listo) y Mesero → Cajero (para cobrar).

## Stack

Expo · React Native · Zustand · React Query · Stripe · Jest + React Native Testing Library · EAS Build · Sentry · GitHub Actions

## Arquitectura

Organización **por Features** (`auth`, `menu`, `reservations`, `orders`, `notifications`, `admin`), cada una con `screens/`, `components/`, `hooks/` y `services/`. Sigue MVVM con Custom Hooks y una capa de servicios:

```
Screen (UI) → Custom Hook (estado + lógica) → Service (HTTP) → API
```

Un screen nunca llama a un service directamente, siempre pasa por un hook; así la lógica es fácil de probar con TDD. Se descartaron Clean Architecture (demasiadas capas para el tamaño del proyecto) y MVC (React Native no tiene un Controller natural).

## Patrones de diseño

| Patrón | Uso |
|---|---|
| Dependency Injection | Inyectar services (y mocks en pruebas) vía Context |
| Singleton | Un único cliente HTTP con el token JWT |
| Adapter | Aislar el SDK de Stripe |
| Facade | `checkout()`: carrito → pedido → cobro → confirmación |
| Observer | Reaccionar a pedidos en tiempo real y a notificaciones push |

Donde no hacía falta un patrón (menú, reservaciones, estadísticas, navegación por rol) se mantuvo lo simple.

## Manejo de estado

- **Zustand:** estado del dispositivo (sesión y rol, pedido en curso, permiso de notificaciones).
- **React Query:** datos del servidor (menú, reservaciones, historial, pedidos en tiempo real, dashboard).

## Flujo de trabajo

Scrumban + XP (TDD, pair programming, CI) · GitHub Flow con `main` protegida y PR con CI obligatorio · APK de prueba con EAS Build al cierre de cada sprint · errores monitoreados con Sentry.

## Equipo

[@irvingaldahirangelesromero](https://github.com/irvingaldahirangelesromero) (arquitectura y frontend) · [@joose30](https://github.com/joose30) (calidad, TDD y estado)