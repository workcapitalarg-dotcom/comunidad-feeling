// ============================================================
// DEBUG FETCH HELPER
// Activo sólo cuando EXPO_PUBLIC_DEBUG=true en .env
// Para desactivar un webhook, reemplazar debugFetch por fetch.
// ============================================================

const DEBUG = process.env.EXPO_PUBLIC_DEBUG === 'true';

export async function debugFetch(url: string, body: object): Promise<any> {
  if (DEBUG) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📤 SEND → ${url}`);
    console.log(JSON.stringify(body, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (DEBUG) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📥 RECV ← ${url}  [status: ${response.status}]`);
    console.log(JSON.stringify(data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  if (!response.ok || data.code) {
    // Si n8n devuelve un 404 u otro error (generalmente con res.ok=false o especificando un "code" en json)
    throw new Error(`[debugFetch] Error HTTP ${response.status}: ${data.message || 'Desconocido'}`);
  }

  return data;
}

export async function debugFetchGet(url: string, params: Record<string, string>): Promise<any> {
  const queryString = new URLSearchParams(params).toString();
  const finalUrl = queryString ? `${url}?${queryString}` : url;

  if (DEBUG) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📤 SEND (GET) → ${finalUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  const response = await fetch(finalUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  if (DEBUG) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📥 RECV ← ${finalUrl}  [status: ${response.status}]`);
    console.log(JSON.stringify(data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  if (!response.ok || data.code) {
    throw new Error(`[debugFetch] Error HTTP ${response.status}: ${data.message || 'Desconocido'}`);
  }

  return data;
}
