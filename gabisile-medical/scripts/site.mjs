// Single source of truth for every fact and service on the site.
// Edit here, then run `node scripts/build.mjs` to regenerate all pages.

export const SITE = {
  name: "Gabisile Medical Facility",
  shortName: "Gabisile Medical",
  tagline: "Your health. Our priority.",
  // Registered domain. Used for canonical URLs, sitemap, Open Graph and
  // structured data. Keep the www form consistent everywhere.
  url: "https://www.gabisilemedicalfacility.co.za",
  phoneDisplay: "066 352 6383",
  phoneIntl: "+27663526383",
  whatsapp: "https://wa.me/27663526383",
  email: "gabisilemedical@gmail.com",
  practiceNo: "99088001213210",
  address: {
    suite: "Suite 6, Keerath Centre",
    street: "2 Police Station Road",
    locality: "Isipingo",
    city: "Durban",
    region: "KwaZulu-Natal",
    country: "ZA",
  },
  mapsQuery: "Keerath Centre 2 Police Station Road Isipingo",
  hours: [
    { label: "Mon to Fri", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "16:00" },
    { label: "Saturday", days: ["Saturday"], opens: "09:00", closes: "13:00" },
    { label: "Sunday", days: [], closed: true },
  ],
  themeColor: "#092621",
  ogImage: "images/nurse-reception.jpg",
  google: {
    // Google Place ID of the clinic's Business Profile. Not secret.
    // Find it: https://developers.google.com/maps/documentation/places/web-service/place-id
    // Paste it here, then run `node scripts/build.mjs`. Also set it as the
    // GOOGLE_PLACE_ID environment variable in Vercel (used by api/reviews.js).
    placeId: "",
  },
};

// Links for the "Review us on Google" and "Read all reviews" buttons.
// Until a Place ID is set they fall back to a Google Maps search for the clinic.
export function googleUrls() {
  const id = SITE.google.placeId;
  if (id) {
    return {
      write: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(id)}`,
      read: `https://search.google.com/local/reviews?placeid=${encodeURIComponent(id)}`,
      configured: true,
    };
  }
  const search = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Gabisile Medical Facility Isipingo")}`;
  return { write: search, read: search, configured: false };
}

export const IMAGES = {
  logo: { src: "images/logo.png", w: 500, h: 500 },
  reception: { src: "images/nurse-reception.jpg", w: 1050, h: 1400 },
  portrait: { src: "images/nurse-portrait.jpg", w: 647, h: 1400 },
  iv: { src: "images/iv-lounge.jpg", w: 1050, h: 1400 },
  wellness: { src: "images/wellness-day.jpg", w: 591, h: 1280 },
  desk: { src: "images/reception.jpg", w: 1050, h: 1400 },
  waiting: { src: "images/waiting-area.jpg", w: 1050, h: 1400 },
};

// Category pages. `path` is the folder the page is written to.
export const CATEGORIES = [
  {
    key: "Everyday care",
    path: "services/everyday-care",
    nav: "Everyday care",
    h1: "Everyday care clinic in Isipingo",
    eyebrow: "Services",
    title: "Walk-In Clinic: Wound Care & Ear Irrigation, Isipingo | Gabisile",
    description:
      "Walk-in nurse clinic in Isipingo, Durban for consultations, wound care, ear irrigation, STI treatment and vitamin B injections. Walk in or book on WhatsApp.",
    intro:
      "Feeling off, hurt, or just not sure what is wrong? Start here. You see a private nurse practitioner who takes the time to listen, examine and treat what can be treated on the day.",
    blurb: "Assessment and treatment, wound care, ear care, STI consultations and vitamin B injections.",
  },
  {
    key: "Mother & Child",
    path: "services/mother-and-child",
    nav: "Mother & child",
    h1: "Mother and child clinic in Isipingo",
    eyebrow: "Services",
    title: "Antenatal Clinic & Family Planning in Isipingo | Gabisile",
    description:
      "Antenatal clinic in Isipingo, Durban: baby wellness checks, immunisations, family planning, Pap smears and pregnancy tests with a private nurse.",
    intro:
      "From a positive pregnancy test to baby check-ups and family planning, you see the same calm, private nurse practitioner each time.",
    blurb: "Antenatal care, baby checks, immunisations, family planning, Pap smears and pregnancy tests.",
  },
  {
    key: "Tests & screening",
    path: "services/tests-and-screening",
    nav: "Tests & screening",
    h1: "Tests and screening clinic in Isipingo",
    eyebrow: "Services",
    title: "HIV, Glucose & Blood Pressure Tests in Isipingo | Gabisile Clinic",
    description:
      "Health screening clinic in Isipingo, Durban: blood pressure, glucose, cholesterol, haemoglobin, HIV and malaria tests, explained by a nurse.",
    intro:
      "Quick tests, clear answers. The nurse explains what your numbers mean and what, if anything, to do next.",
    blurb: "Blood pressure, glucose, cholesterol, HB, HIV and malaria tests.",
  },
  {
    key: "Pre-Employment Medicals & PDP",
    path: "employers",
    nav: "Employers",
    blurb: "Pre-employment medicals, medical surveillance, PDP medicals and on-site wellness days.",
  },
  {
    key: "IV drips",
    path: "iv-drips",
    nav: "IV drips",
    blurb: "Four IV drips, each given only after the nurse has checked you.",
  },
];

// [category, title, description, note]
export const SERVICES = [
  [
    "Everyday care",
    "General patient assessment & treatment",
    "Feeling off and not sure why? Start here. The nurse takes your history, examines you and treats what can be treated on the day. Adults, pensioners and children are all welcome.",
    "Bring any medication you're taking.",
  ],
  [
    "Everyday care",
    "STI consultation and treatment",
    "Private. No lecture. You're examined, tested where needed and treated, and we'll talk about getting your partner treated too.",
    "Everything you say stays in the room.",
  ],
  [
    "Everyday care",
    "Wound care",
    "Cuts, burns, ulcers and wounds that just won't close. We clean and dress them properly, then show you how to look after the dressing at home.",
    "",
  ],
  [
    "Everyday care",
    "Ear irrigation & ear infections",
    "Blocked ears from wax, or an ear that's sore, itchy or leaking. The nurse looks inside first. Wax gets flushed out gently with warm water when it's safe, and the relief is usually instant. If it's an infection, we treat that too, with medication when you need it.",
    "Employers can refer staff for this too.",
  ],
  [
    "Everyday care",
    "Vitamin B injection",
    "A quick shot in the arm. People usually ask for it when they're run down. It takes a few minutes.",
    "",
  ],
  [
    "Mother & Child",
    "Antenatal care",
    "Your first visit is the long one: your history, your blood pressure, the basic checks and a plan for the months ahead. Follow-up visits are shorter and track how you and the baby are doing.",
    "There's a sonographer in the same building for scans.",
  ],
  [
    "Mother & Child",
    "Baby wellness check",
    "Weight, length, head size, feeding and milestones. Bring your questions, however small they feel.",
    "Bring the Road to Health booklet.",
  ],
  [
    "Mother & Child",
    "Immunisations",
    "Childhood vaccines given by a nurse, with the record updated on the spot.",
    "Message us first to check the vaccine you need is in stock.",
  ],
  [
    "Mother & Child",
    "Family planning",
    "Pill, injection or something longer lasting. We talk through what fits your life and help you start or carry on with your method.",
    "",
  ],
  [
    "Mother & Child",
    "Implanon removal",
    "The implant in your arm comes out through a tiny cut, under local anaesthetic. A few minutes, a small dressing, and you're done.",
    "",
  ],
  [
    "Mother & Child",
    "Loop removal",
    "Removal of your IUD, the loop. It's usually quick. If you still want contraception, we can talk about the next method at the same visit.",
    "",
  ],
  [
    "Mother & Child",
    "Pap smear",
    "A screening test that picks up changes in the cervix early, long before they become a problem. A few uncomfortable minutes. Worth it.",
    "We'll tell you when to expect your result.",
  ],
  [
    "Mother & Child",
    "Pregnancy test",
    "A urine test with an answer in minutes. Whatever it says, you can talk through what comes next.",
    "",
  ],
  [
    "Tests & screening",
    "Blood pressure test",
    "Cuff on, a couple of minutes, done. If your numbers are high we explain what they mean and what to do about them.",
    "",
  ],
  [
    "Tests & screening",
    "Blood glucose test",
    "A finger prick that shows your sugar level right away. Useful if diabetes runs in the family, or you've been unusually thirsty and tired.",
    "",
  ],
  [
    "Tests & screening",
    "Cholesterol test",
    "A quick blood test. We explain the number and what, if anything, needs to change.",
    "",
  ],
  [
    "Tests & screening",
    "HB test",
    "Checks your haemoglobin from a small blood sample. It tells us whether you might be anaemic.",
    "",
  ],
  [
    "Tests & screening",
    "HIV test and counselling",
    "A rapid test with proper counselling before and after. Confidential. If you need treatment, we link you to care.",
    "",
  ],
  [
    "Tests & screening",
    "Malaria test",
    "A rapid blood test. Do it if you have a fever after travelling to a malaria area.",
    "Don't wait on this one.",
  ],
  [
    "Pre-Employment Medicals & PDP",
    "Pre-employment and medical surveillance",
    "The medical your employer asks for before you start, and the routine checks for staff already on the job. Employers can send whole teams through.",
    "Ask your employer which form they need completed.",
  ],
  [
    "Pre-Employment Medicals & PDP",
    "PDP medical",
    "The medical examination for your professional driving permit.",
    "Bring your ID and the form.",
  ],
  [
    "IV drips",
    "Glow Drip",
    "Fluids and vitamins chosen with your skin in mind. Ask what's in the bag. We'll show you.",
    "Given only after the nurse has checked you.",
  ],
  [
    "IV drips",
    "Immune Booster Drip",
    "A vitamin drip people book when they feel run down. It supports you. It doesn't replace sleep, food or medicine.",
    "Given only after the nurse has checked you.",
  ],
  [
    "IV drips",
    "Detox Drip",
    "Fluids and vitamins for when you feel sluggish. Your liver and kidneys do the real work, and good hydration helps them.",
    "Given only after the nurse has checked you.",
  ],
  [
    "IV drips",
    "Hangover Drip",
    "Fluids and vitamins after a heavy night. Come in, sit back, rehydrate.",
    "Given only after the nurse has checked you.",
  ],
];

// FAQ answers use only facts already published on the site.
export const FAQ = [
  {
    q: "Where is Gabisile Medical Facility?",
    a: "We are at Suite 6, Keerath Centre, 2 Police Station Road, Isipingo, Durban. We are in the Isipingo Hospital building, facing the parking area, with a pharmacy next door.",
  },
  {
    q: "What are your opening hours?",
    a: "Monday to Friday 09:00 to 16:00 and Saturday 09:00 to 13:00. We are closed on Sundays.",
  },
  {
    q: "Do I need an appointment?",
    a: "No. You can book on WhatsApp, call, or simply walk in. All three work. Booking on WhatsApp helps us have the nurse ready for you.",
  },
  {
    q: "How do I book a visit?",
    a: "Use the booking page to pick a service, day and time of day. It opens WhatsApp with your request already typed. You can also WhatsApp or call 066 352 6383 during clinic hours.",
  },
  {
    q: "Who will I see at the clinic?",
    a: "You see a private nurse practitioner with over 30 years of experience in healthcare, including local and international clinical work.",
  },
  {
    q: "What should I bring with me?",
    a: "Bring your clinic card and any medication you are taking. For baby wellness checks bring the Road to Health booklet. For a PDP medical bring your ID and the form.",
  },
  {
    q: "Do you give vaccines for children?",
    a: "Yes, childhood immunisations are given by a nurse and the record is updated on the spot. Message us first to check that the vaccine you need is in stock.",
  },
  {
    q: "Can I get an IV drip without being checked first?",
    a: "No. Every IV drip is given only after the nurse has checked you, including your blood pressure, medical history and allergies. If a drip is not right for you, she will tell you.",
  },
  {
    q: "Can employers send staff to the clinic?",
    a: "Yes. We do pre-employment medicals and routine medical surveillance at the clinic, and we can run wellness days at your premises with blood pressure and glucose checks done on site.",
  },
  {
    q: "Is my information stored on the website?",
    a: "No. The booking form only opens WhatsApp with a typed message. Nothing you enter is stored or posted anywhere by this website.",
  },
  {
    q: "What if it is an emergency?",
    a: "Call 10177 or go to your nearest emergency unit. We are a nurse-led clinic and do not replace emergency care.",
  },
];

export const waLink = (message) => `${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
export const slug = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
