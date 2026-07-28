# DEMO — OpenClaw de Edgar (Academia Catalizadora, S08)

**Video:** https://www.youtube.com/watch?v=8G681Jlbdc0

## Guion (8 min)

### 1. El problema (2 min)
Trabajo hace 6 años en el negocio de repuestos y cambio de aceite de mi papá, aquí en Mérida.
Todos los días se repiten 3 tareas manuales que me quitan tiempo:

1. Un cliente pregunta por WhatsApp el precio de una pieza → yo busco en mi lista de
   precios/Excel → respondo a mano en $ y Bs.
2. Llevar el registro de clientes y ventas del día a mano.
3. Agendar las citas de cambio de aceite por teléfono/WhatsApp.

Sin memoria, cada vez que hablo con Claude tengo que explicarle mi negocio de cero.
Sin herramientas, todo lo tengo que copiar y pegar a mano. Sin automatización, nada
pasa hasta que yo me acuerdo de hacerlo. El OpenClaw ataca los 3 al mismo tiempo.

### 2. El sistema en vivo, con datos reales (3 min)
Mostrar en pantalla:

1. `gh workflow run openclaw.yml --repo Edgar161203/mi-contexto` — corro el OpenClaw a mano
   frente al grupo.
2. `gh run watch` — se ve correr en vivo: lee mi memoria (Mem0 + los archivos de contexto),
   consulta el estado real de `mi-herramienta` en Supabase, redacta el mensaje con Gemini,
   y lo manda por Gmail.
3. Abrir el correo real que llegó a mi bandeja.
4. Mostrar `memory/log.md` con la corrida fechada, committeada en el repo.
5. (Opcional) Pingear `mi-herramienta` en vivo con `curl` para que conteste con el saludo
   del negocio, mostrando que es una herramienta real conectada a Supabase, no un ejemplo.

### 3. La arquitectura — las 4 piezas (2 min)
- **Memoria**: `CLAUDE.md` + `quien-soy.md`/`que-hago.md`/`en-que-estoy.md` en el repo, más
  Mem0 (`user_id: "edgar"`) donde quedan guardados hechos de commits, correos, calendario y
  cierres de sesión de Claude Code (vía Stop hook).
- **Herramienta**: edge function `mi-herramienta` en Supabase, consultada en vivo vía MCP.
- **Automatización**: `.github/workflows/openclaw.yml`, cron de lunes a viernes a las
  7:30am hora Mérida — corre solo, sin que yo tenga que acordarme.
- **Canal de salida**: Gmail — el correo llega de verdad a mi bandeja, no se queda en un
  archivo que nadie lee.

### 4. Qué sigue (1 min)
La automatización que más falta en el negocio real: cuando un cliente pregunta el precio
de una pieza por WhatsApp, que el OpenClaw busque en mi lista de precios y responda solo
(en $ y Bs, con disponibilidad confirmada, nunca inventada). Ya tengo un bot de WhatsApp
corriendo local (Baileys + Gemini + Mem0) — el siguiente paso es conectarlo a la lista de
precios real y subirlo a un servidor para que corra 24/7. Mi meta a mediano plazo sigue
siendo volverme programador profesional y vivir de esto.

---

## Guion hablado (para leer o tener de chuleta)

**1. El problema (2 min)**
> Trabajo hace 6 años en el negocio de repuestos y cambio de aceite de mi papá, aquí en
> Mérida. Atiendo clientes, vendo piezas y hago cambios de aceite. El día a día tiene 3
> cosas que se repiten y me quitan tiempo: un cliente pregunta por WhatsApp el precio de
> una pieza y yo tengo que ir a buscar en mi lista de precios para responderle en dólares
> y bolívares; llevo el registro de ventas del día a mano; y agendo las citas de cambio de
> aceite por teléfono. Eso es tiempo que no estoy vendiendo ni atendiendo. Con Claude, sin
> memoria yo tenía que explicarle mi negocio desde cero cada vez, sin herramientas todo era
> copiar y pegar a mano, y sin automatización nada pasaba si yo no me acordaba. El OpenClaw
> resuelve los tres al mismo tiempo.

**2. Sistema en vivo (3 min)** — hablar mientras se hace:
> Miren, esto es real, no un ejemplo.
> *(correr `gh workflow run openclaw.yml --repo Edgar161203/mi-contexto`)*
> Esto va a leer mi memoria, consultar mi herramienta en Supabase, redactar el mensaje con
> Gemini y mandarlo por Gmail, todo solo.
> *(correr `gh run watch`, esperar a que termine)*
> *(abrir el correo real que llegó)*
> Y aquí quedó el registro.
> *(mostrar `memory/log.md`)*

**3. Arquitectura — las 4 piezas (2 min)**
> Esto tiene 4 piezas. La memoria: mi CLAUDE.md y los archivos de contexto en el repo, más
> Mem0 donde queda guardado lo que hago. La herramienta: una edge function en Supabase que
> consulto en vivo. La automatización: un cron en GitHub Actions que corre de lunes a
> viernes a las 7:30 de la mañana solo, sin que yo me acuerde. Y el canal de salida: Gmail,
> que de verdad llega a mi bandeja.

**4. Qué sigue (1 min)**
> Lo que más falta automatizar en el negocio real es que cuando un cliente pregunte el
> precio de una pieza por WhatsApp, el sistema busque en mi lista de precios y responda
> solo, en dólares y bolívares, sin inventar disponibilidad. Ya tengo un bot de WhatsApp
> corriendo en mi máquina con Baileys, Gemini y Mem0 — el siguiente paso es conectarlo a la
> lista de precios real y subirlo a un servidor para que corra todo el día. Mi meta es
> seguir aprendiendo hasta volverme programador profesional y vivir de esto.

---

## Notas para grabar
- Antes de grabar: correr `gh workflow run openclaw.yml --repo Edgar161203/mi-contexto` una
  vez para tener un correo fresco que mostrar, o dispararlo en vivo durante la demo (tarda
  ~30 segundos).
- Tener a mano: la pestaña de GitHub Actions, la bandeja de Gmail, y una terminal.
