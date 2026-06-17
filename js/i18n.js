const LANGS = ['de', 'en'];
const labels = { de: {}, en: {} };

export const loadStrings = async () => {
  await Promise.all(LANGS.map(async (lang) => {
    const res = await fetch(new URL(`../data/${lang}/labels.json`, import.meta.url));
    labels[lang] = await res.json();
  }));
};

export const t = (lang, key) => labels[lang]?.[key] ?? key;
