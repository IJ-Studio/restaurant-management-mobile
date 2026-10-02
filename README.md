# Restaurant Management Mobile

Aplicación móvil de uso interno construida con **Expo y React Native**, con **Clean Architecture por features y MVVM**.

**Dirigida a:** Mesero · Cocina · Cajero · Administrador
**Backend:** [`restaurant-management-api`](https://github.com/IJ-Studio/restaurant-management-api)

## Contenido

[Tecnologías](#tecnologías) · [Cómo correrlo](#cómo-correrlo) · [Arquitectura](#arquitectura) · [Patrones de diseño](#patrones-de-diseño) · [Manejo de estado](#manejo-de-estado) · [Flujo de trabajo](#flujo-de-trabajo)

## Tecnologías

![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Testing Library](https://img.shields.io/badge/Testing_Library-E33332?style=for-the-badge&logo=testinglibrary&logoColor=white)
![EAS Build](https://img.shields.io/badge/EAS_Build-000020?style=for-the-badge&logo=expo&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

## Cómo correrlo

**Requisitos:** Node.js 20+, npm y la app **Expo Go** en tu celular (o un emulador Android/iOS).

```bash
git clone https://github.com/IJ-Studio/restaurant-management-mobile.git
cd restaurant-management-mobile
npm install
npx expo start
```

Escanea el código QR con Expo Go, o presiona `a` (Android) / `i` (iOS) en la terminal.

Scripts de calidad:

```bash
npm run lint   # análisis estático
npm test       # pruebas con Jest + React Native Testing Library
```

> [!NOTE]
> Las variables de entorno van en un archivo `.env` local (ignorado por Git). Usa `.env.example` como plantilla.

## Arquitectura

Clean Architecture por features + MVVM.

```text
src/
├── core/                            # Configuración, cliente HTTP e inyección de dependencias
├── shared/presentation/components/  # Componentes reutilizables
└── features/<feature>/
    ├── domain/                      # Entidades, interfaces de repositorio y casos de uso
    ├── data/                        # Datasources, DTOs, mappers e implementaciones
    └── presentation/                # Screens, componentes y ViewModels
```

```mermaid
flowchart LR
    V[View] --> VM[ViewModel] --> UC[Use Case] --> R[Repository] --> D[Datasource] --> A[(API)]
```

- Dependencias: `presentation → domain ← data`.
- El dominio no depende de librerías de UI ni de SDKs externos.

**Referencias:** [The Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) · [Model-View-ViewModel (Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/architecture/maui/mvvm)

## Patrones de diseño

| Patrón | Aplicación |
|---|---|
| Dependency Injection | Desacoplamiento entre capas y mocks en pruebas |
| Singleton | Comunicación con la API y autenticación |
| Adapter | Integración con servicios de pago |
| Facade | Procesos de varios pasos expuestos como una sola operación |
| Observer | Datos en tiempo real y notificaciones push |

## Manejo de estado

| Herramienta | Aplicación |
|---|---|
| Zustand | Estado local: sesión, rol y estado temporal de la interfaz |
| React Query | Datos del servidor: consulta, caché y sincronización |

## Flujo de trabajo

**Metodología:** Scrumban + XP (TDD, pair programming, integración continua)
**Control de versiones:** Gitflow · Conventional Commits

```mermaid
gitGraph
    commit id: "commit inicial"
    branch develop
    checkout develop
    branch feature/hu01-login
    commit id: "feat: login"
    checkout develop
    merge feature/hu01-login
    branch release/v1.0.0
    commit id: "chore: versión 1.0.0"
    checkout main
    merge release/v1.0.0 tag: "v1.0.0"
    checkout develop
    merge release/v1.0.0
```

| Rama | Origen | Destino | Ejemplo |
|---|---|---|---|
| `main` | — | — | — |
| `develop` | `main` | — | — |
| `feature/hu0N-<slug>` | `develop` | `develop` | `feature/hu01-login` |
| `release/vX.Y.Z` | `develop` | `main`, `develop` | `release/v1.0.0` |
| `bugfix/<slug>` | `release/vX.Y.Z` | `release/vX.Y.Z` | `bugfix/crash-al-abrir-menu` |
| `hotfix/<slug>` | `main` | `main`, `develop` | `hotfix/token-expirado` |

> [!IMPORTANT]
> `main` y `develop` están protegidas: no hay push directo, todo entra por Pull Request con CI en verde. `main` solo recibe merges desde `release/*` y `hotfix/*`.