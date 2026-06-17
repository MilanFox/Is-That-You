const regions = {};
const announcements = {};

export const announce = (message, { assertive = false } = {}) => {
  const id = assertive ? 'announcer-alert' : 'announcer-status';
  const node = (regions[id] ??= document.getElementById(id));
  if (!node || !message) return;
  node.textContent = '';
  clearTimeout(announcements[id]);
  announcements[id] = setTimeout(() => { node.textContent = message; }, 60);
};
