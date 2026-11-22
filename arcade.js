(() => {
  "use strict";
  if (new URLSearchParams(location.search).has("walk")) return;
  const el = (id) => document.getElementById(id);
  const store = ArcadeSave;
  const modes = {
    walk: ["P.S. I’ll Catch You", "Anniversary walk"],
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
  document.querySelectorAll("[data-item]").forEach((c) => ArcadeItems(c, c.dataset.item));
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
  const previews = {
    walk: "night-walk.png",
    dock: "arcade-lake.png",
    pancake: "arcade-kitchen.png",
    date: "arcade-town.png",
    tank: "arcade-water.png",
  };
  const gameIds = Object.keys(modes);
  let featured = "walk";
  function resultLabel(id) {
    switch (id) {
      case "walk":
        return data.walk.completed.length + " / 20 chapters";
      case "dock":
        return data.catches + " landed";
      case "pancake":
        return data.pancakes + " served";
      case "date":
        return data.dates + (data.dates === 1 ? " date" : " dates");
      case "tank":
        return data.tank.fish.length + " / " + data.tank.level * 4 + " fish";
    }
  }
  function selectGame(id) {
    featured = id;
    el("marquee").dataset.game = id;
    el("marquee").style.backgroundImage = 'url("' + previews[id] + '")';
    el("featured-title").replaceChildren();
    if (id === "walk") {
      const em = document.createElement("em");
      em.textContent = "Arcade";
      el("featured-title").append("Paperheart", document.createElement("br"), em);
    } else el("featured-title").textContent = modes[id][0];
    el("cover-pair").hidden = id !== "walk";
    el("feature-record").textContent = resultLabel(id);
    el("launch").textContent = "▶ Play " + modes[id][0];
    el("feature-number").textContent = gameIds.indexOf(id) + 1 + " / " + gameIds.length;
    el("shelf")
      .querySelectorAll("button")
      .forEach((b) => b.classList.toggle("selected", b.dataset.game === id));
  }
  function turnDial(step) {
    selectGame(gameIds[(gameIds.indexOf(featured) + step + gameIds.length) % gameIds.length]);
  }
  el("prev-game").onclick = () => turnDial(-1);
  el("next-game").onclick = () => turnDial(1);
  el("launch").onclick = () => (featured === "walk" ? location.assign("?walk") : open(featured));
  Sprites.draw(el("hud-portrait").getContext("2d"), "Swayze", 0, 0);
  for (const id of gameIds.slice(1)) {
    const [name, genre] = modes[id];
    const card = button("", () => {
      selectGame(id);
      open(id);
    });
    card.className = "cartridge";
    card.dataset.game = id;
    card.setAttribute("aria-label", "Play " + name);
    const image = document.createElement("canvas");
    image.width = 448;
    image.height = 202;
    image.setAttribute("aria-hidden", "true");
    const type = document.createElement("small");
    type.textContent = genre;
    const title = document.createElement("strong");
    title.textContent = name;
    const footer = document.createElement("span");
    footer.className = "cart-foot";
    const stat = document.createElement("span");
    stat.className = "cart-stat";
    const arrow = document.createElement("b");
    arrow.textContent = "▶";
    arrow.setAttribute("aria-hidden", "true");
    footer.append(stat, arrow);
    card.append(image, type, title, footer);
    el("shelf").append(card);
  }
  function drawCartridges() {
    for (const card of el("shelf").children) {
      const id = card.dataset.game;
      const sample = id === "pancake" ? { phase: "top", served: 3 } : id === "date" ? { pov: "Swayze" } : {};
      drawArcadeScene(card.querySelector("canvas"), id, 1, data, sample);
    }
  }
  Promise.all(Object.values(arcadeBackdrops).map((image) => image.decode().catch(() => {}))).then(
    drawCartridges,
  );
  function library() {
    const lastMode = mode;
    cancelAnimationFrame(frame);
    mode = "";
    held = false;
    data = store.read();
    balance();
    silence();
    el("library").hidden = false;
    el("cabinet").hidden = true;
    for (const card of el("shelf").children)
      card.querySelector(".cart-stat").textContent = resultLabel(card.dataset.game);
    drawCartridges();
    selectGame(featured);
    if (lastMode)
      el("shelf")
        .querySelector('[data-game="' + lastMode + '"]')
        ?.focus({ preventScroll: true });
  }
  el("home").onclick = library;

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
    el("cabinet").dataset.mode = id;
    el("cabinet").classList.remove("inspect");
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
  const recipes = [
    { name: "Sunday honey", layers: ["golden"], topping: "Honey", pay: 8 },
    { name: "Berry short stack", layers: ["light", "golden"], topping: "Berries", pay: 16 },
    { name: "Cocoa at midnight", layers: ["deep", "light"], topping: "Cocoa", pay: 18 },
    { name: "Three little suns", layers: ["light", "golden", "deep"], topping: "Honey", pay: 25 },
    { name: "Pink sunrise", layers: ["golden", "light", "golden"], topping: "Berries", pay: 24 },
    { name: "After-hours single", layers: ["deep"], topping: "Cocoa", pay: 10 },
  ];
  const heatWindows = { light: [0.24, 0.48], golden: [0.45, 0.71], deep: [0.66, 0.92] };
  const lanes = ["Left", "Middle", "Right"];
  function kitchen(message = "Pick an order for Swayze. A larger stack earns more coins.") {
    play.phase = "orders";
    const first = data.pancakes % recipes.length;
    const options = [recipes[first], recipes[(first + 1) % recipes.length]];
    show(
      message,
      options.map((recipe) =>
        button(recipe.name + " · " + recipe.pay + " coins", () => {
          play.recipe = recipe;
          play.served = 0;
          play.pans = [null, null];
          play.clean = true;
          play.plate = 1;
          play.phase = "stove";
          stove("Use either pan. Fill the second while the first cooks, or work one layer at a time.");
        }),
      ),
      `Orders served ${data.pancakes} · Best streak ${data.best}`,
    );
  }
  function ticket() {
    const r = play.recipe;
    return r.name + " · " + r.layers.join(" / ") + " · " + r.topping;
  }
  function stove(message) {
    play.phase = "stove";
    const actions = play.pans.map((pan, index) => {
      const side = index ? "right" : "left";
      const next = play.recipe.layers.findIndex(
        (_, i) => i >= play.served && !play.pans.some((p) => p?.layer === i),
      );
      if (!pan)
        return button(
          "Pour " + side,
          () => {
            play.panSide = index;
            play.pans[index] = { layer: next, heat: 0 };
            stove("Toss each layer in order when its pointer reaches the green band.");
          },
          next < 0,
        );
      return button(
        "Toss " + side + " · " + play.recipe.layers[pan.layer],
        () => {
          const [low, high] = heatWindows[play.recipe.layers[pan.layer]];
          if (pan.heat < low || pan.heat > high) {
            discard(index, pan.heat < low ? "Too pale. Pour that layer again." : "That one got too dark.");
            return;
          }
          play.panSide = index;
          play.phase = "flight";
          play.clock = 0;
          play.landing = (play.served + index + Math.floor(pan.heat * 10)) % 3;
          play.plate = (play.landing + 1) % 3;
          catchPanel();
        },
        pan.layer !== play.served,
      );
    });
    show(message, actions, ticket());
  }
  function discard(index, message) {
    play.pans[index] = null;
    if (play.clean)
      change((s) => {
        s.streak = 0;
      });
    play.clean = false;
    effect(48);
    stove(message);
  }
  function catchPanel() {
    const actions = lanes.map((lane, i) => {
      const b = button(lane + " plate", () => {
        play.plate = i;
        effect(65);
        catchPanel();
      });
      b.setAttribute("aria-pressed", String(play.plate === i));
      return b;
    });
    show("Axel · Slide under the falling pancake. Aim for the steam ring.", actions, ticket());
  }
  function finishStack(message = "Finish the order with the topping on the ticket.") {
    play.phase = "top";
    show(
      message,
      ["Honey", "Berries", "Cocoa"].map((t) =>
        button(t, () => {
          if (t !== play.recipe.topping) {
            finishStack("Check the ticket, baby. They asked for " + play.recipe.topping + ".");
            return;
          }
          const pay = play.recipe.pay + (play.clean ? 2 : 0);
          change((s) => {
            s.coins += pay;
            s.pancakes++;
            if (play.clean) s.streak++;
            s.best = Math.max(s.best, s.streak);
          });
          effect();
          kitchen(
            play.recipe.name +
              " served! +" +
              pay +
              " coins" +
              (play.clean ? " including a clean-stack tip." : "."),
          );
        }),
      ),
      ticket(),
    );
  }
  function cook(dt) {
    const panX = play.panSide === 1 ? 117 : 51;
    const plateX = [169, 221, 271][play.plate ?? 1];
    play.chefX = (play.chefX ?? 51) + (panX - (play.chefX ?? 51)) * Math.min(1, dt * 8);
    play.runnerX = (play.runnerX ?? 221) + (plateX - (play.runnerX ?? 221)) * Math.min(1, dt * 8);
    if (play.phase === "flight") {
      if (play.clock < 2.2) return;
      if (play.plate !== play.landing) {
        discard(play.panSide, "It missed the plate. We can redo that layer.");
        return;
      }
      play.pans[play.panSide] = null;
      play.served++;
      effect(76);
      if (play.served === play.recipe.layers.length) finishStack();
      else stove("Layer caught! Next up: " + play.recipe.layers[play.served] + ".");
    } else if (play.phase === "stove") {
      for (const [index, pan] of play.pans.entries()) {
        if (!pan) continue;
        pan.heat += dt * (index ? 0.13 : 0.1);
        if (pan.heat > 1) {
          discard(index, "A little smoky! Refill the empty pan.");
        }
      }
    }
  }

  function map(message = "") {
    const card = Outings.plan(data.dates),
      trip = data.outing || Outings.fresh(),
      pos = data.route;
    const here = Outings.places[pos],
      axel = play.pov === "Axel";
    play.plan = card;
    play.trip = trip;
    play.receiptSpot = card.closed[1];
    const nextStops = card.stops
      .map((spot, i) => ({ spot, i }))
      .filter(({ i }) => !(trip.mask & (1 << i)) && (!card.ordered || i === 0 || trip.mask & 1));
    const actions = [];
    const clue =
      trip.mask === 3
        ? "Meet Axel " + card.clue + "."
        : nextStops.map(({ spot, i }) => card.tasks[i] + " at the " + Outings.places[spot]).join(" or ") +
          ".";
    if (axel) {
      actions.push(
        button("Back to Swayze", () => {
          play.pov = "Swayze";
          map();
        }),
      );
      if (!trip.opened)
        actions.push(
          button("Open the crossing", () => {
            change((s) => {
              (s.outing ??= Outings.fresh()).opened = true;
            });
            effect(70);
            map("Crossing open. You can walk straight through, baby.");
          }),
        );
    } else {
      for (const { spot, i } of nextStops)
        if (spot === pos)
          actions.push(
            button(card.tasks[i], () => {
              change((s) => {
                (s.outing ??= Outings.fresh()).mask |= 1 << i;
              });
              effect(82);
              map("In your journal: " + card.bag[i] + ".");
            }),
          );
      if (trip.mask === 3)
        actions.push(
          button("Meet here", () => {
            if (pos !== card.goal) {
              map("No sign of Axel. Check his clue again.");
              return;
            }
            const pay = trip.steps <= card.budget ? 20 : 14;
            change((s) => {
              s.coins += pay;
              s.dates++;
              s.route = 0;
              delete s.outing;
            });
            effect();
            play.pov = "Swayze";
            map("Together at the " + here + "! +" + pay + " coins. ");
          }),
        );
      actions.push(
        button("Call Axel", () => {
          play.pov = "Axel";
          map();
        }),
      );
      for (const [label, delta] of [
        ["← West", -1],
        ["↑ North", -3],
        ["↓ South", 3],
        ["→ East", 1],
      ]) {
        const to = pos + delta;
        actions.push(
          button(
            label,
            () => walkTo(to),
            to < 0 || to > 8 || Outings.distance(pos, to) !== 1 || Outings.blocked(pos, to, card, trip),
          ),
        );
      }
      if (!trip.rode && [0, 8].includes(pos))
        actions.push(button("Tram to " + Outings.places[8 - pos], () => walkTo(8 - pos, true)));
    }
    const clock = Math.min(23 * 60 + 59, 19 * 60 + 5 * (trip.steps - card.budget));
    const time = (Math.floor(clock / 60) % 12) + ":" + String(clock % 60).padStart(2, "0");
    const hint = axel
      ? trip.opened
        ? "I’ll meet you " + card.clue + ", baby."
        : "The crossing between " +
          card.closed.map((n) => Outings.places[n]).join(" and ") +
          " is closed. I can open it from here."
      : clue + " Each move takes five minutes. Meet by seven for a tip.";
    show(
      [message, hint].filter(Boolean).join(" "),
      actions,
      card.title +
        " · " +
        time +
        " PM · " +
        (axel ? "Axel" : here) +
        " · " +
        [0, 1].filter((i) => trip.mask & (1 << i)).length +
        "/2 errands",
    );
  }
  function walkTo(to, tram = false) {
    const from = data.route,
      trip = data.outing || Outings.fresh(),
      card = play.plan;
    if (play.pov === "Axel" || to < 0 || to > 8) return;
    if (tram) {
      if (trip.rode || ![0, 8].includes(from) || to !== 8 - from) return;
    } else if (Outings.distance(from, to) !== 1 || Outings.blocked(from, to, card, trip)) return;
    change((s) => {
      const trip = (s.outing ??= Outings.fresh());
      trip.steps++;
      if (tram) trip.rode = true;
      s.route = to;
    });
    play.departure = from;
    play.moveStarted = elapsed;
    effect(tram ? 77 : 63);
    map();
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
    const actions = [
      button(el("cabinet").classList.contains("inspect") ? "View aquarium room" : "Inspect tank", () => {
        el("cabinet").classList.toggle("inspect");
        aquarium();
      }),
    ];
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
          el("cabinet").classList.add("inspect");
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
    if (mode === "date") {
      const r = el("stage").getBoundingClientRect();
      const to =
        Math.min(2, Math.floor((3 * (e.clientX - r.left)) / r.width)) +
        3 * Math.min(2, Math.floor((3 * (e.clientY - r.top)) / r.height));
      walkTo(to);
      return;
    }
    if (mode !== "tank" || !Number.isInteger(play.moving)) return;
    const r = el("stage").getBoundingClientRect();
    place(Math.max(0, Math.min(300, Math.round(((e.clientX - r.left) * 320) / r.width))));
  };
  function tick(dt) {
    play.clock = (play.clock || 0) + dt;
    if (mode === "pancake") cook(dt);
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
    frame = requestAnimationFrame(loop);
  }
  document.addEventListener("keydown", (e) => {
    if (!settings.open && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (!mode && ["ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
        turnDial(e.code === "ArrowLeft" ? -1 : 1);
        return;
      }
      const dirs = { ArrowLeft: -1, ArrowUp: -3, ArrowDown: 3, ArrowRight: 1 };
      if (mode === "date" && e.code in dirs) {
        e.preventDefault();
        if (!e.repeat) walkTo(data.route + dirs[e.code]);
        return;
      }
      if (mode === "pancake" && play.phase === "flight" && ["ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
        play.plate = Math.min(2, Math.max(0, play.plate + dirs[e.code]));
        catchPanel();
        return;
      }
    }
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
  el("sound-options").onclick = () => {
    el("settings").onclick();
    el("music-volume").focus();
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
