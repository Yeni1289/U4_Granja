import { neon } from '@neondatabase/serverless';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization'
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,OPTIONS',
          'access-control-allow-headers': 'content-type,authorization'
        }
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/') {
      return json({
        ok: true,
        service: 'u4-granja-backend',
        message: 'Cloudflare Worker activo'
      });
    }

    if (url.pathname === '/api/health') {
      if (!env.DATABASE_URL) {
        return json({ ok: false, error: 'DATABASE_URL no configurada' }, 500);
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const result = await sql`select now() as db_time`;
        return json({ ok: true, db: 'connected', db_time: result[0]?.db_time ?? null });
      } catch (error) {
        return json({ ok: false, db: 'error', message: error.message }, 500);
      }
    }

    if (url.pathname === '/api/productos' && request.method === 'GET') {
      if (!env.DATABASE_URL) {
        return json({ ok: false, error: 'DATABASE_URL no configurada' }, 500);
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const productos = await sql`select id, nombre, descripcion, precio, imagen_url, stock from productos order by id desc`;
        return json(productos);
      } catch (error) {
        return json({ ok: false, message: error.message }, 500);
      }
    }

    return json({ ok: false, message: 'Ruta no encontrada' }, 404);
  }
};
