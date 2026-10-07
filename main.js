/* ── DRINKS: scroll-driven panel switcher ─────────────────────────────── */
const wrapper    = document.getElementById('drinks-wrapper');
const panels     = document.querySelectorAll('.drink-panel');
const navItems   = document.querySelectorAll('.drink-nav-item');
const drinkNav   = document.getElementById('drink-nav');
const NUM        = panels.length;
let   currentDrink = -1;

function activateDrink(index) {
  if (index === currentDrink) return;
  currentDrink = index;

  panels.forEach((p, i) => {
    const isActive = i === index;
    p.classList.toggle('active', isActive);
    if (isActive) triggerIngredients(p);
  });

  navItems.forEach((item, i) => item.classList.toggle('active', i === index));

  wrapper.style.backgroundColor = panels[index].dataset.color;
}

function triggerIngredients(panel) {
  const items = panel.querySelectorAll('.drink-ingredients li');
  items.forEach(li => li.classList.remove('visible'));
  items.forEach((li, i) => {
    setTimeout(() => li.classList.add('visible'), 120 * i + 80);
  });
}

/* map scroll position inside wrapper to drink index */
let wrapTop = 0, wrapHeight = 0, viewH = window.innerHeight, ticking = false;

function measure() {
  viewH      = window.innerHeight;
  wrapHeight = wrapper.offsetHeight;
  wrapTop    = wrapper.getBoundingClientRect().top + window.scrollY;
}

function onScroll() {
  ticking = false;
  const top        = wrapTop - window.scrollY;           /* rect.top, sem forçar layout */
  const scrollable = wrapHeight - viewH;
  const scrolled   = Math.max(0, -top);
  const progress   = Math.min(1, scrolled / scrollable);

  /*
    Each drink occupies an equal slice of progress [0, 1).
    Clamp to NUM-1 so the last drink stays active until the
    wrapper fully leaves the viewport on the way down.
  */
  const index = Math.min(NUM - 1, Math.floor(progress * NUM));

  const inView = top < viewH && top + wrapHeight > 0;
  drinkNav.classList.toggle('visible', inView);

  if (inView) activateDrink(index);
}

function requestTick() {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}

window.addEventListener('scroll', requestTick, { passive: true });
window.addEventListener('resize', () => { measure(); requestTick(); });
window.addEventListener('load', () => { measure(); requestTick(); });

/* dot click → scroll to corresponding progress position */
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const idx      = parseInt(item.dataset.index, 10);
    const scrollable = wrapHeight - viewH;
    /* centre each drink in its slice */
    const target   = wrapTop + (idx / NUM) * scrollable + scrollable / NUM / 2;
    window.scrollTo({ top: target, behavior: 'smooth' });
  });
});

/* init on load */
triggerIngredients(panels[0]);
activateDrink(0);
measure();
onScroll();

/* ── AGENDA ────────────────────────────────────────────────────────────── */
const agendaTabs    = document.querySelectorAll('.agenda-tab');
const agendaDetails = document.querySelectorAll('.agenda-detail');

function activateAgenda(idx) {
  agendaTabs.forEach((t, i)    => t.classList.toggle('active', i === idx));
  agendaDetails.forEach((d, i) => d.classList.toggle('active', i === idx));
  document.querySelectorAll('.cal-event').forEach(btn => {
    btn.classList.toggle('active', +btn.dataset.idx === idx);
  });
}

agendaTabs.forEach(tab => {
  tab.addEventListener('click', () => activateAgenda(+tab.dataset.idx));
});

/* build full calendar from event dates */
(function buildCalendar() {
  const cal = document.getElementById('agenda-calendar');
  if (!cal) return;

  const eventMap = {};
  agendaTabs.forEach(t => {
    const d = new Date(t.dataset.date + 'T00:00:00');
    eventMap[d.getDate()] = +t.dataset.idx;
  });

  const ref          = new Date(agendaTabs[0].dataset.date + 'T00:00:00');
  const year         = ref.getFullYear();
  const month        = ref.getMonth();
  const monthNames   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const dayNames     = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = new Date(year, month, 1).getDay();

  let html = `<p class="cal-month-label">${monthNames[month]} · ${year}</p><div class="cal-grid">`;

  dayNames.forEach(d => { html += `<div class="cal-day-name">${d}</div>`; });
  for (let i = 0; i < firstWeekDay; i++) { html += `<div class="cal-cell cal-empty"></div>`; }

  for (let d = 1; d <= daysInMonth; d++) {
    if (d in eventMap) {
      html += `<button class="cal-cell cal-event" data-idx="${eventMap[d]}">${d}</button>`;
    } else {
      html += `<div class="cal-cell">${d}</div>`;
    }
  }

  html += '</div>';
  cal.innerHTML = html;

  cal.querySelectorAll('.cal-event').forEach(btn => {
    btn.addEventListener('click', () => activateAgenda(+btn.dataset.idx));
  });
})();

/* pre-select the closest upcoming event (after calendar is built) */
(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates   = Array.from(agendaTabs).map(t => new Date(t.dataset.date + 'T00:00:00'));
  const nextIdx = dates.findIndex(d => d >= today);
  activateAgenda(nextIdx >= 0 ? nextIdx : dates.length - 1);
})();

/* ── INTERSECTION OBSERVER: fade-in-up ────────────────────────────────── */
const fadeEls = document.querySelectorAll('.fade-in-up');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeEls.forEach(el => fadeObserver.observe(el));
