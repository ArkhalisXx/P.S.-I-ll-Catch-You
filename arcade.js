(() => {
  "use strict";
  if (new URLSearchParams(location.search).has("walk")) return;
  const el = (id) => document.getElementById(id);
  const store = ArcadeSave;
  const modes = {
    dock: ["Just One More Cast", "Endless fishing"],
    pancake: ["Last Pancake", "Kitchen duet"],
    date: ["Meet Me at Seven", "Map puzzle"],
    tank: ["Room for a Tank", "Aquarium tycoon"],
  };
  let data = store.read(),
    mode = "",
    play = {},
    elapsed = 0,
    previous = 0,
    held = false,
    frame = 0;
  const settings = el("preferences");
  el("arcade").hidden = false;
  const coverPair = el("cover-pair").getContext("2d");
  Sprites.draw(coverPair, "Axel", 5, 4);
  Sprites.draw(coverPair, "Swayze", 32, 4, 1, -1);
  const shelfCanvases = {};
  function change(fn) {
    store.change(fn);
    data = store.read();
    balance();
  }
  function balance() {
    el("coins").textContent = data.coins.toLocaleString();
  }
  function button(label, handler, disabled = false) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.disabled = disabled;
    b.addEventListener("click", handler);
    return b;
  }
  for (const [id, [name, genre]] of Object.entries(modes)) {
    const card = button("", () => open(id));
    card.className = "cartridge";
    const screen = document.createElement("canvas");
    screen.width = 320;
    screen.height = 144;
    screen.ariaHidden = "true";
    shelfCanvases[id] = screen;
    const title = document.createElement("strong");
    title.textContent = name;
    const type = document.createElement("small");
    type.textContent = genre;
    card.append(screen, type, title);
    el("shelf").append(card);
  }
  function library() {
    cancelAnimationFrame(frame);
    mode = "";
    held = false;
    data = store.read();
    balance();
    silence();
    el("library").hidden = false;
    el("cabinet").hidden = true;
    for (const [id, c] of Object.entries(shelfCanvases)) drawArcadeScene(c, id, 1, data);
  }
  el("home").onclick = library;
  document.querySelector('[data-open="walk"]').onclick = () => location.assign("?walk");
  const tracks = {
    dock: [0.52, "triangle", [74, 0, 81, 78, 0, 76, 74, 0, 71, 0, 74, 0, 69, 0, 0, 0]],
    pancake: [0.19, "square", [72, 76, 0, 79, 76, 0, 81, 79, 72, 0, 74, 77, 76, 74, 0, 67]],
    date: [0.35, "triangle", [67, 71, 74, 0, 69, 72, 76, 0, 74, 78, 81, 0, 76, 74, 71, 0]],
    tank: [0.72, "sine", [60, 67, 0, 71, 64, 0, 67, 0, 62, 69, 0, 72, 65, 0, 69, 0]],
  };
  let audio,
    step = 0,
    beat = 0;
  function wake() {
    try {
      audio ??= new AudioContext();
      audio.resume().catch(() => {});
    } catch {}
  }
  function tone(note, length, wave, gain) {
    if (!gain || audio?.state !== "running") return;
    const src = audio.createOscillator(),
      env = audio.createGain(),
      now = audio.currentTime;
    src.type = wave;
    src.frequency.value = 440 * 2 ** ((note - 69) / 12);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(Math.max(0.00011, gain), now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, now + length);
    src.connect(env).connect(audio.destination);
    src.start();
    src.stop(now + length);
  }
  function silence() {
    step = 0;
    beat = 0;
  }
  function music(dt) {
    beat -= dt;
    if (beat > 0) return;
    const [speed, wave, notes] = tracks[mode];
    beat = mode === "dock" && play.phase === "reel" ? speed * 0.6 : speed;
    const pitch = notes[step % notes.length];
    if (pitch) tone(pitch, speed * 0.92, wave, data.music * (mode === "pancake" ? 0.025 : 0.08));
    if (step % 4 === 0)
      tone((notes[step % notes.length] || 60) - 12, speed * 1.4, "sine", data.music * 0.055);
    step++;
  }
  function effect(note = 84) {
    tone(note, 0.17, "sine", data.effects * 0.12);
  }
  function show(message, actions = [], record = "") {
    el("cue").textContent = message;
    el("actions").replaceChildren(...actions);
    el("record").textContent = record;
  }
  function open(id) {
    cancelAnimationFrame(frame);
    data = store.read();
    balance();
    mode = id;
    play = {};
    elapsed = 0;
    previous = 0;
    held = false;
    silence();
    wake();
    el("library").hidden = true;
    el("cabinet").hidden = false;
    el("mode-title").textContent = modes[id][0];
    el("mode-genre").textContent = modes[id][1];
    if (id === "dock") dock();
    if (id === "pancake") kitchen();
    if (id === "date") map();
    if (id === "tank") aquarium();
    frame = requestAnimationFrame(loop);
    el("home").focus();
  }
  function kitchen(message = "Swayze flips. Axel catches. Land both in the gold zone.") {
    play.phase = "ready";
    show(
      message,
      [
        button("Pour batter", () => {
          play.phase = "flip";
          play.clock = 0;
          play.meter = 0;
          show("Swayze · Flip when the pointer reaches gold.", [button("Flip pancake", timePancake)]);
        }),
      ],
      `Served ${data.pancakes} · Best streak ${data.best}`,
    );
  }
  function timePancake() {
    const good = Math.abs(play.meter - 0.5) <= 0.19;
    if (!good) {
      change((s) => {
        s.streak = 0;
      });
      effect(49);
      kitchen("Just missed! Baby, I’ll get another plate.");
      return;
    }
    if (play.phase === "flip") {
      play.phase = "catch";
      play.clock = 0;
      play.meter = 0;
      effect(72);
      show("Axel · Slide the plate into the gold zone under her pancake.", [
        button("Catch on plate", timePancake),
      ]);
    } else {
      change((s) => {
        s.coins += 8;
        s.pancakes++;
        s.streak++;
        s.best = Math.max(s.best, s.streak);
      });
      effect();
      kitchen("Breakfast served! +8 coins.");
    }
  }
  const places = ["Pier", "Bakery", "Clock", "Park", "Bridge", "Books", "Florist", "Café", "Tram"];
  function meeting() {
    // The two notes specify a crossing, each using a different nearby landmark.
    return [7, 2, 3, 8, 1, 6, 5, 0, 4][data.dates % 9];
  }
  function map(message = "") {
    const goal = meeting(),
      row = Math.floor(goal / 3),
      col = goal % 3;
    const axel = play.pov === "Axel";
    play.receiptSpot = row * 3 + ((col + 1) % 3);
    const clue = axel
      ? `Axel’s receipt · “Our place is on the east–west street through ${places[play.receiptSpot]}, baby.”`
      : `Swayze’s map · “We said the north–south avenue through ${places[((row + 1) % 3) * 3 + col]}.”`;
    const actions = [
      button(axel ? "Back to Swayze" : "Check Axel’s receipt", () => {
        play.pov = axel ? "Swayze" : "Axel";
        map();
      }),
    ];
    if (!axel) {
      for (const [label, delta, can] of [
        ["← West", -1, data.route % 3 > 0],
        ["↑ North", -3, data.route >= 3],
        ["↓ South", 3, data.route < 6],
        ["→ East", 1, data.route % 3 < 2],
      ]) {
        actions.push(
          button(
            label,
            () => {
              change((s) => {
                s.route += delta;
              });
              map();
            },
            !can,
          ),
        );
      }
      actions.push(
        button("Meet here", () => {
          if (data.route !== meeting()) {
            map("Two different streets. Check both notes.");
            return;
          }
          const name = places[data.route];
          change((s) => {
            s.coins += 14;
            s.dates++;
            s.route = 0;
          });
          effect();
          map(`Date at the ${name}! +14 coins. Next invitation:`);
        }),
      );
    }
    show(
      [message, clue].filter(Boolean).join(" "),
      actions,
      `${axel ? "Axel" : "Swayze"} at the ${places[axel ? play.receiptSpot : data.route]} · Dates together ${data.dates}`,
    );
  }
  const value = { Bluegill: 8, Sunfish: 12, Perch: 16 };
  function dock(message = "Swayze · Choose where to cast. Watch the float for a bite.") {
    if (data.pending) {
      catchChoices();
      return;
    }
    play.phase = "ready";
    show(
      message,
      ["Reeds", "Open water", "Deep pool"].map((zone, i) =>
        button("Cast · " + zone, () => {
          play.zone = i;
          play.phase = "waiting";
          play.clock = 0;
          play.delay = 1 + Math.random() * 2;
          play.kind = store.species[Math.random() < 0.7 ? i : Math.floor(Math.random() * 3)];
          show("The float is still…", [], zone);
        }),
      ),
      `Landed ${data.catches} fish`,
    );
  }
  function bite() {
    play.phase = "bite";
    play.clock = 0;
    effect(88);
    show("A bite! Hook it, baby!", [
      button("Set hook", () => {
        play.phase = "reel";
        play.clock = 0;
        play.bar = 0.5;
        play.target = 0.5;
        play.fill = 0.34;
        held = false;
        const lift = button("Hold to lift", () => {});
        lift.onpointerdown = (e) => {
          held = true;
          lift.setPointerCapture(e.pointerId);
        };
        lift.onpointerup =
          lift.onlostpointercapture =
          lift.onpointercancel =
            () => {
              held = false;
            };
        show(
          "Swayze · Hold Space or the button to lift the green bar. Release to lower it. Keep the fish inside.",
          [lift],
        );
      }),
    ]);
  }
  function catchChoices() {
    play.phase = "caught";
    const name = data.pending;
    function settle(choice) {
      change((s) => {
        if (s.pending !== name) return;
        if (choice === "keep") {
          if (s.tank.fish.length >= s.tank.level * 4) return;
          s.tank.fish.push(name);
        }
        if (choice === "sell") s.coins += value[name];
        s.pending = null;
      });
      effect();
      dock(
        choice === "keep"
          ? "Home to the aquarium!"
          : choice === "sell"
            ? `Sold for ${value[name]} coins.`
            : "Back into the water.",
      );
    }
    show(`Swayze landed a ${name}!`, [
      button("Keep in tank", () => settle("keep"), data.tank.fish.length >= data.tank.level * 4),
      button(`Sell · ${value[name]} coins`, () => settle("sell")),
      button("Release", () => settle("release")),
    ]);
  }
  function aquarium(
    message = "Spend arcade coins on your shared tank. Every third feeding can raise a fry with two matching fish.",
  ) {
    const t = data.tank,
      cap = t.level * 4,
      room = t.fish.length < cap;
    const actions = [];
    function buy(label, cost, update, allowed = true) {
      actions.push(
        button(
          `${label} · ${cost} coins`,
          () => {
            change((s) => {
              if (s.coins >= cost) {
                s.coins -= cost;
                update(s.tank);
              }
            });
            effect();
            aquarium(label + " purchased.");
          },
          !allowed || data.coins < cost,
        ),
      );
    }
    buy("Bluegill", 8, (t) => t.fish.push("Bluegill"), room);
    buy("Food ×3", 4, (t) => {
      t.food += 3;
    });
    for (const kind of ["Fern", "Mug"])
      buy(kind, 6, (t) => t.decor.push({ kind, x: 28 + t.decor.length * 21 }), t.decor.length < 12);
    buy(
      "Larger tank",
      t.level * 20,
      (t) => {
        t.level++;
      },
      t.level < 6,
    );
    actions.push(
      button(
        "Feed the fish",
        () => {
          let fry = "";
          change((s) => {
            const tank = s.tank;
            tank.food--;
            tank.fed++;
            const pair = tank.fish.find((n) => tank.fish.filter((f) => f === n).length >= 2);
            if (pair && tank.fed % 3 === 0 && tank.fish.length < tank.level * 4) {
              fry = pair;
              tank.fish.push(pair);
            }
          });
          play.lastFeed = elapsed;
          effect(76);
          aquarium(fry ? `A baby ${fry} joined the school!` : "A pinch of food for the school.");
        },
        !t.food || !t.fish.length,
      ),
    );
    for (const n of new Set(t.fish))
      actions.push(
        button(`Sell one ${n} · ${value[n]}`, () => {
          change((s) => {
            s.tank.fish.splice(s.tank.fish.indexOf(n), 1);
            s.coins += value[n];
          });
          aquarium(`${n} sold.`);
        }),
      );
    t.decor.forEach((d, i) =>
      actions.push(
        button(`Move ${d.kind} ${i + 1}`, () => {
          play.moving = i;
          aquarium("Tap a spot on the tank floor, or use the placement buttons.");
        }),
      ),
    );
    if (Number.isInteger(play.moving))
      for (const [label, x] of [
        ["Left", 40],
        ["Center", 150],
        ["Right", 270],
      ])
        actions.push(button(label, () => place(x)));
    show(
      message,
      actions,
      `Tank ${t.level} · ${t.fish.length}/${cap} fish · Food ${t.food} · Feedings ${t.fed}`,
    );
  }
  function place(x) {
    change((s) => {
      s.tank.decor[play.moving].x = x;
    });
    delete play.moving;
    aquarium("Decoration placed.");
  }
  el("stage").onclick = (e) => {
    if (mode !== "tank" || !Number.isInteger(play.moving)) return;
    const r = el("stage").getBoundingClientRect();
    place(Math.max(0, Math.min(300, Math.round(((e.clientX - r.left) * 320) / r.width))));
  };
  function tick(dt) {
    play.clock = (play.clock || 0) + dt;
    if (mode === "pancake" && ["flip", "catch"].includes(play.phase)) {
      const speed = play.phase === "flip" ? 1 : 1.35;
      play.meter = (1 - Math.cos(play.clock * (3 + Math.min(2, data.streak * 0.12)) * speed)) / 2;
    }
    if (mode !== "dock") return;
    if (play.phase === "waiting" && play.clock >= play.delay) bite();
    else if (play.phase === "bite" && play.clock > 3) dock("It slipped away. Try another cast.");
    else if (play.phase === "reel") {
      const speed = { Bluegill: 0.85, Sunfish: 1.35, Perch: 1.9 }[play.kind];
      play.target = 0.5 + 0.31 * Math.sin(play.clock * speed) + 0.12 * Math.sin(play.clock * speed * 2);
      play.bar = Math.max(0, Math.min(1, play.bar + (held ? 0.66 : -0.44) * dt));
      const inside = Math.abs(0.13 + 0.74 * play.bar - play.target) < 0.14;
      play.fill += dt * (inside ? 0.32 : -0.15);
      if (play.fill <= 0) dock("The line went slack. Another cast, baby?");
      else if (play.fill >= 1) {
        play.phase = "net";
        held = false;
        show("Axel · She’s got it! Scoop the fish into the net.", [
          button("Land with Axel", () => {
            change((s) => {
              s.pending = play.kind;
              s.catches++;
            });
            effect();
            catchChoices();
          }),
        ]);
      }
    }
  }
  function loop(now) {
    const dt = previous ? Math.min((now - previous) / 1000, 0.06) : 0;
    previous = now;
    if (!document.hidden && !settings.open) {
      elapsed += dt;
      tick(dt);
      music(dt);
    }
    drawArcadeScene(el("stage"), mode, elapsed, data, play);
    if (mode === "pancake" && ["flip", "catch"].includes(play.phase)) {
      const c = el("stage").getContext("2d");
      c.fillStyle = "#403847";
      c.fillRect(85, 123, 150, 10);
      c.fillStyle = "#ffce80";
      c.fillRect(132, 125, 56, 6);
      c.fillStyle = "#fffbe3";
      c.fillRect(85 + play.meter * 146, 120, 4, 15);
    }
    frame = requestAnimationFrame(loop);
  }
  document.addEventListener("keydown", (e) => {
    if (
      !settings.open &&
      mode === "dock" &&
      play.phase === "reel" &&
      e.code === "Space" &&
      [document.body, el("actions").firstChild, el("home")].includes(document.activeElement)
    ) {
      e.preventDefault();
      held = true;
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.code === "Space") held = false;
  });
  window.addEventListener("blur", () => {
    held = false;
  });
  el("settings").onclick = () => {
    held = false;
    data = store.read();
    el("file-status").textContent = "";
    for (const k of ["music", "effects"]) el(k + "-volume").value = Math.round(data[k] * 100);
    settings.showModal();
  };
  for (const k of ["music", "effects"])
    el(k + "-volume").oninput = (e) =>
      change((s) => {
        s[k] = Number(e.target.value) / 100;
      });
  el("export").onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(store.read(), null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "paperheart-save.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
  el("import").onclick = () => el("save-file").click();
  el("save-file").onchange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 262144) throw Error("Save file is too large.");
      const next = store.validate(JSON.parse(await file.text()));
      if (!confirm("Replace your current progress with this save file?")) return;
      store.importFile(next);
      settings.close();
      library();
    } catch (err) {
      el("file-status").textContent = err.message;
    } finally {
      e.target.value = "";
    }
  };
  library();
})();
