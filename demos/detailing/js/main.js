/* Настройка отправки заявок — см. template/README.md */
const TG_CONFIG = { botToken: "", chatId: "" };

/* ---------- мобильное меню ---------- */
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }
});

/* ---------- появление при скролле ---------- */
const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

/* ---------- слайдер до/после ---------- */
const ba = document.getElementById("ba");
const baRange = document.getElementById("ba-range");
baRange.addEventListener("input", () => {
  ba.style.setProperty("--pos", baRange.value + "%");
});

/* ---------- форма заявки ---------- */
const form = document.getElementById("lead-form");
const statusEl = document.getElementById("form-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.className = "form__status";

  const name = form.name.value.trim();
  const phone = form.phone.value.trim();

  if (!name || phone.replace(/\D/g, "").length < 10) {
    statusEl.textContent = "Проверьте имя и номер телефона.";
    statusEl.classList.add("is-err");
    return;
  }
  if (!form.consent.checked) {
    statusEl.textContent = "Нужно согласие на обработку данных.";
    statusEl.classList.add("is-err");
    return;
  }

  const text = [
    "🔔 Запись с сайта (детейлинг)",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    form.message.value.trim() ? `Авто/услуга: ${form.message.value.trim()}` : null,
  ].filter(Boolean).join("\n");

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Отправляем…";

  try {
    if (TG_CONFIG.botToken && TG_CONFIG.chatId) {
      const res = await fetch(`https://api.telegram.org/bot${TG_CONFIG.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TG_CONFIG.chatId, text }),
      });
      if (!res.ok) throw new Error("tg error");
    }
    form.reset();
    statusEl.textContent = "Записали! Перезвоним, чтобы подтвердить время.";
    statusEl.classList.add("is-ok");
  } catch {
    statusEl.textContent = "Не получилось отправить. Напишите нам в WhatsApp или Telegram.";
    statusEl.classList.add("is-err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Записаться на осмотр";
  }
});
