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

/* ---------- табы «что входит» ---------- */
const tabBtns = document.querySelectorAll(".tabs__btn");
const tabPanels = document.querySelectorAll(".tabs__panel");
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", b === btn);
    });
    tabPanels.forEach((p) => {
      const active = p.dataset.panel === btn.dataset.tab;
      p.classList.toggle("is-active", active);
      p.hidden = !active;
    });
  });
});

/* ---------- калькулятор ---------- */
const areaInput = document.getElementById("calc-area");
const areaOut = document.getElementById("calc-area-out");
const windowsCheck = document.getElementById("calc-windows");
const totalOut = document.getElementById("calc-total");
const WINDOWS_PRICE = 1500;

function formatRub(n) {
  return Math.round(n / 100) * 100;
}

function recalc() {
  const area = Number(areaInput.value);
  const typeEl = document.querySelector('input[name="calc-type"]:checked');
  const rate = Number(typeEl.value);
  const min = Number(typeEl.dataset.min);
  let total = Math.max(area * rate, min);
  if (windowsCheck.checked) total += WINDOWS_PRICE;
  areaOut.textContent = `${area} м²`;
  totalOut.textContent = `${formatRub(total).toLocaleString("ru-RU")} ₽`;
}

[areaInput, windowsCheck, ...document.querySelectorAll('input[name="calc-type"]')].forEach(
  (el) => el.addEventListener("input", recalc)
);
recalc();

/* при переходе из калькулятора в форму — подставляем расчёт */
document.getElementById("calc-cta").addEventListener("click", () => {
  const msg = document.getElementById("f-msg");
  if (!msg.value) {
    const typeEl = document.querySelector('input[name="calc-type"]:checked');
    const type = typeEl.closest(".chip").textContent.trim().toLowerCase();
    const windows = windowsCheck.checked ? ", с мытьём окон" : "";
    msg.value = `${areaInput.value} м², ${type}${windows}. Расчёт с сайта: ${totalOut.textContent}`;
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
    "🔔 Заказ уборки с сайта",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    form.message.value.trim() ? `Детали: ${form.message.value.trim()}` : null,
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
    recalc();
    statusEl.textContent = "Заявка получена! Подтвердим заказ в течение 15 минут.";
    statusEl.classList.add("is-ok");
  } catch {
    statusEl.textContent = "Не получилось отправить. Позвоните: +7 999 000-44-55";
    statusEl.classList.add("is-err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Заказать уборку";
  }
});
