/* ============================================================
   Мехрубон & Исмат — логика приглашения
   ============================================================ */

/* >>> Дата свадьбы — отредактируйте при необходимости (год, месяц[0-11], день, час, минута) <<< */
const WEDDING_DATE = new Date(2026, 8, 12, 16, 0); // 12 сентября 2026, 16:00

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
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const attend = form.attend.value;
    if (!name || !attend) {
      hint.textContent = "Пожалуйста, заполните имя и выберите ответ.";
      return;
    }
    // Сохраняем локально и показываем благодарность.
    // Чтобы получать ответы на почту, замените блок ниже на отправку (mailto / Formspree / Google Forms).
    try {
      const data = { name, attend, guests: form.guests.value, wish: form.wish.value, at: new Date().toISOString() };
      const all = JSON.parse(localStorage.getItem("rsvp") || "[]");
      all.push(data);
      localStorage.setItem("rsvp", JSON.stringify(all));
    } catch (_) {}

    hint.textContent = attend === "Буду"
      ? `Спасибо, ${name}! Будем рады видеть вас ❖`
      : `Спасибо за ответ, ${name}. Будем скучать.`;
    form.reset();
  });
}
