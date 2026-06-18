import { loadStrings, applyLang, initLang, uiLang } from './js/i18n.js';
import { loadWords } from './js/labels.js';
import { normalize } from './js/crypto.js';
import { dom } from './js/dom.js';
import { load, groups } from './js/state.js';
import { startTicker } from './js/timer.js';
import { renderAndFill, renderStrength, showAdd, showDashboard, save, setAddLangButtons, setAddLang } from './js/form.js';
import { VERSION } from './version.js';

const apply = (lang) => applyLang(lang, { renderStrength, renderAndFill });

const init = async () => {
  if (dom.appVersion) dom.appVersion.textContent = VERSION;

  initLang();

  try {
    await Promise.all([loadStrings(), loadWords()]);
    load();
    apply(uiLang);
    startTicker(groups);
  } finally {
    document.getElementById('boot')?.remove();
  }

  dom.addBtn.addEventListener('click', showAdd);
  dom.emptyAdd.addEventListener('click', showAdd);
  dom.cancel.addEventListener('click', showDashboard);

  dom.uiLang.addEventListener('click', () => apply(uiLang === 'de' ? 'en' : 'de'));

  dom.showPassword.addEventListener('change', (e) => {
    dom.groupPassword.type = e.target.checked ? 'text' : 'password';
  });

  dom.groupPassword.addEventListener('input', (e) => {
    const val = normalize(e.target.value);
    renderStrength(val);
    dom.save.disabled = val.length === 0;
  });

  dom.groupPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !dom.save.disabled) save();
  });

  dom.save.addEventListener('click', save);

  dom.langButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setAddLang(button.dataset.lang);
      setAddLangButtons();
    });
  });
};

init();
