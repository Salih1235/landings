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

/* ---------- калькулятор ---------- */
const areaInput = document.getElementById("calc-area");
const areaOut = document.getElementById("calc-area-out");
const bathCheck = document.getElementById("calc-bath");
const totalOut = document.getElementById("calc-total");
const BATH_PRICE = 120000;

function formatRub(n) {
  // округляем до 5 тысяч, чтобы цифры выглядели как оценка, а не точный счёт
  const rounded = Math.round(n / 5000) * 5000;
  return rounded.toLocaleString("ru-RU");
}

function recalc() {
  const area = Number(areaInput.value);
  const rate = Number(document.querySelector('input[name="calc-type"]:checked').value);
  let base = area * rate;
  if (bathCheck.checked) base += BATH_PRICE;
  areaOut.textContent = `${area} м²`;
  totalOut.textContent = `${formatRub(base * 0.95)} – ${formatRub(base * 1.1)} ₽`;
}

[areaInput, bathCheck, ...document.querySelectorAll('input[name="calc-type"]')].forEach(
  (el) => el.addEventListener("input", recalc)
);
recalc();

/* при переходе из калькулятора в форму — подставляем расчёт в комментарий */
document.getElementById("calc-cta").addEventListener("click", () => {
  const msg = document.getElementById("f-msg");
  if (!msg.value) {
    const area = areaInput.value;
    const type = document.querySelector('input[name="calc-type"]:checked')
      .closest(".chip").textContent.trim();
    const bath = bathCheck.checked ? ", санузел под ключ" : "";
    msg.value = `Квартира ${area} м², ${type.toLowerCase()} ремонт${bath}. Расчёт с сайта: ${totalOut.textContent}`;
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
