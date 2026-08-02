/* ============================================================
   ЗАЯВКИ С ФОРМЫ → TELEGRAM

   Как заполнить (подробно — в docs/telegram-bot.md):
   1. В Telegram написать @BotFather → /newbot → получить токен
   2. Написать своему боту любое сообщение
   3. Открыть https://api.telegram.org/bot<ТОКЕН>/getUpdates
      и найти "chat":{"id":ЧИСЛО} — это chatId
   4. Вписать оба значения ниже и запушить

   Пока значения пустые, форма НЕ делает вид, что отправила заявку,
   а честно предлагает написать напрямую — чтобы не потерять клиента.
   ============================================================ */
const TG_CONFIG = {
  botToken: "",
  chatId: "",
};

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

  const text = [
    "🔔 Заявка с odnastranica.ru",
    `Имя: ${name}`,
    `Контакт: ${contact}`,
    form.message.value.trim() ? `О бизнесе: ${form.message.value.trim()}` : null,
  ].filter(Boolean).join("\n");

  // Бот ещё не настроен — не притворяемся, что отправили
  if (!TG_CONFIG.botToken || !TG_CONFIG.chatId) {
    setStatus("Форма пока не подключена. Напишите, пожалуйста, в Telegram — отвечу сразу.", "err");
    window.open(TELEGRAM_URL, "_blank", "noopener");
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Отправляем…";

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_CONFIG.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CONFIG.chatId, text }),
    });
    if (!res.ok) throw new Error("telegram " + res.status);

    form.reset();
    setStatus("Заявка отправлена! Отвечу в течение пары часов.", "ok");
    if (typeof ym === "function") ym(METRIKA_ID, "reachGoal", "lead");
  } catch {
    setStatus("Не получилось отправить. Напишите в Telegram — отвечу сразу.", "err");
    window.open(TELEGRAM_URL, "_blank", "noopener");
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
});
