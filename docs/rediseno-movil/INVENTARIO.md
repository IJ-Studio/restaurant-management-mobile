# Inventario de la capa de presentación — app móvil

Fecha: 2026-11-20 · Rama: `feature/pulido-ui-movil` · Base: `develop` (00abc31)

> Nota de rutas: la especificación habla de `src/presentation/`, pero en este repo la capa vive en
> `src/shared/presentation/` (tema y primitivas) y `src/features/*/presentation/` (pantallas).
> La navegación (tema de cabeceras y pestañas) está en `src/core/navigation/`.

## Tema (`src/shared/presentation/theme/`)

| Archivo | Contenido | Estado inicial |
|---|---|---|
| `webTokens.ts` | Colores y radios generados desde `styles/tokens.css` de la web (tema claro) | Generado por `scripts/tokens-desde-web.mjs`; no se edita a mano |
| `colors.ts` | Nombres de la app (`brand`, `surface`, `text`…) sobre los tokens | Tenía blancos puros `rgba(255,255,255,…)` para el degradado |
| `layout.ts` | `spacing`, `radius`, `shadows`, `sizes`, `gradients`, `pressScale`, `opacity` | Sombras `boxShadow`, degradado, `radius.xl` = 6 en tarjetas, `sizes.control` = 52 |
| `typography.ts` | Escala con Fraunces 700/600 y DM Sans | Sin `fontVariant` en cifras; versalitas en negrita y 1.4 de espaciado |
| `appFonts.ts` | Archivos de fuente para `useFonts` | Fraunces 700 y 600 |

## Primitivas compartidas (`src/shared/presentation/components/`)

| Componente | Usado en | Problemas frente a la especificación |
|---|---|---|
| `Button` | ~25 pantallas | Sombra, alto 52, radio 4, texto 18 negrita; `secondary` relleno pizarra |
| `TextField` | 15 pantallas | Etiqueta flotante sobre el borde; anillo con `boxShadow`; alto 52 |
| `PasswordField` | Login, cambiar contraseña, eliminar cuenta | Hereda el campo flotante |
| `Card` | ~20 pantallas | Sombra, radio 6 |
| `ListItem` | Menú | Sin cifras tabulares en precio |
| `StatusBadge` | 10 pantallas | Sin borde ni punto; sin versalitas |
| `Chip` | Pedidos, reservaciones, nómina, mesas, personal, cocina, cobro | Seleccionado en relleno pizarra |
| `ScreenHeader` | Login, `PlaceholderScreen` | Sin filete doble |
| `SectionTitle` | Dashboard, nómina, personal, mesas, cocina, pedido, privacidad | Sin etiqueta/filete |
| `HeroCard` | Dashboard, perfil, caja, cobro | `LinearGradient` + círculo decorativo + sombra |
| `StatCard` | Dashboard, caja, cobros | Caja de color detrás del icono, sombra, radio 6 |
| `HeaderButton` | Cabeceras (cocina/pedidos) | Pastilla 999, sin chevron |
| `FloorMap` | Dashboard, tomar pedido | Borde punteado, radio 6, sin código de zona |
| `CalculationView` | Dashboard, caja | «Ver cálculo» con área de 32 |
| `EmptyState` / `ErrorState` / `LoadingState` / `ScreenState` | Todas las listas | Círculo relleno detrás del icono |
| `Notice` | ~25 pantallas | Sin borde |
| `Charts` | Dashboard | Usa tokens; sin cambios mayores |
| `PlaceholderScreen` | Secciones pendientes | Hereda `ScreenHeader` |

## Navegación (`src/core/navigation/`)

| Archivo | Qué pinta |
|---|---|
| `navigationTheme.ts` | Cabeceras de stack y barra de pestañas (fuente, colores, bordes) |
| `sections.tsx` | Título e icono de cada pestaña; «Reservaciones» se trunca |
| `AppNavigator.tsx` | Monta las pestañas con `SECTION_CONFIG` |

## Pantallas por rol

Roles con secciones: **admin** (Dashboard, Pedidos, Reservaciones, Menú, Perfil), **mesero** (Menú, Pedidos,
Reservaciones, Perfil), **cajero** (Cobros, Pedidos, Perfil), **cocina** (Pedidos, Perfil).
El rol **cliente** no tiene secciones en la app móvil (`SECTIONS_BY_ROLE.cliente = []`).

| Pantalla | Archivo | Roles | Primitivas | Estilos propios |
|---|---|---|---|---|
| Iniciar sesión | `auth/.../LoginScreen.tsx` | todos | ScreenHeader, TextField, PasswordField, Button, Notice | Sí: degradado, círculo, hoja con radio 6 |
| Aviso de privacidad (consentimiento) | `privacy/.../PrivacyNoticeScreen.tsx` | todos | Card, Button, Notice | Sí |
| Permiso de notificaciones (modal) | `notifications/.../NotificationPermissionPrompt.tsx` | todos | Button, Modal | Sí: diálogo |
| Dashboard (inicio admin + accesos) | `admin/.../AdminNavigator.tsx` (AdminHome) + `DashboardScreen.tsx` | admin | HeroCard, StatCard, FloorMap, Charts, CalculationToggle, Card, SectionTitle | Sí |
| Nómina | `admin/payroll/.../PayrollScreen.tsx` | admin | Button, Card, Chip, TextField, SectionTitle | Sí: radio 8 suelto |
| Empleados de la nómina | `admin/payroll/.../PayrollEmployeesScreen.tsx` | admin | Button, Card, TextField, StatusBadge | Sí |
| Mesas | `admin/tables/.../TablesScreen.tsx` | admin | Button, Card, Chip, TextField, StatusBadge | Sí |
| Personal | `admin/staff/.../StaffScreen.tsx` | admin | Button, Card, Chip, TextField, StatusBadge | Sí |
| Facturas | `admin/invoices/.../InvoicesScreen.tsx` | admin | Button, Card, TextField, StatusBadge | Sí |
| Promociones | `admin/promotions/.../PromotionsScreen.tsx` | admin | Button, Card, StatusBadge | Sí |
| Existencias | `admin/stock/.../StockScreen.tsx` | admin | Card, StatusBadge | Sí |
| Menú | `menu/.../MenuScreen.tsx` | admin, mesero | ListItem, ScreenState, Notice | Sí |
| Detalle de platillo (+ controles admin) | `menu/.../DishDetailScreen.tsx`, `DishAdminControls.tsx` | admin, mesero | Card, StatusBadge, TextField, Button | Sí: imagen radio 6 |
| Tomar pedido en mesa | `orders/.../TableOrderScreen.tsx` | admin, mesero | FloorMap, Card, TextField, Button | Sí: pie flotante con sombra |
| Pedidos (lista) | `orders/.../OrdersScreen.tsx` + `OrderCard.tsx` | admin, mesero, cajero, cocina | Chip, OrderCard, estados | Sí: tarjeta con sombra |
| Detalle de pedido | `orders/.../OrderDetailScreen.tsx` | todos con Pedidos | Card, SectionTitle, StatusBadge, TextField, Button | Sí |
| Cobros (lista) | `orders/.../ChargeListScreen.tsx` | cajero | StatCard, Button, estados | Sí |
| Cobrar | `orders/.../ChargeScreen.tsx` | cajero | HeroCard, Card, Chip, TextField, Button | Sí |
| Caja (corte) | `cashier/.../CashRegisterScreen.tsx` | cajero | HeroCard, StatCard, Card, TextField, CalculationToggle | Sí |
| Reportes de cocina | `kitchen/.../KitchenReportsScreen.tsx` | cocina | Card, SectionTitle, StatusBadge, Button | Sí |
| Reportar incidencia | `kitchen/.../ReportIncidentScreen.tsx` | cocina | Chip, TextField, Button, Notice | Sí: radio 6 |
| Registrar merma | `kitchen/.../ReportWasteScreen.tsx` | cocina | Card, Chip, TextField, Button | Sí |
| Reservaciones (lista) | `reservations/.../ReservationsScreen.tsx` + `ReservationCard.tsx` | admin, mesero | Chip (pestañas), ReservationCard, Button | Sí: tarjeta con sombra |
| Nueva reservación | `reservations/.../NewReservationScreen.tsx` + `DateTimeField.tsx` | admin, mesero | Card, Chip, TextField, Button | Sí |
| Estado de reservación | `reservations/.../ReservationStatusScreen.tsx` | admin, mesero | Card, Chip, TextField, Button | Sí |
| Perfil | `auth/.../ProfileScreen.tsx` (+ `NotificationSettings`) | todos | HeroCard, Card, Button | Sí: avatar circular plano |
| Editar perfil | `profile/.../EditProfileScreen.tsx` | todos | Card, TextField, Button | Sí |
| Cambiar contraseña | `profile/.../ChangePasswordScreen.tsx` | todos | Card, PasswordField, Button | Sí |
| Privacidad (ARCO) | `privacy/.../PrivacyScreen.tsx` | todos | Card, SectionTitle, Button | Sí |
| Eliminar cuenta | `privacy/.../DeleteAccountScreen.tsx` | todos | Card, PasswordField, Button | Sí |

Componentes de apoyo sin pantalla propia: `AuthGate`, `RequireSection`, `PrivacyConsentGate`,
`AddToOrderButton`, `CurrentOrderButton`, `DateTimeField`.

## Hallazgos de la auditoría previa (rg)

- Sombras: `shadows.*` en Card, Button, StatCard, HeroCard, OrderCard, ReservationCard; `boxShadow` en el foco de TextField.
- `LinearGradient`: HeroCard y LoginScreen.
- Radios fuera de {2, 4, 6, 999}: círculos decorativos (RING/2) en HeroCard y Login; `8` en PayrollScreen.
  Además `radius.xl`/`radius.lg` (6) en tarjetas que deben ir a 4.
- `fontSize` < 12: ninguno.
- Hexadecimales sueltos fuera del tema: ninguno; blancos puros `rgba(255,255,255,…)` dentro de `colors.ts`.
- `fontVariant` tabular: solo en `CalculationView`.
