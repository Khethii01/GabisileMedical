// Static site generator for Gabisile Medical Facility.
// Zero dependencies. Run from the project folder:  node scripts/build.mjs
// Writes every page as <folder>/index.html plus sitemap.xml, robots.txt,
// site.webmanifest and 404.html.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES, FAQ, IMAGES, SERVICES, SITE, googleUrls, slug, waLink } from "./site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = new Date().toISOString().slice(0, 10);
const TODAY_LONG = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ARROW =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';
const WA_ICON =
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/></svg>';

const catByKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
const servicesIn = (key) => SERVICES.filter((s) => s[0] === key);
const bookMsg = (t) => waLink(`Hi Gabisile Medical, I'd like to book: ${t}.`);
const addr = SITE.address;
const addrLines = [addr.suite, addr.street, addr.locality];

/* ---------- context: relative URLs so the site works on any host/path ---------- */
function makeCtx(path) {
  const depth = path.split("/").filter(Boolean).length;
  const prefix = "../".repeat(depth);
  return {
    // link to another page by folder path ("" = home)
    u: (p = "", hash = "") => (p ? `${prefix}${p}/` : prefix || "./") + hash,
    // link to a static asset
    a: (p) => prefix + p,
  };
}
const absUrl = (path) => `${SITE.url}/${path ? path + "/" : ""}`;
const absAsset = (p) => `${SITE.url}/${p}`;

/* ---------- structured data ---------- */
const CLINIC_ID = `${SITE.url}/#clinic`;
function clinicLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": CLINIC_ID,
    name: SITE.name,
    url: `${SITE.url}/`,
    description:
      "Nurse-led private clinic in Isipingo, Durban offering consultations, mother and child care, screening tests, pre-employment medicals and IV drips.",
    image: absAsset(SITE.ogImage),
    logo: absAsset(IMAGES.logo.src),
    telephone: SITE.phoneIntl,
    email: SITE.email,
    identifier: SITE.practiceNo,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${addr.suite}, ${addr.street}`,
      addressLocality: addr.locality,
      addressRegion: addr.region,
      addressCountry: addr.country,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`,
    areaServed: [
      { "@type": "City", name: "Isipingo" },
      { "@type": "City", name: "Durban" },
    ],
    openingHoursSpecification: SITE.hours
      .filter((h) => !h.closed)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    availableService: SERVICES.map((s) => ({ "@type": "MedicalProcedure", name: s[1] })),
  };
}
const breadcrumbLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.label,
    item: absUrl(it.path),
  })),
});
const faqLd = (qa) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: qa.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
});
const serviceListLd = (name, services) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  itemListElement: services.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: s[1],
      description: s[2],
      provider: { "@id": CLINIC_ID },
      areaServed: { "@type": "City", name: "Isipingo" },
    },
  })),
});

/* ---------- shared fragments ---------- */
function headHtml(page, ctx) {
  const canonical = absUrl(page.path);
  const image = absAsset(page.image || SITE.ogImage);
  const ld = (page.schema || []).map((o) => `    <script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n");
  return `<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}" />
    <meta name="robots" content="${page.noindex ? "noindex,follow" : "index,follow,max-image-preview:large"}" />
    <meta name="geo.region" content="ZA-NL" />
    <meta name="geo.placename" content="Isipingo, Durban" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(SITE.name)}" />
    <meta property="og:locale" content="en_ZA" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(page.title)}" />
    <meta name="twitter:description" content="${esc(page.description)}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="theme-color" content="${SITE.themeColor}" />
    <link rel="icon" type="image/png" sizes="32x32" href="${ctx.a("icons/favicon-32.png")}" />
    <link rel="apple-touch-icon" sizes="180x180" href="${ctx.a("icons/apple-touch-icon.png")}" />
    <link rel="manifest" href="${ctx.a("site.webmanifest")}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400;1,6..96,500&family=Jost:wght@300;400;500;600&display=swap"
    />
    <link rel="stylesheet" href="${ctx.a("css/styles.css")}" />
    <script src="${ctx.a("js/main.js")}" defer></script>
${ld}
  </head>`;
}

const NAV = [
  { key: "about", label: "Your nurse", path: "about" },
  { key: "services", label: "Services", path: "services" },
  { key: "drips", label: "IV drips", path: "iv-drips" },
  { key: "employers", label: "Employers", path: "employers" },
  { key: "faq", label: "FAQ", path: "faq" },
  { key: "visit", label: "Find us", path: "find-us" },
];

function headerHtml(page, ctx) {
  const links = NAV.map(
    (n) =>
      `<a href="${ctx.u(n.path)}"${page.nav === n.key ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`,
  ).join("\n          ");
  return `<header>
      <div class="wrap nav">
        <a class="brand" href="${ctx.u()}" aria-label="${esc(SITE.name)}, home">
          <img src="${ctx.a(IMAGES.logo.src)}" alt="" width="46" height="46" />
          <span><b>${esc(SITE.name)}</b><small>${esc(SITE.tagline)}</small></span>
        </a>
        <nav class="links" id="mainnav" aria-label="Main">
          ${links}
          <a class="btn btn-brass" href="${ctx.u("book")}"${page.nav === "book" ? ' aria-current="page"' : ""}><span>Book a visit</span></a>
        </nav>
        <button class="menu-btn" id="menu" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mainnav">
          <i></i>
        </button>
      </div>
    </header>`;
}

function footerHtml(ctx) {
  const hoursRows = SITE.hours
    .map((h) => `<li><span>${esc(h.label)}</span> ${h.closed ? "Closed" : `${h.opens} to ${h.closes}`}</li>`)
    .join("");
  const svcLinks = CATEGORIES.map((c) => `<li><a href="${ctx.u(c.path)}">${esc(c.nav)}</a></li>`).join("");
  return `<footer>
      <div class="wrap foot">
        <div class="foot-brand">
          <a class="brand" href="${ctx.u()}" aria-label="${esc(SITE.name)}, home">
            <img src="${ctx.a(IMAGES.logo.src)}" alt="" width="46" height="46" loading="lazy" />
            <span><b>${esc(SITE.name)}</b><small>${esc(SITE.tagline)}</small></span>
          </a>
          <p>Nurse-led private clinic in Isipingo, Durban.</p>
        </div>
        <nav aria-label="Services">
          <h2>Services</h2>
          <ul>${svcLinks}</ul>
        </nav>
        <nav aria-label="Footer">
          <h2>Clinic</h2>
          <ul>
            <li><a href="${ctx.u("about")}">Your nurse</a></li>
            <li><a href="${ctx.u("faq")}">FAQ</a></li>
            <li><a href="${ctx.u("reviews")}">Reviews</a></li>
            <li><a href="${googleUrls().write}" target="_blank" rel="noopener">Review us on Google</a></li>
            <li><a href="${ctx.u("book")}">Book a visit</a></li>
            <li><a href="${ctx.u("find-us")}">Find us</a></li>
          </ul>
        </nav>
        <div>
          <h2>Contact</h2>
          <address>
            ${addrLines.map(esc).join("<br />")}<br />
            <a href="tel:${SITE.phoneIntl}">${SITE.phoneDisplay}</a><br />
            <a href="mailto:${SITE.email}">${SITE.email}</a>
          </address>
          <ul class="foot-hours">${hoursRows}</ul>
        </div>
      </div>
      <div class="wrap foot-bottom">
        <span><b>${esc(SITE.name)}</b> · Practice no. ${SITE.practiceNo}</span>
        <span>Emergency? Call <b>10177</b> or go to your nearest emergency unit.</span>
        <span>
          © ${new Date().getFullYear()}. This site gives general information and doesn't replace a consultation.
          <a href="${ctx.u("privacy-policy")}">Privacy</a> · <a href="${ctx.u("terms")}">Terms</a>
        </span>
      </div>
    </footer>`;
}

const waFab = `<a class="wa" target="_blank" rel="noopener" href="${SITE.whatsapp}" aria-label="WhatsApp the clinic">${WA_ICON}</a>`;

function pageHero(ctx, { eyebrow, h1, intro, crumbs }) {
  const trail = crumbs
    .map((c, i) =>
      i === crumbs.length - 1
        ? `<li aria-current="page">${esc(c.label)}</li>`
        : `<li><a href="${ctx.u(c.path)}">${esc(c.label)}</a></li>`,
    )
    .join("");
  return `<div class="page-hero">
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb"><ol>${trail}</ol></nav>
          <span class="eyebrow">${esc(eyebrow)}</span>
          <h1>${h1}</h1>
          <p>${esc(intro)}</p>
        </div>
      </div>`;
}

function ctaBand(ctx, heading = "Ready when you are.", text = "Book on WhatsApp, call, or just walk in during clinic hours.") {
  return `<section class="cta-band">
        <div class="wrap">
          <div>
            <h2>${heading}</h2>
            <p>${esc(text)}</p>
          </div>
          <div class="cta">
            <a class="btn btn-brass" href="${ctx.u("book")}"><span>Book a visit</span>${ARROW}</a>
            <a class="btn btn-ghost" href="tel:${SITE.phoneIntl}"><span>Call ${SITE.phoneDisplay}</span></a>
          </div>
        </div>
      </section>`;
}

const hoursLine = `<div class="hours">${SITE.hours
  .map((h) => `<span><b>${esc(h.label)}</b> ${h.closed ? "closed" : `${h.opens} to ${h.closes}`}</span>`)
  .join("")}</div>`;

function reviewsSection(ctx, { standalone = false } = {}) {
  const g = googleUrls();
  const head = standalone
    ? ""
    : `<div class="head">
            <span class="eyebrow">Reviews</span>
            <h2>What patients <em>say</em></h2>
          </div>`;
  return `<section class="reviews on-light" id="reviews" data-reviews data-endpoint="${ctx.a("api/reviews")}">
        <div class="wrap">
          ${head}
          <p class="rating-line" data-summary hidden></p>
          <div class="review-grid" data-list hidden></div>
          <p class="review-source" data-source hidden>Reviews from <a href="${g.read}" target="_blank" rel="noopener" data-source-link>Google Maps</a>, shown as posted.</p>
          <div class="cta review-cta">
            <a class="btn btn-green" target="_blank" rel="noopener" href="${g.write}"><span>Review us on Google</span>${ARROW}</a>
            <a class="btn btn-line" target="_blank" rel="noopener" href="${g.read}"><span>Read all reviews on Google</span></a>
          </div>
        </div>
      </section>`;
}

function img(ctx, im, alt, { eager = false, cls = "" } = {}) {
  return `<img src="${ctx.a(im.src)}" alt="${esc(alt)}" width="${im.w}" height="${im.h}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}${cls ? ` class="${cls}"` : ""} />`;
}

function serviceArticles(list) {
  return list
    .map(
      (s) => `<article class="svc" id="${slug(s[1])}">
            <div class="svc-body">
              <h2>${esc(s[1])}</h2>
              <p>${esc(s[2])}</p>
              ${s[3] ? `<p class="note">${esc(s[3])}</p>` : ""}
            </div>
            <a class="btn btn-line" target="_blank" rel="noopener" href="${bookMsg(s[1])}"><span>Book this on WhatsApp</span>${ARROW}</a>
          </article>`,
    )
    .join("\n          ");
}

const STEPS = [
  ["Book, or just walk in", "WhatsApp, call or turn up. All of them work."],
  ["Sit down with the nurse", "She asks, listens and examines. Bring your clinic card and any medication you're taking."],
  ["Leave with a plan", "Treatment on the spot where possible. A referral when it needs a doctor, a scan or a hospital."],
  ["We check in", "For ongoing things like blood pressure or pregnancy, your next visit is booked before you go."],
];
const stepsHtml = `<div class="steps">
            ${STEPS.map((s, i) => `<div class="step"><b>${i + 1}</b><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join("\n            ")}
          </div>`;

const NURSE_P1 =
  "With over 30 years of experience in healthcare, I bring extensive local and international clinical expertise to Gabisile Medical Facility. My nursing career has taken me from Saudi Arabia and Libya to 13 years with Royal Caribbean Cruises in Miami, where I worked alongside highly experienced medical professionals from over 20 countries.";
const NURSE_P2 =
  "Today, I bring this wealth of experience, knowledge and compassionate care to my patients at Gabisile Medical Facility.";

/* ---------- page bodies ---------- */
function homeBody(ctx) {
  const cards = CATEGORIES.map(
    (c) => `<a class="cat-card" href="${ctx.u(c.path)}">
              <h3>${esc(c.nav === "Employers" ? "Work medicals & PDP" : c.nav)}</h3>
              <p>${esc(c.blurb)}</p>
              <span class="more"><span>Explore</span><b>${ARROW}</b></span>
            </a>`,
  ).join("\n            ");
  const drips = servicesIn("IV drips")
    .map((s) => `<a class="drip" href="${ctx.u("iv-drips", "#" + slug(s[1]))}"><h3>${esc(s[1])}</h3><span>Learn more</span></a>`)
    .join("");
  return `<div class="hero">
        <div class="wrap">
          <div class="hero-copy">
            <span class="eyebrow">Nurse-led private clinic, Isipingo</span>
            <h1>Private nurse clinic in Isipingo that knows <em>your name.</em></h1>
            <p>
              You walk in and you're greeted with a smile. Then you sit down with a private nurse practitioner
              who isn't watching the clock. That's the whole idea.
            </p>
            <div class="cta">
              <a class="btn btn-brass" href="${ctx.u("book")}"><span>Book a visit</span>${ARROW}</a>
              <a class="btn btn-ghost" href="${ctx.u("services")}"><span>See our services</span></a>
            </div>
            ${hoursLine}
          </div>
          <div class="portrait">
            <div class="arch">
              ${img(ctx, IMAGES.reception, "The clinic's private nurse practitioner standing at the Gabisile reception desk, smiling", { eager: true })}
            </div>
            <span class="caption">Private Nurse Practitioner</span>
            <div class="seal" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs><path id="ring" d="M60 60m-50 0a50 50 0 1 1 100 0a50 50 0 1 1-100 0" /></defs>
                <text><textPath href="#ring">Your health · Our priority · Your health · Our priority ·</textPath></text>
              </svg>
              <img src="${ctx.a(IMAGES.logo.src)}" alt="" width="60" height="60" />
            </div>
          </div>
        </div>
      </div>

      <div class="marquee" aria-hidden="true">
        <div>
          ${["Consultations", "Antenatal care", "Immunisations", "Family planning", "Wound care", "Ear care", "Screening tests", "IV drips", "Work medicals"]
            .concat(["Consultations", "Antenatal care", "Immunisations", "Family planning", "Wound care", "Ear care", "Screening tests", "IV drips", "Work medicals"])
            .map((t) => `<span>${t}</span><i>✦</i>`)
            .join("")}
        </div>
      </div>

      <section class="nurse on-light">
        <div class="wrap">
          <div class="frame"><div class="ph">${img(ctx, IMAGES.portrait, "The nurse at the front desk in her white uniform and maroon epaulettes, laughing")}</div></div>
          <div class="letter">
            <span class="eyebrow">Your nurse</span>
            <h2>Hello. I'm the one <em>you'll see.</em></h2>
            <p class="lead">I run this clinic the way I'd want my own family treated.</p>
            <p>With over 30 years in healthcare, including 13 years with Royal Caribbean Cruises, I bring local and international experience to every visit.</p>
            <div class="cta"><a class="btn btn-line" href="${ctx.u("about")}"><span>Meet your nurse</span>${ARROW}</a></div>
          </div>
        </div>
      </section>

      <section class="services on-light">
        <div class="wrap">
          <div class="head">
            <span class="eyebrow">Services</span>
            <h2>What we can do <em>for you</em></h2>
            <p>Everything is done by a private nurse practitioner, in one calm room, without the rush.</p>
          </div>
          <div class="cat-grid">
            ${cards}
          </div>
        </div>
      </section>

      <section class="on-light" id="how">
        <div class="wrap">
          <div class="head">
            <span class="eyebrow">How a visit goes</span>
            <h2>Simple. <em>On purpose.</em></h2>
          </div>
          ${stepsHtml}
        </div>
      </section>

      <section class="iv">
        <div class="wrap">
          <div class="iv-ph">${img(ctx, IMAGES.iv, "Two patients relaxing during IV drips while the nurse checks on them")}</div>
          <div class="iv-copy">
            <span class="eyebrow">IV drips</span>
            <h2>Sit back. <em>Rehydrate.</em></h2>
            <p>Four drips, one rule. The nurse checks you first: blood pressure, medical history, allergies. If a drip isn't right for you, she'll tell you.</p>
            <div class="drips">${drips}</div>
          </div>
        </div>
      </section>

      <section class="work on-light">
        <div class="wrap">
          <div class="copy">
            <span class="eyebrow">For employers</span>
            <h2>Your people, <em>looked after.</em></h2>
            <p>We do pre-employment medicals and routine medical surveillance at the clinic. We also come to you, with wellness days at your premises and blood pressure and glucose checks done on site.</p>
            <div class="cta"><a class="btn btn-green" href="${ctx.u("employers")}"><span>Employer services</span>${ARROW}</a></div>
          </div>
          <div class="ph">${img(ctx, IMAGES.wellness, "The nurse taking a blood pressure reading at a company wellness day")}</div>
        </div>
      </section>

      ${reviewsSection(ctx)}

      ${ctaBand(ctx)}

      <section class="find on-light">
        <div class="wrap">
          <div>
            <div class="head">
              <span class="eyebrow">Find us</span>
              <h2>Suite 6, <em>Keerath Centre</em></h2>
            </div>
            ${factsHtml(ctx)}
            <div class="cta" style="margin-top: 36px">
              <a class="btn btn-line" href="${ctx.u("find-us")}"><span>Directions and contact</span>${ARROW}</a>
            </div>
          </div>
          <div class="pair">
            <div>${img(ctx, IMAGES.desk, "The Gabisile reception desk with the clinic crest")}</div>
            <div>${img(ctx, IMAGES.waiting, "The nurse seated in the waiting area")}</div>
          </div>
        </div>
      </section>`;
}

function factsHtml() {
  const rows = SITE.hours
    .map((h) => `<tr><td>${esc(h.label)}</td><td>${h.closed ? "Closed" : `${h.opens} to ${h.closes}`}</td></tr>`)
    .join("");
  return `<div class="facts">
              <div><h3>Address</h3><p>${addrLines.map(esc).join("<br />")}</p></div>
              <div><h3>Hours</h3><table>${rows}</table></div>
              <div><h3>Good to know</h3><p>We're in the Isipingo Hospital building, facing the parking area. Pharmacy next door.</p></div>
              <div><h3>Call or WhatsApp</h3><p><a href="tel:${SITE.phoneIntl}">${SITE.phoneDisplay}</a><br /><a href="mailto:${SITE.email}">${SITE.email}</a></p></div>
            </div>`;
}

function aboutBody(ctx) {
  return `${pageHero(ctx, {
    eyebrow: "Your nurse",
    h1: "Your nurse practitioner <em>in Isipingo.</em>",
    intro: "A private nurse practitioner with over 30 years of experience, here in Isipingo.",
    crumbs: [{ label: "Home", path: "" }, { label: "Your nurse" }],
  })}
      <section class="nurse on-light">
        <div class="wrap">
          <div class="frame"><div class="ph">${img(ctx, IMAGES.portrait, "The nurse at the front desk in her white uniform and maroon epaulettes, laughing")}</div></div>
          <div class="letter">
            <p class="lead">I run this clinic the way I'd want my own family treated.</p>
            <p>${esc(NURSE_P1)}</p>
            <p>${esc(NURSE_P2)}</p>
            <div class="stats">
              <div><b data-n="30">30</b><sup>+</sup><span>years in healthcare</span></div>
              <div><b data-n="13">13</b><span>years with Royal Caribbean Cruises</span></div>
              <div><b data-n="20">20</b><sup>+</sup><span>countries' colleagues worked alongside</span></div>
            </div>
            <div class="sign"><i></i><span>Your nurse at Gabisile<small>Private Nurse Practitioner</small></span></div>
          </div>
        </div>
      </section>
      <section class="on-light" id="how">
        <div class="wrap">
          <div class="head">
            <span class="eyebrow">What to expect</span>
            <h2>Simple. <em>On purpose.</em></h2>
          </div>
          ${stepsHtml}
        </div>
      </section>
      ${ctaBand(ctx, "Come and meet her.", "Walk in or book ahead on WhatsApp.")}`;
}

function servicesHubBody(ctx) {
  const cards = CATEGORIES.map((c) => {
    const n = servicesIn(c.key).length;
    return `<a class="cat-card" href="${ctx.u(c.path)}">
              <small>${n} ${n === 1 ? "service" : "services"}</small>
              <h2>${esc(c.nav === "Employers" ? "Work medicals & PDP" : c.nav)}</h2>
              <p>${esc(c.blurb)}</p>
              <span class="more"><span>Explore</span><b>${ARROW}</b></span>
            </a>`;
  }).join("\n            ");
  const all = CATEGORIES.map((c) => {
    const items = servicesIn(c.key)
      .map((s) => `<li><a href="${ctx.u(c.path, "#" + slug(s[1]))}">${esc(s[1])}</a></li>`)
      .join("");
    return `<div><h3>${esc(c.key)}</h3><ul>${items}</ul></div>`;
  }).join("");
  return `${pageHero(ctx, {
    eyebrow: "Services",
    h1: "Clinic services <em>in Isipingo</em>",
    intro: "A nurse-led clinic in Isipingo for everyday care, mother and child, tests, work medicals and IV drips.",
    crumbs: [{ label: "Home", path: "" }, { label: "Services" }],
  })}
      <section class="services on-light">
        <div class="wrap">
          <div class="cat-grid">
            ${cards}
          </div>
        </div>
      </section>
      <section class="on-light">
        <div class="wrap">
          <div class="head"><span class="eyebrow">Full list</span><h2>Every service, <em>at a glance</em></h2></div>
          <div class="az">${all}</div>
        </div>
      </section>
      ${ctaBand(ctx)}`;
}

function categoryBody(ctx, cat) {
  const others = CATEGORIES.filter((c) => c.key !== cat.key)
    .map((c) => `<li><a href="${ctx.u(c.path)}">${esc(c.nav === "Employers" ? "Work medicals & PDP" : c.nav)}</a></li>`)
    .join("");
  return `${pageHero(ctx, {
    eyebrow: cat.eyebrow,
    h1: esc(cat.h1),
    intro: cat.intro,
    crumbs: [{ label: "Home", path: "" }, { label: "Services", path: "services" }, { label: cat.nav }],
  })}
      <section class="on-light">
        <div class="wrap narrow">
          <div class="svc-list">
          ${serviceArticles(servicesIn(cat.key))}
          </div>
          <aside class="more-links" aria-label="Other services">
            <h2>More services</h2>
            <ul>${others}</ul>
          </aside>
        </div>
      </section>
      ${ctaBand(ctx)}`;
}

function dripsBody(ctx) {
  const list = servicesIn("IV drips");
  const cards = list
    .map(
      (s) => `<article class="svc svc-dark" id="${slug(s[1])}">
            <div class="svc-body">
              <h2>${esc(s[1])}</h2>
              <p>${esc(s[2])}</p>
              <p class="note">${esc(s[3])}</p>
            </div>
            <a class="btn btn-brass" target="_blank" rel="noopener" href="${bookMsg(s[1])}"><span>Book this on WhatsApp</span>${ARROW}</a>
          </article>`,
    )
    .join("\n          ");
  return `${pageHero(ctx, {
    eyebrow: "IV drips",
    h1: "IV drips in Isipingo. <em>Sit back.</em>",
    intro: "Four IV drips in Isipingo, one rule: the nurse checks you first.",
    crumbs: [{ label: "Home", path: "" }, { label: "IV drips" }],
  })}
      <section class="iv">
        <div class="wrap">
          <div class="iv-ph">${img(ctx, IMAGES.iv, "Two patients relaxing during IV drips while the nurse checks on them")}</div>
          <div class="iv-copy">
            <h2>Checked first. <em>Then relax.</em></h2>
            <p>Before any drip, the nurse checks your blood pressure, medical history and allergies. If a drip isn't right for you, she'll tell you.</p>
            <p>A drip supports you. It doesn't replace sleep, food or medicine.</p>
          </div>
        </div>
      </section>
      <section class="iv-list">
        <div class="wrap narrow">
          <div class="svc-list">
          ${cards}
          </div>
        </div>
      </section>
      ${ctaBand(ctx)}`;
}

function employersBody(ctx) {
  const list = servicesIn("Pre-Employment Medicals & PDP");
  return `${pageHero(ctx, {
    eyebrow: "For employers",
    h1: "Staff medicals in Isipingo, <em>looked after.</em>",
    intro: "Pre-employment medicals, medical surveillance and PDP medicals in Isipingo, plus wellness days at your premises.",
    crumbs: [{ label: "Home", path: "" }, { label: "Employers" }],
  })}
      <section class="work on-light">
        <div class="wrap">
          <div class="copy">
            <span class="eyebrow">Wellness days</span>
            <h2>We come <em>to you.</em></h2>
            <p>We do pre-employment medicals and routine medical surveillance at the clinic. We also come to you. Wellness days at your premises, with blood pressure and glucose checks done on site.</p>
            <p>One message is enough to set it up.</p>
            <div class="cta">
              <a class="btn btn-green" target="_blank" rel="noopener" href="${waLink("Hi Gabisile Medical, I'd like to talk about staff medicals or a wellness day.")}"><span>Talk to us on WhatsApp</span>${ARROW}</a>
            </div>
          </div>
          <div class="ph">${img(ctx, IMAGES.wellness, "The nurse taking a blood pressure reading at a company wellness day")}</div>
        </div>
      </section>
      <section class="on-light">
        <div class="wrap narrow">
          <div class="head"><span class="eyebrow">At the clinic</span><h2>Medicals <em>we do</em></h2></div>
          <div class="svc-list">
          ${serviceArticles(list)}
          </div>
        </div>
      </section>
      ${ctaBand(ctx, "Send your team through.", "One message is enough to set up staff medicals or a wellness day.")}`;
}

function bookBody(ctx) {
  const options = SERVICES.map((s) => `<option>${esc(s[1])}</option>`).join("");
  return `${pageHero(ctx, {
    eyebrow: "Book a visit",
    h1: "Book a clinic visit. <em>We'll confirm.</em>",
    intro: "Fill this in and it opens WhatsApp with your request already typed. A real person replies during clinic hours.",
    crumbs: [{ label: "Home", path: "" }, { label: "Book a visit" }],
  })}
      <section class="book" id="book">
        <div class="wrap">
          <div class="head">
            <p>You don't need an appointment. Walk-ins are welcome during clinic hours.</p>
            <div class="contact-lines">
              <span>Calls and WhatsApp</span>
              <a class="phone" href="tel:${SITE.phoneIntl}">${SITE.phoneDisplay}</a>
              <a href="mailto:${SITE.email}">${SITE.email}</a>
            </div>
            ${hoursLine}
          </div>
          <form id="bookform" novalidate>
            <label class="full" for="f-name">Your name<input id="f-name" name="name" type="text" placeholder="Name and surname" autocomplete="name" /></label>
            <label class="full" for="f-service">What do you need?<select id="f-service" name="service"><option value="">Not sure yet</option>${options}</select></label>
            <fieldset class="pick" id="f-day">
              <legend>Which day suits you?</legend>
              <div class="opts">
                ${["Any day", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => `<button type="button" class="opt" aria-pressed="${i === 0}">${d}</button>`).join("")}
              </div>
            </fieldset>
            <fieldset class="pick" id="f-time">
              <legend>What time of day?</legend>
              <div class="opts">
                ${["Morning", "Midday", "Afternoon"].map((d, i) => `<button type="button" class="opt" aria-pressed="${i === 0}">${d}</button>`).join("")}
              </div>
              <small class="hint" id="sat-hint" hidden>We close at 13:00 on Saturdays.</small>
            </fieldset>
            <div class="send">
              <a class="btn btn-brass" id="walink" target="_blank" rel="noopener" href="${SITE.whatsapp}"><span>Send your booking on WhatsApp</span>${ARROW}</a>
              <small>WhatsApp opens with your message already typed. Just press send. Nothing is stored on this site. Please don't send detailed medical information here.</small>
            </div>
          </form>
        </div>
      </section>
      <section class="on-light" id="how">
        <div class="wrap">
          <div class="head"><span class="eyebrow">How a visit goes</span><h2>Simple. <em>On purpose.</em></h2></div>
          ${stepsHtml}
        </div>
      </section>`;
}

function findUsBody(ctx) {
  const map = `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsQuery)}&output=embed`;
  const dir = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`;
  return `${pageHero(ctx, {
    eyebrow: "Find us",
    h1: "Clinic in Isipingo: <em>Keerath Centre</em>",
    intro: "Suite 6, Isipingo, Durban. In the Isipingo Hospital building, facing the parking area, with a pharmacy next door.",
    crumbs: [{ label: "Home", path: "" }, { label: "Find us" }],
  })}
      <section class="find on-light">
        <div class="wrap">
          <div>
            ${factsHtml(ctx)}
            <div class="cta" style="margin-top: 36px">
              <a class="btn btn-line" target="_blank" rel="noopener" href="${dir}"><span>Get directions</span>${ARROW}</a>
              <a class="btn btn-green" href="tel:${SITE.phoneIntl}"><span>Call ${SITE.phoneDisplay}</span></a>
            </div>
          </div>
          <div class="map">
            <iframe title="Map showing Gabisile Medical Facility at Keerath Centre, Isipingo" src="${map}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
          </div>
        </div>
      </section>
      <section class="on-light">
        <div class="wrap">
          <div class="pair pair-wide">
            <div>${img(ctx, IMAGES.desk, "The Gabisile reception desk with the clinic crest")}</div>
            <div>${img(ctx, IMAGES.waiting, "The nurse seated in the waiting area")}</div>
          </div>
        </div>
      </section>
      ${ctaBand(ctx)}`;
}

function faqBody(ctx) {
  const items = FAQ.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n          ");
  return `${pageHero(ctx, {
    eyebrow: "FAQ",
    h1: "Clinic questions, <em>straight answers.</em>",
    intro: "What to bring, when we're open and how booking works.",
    crumbs: [{ label: "Home", path: "" }, { label: "FAQ" }],
  })}
      <section class="on-light">
        <div class="wrap narrow">
          <div class="faq">
          ${items}
          </div>
        </div>
      </section>
      ${ctaBand(ctx, "Still not sure?", "Send us a message and a real person will reply during clinic hours.")}`;
}

function reviewsBody(ctx) {
  return `${pageHero(ctx, {
    eyebrow: "Reviews",
    h1: "Patient reviews <em>from Google.</em>",
    intro: "What patients say about our private nurse clinic in Isipingo. Had a visit? Tell others how it went.",
    crumbs: [{ label: "Home", path: "" }, { label: "Reviews" }],
  })}
      ${reviewsSection(ctx, { standalone: true })}
      ${ctaBand(ctx)}`;
}

function privacyBody(ctx) {
  return `${pageHero(ctx, {
    eyebrow: "Legal",
    h1: "Privacy Policy",
    intro: "What this website does and doesn't do with your information.",
    crumbs: [{ label: "Home", path: "" }, { label: "Privacy Policy" }],
  })}
      <section class="on-light">
        <div class="wrap narrow legal">
          <p><small>Last updated ${TODAY_LONG}</small></p>
          <h2>1. Who we are</h2>
          <p>${esc(SITE.name)} is a nurse-led private clinic at ${addrLines.map(esc).join(", ")}. You can contact us at <a href="mailto:${SITE.email}">${SITE.email}</a> or on ${SITE.phoneDisplay}.</p>
          <h2>2. What this website collects</h2>
          <p>This website does not store, post or collect the details you type into the booking form. The form builds a WhatsApp message in your browser. When you press send, the message goes to us through WhatsApp.</p>
          <h2>3. Messages you send us</h2>
          <p>If you message or call us, we use your name, phone number and message only to reply, to book your visit and to provide care. Patient records are kept as required for healthcare record-keeping. Please don't send detailed medical information over WhatsApp. Discuss it with the nurse during your visit.</p>
          <h2>4. Third-party services</h2>
          <ul>
            <li><strong>WhatsApp</strong> (Meta) carries your message and is governed by its own terms and privacy policy.</li>
            <li><strong>Google Fonts</strong> loads the typefaces. Your browser requests them from Google, which may receive your IP address.</li>
            <li><strong>Google Maps</strong> is embedded on the Find us page and may set its own cookies when it loads.</li>
            <li><strong>Google reviews</strong> are shown on the home and Reviews pages. When the page loads, your browser asks our server for them, and our server gets them from Google. Reviewers' profile pictures load from Google's servers, which may receive your IP address.</li>
          </ul>
          <p>We don't currently run advertising or analytics cookies on this website. If that changes, we will update this policy and ask for consent where required.</p>
          <h2>5. Your rights under POPIA</h2>
          <p>Under the Protection of Personal Information Act (POPIA) you may ask what personal information we hold about you, ask us to correct or delete it, and object to its use. Email <a href="mailto:${SITE.email}">${SITE.email}</a> and we will respond. You may also complain to the Information Regulator in South Africa.</p>
          <h2>6. Changes</h2>
          <p>We may update this policy from time to time. The date at the top shows when it last changed.</p>
        </div>
      </section>`;
}

function termsBody(ctx) {
  return `${pageHero(ctx, {
    eyebrow: "Legal",
    h1: "Terms of Use",
    intro: "The basics of using this website.",
    crumbs: [{ label: "Home", path: "" }, { label: "Terms of Use" }],
  })}
      <section class="on-light">
        <div class="wrap narrow legal">
          <p><small>Last updated ${TODAY_LONG}</small></p>
          <h2>1. General information only</h2>
          <p>This website gives general information about ${esc(SITE.name)} and our services. It is not medical advice and doesn't replace a consultation with a healthcare professional.</p>
          <h2>2. Emergencies</h2>
          <p>In an emergency call 10177 or go to your nearest emergency unit. Do not use this website or WhatsApp for emergencies.</p>
          <h2>3. Accuracy and availability</h2>
          <p>We work to keep information correct, but services, opening hours and stock (for example vaccines) can change. Please confirm with us before you travel.</p>
          <h2>4. Booking requests</h2>
          <p>A booking request sent through WhatsApp is a request, not a confirmed appointment, until we confirm it.</p>
          <h2>5. Third-party links</h2>
          <p>Links to services such as WhatsApp and Google Maps are provided for convenience. We aren't responsible for their content or practices.</p>
          <h2>6. Intellectual property</h2>
          <p>The text, logo and photographs on this website belong to ${esc(SITE.name)} or are used with permission. Please don't copy them without our consent.</p>
          <h2>7. Governing law</h2>
          <p>These terms are governed by the laws of the Republic of South Africa.</p>
          <h2>8. Contact</h2>
          <p>Questions? Email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
        </div>
      </section>`;
}

function notFoundBody(ctx) {
  return `<div class="page-hero">
        <div class="wrap">
          <span class="eyebrow">Error 404</span>
          <h1>That page <em>isn't here.</em></h1>
          <p>The link may be old or mistyped. Try one of these instead.</p>
          <div class="cta">
            <a class="btn btn-brass" href="${ctx.u()}"><span>Go to the home page</span>${ARROW}</a>
            <a class="btn btn-ghost" href="${ctx.u("services")}"><span>See our services</span></a>
            <a class="btn btn-ghost" href="${ctx.u("find-us")}"><span>Find us</span></a>
          </div>
        </div>
      </div>`;
}

/* ---------- page registry ---------- */
const crumbsLd = (items) => breadcrumbLd(items.map((i) => ({ label: i.label, path: i.path ?? "" })));
const HOME = { label: "Home", path: "" };

const pages = [
  {
    path: "",
    nav: "",
    title: "Private Nurse Clinic in Isipingo, Durban | Gabisile Medical",
    description:
      "Walk-in private nurse clinic in Isipingo, Durban. Consultations, antenatal care, screening tests, work medicals and IV drips. Walk in or WhatsApp 066 352 6383.",
    schema: [clinicLd()],
    body: homeBody,
  },
  {
    path: "about",
    nav: "about",
    title: "Nurse Practitioner in Isipingo | Gabisile Medical Clinic",
    description:
      "Meet the private nurse practitioner at our Isipingo clinic: over 30 years in healthcare, including 13 years with Royal Caribbean Cruises. Walk-ins welcome.",
    schema: [clinicLd(), crumbsLd([HOME, { label: "Your nurse", path: "about" }])],
    image: IMAGES.portrait.src,
    body: aboutBody,
  },
  {
    path: "services",
    nav: "services",
    title: "Clinic Services in Isipingo, Durban | Gabisile Medical",
    description:
      "Everyday care, mother and child care, screening tests, work medicals and IV drips at a nurse-led private clinic in Isipingo, Durban.",
    schema: [crumbsLd([HOME, { label: "Services", path: "services" }]), serviceListLd("Gabisile Medical Facility services", SERVICES)],
    body: servicesHubBody,
  },
  ...CATEGORIES.filter((c) => c.h1).map((c) => ({
    path: c.path,
    nav: "services",
    title: c.title,
    description: c.description,
    schema: [
      crumbsLd([HOME, { label: "Services", path: "services" }, { label: c.nav, path: c.path }]),
      serviceListLd(c.h1, servicesIn(c.key)),
    ],
    body: (ctx) => categoryBody(ctx, c),
  })),
  {
    path: "iv-drips",
    nav: "drips",
    title: "IV Drip Clinic in Isipingo, Durban | Gabisile Medical",
    description:
      "IV drip clinic in Isipingo, Durban: Glow, Immune Booster, Detox and Hangover drips, each given only after a nurse checks your blood pressure and history.",
    schema: [crumbsLd([HOME, { label: "IV drips", path: "iv-drips" }]), serviceListLd("IV drips", servicesIn("IV drips"))],
    image: IMAGES.iv.src,
    body: dripsBody,
  },
  {
    path: "employers",
    nav: "employers",
    title: "Pre-Employment & PDP Medicals in Isipingo | Gabisile Clinic",
    description:
      "Pre-employment medicals, medical surveillance and PDP medicals in Isipingo, Durban, plus on-site wellness days with blood pressure and glucose checks.",
    schema: [
      crumbsLd([HOME, { label: "Employers", path: "employers" }]),
      serviceListLd("Employer services", servicesIn("Pre-Employment Medicals & PDP")),
    ],
    image: IMAGES.wellness.src,
    body: employersBody,
  },
  {
    path: "book",
    nav: "book",
    title: "Book a Clinic Visit on WhatsApp | Gabisile Medical, Isipingo",
    description:
      "Book a visit at our private nurse clinic in Isipingo. Pick a service, day and time and WhatsApp opens with your request typed. Walk-ins welcome.",
    schema: [crumbsLd([HOME, { label: "Book a visit", path: "book" }])],
    body: bookBody,
  },
  {
    path: "find-us",
    nav: "visit",
    title: "Clinic in Isipingo: Address, Hours & Map | Gabisile Medical",
    description:
      "Private nurse clinic at Suite 6, Keerath Centre, 2 Police Station Road, Isipingo, Durban. Open Mon to Fri 09:00 to 16:00, Sat 09:00 to 13:00. Call 066 352 6383.",
    schema: [clinicLd(), crumbsLd([HOME, { label: "Find us", path: "find-us" }])],
    image: IMAGES.desk.src,
    body: findUsBody,
  },
  {
    path: "faq",
    nav: "faq",
    title: "Clinic FAQ: Hours, Walk-Ins & Booking | Gabisile Medical",
    description:
      "Opening hours, walk-ins, what to bring, vaccines, IV drip safety and how to book at Gabisile Medical Facility in Isipingo, Durban.",
    schema: [crumbsLd([HOME, { label: "FAQ", path: "faq" }]), faqLd(FAQ)],
    body: faqBody,
  },
  {
    path: "reviews",
    nav: "",
    title: "Patient Reviews | Gabisile Medical Clinic, Isipingo",
    description:
      "Read Google reviews of Gabisile Medical Facility, a private nurse clinic in Isipingo, Durban, and leave your own review.",
    schema: [crumbsLd([HOME, { label: "Reviews", path: "reviews" }])],
    body: reviewsBody,
  },
  {
    path: "privacy-policy",
    nav: "",
    title: "Privacy Policy | Gabisile Medical Facility",
    description: "How the Gabisile Medical Facility website handles your information, including WhatsApp bookings, and your rights under POPIA.",
    schema: [crumbsLd([HOME, { label: "Privacy Policy", path: "privacy-policy" }])],
    body: privacyBody,
  },
  {
    path: "terms",
    nav: "",
    title: "Terms of Use | Gabisile Medical Facility",
    description: "Terms of use for the Gabisile Medical Facility website. General information only, not medical advice. In an emergency call 10177.",
    schema: [crumbsLd([HOME, { label: "Terms of Use", path: "terms" }])],
    body: termsBody,
  },
];

/* ---------- write ---------- */
function render(page, ctx) {
  return `<!doctype html>
<html lang="en-ZA">
  ${headHtml(page, ctx)}
  <body>
    <a class="skip" href="#main">Skip to content</a>
    ${headerHtml(page, ctx)}

    <main id="main">
      ${page.body(ctx)}
    </main>

    ${footerHtml(ctx)}

    ${waFab}
  </body>
</html>
`;
}

function write(rel, content) {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

for (const page of pages) {
  write(join(page.path, "index.html"), render(page, makeCtx(page.path)));
}

// 404 uses root-absolute URLs because hosts serve it from any path.
const nf = {
  path: "404",
  nav: "",
  noindex: true,
  title: "Page not found | Gabisile Medical Facility",
  description: "This page could not be found.",
  schema: [],
  body: notFoundBody,
};
const rootCtx = { u: (p = "") => (p ? `/${p}/` : "/"), a: (p) => `/${p}` };
write("404.html", render(nf, rootCtx).replace(`href="${SITE.url}/404/"`, `href="${SITE.url}/"`));

write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>\n    <loc>${absUrl(p.path)}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`).join("\n")}
</urlset>
`,
);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
write(
  "site.webmanifest",
  JSON.stringify(
    {
      name: SITE.name,
      short_name: SITE.shortName,
      description: "Nurse-led private clinic in Isipingo, Durban.",
      start_url: "./",
      display: "standalone",
      background_color: SITE.themeColor,
      theme_color: SITE.themeColor,
      icons: [
        { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2,
  ) + "\n",
);

console.log(`Built ${pages.length} pages + 404, sitemap.xml, robots.txt, site.webmanifest`);
