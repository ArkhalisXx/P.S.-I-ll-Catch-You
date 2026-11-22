(() => {
  "use strict";
  const key = "paperheart-arcade-v1";
  const species = ["Bluegill", "Sunfish", "Perch"];
  const fresh = () => ({
    version: 1,
    stamp: 0,
    coins: 0,
    music: 0.65,
    effects: 0.8,
    walk: { completed: [], lastChapter: null, sound: true },
    pancakes: 0,
    streak: 0,
    best: 0,
    dates: 0,
    route: 0,
    catches: 0,
    pending: null,
    tank: { level: 1, fish: ["Bluegill"], food: 2, fed: 0, decor: [] },
  });
  const integer = (n) => Number.isSafeInteger(n) && n >= 0;
  function validate(d) {
    const t = d?.tank,
      w = d?.walk;
    if (
      d?.version !== 1 ||
      !t ||
      !w ||
      !["stamp", "coins", "pancakes", "streak", "best", "dates", "route", "catches"].every((k) =>
        integer(d[k]),
      ) ||
      ![d.music, d.effects].every((n) => Number.isFinite(n) && n >= 0 && n <= 1) ||
      ![t.level, t.food, t.fed].every(integer) ||
      t.level < 1 ||
      t.level > 6 ||
      !Array.isArray(t.fish) ||
      t.fish.length > t.level * 4 ||
      !t.fish.every((n) => species.includes(n)) ||
      !Array.isArray(t.decor) ||
      t.decor.length > 12 ||
      !t.decor.every((i) => i && ["Fern", "Mug"].includes(i.kind) && integer(i.x) && i.x <= 300) ||
      !Array.isArray(w.completed) ||
      !w.completed.every((n) => integer(n) && n < 20) ||
      !(w.lastChapter == null || (integer(w.lastChapter) && w.lastChapter < 20)) ||
      !(d.pending === null || species.includes(d.pending)) ||
      (d.outing != null &&
        !(
          integer(d.outing.steps) &&
          integer(d.outing.mask) &&
          d.outing.mask <= 3 &&
          typeof d.outing.opened === "boolean" &&
          typeof d.outing.rode === "boolean"
        )) ||
      d.route >= 9
    )
      throw Error("This file is not a valid Paperheart Arcade save.");
    return d;
  }
  function get(k) {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch {
      return null;
    }
  }
  function valid(d) {
    try {
      return validate(d);
    } catch {
      return null;
    }
  }
  const saved = [get(key), window.arcadeDisk, get(key + ".bak")]
    .map(valid)
    .filter(Boolean)
    .sort((a, b) => b.stamp - a.stamp);
  let state = saved[0] || fresh();
  if (!saved.length) {
    const legacy = get("paperheart-anniversary-v1");
    if (Array.isArray(legacy?.completed)) {
      const migrated = { ...state, walk: legacy };
      if (valid(migrated)) state = migrated;
    }
  }
  function warn() {
    let el = document.getElementById("save-warning");
    if (!el) {
      el = document.createElement("p");
      el.id = "save-warning";
      el.setAttribute("role", "alert");
      document.body.prepend(el);
    }
    el.textContent = "Autosave storage is unavailable. Export a save file before closing.";
  }
  function read() {
    const latest = valid(get(key));
    if (latest && latest.stamp > state.stamp) state = latest;
    return structuredClone(state);
  }
  function commit(next) {
    validate(next);
    next.stamp = Math.max(Date.now(), state.stamp + 1);
    const raw = JSON.stringify(next);
    try {
      localStorage.setItem(key + ".bak", JSON.stringify(state));
      localStorage.setItem(key, raw);
    } catch {
      warn();
    }
    state = next;
    if (window.arcadeWrite && window.arcadeTicket) window.arcadeWrite(window.arcadeTicket, raw).catch(warn);
  }
  window.ArcadeSave = {
    read,
    validate,
    importFile: commit,
    species,
    change(fn) {
      const next = read();
      fn(next);
      commit(next);
    },
  };
})();
