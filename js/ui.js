import { wordFor } from './crypto.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

export const applyStaticI18n = (translate) => {
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = translate(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((n) => { n.innerHTML = translate(n.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-ph]').forEach((n) => { n.placeholder = translate(n.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach((n) => { n.setAttribute('aria-label', translate(n.dataset.i18nAria)); });
};

export const setLangToggle = (lang) => {
  const btn = document.getElementById('uiLang');
  if (btn) btn.dataset.active = lang;
};

export const renderCards = (groups, translate, onDelete) => {
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('empty');
  const validityEl = document.getElementById('validity');

  listEl.innerHTML = '';

  if (groups.length === 0) {
    emptyEl.hidden = false;
    listEl.hidden = true;
    validityEl.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  listEl.hidden = false;
  validityEl.hidden = false;

  groups.forEach((group) => {
    const card = document.createElement('li');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'card__header';

    const name = document.createElement('h2');
    name.className = 'card__name';
    name.textContent = group.name;

    const tag = document.createElement('span');
    tag.className = 'card__tag';
    tag.setAttribute('aria-hidden', 'true');
    tag.textContent = group.lang.toUpperCase();

    const del = document.createElement('button');
    del.className = 'card__delete';
    del.type = 'button';
    del.setAttribute('aria-label', translate('del'));
    del.textContent = '✕';

    header.append(name, tag, del);

    const word = document.createElement('div');
    word.className = 'card__word';
    word.setAttribute('aria-live', 'polite');
    word.setAttribute('lang', group.lang);
    group.wordEl = word;

    const confirm = document.createElement('div');
    confirm.className = 'card__confirm';
    confirm.hidden = true;

    const confirmText = document.createElement('span');
    confirmText.className = 'card__confirm-text';
    confirmText.textContent = translate('delConfirm');

    const yes = document.createElement('button');
    yes.className = 'card__confirm-yes';
    yes.type = 'button';
    yes.textContent = translate('confirmDel');

    const no = document.createElement('button');
    no.className = 'card__confirm-no';
    no.type = 'button';
    no.textContent = translate('cancel');

    confirm.append(confirmText, yes, no);

    del.addEventListener('click', () => {
      confirm.hidden = false;
      yes.focus();
    });
    no.addEventListener('click', () => { confirm.hidden = true; });
    yes.addEventListener('click', () => onDelete(group.id));

    card.append(header, word, confirm);
    listEl.append(card);
  });
};

export const refreshWords = (groups, windowIndex) => {
  groups.forEach((group) => {
    const target = group.wordEl;
    if (!target) return;
    wordFor(group.keyBytes, group.lang, windowIndex).then((word) => {
      if (group.wordEl !== target) return;
      if (!target.textContent || reduceMotion) {
        target.textContent = word;
        target.style.opacity = '1';
      } else {
        target.style.opacity = '0';
        setTimeout(() => {
          if (group.wordEl !== target) return;
          target.textContent = word;
          target.style.opacity = '1';
        }, 180);
      }
    }).catch(() => {});
  });
};
