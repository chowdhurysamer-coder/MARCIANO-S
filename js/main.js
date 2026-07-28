/* Marciano's Pizza Truck — calendar + inquiry form
   No dependencies. The calendar reads availability.json (see loadAvailability
   for the Google Calendar swap point). */

'use strict';

/* ============================================================
   FORM_ENDPOINT — paste a form service URL here (e.g. Formspree).
   Left empty on purpose: no service has been signed up for.
   While empty, the form shows a call/email fallback instead of posting.
   ============================================================ */
const FORM_ENDPOINT = '';

const MONTHS_TO_SHOW = 3;
const SATURDAY = 6;

const monthsEl = document.getElementById('calendar-months');
const liveEl = document.getElementById('calendar-live');
const dateInput = document.getElementById('f-date');
const form = document.getElementById('inquiry-form');
const formStatus = document.getElementById('form-status');

const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- availability ---------- */

async function loadAvailability() {
  /* SWAP POINT: to drive this from a public Google Calendar feed instead,
     replace this fetch with a call to the calendar's public JSON/ICS URL and
     map busy events to an array of ISO 'YYYY-MM-DD' strings. Everything
     downstream only needs that array. */
  try {
    const res = await fetch('availability.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return new Set(data.booked || []);
  } catch (err) {
    // file:// viewing or fetch failure — use the inline fallback data
    const fallback = document.getElementById('availability-fallback');
    if (fallback) {
      try {
        return new Set(JSON.parse(fallback.textContent).booked || []);
      } catch (e) { /* fall through */ }
    }
    return new Set();
  }
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function upcomingSaturdayMonths() {
  // Next MONTHS_TO_SHOW months that still contain a future Saturday.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const months = [];
  let cursor = new Date(today.getFullYear(), today.getMonth(), 1);
  while (months.length < MONTHS_TO_SHOW) {
    const saturdays = [];
    const d = new Date(cursor);
    while (d.getMonth() === cursor.getMonth()) {
      if (d.getDay() === SATURDAY && d >= today) saturdays.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    if (saturdays.length > 0) months.push({ first: new Date(cursor), saturdays });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
}

function buildCalendar(bookedSet) {
  if (!monthsEl) return;
  const fmtMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
  const fmtFull = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  upcomingSaturdayMonths().forEach(({ first, saturdays }) => {
    const monthWrap = document.createElement('div');
    monthWrap.className = 'cal-month';

    const name = document.createElement('h3');
    name.className = 'cal-month-name';
    name.textContent = fmtMonth.format(first);
    monthWrap.appendChild(name);

    const days = document.createElement('div');
    days.className = 'cal-days';
    days.setAttribute('role', 'list');

    saturdays.forEach((sat) => {
      const iso = isoDate(sat);
      const booked = bookedSet.has(iso);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day ' + (booked ? 'is-booked' : 'is-open');
      btn.dataset.date = iso;
      btn.setAttribute('role', 'listitem');
      btn.innerHTML =
        `<span class="cal-num">${sat.getDate()}</span>` +
        `<span class="cal-meta">Sat &middot; ${booked ? 'Booked' : 'Open'}</span>`;
      btn.setAttribute(
        'aria-label',
        `${fmtFull.format(sat)} — ${booked ? 'booked' : 'open, select to inquire'}`
      );
      if (booked) {
        btn.setAttribute('aria-disabled', 'true');
      } else {
        btn.addEventListener('click', () => selectDate(iso, fmtFull.format(sat)));
      }
      days.appendChild(btn);
    });

    monthWrap.appendChild(days);
    monthsEl.appendChild(monthWrap);
  });

  enableArrowKeys();
}

function selectDate(iso, spoken) {
  if (dateInput) dateInput.value = iso;
  if (liveEl) liveEl.textContent = `${spoken} selected. The inquiry form's date field has been filled in.`;
  const target = document.getElementById('inquire');
  if (target) {
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }
  const nameField = document.getElementById('f-name');
  if (nameField) nameField.focus({ preventScroll: true });
}

function enableArrowKeys() {
  // Left/right arrows walk the Saturdays; Tab order is untouched.
  const cells = Array.from(monthsEl.querySelectorAll('.cal-day'));
  cells.forEach((cell, i) => {
    cell.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = cells[i + 1];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = cells[i - 1];
      if (next) {
        e.preventDefault();
        next.focus();
      }
    });
  });
}

/* ---------- inquiry form ---------- */

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    if (!FORM_ENDPOINT) {
      formStatus.innerHTML =
        'The form isn&rsquo;t connected yet. Please call ' +
        '<a href="tel:+16319601271">(631)&nbsp;960-1271</a> or email ' +
        '<a href="mailto:marcianospizzatruck@gmail.com">marcianospizzatruck@gmail.com</a>.';
      return;
    }

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      formStatus.textContent = 'Sent. You’ll hear back to confirm the date.';
    } catch (err) {
      formStatus.innerHTML =
        'Something went wrong sending the form. Please call ' +
        '<a href="tel:+16319601271">(631)&nbsp;960-1271</a> instead.';
    }
  });
}

/* ---------- boot ---------- */

loadAvailability().then(buildCalendar);
