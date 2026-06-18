import { store } from './store.js';
import { dom } from './dom.js';
import { applyStaticI18n, setLangToggle } from './ui.js';
import { normalize } from './crypto.js';

const LANGS = ['de', 'en'];
const labels = { de: {}, en: {} };

const DEFAULT_LANG = 'en';
const hasCrypto = () => !!(window.crypto?.subtle);

export let uiLang = DEFAULT_LANG;

export const t = (key) => labels[uiLang]?.[key] ?? key;

export const loadStrings = async () => {
  await Promise.all(LANGS.map(async (lang) => {
    const res = await fetch(new URL(`../data/${lang}/labels.json`, import.meta.url));
    labels[lang] = await res.json();
  }));
};

export const applyLang = (lang, { renderStrength, renderAndFill } = {}) => {
  uiLang = lang;
  store.set('uiLanguage', uiLang);
  document.documentElement.lang = uiLang;
  document.title = t('appName');
  applyStaticI18n(t);
  setLangToggle(uiLang);
  if (!hasCrypto()) dom.instruction.innerHTML = t('httpsSub');
  renderStrength?.(normalize(dom.groupPassword.value));
  renderAndFill?.();
};

export const initLang = () => {
  const stored = store.get('uiLanguage');
  uiLang = stored === 'de' || stored === 'en' ? stored : DEFAULT_LANG;
};
