import { dom } from './dom.js';
import { t } from './i18n.js';
import { refreshWords } from './ui.js';
import { announce } from './a11y.js';

const PERIOD = 300;

let lastWindow = null;
let ticker = null;

const formatTime = (sec) => {
  sec = Math.max(0, Math.ceil(sec));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
};

export const currentWindowIndex = () => Math.floor(Date.now() / 1000 / PERIOD);

export const stopTicker = () => {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
};

const tick = (groups) => {
  const now = Date.now() / 1000;
  const windowIndex = Math.floor(now / PERIOD);
  const remaining = PERIOD - (now % PERIOD);

  dom.timeRemaining.textContent = formatTime(remaining);
  dom.validityBarFill.style.width = (remaining / PERIOD * 100).toFixed(2) + '%';
  dom.validity.classList.toggle('validity--warn', remaining <= 30);

  if (windowIndex !== lastWindow) {
    lastWindow = windowIndex;
    refreshWords(groups, windowIndex);
    if (groups.length) announce(t('codewordUpdated'), { assertive: true });
  }
};

export const startTicker = (groups) => {
  stopTicker();
  lastWindow = currentWindowIndex();
  tick(groups);
  ticker = setInterval(() => tick(groups), 250);
};
