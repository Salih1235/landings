/* ============================================================
   НАСТРОЙКА ОТПРАВКИ ЗАЯВОК
   Для боевого сайта: создать бота через @BotFather, получить
   токен и chat_id клиента, вписать сюда. Пока пусто — форма
   работает в демо-режиме (показывает успех без отправки).
   ============================================================ */
const TG_CONFIG = {
  botToken: "",   // токен бота, например "123456:ABC-DEF..."
  chatId: "",     // id чата клиента, например "-100123456789"
};

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

/* ---------- появление секций при скролле ---------- */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

/* ---------- калькулятор выезда ---------- */
const kmInput = document.getElementById("calc-km");
const kmOut = document.getElementById("calc-km-out");
const nightCheck = document.getElementById("calc-night");
const parkCheck = document.getElementById("calc-park");
const totalOut = document.getElementById("calc-total");

const PER_KM = 45;      // рубли за километр за городом, в обе стороны
const NIGHT_FEE = 700;
const PARK_FEE = 1000;

function recalc() {
  const km = Number(kmInput.value);
  const base = Number(document.querySelector('input[name="kind"]:checked').value);
  let total = base + km * PER_KM;
  if (nightCheck.checked) total += NIGHT_FEE;
  if (parkCheck.checked) total += PARK_FEE;

  kmOut.textContent = km === 0 ? "по городу" : `${km} км`;
  totalOut.textContent = `${total.toLocaleString("ru-RU")} ₽`;
}

[kmInput, nightCheck, parkCheck, ...document.querySelectorAll('input[name="kind"]')].forEach(
  (el) => el.addEventListener("input", recalc)
);
recalc();

/* при переходе из калькулятора в форму — подставляем расчёт в комментарий */
document.getElementById("calc-cta").addEventListener("click", () => {
  const msg = document.getElementById("f-msg");
  if (!msg.value) {
    const km = Number(kmInput.value);
    const kind = document.querySelector('input[name="kind"]:checked')
      .closest(".chip").textContent.trim();
    const where = km === 0 ? "по городу" : `за город, ${km} км`;
    const night = nightCheck.checked ? ", ночной вызов" : "";
    const park = parkCheck.checked ? ", из паркинга" : "";
    msg.value = `${kind}, ${where}${night}${park}. Расчёт с сайта: ${totalOut.textContent}`;
  }
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
    "🔔 Заявка с сайта",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    form.message.value.trim() ? `Комментарий: ${form.message.value.trim()}` : null,
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
    statusEl.textContent = "Заявка отправлена! Перезвоним в течение часа в рабочее время.";
    statusEl.classList.add("is-ok");
  } catch {
    statusEl.textContent = "Не получилось отправить. Напишите нам в WhatsApp или Telegram.";
    statusEl.classList.add("is-err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Получить бесплатную смету";
  }
});
