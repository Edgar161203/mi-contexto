const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const MEM0_API_KEY = process.env.MEM0_API_KEY;

async function refrescarAccessToken() {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await resp.json();
  if (!data.access_token) {
    throw new Error("No se pudo refrescar el access token: " + JSON.stringify(data));
  }
  return data.access_token;
}

async function guardarMemoria(texto, fuente) {
  const resp = await fetch("https://api.mem0.ai/v1/memories/", {
    method: "POST",
    headers: {
      Authorization: `Token ${MEM0_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: texto }],
      user_id: "edgar",
      source: fuente,
    }),
  });
  if (resp.status !== 200) {
    console.error(`ERROR (${fuente}, HTTP ${resp.status}): ${texto}`);
    return false;
  }
  console.log(`guardado (${fuente}): ${texto}`);
  return true;
}

async function extraerGmail(accessToken) {
  let guardados = 0;
  const listResp = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=" +
      encodeURIComponent("newer_than:1d"),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listResp.json();
  const mensajes = listData.messages || [];
  for (const msg of mensajes) {
    const msgResp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const msgData = await msgResp.json();
    const headers = msgData.payload?.headers || [];
    const asunto = headers.find((h) => h.name === "Subject")?.value || "(sin asunto)";
    const de = headers.find((h) => h.name === "From")?.value || "desconocido";
    const texto = `Edgar recibió un correo de ${de} con asunto: "${asunto}"`;
    if (await guardarMemoria(texto, "gmail")) guardados++;
  }
  return guardados;
}

async function extraerCalendario(accessToken) {
  let guardados = 0;
  const ahora = new Date();
  const enDosDias = new Date(ahora.getTime() + 2 * 24 * 60 * 60 * 1000);
  const url =
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?" +
    new URLSearchParams({
      timeMin: ahora.toISOString(),
      timeMax: enDosDias.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "10",
    }).toString();
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await resp.json();
  const eventos = data.items || [];
  for (const ev of eventos) {
    const inicio = ev.start?.dateTime || ev.start?.date || "fecha desconocida";
    const texto = `Edgar tiene en su calendario: "${ev.summary || "(sin título)"}" el ${inicio}`;
    if (await guardarMemoria(texto, "calendar")) guardados++;
  }
  return guardados;
}

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log("Google no está configurado (faltan credenciales), saltando gmail/calendar.");
  process.exit(0);
}

const accessToken = await refrescarAccessToken();
const gmailCount = await extraerGmail(accessToken);
const calCount = await extraerCalendario(accessToken);
console.log(`--- facts guardados (gmail): ${gmailCount} ---`);
console.log(`--- facts guardados (calendar): ${calCount} ---`);
