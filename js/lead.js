/* ============================================================
   ЗАЯВКИ С ФОРМЫ

   Форма отправляет данные не в Telegram напрямую, а на прослойку
   Cloudflare Worker — там лежит токен бота, и в код страницы он
   не попадает. Код прослойки: worker/lead-proxy.js
   Развёртывание: docs/cloudflare-worker.md

   Ниже — адрес развёрнутого воркера. Пока пусто, форма не делает
   вид, что отправила заявку, а отправляет человека в Telegram.
   ============================================================ */
const LEAD_ENDPOINT = "";

const METRIKA_ID = 111244786;
const TELEGRAM_URL = "https://t.me/jafarovsalih";

/* ---------- цели Метрики на клики по контактам ---------- */
document.querySelectorAll("[data-goal]").forEach((el) => {
  el.addEventListener("click", () => {
    if (typeof ym === "function") ym(METRIKA_ID, "reachGoal", el.dataset.goal);
  });
});

/* ---------- форма ---------- */
const form = document.getElementById("lead-form");
const statusEl = document.getElementById("form-status");

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = "form__status" + (kind ? " is-" + kind : "");
}

function fallbackToTelegram(text) {
  setStatus(text, "err");
  window.open(TELEGRAM_URL, "_blank", "noopener");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const name = form.name.value.trim();
  const contact = form.contact.value.trim();

  if (name.length < 2) {
    setStatus("Напишите, как к вам обращаться.", "err");
    form.name.focus();
    return;
  }
  // телефон (от 10 цифр) или ник в Telegram
  const digits = contact.replace(/\D/g, "").length;
  const isNick = /^@?[a-zA-Z0-9_]{4,}$/.test(contact);
  if (digits < 10 && !isNick) {
    setStatus("Оставьте телефон или ник в Telegram — иначе не смогу ответить.", "err");
    form.contact.focus();
    return;
  }
  if (!form.consent.checked) {
    setStatus("Нужно согласие на обработку данных.", "err");
    return;
  }

  if (!LEAD_ENDPOINT) {
    fallbackToTelegram("Форма пока не подключена. Напишите, пожалуйста, в Telegram — отвечу сразу.");
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Отправляем…";

  try {
    const res = await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        contact,
        message: form.message.value.trim(),
        company: form.company.value, // ловушка для ботов, человек её не видит
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || res.status);

    form.reset();
    setStatus("Заявка отправлена! Отвечу в течение пары часов.", "ok");
    if (typeof ym === "function") ym(METRIKA_ID, "reachGoal", "lead");
  } catch {
    fallbackToTelegram("Не получилось отправить. Напишите в Telegram — отвечу сразу.");
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
});
