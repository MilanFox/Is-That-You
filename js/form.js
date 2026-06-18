import { dom } from './dom.js';
import { t } from './i18n.js';
import { normalize, deriveKey, toHex } from './crypto.js';
import { groups, uid, persist, deleteGroup } from './state.js';
import { renderCards, refreshWords } from './ui.js';
import { announce } from './a11y.js';
import { currentWindowIndex } from './timer.js';

const hasCrypto = () => !!(window.crypto?.subtle);

let addLang = 'de';
export const setAddLang = (lang) => { addLang = lang; };

const strengthHint = (passphrase) => {
  if (!passphrase) return { level: '', text: '' };
  if (passphrase.length < 8) return { level: 'weak', text: t('pwShort') };
  if (passphrase.length < 14) return { level: 'ok', text: t('pwOk') };
  return { level: 'strong', text: t('pwStrong') };
};

export const renderStrength = (passphrase) => {
  const { level, text } = strengthHint(passphrase);
  dom.passwordStrength.dataset.level = level;
  dom.strengthText.textContent = text;
};

export const setAddLangButtons = () => {
  dom.langButtons.forEach((button) => {
    const on = button.dataset.lang === addLang;
    button.classList.toggle('lang-seg__option--active', on);
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
};

export const showDashboard = () => {
  dom.groupPassword.value = '';
  dom.add.hidden = true;
  dom.dashboard.hidden = false;
};

export const isFormVisible = () => !dom.add.hidden;

export const showAdd = () => {
  dom.groupName.value = '';
  dom.groupPassword.value = '';
  dom.groupPassword.type = 'password';
  dom.showPassword.checked = false;
  renderStrength('');
  dom.formError.hidden = true;
  addLang = 'de';
  setAddLangButtons();
  dom.save.disabled = true;
  dom.save.textContent = t('save');
  dom.dashboard.hidden = true;
  dom.add.hidden = false;
  dom.groupName.focus();
  if (history.state?.view !== 'add') {
    history.pushState({ view: 'add' }, '');
  }
};

export const renderAndFill = () => {
  renderCards(groups, t, (id) => deleteGroup(id, renderAndFill));
  if (groups.length) refreshWords(groups, currentWindowIndex());
};

export const save = async () => {
  const pass = dom.groupPassword.value;
  if (!normalize(pass)) return;

  if (!hasCrypto()) {
    dom.formError.textContent = t('errCrypto');
    dom.formError.hidden = false;
    return;
  }

  dom.formError.hidden = true;
  dom.save.disabled = true;

  try {
    const keyBytes = await deriveKey(pass);
    const name = dom.groupName.value.trim() || 'Codewort';
    groups.push({ id: uid(), name, lang: addLang, key: toHex(keyBytes), keyBytes, wordEl: null });
    persist();
    if (history.state?.view === 'add') history.back();
    else showDashboard();
    renderAndFill();
    announce(t('codewordAdded'));
  } catch (e) {
    dom.formError.textContent = t('errAdd');
    dom.formError.hidden = false;
    dom.save.disabled = false;
  }
};
