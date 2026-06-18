import { store } from './store.js';
import { fromHex } from './crypto.js';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const groups = [];

export const persist = () => store.set('codewords',
  JSON.stringify(groups.map(({ id, name, lang, key }) => ({ id, name, lang, key }))));

export const load = () => {
  groups.length = 0;
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
    groups.length = 0;
  }
};

export const deleteGroup = (id, onDeleted) => {
  const idx = groups.findIndex((g) => g.id === id);
  if (idx !== -1) groups.splice(idx, 1);
  persist();
  onDeleted();
};
