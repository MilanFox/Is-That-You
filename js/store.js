const _mem = {};

export const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch(e) { return _mem[k] ?? null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch(e) { _mem[k] = v; } },
  del: (k) => { try { localStorage.removeItem(k); } catch(e) { delete _mem[k]; } },
};
