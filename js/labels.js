const LANGS = ['de', 'en'];

export const labels = { de: [], en: [] };

export const loadWords = async () => {
  await Promise.all(LANGS.map(async (lang) => {
    const res = await fetch(new URL(`../data/${lang}/words.json`, import.meta.url));
    labels[lang] = await res.json();
  }));
};
