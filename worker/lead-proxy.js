/**
 * Приём заявок с формы → Telegram.
 *
 * Зачем: чтобы токен бота не лежал в коде страницы. Браузер обращается
 * сюда, а токен хранится в переменных окружения Cloudflare и наружу
 * не выходит.
 *
 * Переменные (задаются в панели Cloudflare как Secret):
 *   TG_TOKEN — токен бота из @BotFather
 *   TG_CHAT  — chat_id, куда слать заявки
 *
 * Инструкция по развёртыванию: docs/cloudflare-worker.md
 */

// Домены, которым разрешено обращаться к прослойке
const ALLOWED_ORIGINS = [
  "https://odnastranica.ru",
  "https://www.odnastranica.ru",
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return reply({ ok: false, error: "method" }, 405, origin);
    }
    // запросы с чужих сайтов не обслуживаем
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return reply({ ok: false, error: "origin" }, 403, origin);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return reply({ ok: false, error: "json" }, 400, origin);
    }

    // Ловушка для ботов: поле скрыто от людей, автозаполнялки его заполняют.
    // Отвечаем «успех», чтобы бот не подбирал обход.
    if (data.company) return reply({ ok: true }, 200, origin);

    const cut = (v, n) => String(v ?? "").trim().slice(0, n);
    const name = cut(data.name, 100);
    const contact = cut(data.contact, 100);
    const message = cut(data.message, 1000);

    if (name.length < 2 || contact.length < 3) {
      return reply({ ok: false, error: "validation" }, 400, origin);
    }

    if (!env.TG_TOKEN || !env.TG_CHAT) {
      return reply({ ok: false, error: "not_configured" }, 500, origin);
    }

    const text = [
      "🔔 Заявка с odnastranica.ru",
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      message ? `О бизнесе: ${message}` : null,
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TG_CHAT, text, disable_web_page_preview: true }),
      });
      if (!res.ok) {
        // подробности ошибки наружу не отдаём
        console.log("telegram error", res.status, await res.text());
        return reply({ ok: false, error: "telegram" }, 502, origin);
      }
      return reply({ ok: true }, 200, origin);
    } catch (e) {
      console.log("fetch error", String(e));
      return reply({ ok: false, error: "network" }, 502, origin);
    }
  },
};
