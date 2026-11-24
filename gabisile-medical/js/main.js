// Gabisile Medical Facility
// All page content is static HTML (see scripts/build.mjs). This file only adds
// progressive enhancements: mobile menu, booking-form WhatsApp link, reveal
// animations, stat counters and the hero tilt. The site works without it.

const WHATSAPP = "https://wa.me/27663526383?text=";
const $ = (id) => document.getElementById(id);

// Mobile menu
const hd = document.querySelector("header");
const menu = $("menu");
if (hd && menu) {
  menu.addEventListener("click", () => {
    const o = hd.classList.toggle("open");
    menu.setAttribute("aria-expanded", o);
    menu.setAttribute("aria-label", o ? "Close menu" : "Open menu");
  });
  $("mainnav").addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      hd.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open menu");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && hd.classList.contains("open")) {
      hd.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open menu");
      menu.focus();
    }
  });
}

// Booking form (book page only): builds a prefilled WhatsApp link
const form = $("bookform");
if (form) {
  const pick = { day: "Any day", time: "Morning" };
  const link = () => {
    const name = $("f-name").value.trim();
    const service = $("f-service").value;
    let m = "Hi Gabisile Medical, I'd like to book a visit.";
    if (name) m += "\nName: " + name;
    m += "\nService: " + (service || "Not sure yet");
    m += "\nPreferred day: " + pick.day;
    m += "\nTime of day: " + pick.time;
    $("walink").href = WHATSAPP + encodeURIComponent(m);
  };
  const choose = (group, key) => {
    group.addEventListener("click", (e) => {
      const b = e.target.closest(".opt");
      if (!b || b.disabled) return;
      group.querySelectorAll(".opt").forEach((x) => x.setAttribute("aria-pressed", x === b));
      pick[key] = b.textContent;
      if (key === "day") {
        const sat = pick.day === "Sat";
        const aft = [...$("f-time").querySelectorAll(".opt")].find((x) => x.textContent === "Afternoon");
        aft.disabled = sat;
        $("sat-hint").hidden = !sat;
        if (sat && pick.time === "Afternoon") $("f-time").querySelector(".opt").click();
      }
      link();
    });
  };
  form.addEventListener("input", link);
  form.addEventListener("submit", (e) => e.preventDefault());
  choose($("f-day"), "day");
  choose($("f-time"), "time");
  link();
}

// Google reviews: fetched from /api/reviews (see api/reviews.js).
// Everything is built with textContent, never innerHTML, so review text cannot
// inject markup. If the request fails the section just keeps its buttons.
const reviewsRoot = document.querySelector("[data-reviews]");
if (reviewsRoot) {
  const el = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };
  const stars = (n) => {
    const s = el("span", "stars", "★".repeat(n) + "☆".repeat(5 - n));
    s.setAttribute("role", "img");
    s.setAttribute("aria-label", n + " out of 5 stars");
    return s;
  };
  fetch(reviewsRoot.dataset.endpoint, { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || !Array.isArray(data.reviews) || !data.reviews.length) return;

      if (data.rating && data.count) {
        const sum = $q("[data-summary]");
        sum.textContent = "";
        sum.append(
          stars(Math.round(data.rating)),
          el("b", null, " " + data.rating.toFixed(1)),
          document.createTextNode(" out of 5 · " + data.count + (data.count === 1 ? " Google review" : " Google reviews")),
        );
        sum.hidden = false;
      }

      const list = $q("[data-list]");
      data.reviews.forEach((rv) => {
        const card = el("article", "review");
        const top = el("div", "review-top");
        if (rv.photo) {
          const p = el("img", "review-photo");
          p.src = rv.photo;
          p.alt = "";
          p.width = 40;
          p.height = 40;
          p.loading = "lazy";
          p.referrerPolicy = "no-referrer";
          top.append(p);
        } else {
          top.append(el("span", "review-photo review-initial", (rv.author || "?").charAt(0).toUpperCase()));
        }
        const who = el("div", "review-who");
        if (rv.authorUri) {
          const a = el("a", null, rv.author || "Google user");
          a.href = rv.authorUri;
          a.target = "_blank";
          a.rel = "noopener";
          who.append(a);
        } else {
          who.append(el("b", null, rv.author || "Google user"));
        }
        if (rv.when) who.append(el("small", null, rv.when));
        top.append(who);
        card.append(top, stars(rv.rating), el("p", "review-text", rv.text));
        list.append(card);
      });
      list.hidden = false;

      const src = $q("[data-source]");
      if (data.mapsUri) $q("[data-source-link]").href = data.mapsUri;
      src.hidden = false;
    })
    .catch(() => {});
}
function $q(sel) {
  return reviewsRoot.querySelector(sel);
}

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!calm && "IntersectionObserver" in window) {
  // Scroll reveal
  const items = document.querySelectorAll(
    ".head,.frame,.letter,.step,.drip,.iv-ph,.iv-copy,.work .copy,.work .ph,.pair div,.facts > div,.cat-card,.svc,.faq details,.map,form",
  );
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.remove("pre");
          io.unobserve(en.target);
        }
      }),
    { threshold: 0.12 },
  );
  items.forEach((el, i) => {
    if (el.getBoundingClientRect().top > innerHeight) {
      el.classList.add("rv", "pre");
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    }
  });

  // Stat counters
  const nums = document.querySelectorAll(".stats b[data-n]");
  if (nums.length) {
    const co = new IntersectionObserver(
      (es) =>
        es.forEach((en) => {
          if (!en.isIntersecting) return;
          co.unobserve(en.target);
          const el = en.target;
          const end = +el.dataset.n;
          const t0 = performance.now();
          (function tick(t) {
            const p = Math.min(1, (t - t0) / 1400);
            el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          })(t0);
        }),
      { threshold: 0.6 },
    );
    nums.forEach((n) => co.observe(n));
  }

  // Hero portrait tilt (desktop only)
  const pt = document.querySelector(".portrait");
  if (pt && matchMedia("(pointer:fine)").matches) {
    pt.addEventListener("pointermove", (e) => {
      const r = pt.getBoundingClientRect();
      pt.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 8 + "deg");
      pt.style.setProperty("--rx", (0.5 - (e.clientY - r.top) / r.height) * 8 + "deg");
    });
    pt.addEventListener("pointerleave", () => {
      pt.style.setProperty("--rx", "0deg");
      pt.style.setProperty("--ry", "0deg");
    });
  }
}
