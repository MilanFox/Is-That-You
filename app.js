import { store } from './js/store.js';
import { t as translate, loadStrings } from './js/i18n.js';
import { loadWords } from './js/labels.js';
import { deriveKey, toHex, fromHex, normalize } from './js/crypto.js';
import { renderCards, refreshWords, applyStaticI18n, setLangToggle } from './js/ui.js';
import { announce } from './js/a11y.js';
import { VERSION } from './version.js';

const PERIOD = 300;
const DEFAULT_LANG = 'en';
const hasCrypto = () => !!(window.crypto?.subtle);

let groups = [];
let addLang = 'de';
let uiLang = DEFAULT_LANG;
let lastWindow = null;
let ticker = null;

const t = (k) => translate(uiLang, k);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const formatTime = (sec) => {
  sec = Math.max(0, Math.ceil(sec));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
};

const persist = () => store.set('codewords',
  JSON.stringify(groups.map(({ id, name, lang, key }) => ({ id, name, lang, key }))));

const load = () => {
  groups = [];
  const raw = store.get('codewords');
  if (!raw) return;
  try {
    JSON.parse(raw).forEach((group) => {
      if (group?.key && (group.lang === 'de' || group.lang === 'en')) {
        groups.push({
          id: group.id || uid(),
          name: group.name,
          lang: group.lang,
          key: group.key,
          keyBytes: fromHex(group.key),
          wordEl: null,
        });
      }
    });
  } catch (e) {
    groups = [];
  }
};

const deleteGroup = (id) => {
  groups = groups.filter((g) => g.id !== id);
  persist();
  renderAndFill();
};

const renderAndFill = () => {
  renderCards(groups, t, deleteGroup);
  if (groups.length) refreshWords(groups, Math.floor(Date.now() / 1000 / PERIOD));
};

const stopTicker = () => {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
};

const tick = () => {
  const now = Date.now() / 1000;
  const windowIndex = Math.floor(now / PERIOD);
  const remaining = PERIOD - (now % PERIOD);

  document.getElementById('timeRemaining').textContent = formatTime(remaining);
  document.getElementById('validityBarFill').style.width = (remaining / PERIOD * 100).toFixed(2) + '%';
  document.getElementById('validity').classList.toggle('validity--warn', remaining <= 30);

  if (windowIndex !== lastWindow) {
    lastWindow = windowIndex;
    refreshWords(groups, windowIndex);
    if (groups.length) announce(t('codewordUpdated'), { assertive: true });
  }
};

const startTicker = () => {
  stopTicker();
  lastWindow = Math.floor(Date.now() / 1000 / PERIOD);
  tick();
  ticker = setInterval(tick, 250);
};

const strengthHint = (p) => {
  if (!p) return { level: '', text: '' };
  if (p.length < 8) return { level: 'weak', text: t('sShort') };
  if (p.length < 14) return { level: 'ok', text: t('sOk') };
  return { level: 'strong', text: t('sStrong') };
};

const renderStrength = (p) => {
  const el = document.getElementById('passwordStrength');
  if (!el) return;
  const { level, text } = strengthHint(p);
  el.dataset.level = level;
  el.querySelector('.form__strength-text').textContent = text;
};

const setAddLangButtons = () => {
  document.querySelectorAll('#add [data-lang]').forEach((b) => {
    const on = b.dataset.lang === addLang;
    b.classList.toggle('lang-seg__option--active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
};

const applyLang = (lang) => {
  uiLang = lang;
  store.set('uiLanguage', uiLang);
  document.documentElement.lang = uiLang;
  document.title = t('appName');
  applyStaticI18n(t);
  setLangToggle(uiLang);
  if (!hasCrypto()) document.getElementById('instruction').innerHTML = t('httpsSub');
  const groupPassword = document.getElementById('groupPassword');
  if (groupPassword) renderStrength(normalize(groupPassword.value));
  renderAndFill();
};

const showAdd = () => {
  const groupName = document.getElementById('groupName');
  const groupPassword = document.getElementById('groupPassword');
  const showPassword = document.getElementById('showPassword');
  const saveBtn = document.getElementById('save');

  groupName.value = '';
  groupPassword.value = '';
  groupPassword.type = 'password';
  showPassword.checked = false;
  renderStrength('');
  document.getElementById('formError').hidden = true;
  addLang = 'de';
  setAddLangButtons();
  saveBtn.disabled = true;
  saveBtn.textContent = t('save');

  document.getElementById('dashboard').hidden = true;
  document.getElementById('add').hidden = false;
  groupName.focus();
};

const showDashboard = () => {
  document.getElementById('groupPassword').value = '';
  document.getElementById('add').hidden = true;
  document.getElementById('dashboard').hidden = false;
};

const save = async () => {
  const groupPassword = document.getElementById('groupPassword');
  const formError = document.getElementById('formError');
  const saveBtn = document.getElementById('save');
  const pass = groupPassword.value;

  if (!normalize(pass)) return;

  if (!hasCrypto()) {
    formError.textContent = t('errCrypto');
    formError.hidden = false;
    return;
  }

  formError.hidden = true;
  saveBtn.disabled = true;

  try {
    const keyBytes = await deriveKey(pass);
    const name = document.getElementById('groupName').value.trim() || 'Codewort';
    groups.push({ id: uid(), name, lang: addLang, key: toHex(keyBytes), keyBytes, wordEl: null });
    persist();
    showDashboard();
    renderAndFill();
    announce(t('codewordAdded'));
  } catch (e) {
    formError.textContent = t('errAdd');
    formError.hidden = false;
    saveBtn.disabled = false;
  }
};

const init = async () => {
  const versionEl = document.getElementById('appVersion');
  if (versionEl) versionEl.textContent = VERSION;

  const stored = store.get('uiLanguage');
  uiLang = stored === 'de' || stored === 'en' ? stored : DEFAULT_LANG;

  try {
    await Promise.all([loadStrings(), loadWords()]);
    load();
    applyLang(uiLang);
    startTicker();
  } finally {
    document.getElementById('boot')?.remove();
  }

  document.getElementById('addBtn').addEventListener('click', showAdd);
  document.getElementById('emptyAdd').addEventListener('click', showAdd);
  document.getElementById('cancel').addEventListener('click', showDashboard);

  document.getElementById('uiLang').addEventListener('click', () => {
    applyLang(uiLang === 'de' ? 'en' : 'de');
  });

  document.getElementById('showPassword').addEventListener('change', (e) => {
    document.getElementById('groupPassword').type = e.target.checked ? 'text' : 'password';
  });

  document.getElementById('groupPassword').addEventListener('input', (e) => {
    const val = normalize(e.target.value);
    renderStrength(val);
    document.getElementById('save').disabled = val.length === 0;
  });

  document.getElementById('groupPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !document.getElementById('save').disabled) save();
  });

  document.getElementById('save').addEventListener('click', save);

  document.querySelectorAll('#add [data-lang]').forEach((button) => {
    button.addEventListener('click', () => {
      addLang = button.dataset.lang;
      setAddLangButtons();
    });
  });
};

init();
