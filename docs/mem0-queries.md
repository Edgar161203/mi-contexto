# Queries de Mem0 · negocio de repuestos y cambio de aceite

Cinco búsquedas semánticas útiles sobre la memoria de Edgar en Mem0
(`mcp__mem0__search_memories` desde Claude, o `POST /v1/search/` de la API
REST de Mem0 fuera de Claude). Las dos primeras ya se probaron en vivo; las
otras tres quedan listas para correr cuando el cron nocturno lleve más
noches acumulando commits, correos y eventos de calendario.

## 1. ¿Cuáles son mis tareas manuales pendientes de automatizar?

**Query:** `tareas manuales del negocio de repuestos que Edgar quiere automatizar`

**Probada — resultado real:**
- "Edgar identified the three manual tasks that consume most time in his
  family's auto parts and oil‑change business: registering clients and sales
  by hand, answering repetitive customer questions, and scheduling
  oil‑change appointments via WhatsApp or phone" (score 0.29)
- "Edgar works in his family's auto parts and oil‑change business in
  Mérida, Venezuela" (score 0.22)

**Para qué sirve:** repasar rápido cuáles de las 3 tareas del negocio
todavía no se han automatizado, sin tener que releer el CLAUDE.md completo.

## 2. ¿Cómo voy en la Academia Catalizadora?

**Query:** `avances de Edgar en la Academia Catalizadora`

**Probada — resultado real:**
- "Edgar completed the onboarding for the Academia Catalizadora on July 24,
  2026" (score 0.32)
- "Edgar decided to use those three tasks as the first objectives to
  automate with AI throughout the Academia Catalizadora program" (score 0.23)

**Para qué sirve:** que el agente (o Edgar) tenga contexto de dónde va el
curso sin depender solo de `ver_mi_progreso`.

## 3. ¿Qué cambié últimamente en el código del negocio?

**Query:** `últimos commits de Edgar en mi-contexto`

**Para qué sirve:** ver qué se tocó en el repo los últimos días (viene del
extractor de commits) antes de seguir trabajando, para no repetir cambios.

## 4. ¿Qué correos importantes me han llegado esta semana?

**Query:** `correos importantes que le llegaron a Edgar esta semana`

**Para qué sirve:** un resumen rápido de Gmail sin abrir el correo — útil
para no perderse notificaciones de GitHub, clientes o proveedores.

## 5. ¿Tengo alguna cita de cambio de aceite o evento agendado pronto?

**Query:** `próximas citas o eventos en el calendario de Edgar`

**Para qué sirve:** cruzar el calendario personal con las citas de cambio
de aceite del negocio, para no chocar horarios.

---

Cómo correr cualquiera de estas desde Claude Code:

```
mcp__mem0__search_memories(query: "<la query de arriba>")
```

O directo contra la API REST de Mem0 (útil para scripts fuera de Claude):

```bash
curl -s -X POST "https://api.mem0.ai/v1/memories/search/" \
  -H "Authorization: Token $MEM0_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "<la query de arriba>", "user_id": "edgar"}'
```
