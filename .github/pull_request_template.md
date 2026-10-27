Closes #

## Qué cambia
<!-- Qué hace este PR y por qué. -->

## Cómo se probó
<!-- Enfoque estándar: docs/testing-strategy.md -->
- [ ] Pruebas unitarias nuevas o actualizadas (caso de uso, mapper, ViewModel o pantalla)
- [ ] Prueba de integración del flujo principal en `src/__tests__/integration/` (si cambia un flujo)
- [ ] Datos de prueba agregados en `src/core/testing/data/testData.ts` (si hay un endpoint o caso nuevo)
- [ ] En local: `npm run lint`, `npm run typecheck`, `npm run test:unit -- --coverage`, `npm run test:integration`
- [ ] Probado en Expo Go o en el APK de preview (si cambia la UI)

## Criterio de aceptación
<!-- Copia el criterio de la HU y marca si se cumple. -->
- [ ]

## Seguridad
- [ ] Sin secretos ni datos reales en el código o en las pruebas
- [ ] Los datos sensibles no llegan a logs ni a Sentry
