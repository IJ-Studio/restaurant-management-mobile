# Google Play: ficha de la tienda y contenido de la app

Textos y respuestas listos para copiar en Play Console. Lo marcado con **CONFIRMAR** o entre corchetes lo
completa el equipo. Las respuestas de privacidad están en
[`google-play-seguridad-datos.md`](google-play-seguridad-datos.md), y la configuración técnica, en
[`deployment-google-play.md`](deployment-google-play.md).

## Datos de la app

| Campo | Valor |
|---|---|
| Nombre (máx. 30) | Restaurante El Quijote |
| Paquete | `com.ijstudio.restaurantmanagement` |
| Categoría | Empresa |
| Correo de contacto | `elquijote.atencion@gmail.com` |
| Desarrollador (cuenta de Play) | Angel Uriel Martinez Hernandez |
| Sitio web | `https://el-quijote.vercel.app` |
| Política de privacidad | `https://el-quijote.vercel.app/privacidad` |

## Descripción corta (máx. 80)

```text
Pedidos, mesas, cobros y reservaciones para el personal de El Quijote.
```

## Descripción completa (máx. 4000)

```text
Restaurante El Quijote es la app de trabajo del personal del restaurante El Quijote, en Huejutla de Reyes, Hidalgo. Cada persona entra con la cuenta que le da la administración y ve solo lo que corresponde a su rol.

Meseros
• Abre la mesa, registra comensales y arma el pedido con notas para cocina.
• Consulta el menú con fotos, precios y platillos agotados.
• Registra reservaciones con validación de datos.

Cocina
• Recibe los pedidos y cambia su estado: en preparación y listo.
• Reporta incidencias y mermas.

Caja
• Cobra en efectivo o con terminal, con propina y cuenta dividida.
• Abre y cierra la caja y consulta los cortes anteriores.

Administración
• Dashboard del día: ventas por hora, por método de pago, por mesero y por platillo.
• Plano de mesas en tiempo real.

Además
• Avisos cuando un pedido está listo.
• La sesión se guarda en el almacenamiento seguro del teléfono y toda la comunicación va cifrada.

La app es para el personal del restaurante: no permite crear cuentas ni hacer pedidos como cliente.
```

## Recursos gráficos

| Recurso | Requisito | Estado |
|---|---|---|
| Ícono | PNG 512×512, hasta 1 MB | Reducir `assets/icon.png` (1024×1024) |
| Gráfico destacado | PNG o JPG 1024×500 | **Falta** |
| Capturas de teléfono | De 2 a 8, PNG o JPG, lado corto de al menos 320 px | **Faltan**: Login, Pedidos, Pedido de mesa, Cobro, Dashboard |

## Contenido de la app (Play Console → Política → Contenido de la app)

| Sección | Respuesta |
|---|---|
| Política de privacidad | `https://el-quijote.vercel.app/privacidad` |
| Anuncios | La app **no** contiene anuncios |
| Acceso a la app | **Toda o parte de la funcionalidad está restringida.** Instrucciones: «La app es para el personal del restaurante. Inicie sesión con el usuario de prueba; tiene rol de Administrador y ve todas las secciones.» Usuario: [correo demo] · Contraseña: [contraseña demo] **CONFIRMAR** |
| Clasificación de contenido | Categoría: «Todas las demás apps». Responde **No** a violencia, sexualidad, lenguaje, drogas, apuestas y contenido generado por usuarios compartido públicamente. No permite comprar productos digitales. Resultado esperado: Apto para todos / PEGI 3 |
| Público objetivo | 18 años o más. No está dirigida a niños |
| Apps de noticias | No |
| Apps gubernamentales | No |
| Funciones financieras | Ninguna (registra cobros del restaurante, pero no ofrece servicios financieros) |
| Salud | No |
| Seguridad de los datos | Ver [`google-play-seguridad-datos.md`](google-play-seguridad-datos.md) |

## Antes de la revisión de Google

- [ ] El API de producción responde por HTTPS y `EXPO_PUBLIC_API_URL` apunta a él en el entorno
      `production` de EAS.
- [ ] Existe el usuario demo con rol de Administrador y la contraseña de arriba funciona contra ese API.
- [ ] Primer build: `eas build --platform android --profile store` y subir el `.aab` a mano en
      Play Console → Pruebas → Prueba cerrada.
- [ ] Testers: lista de correos de Gmail (12 si la cuenta de Play es personal y nueva) con el enlace de
      la prueba cerrada.
