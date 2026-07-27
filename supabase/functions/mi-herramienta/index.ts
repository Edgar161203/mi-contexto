// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";

console.log("Hello from Functions!");

// Sin apikey: cualquiera puede pingearla (checklist de la Academia, demos, etc.)
// No devuelve ni escribe nada sensible, solo un saludo del negocio.
export default {
  fetch: async (req: Request) => {
    let name = "amigo";
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.name) name = body.name;
      } catch {
        // body vacío o no-JSON: seguimos con el saludo genérico
      }
    }

    return Response.json({
      message: `¡Épale ${name}! Gracias por escribir a Repuestos y Cambio de Aceite. El cambio de aceite toma entre 30 y 45 minutos aprox. Los precios te los confirmamos en $ y Bs apenas nos digas la pieza o el modelo del carro.`,
    });
  },
};

/* To invoke:

  curl -i --location --request POST 'https://eccpmhaiowuiiojatidr.supabase.co/functions/v1/mi-herramienta' \
    --data '{"name":"Edgar"}'

  O como ping simple (sin body, sin apikey):

  curl -i 'https://eccpmhaiowuiiojatidr.supabase.co/functions/v1/mi-herramienta'

*/
