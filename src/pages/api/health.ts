import type { APIRoute } from 'astro';
import { supabase, supabaseAnon } from '../../lib/supabase';

/**
 * 臨時診斷端點 — 用來排查線上 Supabase 連線問題（統計歸零、按讚變慢）。
 * 只回報連線狀態、耗時與錯誤訊息，不包含任何金鑰或私人資料。
 * 問題解決後可移除。
 */

async function probe(client: typeof supabase, label: string) {
  const t0 = Date.now();
  try {
    const { data, error, status } = await client
      .from('story_stats')
      .select('story_slug, views, likes')
      .limit(3);
    return {
      label,
      ok: !error,
      ms: Date.now() - t0,
      httpStatus: status,
      rows: data?.length ?? 0,
      sample: data ?? null,
      error: error
        ? { message: error.message, code: error.code, details: error.details, hint: error.hint }
        : null,
    };
  } catch (e) {
    return {
      label,
      ok: false,
      ms: Date.now() - t0,
      threw: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }
}

export const GET: APIRoute = async () => {
  let urlHost: string | null = null;
  try {
    urlHost = new URL(import.meta.env.PUBLIC_SUPABASE_URL).host;
  } catch {
    // PUBLIC_SUPABASE_URL missing or malformed — reported via env flags below
  }

  const [service, anon] = await Promise.all([
    probe(supabase, 'service-role'),
    // anon 受 RLS 限制，若只有 anon 失敗而 service 正常，多半是 RLS 而非連線問題
    probe(supabaseAnon, 'anon'),
  ]);

  return new Response(
    JSON.stringify(
      {
        time: new Date().toISOString(),
        node: process.version,
        env: {
          PUBLIC_SUPABASE_URL: !!import.meta.env.PUBLIC_SUPABASE_URL,
          PUBLIC_SUPABASE_ANON_KEY: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_ROLE_KEY: !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
          supabaseHost: urlHost,
        },
        service,
        anon,
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );
};
