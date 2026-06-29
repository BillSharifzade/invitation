/* ============================================================
   Мехрубон & Исмат — логика приглашения
   ============================================================ */

/* >>> Дата свадьбы — отредактируйте при необходимости (год, месяц[0-11], день, час, минута) <<< */
const WEDDING_DATE = new Date(2026, 6, 5, 18, 0); // 5 июля 2026, 18:00

/* >>> Telegram (режим без бэкенда — отправка прямо из браузера) <<<
   ВНИМАНИЕ: токен виден всем в исходниках страницы. Это осознанный выбор для
   простого приглашения. Если токен начнут использовать не по делу — перевыпустите
   его в @BotFather. Пусто = ответы только сохраняются локально (в браузере). */
const TELEGRAM = {
  token: "7884567380:AAFsuceEhSxdDvXg1FtvXvfOALdJCvnMFAM",
  chatIds: ["971104199", "631886740"],
};

/* ---------- Форматирование даты ---------- */
const MONTHS = ["января","февраля","марта","апреля","мая","июня",
                "июля","августа","сентября","октября","ноября","декабря"];

function formatShort(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd} · ${mm} · ${d.getFullYear()}`;
}
function formatLong(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

document.querySelectorAll("[data-wedding-date]").forEach(el => el.textContent = formatShort(WEDDING_DATE));
document.querySelectorAll("[data-wedding-date-long]").forEach(el => el.textContent = formatLong(WEDDING_DATE));

/* ---------- Обратный отсчёт ---------- */
const elDays = document.querySelector("[data-days]");
const elHours = document.querySelector("[data-hours]");
const elMins = document.querySelector("[data-mins]");
const elSecs = document.querySelector("[data-secs]");

function pad(n) { return String(n).padStart(2, "0"); }

function tick() {
  const diff = WEDDING_DATE - new Date();
  if (diff <= 0) {
    [elDays, elHours, elMins, elSecs].forEach(e => e && (e.textContent = "00"));
    return;
  }
  const s = Math.floor(diff / 1000);
  if (elDays) elDays.textContent = Math.floor(s / 86400);
  if (elHours) elHours.textContent = pad(Math.floor((s % 86400) / 3600));
  if (elMins) elMins.textContent = pad(Math.floor((s % 3600) / 60));
  if (elSecs) elSecs.textContent = pad(s % 60);
}
tick();
setInterval(tick, 1000);

/* ---------- Reveal при скролле ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("is-visible");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* ---------- Парящие частицы ---------- */
const particleHost = document.querySelector(".particles");
if (particleHost && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const COUNT = 18;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "vw";
    const size = 3 + Math.random() * 5;
    p.style.width = p.style.height = size + "px";
    p.style.animationDuration = 10 + Math.random() * 16 + "s";
    p.style.animationDelay = -Math.random() * 20 + "s";
    particleHost.appendChild(p);
  }
}

/* ---------- RSVP форма ---------- */
const form = document.getElementById("rsvpForm");
const hint = document.getElementById("rsvpHint");
if (form) {
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const attend = form.attend.value;
    const wish = form.wish.value.trim();
    if (!name || !attend) {
      hint.textContent = "Пожалуйста, заполните имя и выберите ответ.";
      return;
    }

    const payload = { name, attend, wish, at: new Date().toISOString() };
    const thanks = attend === "Буду"
      ? `Спасибо, ${name}! Будем рады видеть вас ❖`
      : `Спасибо за ответ, ${name}. Будем скучать.`;

    // Локальная резервная копия в браузере.
    try {
      const all = JSON.parse(localStorage.getItem("rsvp") || "[]");
      all.push(payload);
      localStorage.setItem("rsvp", JSON.stringify(all));
    } catch (_) {}

    // Если Telegram не настроен — просто благодарим.
    if (!TELEGRAM.token || !TELEGRAM.chatIds.length) {
      hint.textContent = thanks;
      form.reset();
      return;
    }

    // Отправляем ответ напрямую в Telegram (в каждый чат).
    hint.textContent = "Отправляем…";
    if (submitBtn) submitBtn.disabled = true;

    const emoji = attend === "Буду" ? "✅" : "❌";
    const when = new Date().toLocaleString("ru-RU", { timeZone: "Asia/Dushanbe" });
    const text =
      `💌 Новый ответ на приглашение\n\n` +
      `👤 Имя: ${name}\n` +
      `${emoji} Ответ: ${attend}\n` +
      (wish ? `📝 Пожелание: ${wish}\n` : "") +
      `🕒 ${when}`;

    const url = `https://api.telegram.org/bot${TELEGRAM.token}/sendMessage`;
    try {
      const results = await Promise.allSettled(
        TELEGRAM.chatIds.map((chat_id) =>
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id, text }),
          }).then((r) => (r.ok ? r : Promise.reject(r)))
        )
      );
      const ok = results.some((r) => r.status === "fulfilled");
      if (!ok) throw new Error("all sends failed");
      hint.textContent = thanks;
      form.reset();
    } catch (err) {
      hint.textContent = "Не удалось отправить. Попробуйте позже или напишите нам напрямую.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
