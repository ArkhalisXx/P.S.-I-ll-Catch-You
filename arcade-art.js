const arcadeBackdrops = {};
for (const name of ["kitchen", "lake", "water", "town"]) {
  const image = new Image();
  image.src = "arcade-" + name + ".png";
  arcadeBackdrops[name] = image;
}
const actorCel = document.createElement("canvas");
actorCel.width = actorCel.height = 32;
const actorInk = actorCel.getContext("2d");
/* Scenes share a 320 × 144 pixel grid with the original character cels. */
window.drawArcadeScene = function (canvas, mode, t, state, play = {}) {
  const ctx = canvas.getContext("2d");
  ctx.setTransform(canvas.width / 320, 0, 0, canvas.height / 144, 0, 0);
  ctx.imageSmoothingEnabled = false;
  function box(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }
  function line(x, y, a, b, c) {
    const steps = Math.ceil(Math.max(Math.abs(a - x), Math.abs(b - y)));
    for (let i = 0; i <= steps; i++)
      box(x + ((a - x) * i) / (steps || 1), y + ((b - y) * i) / (steps || 1), 1, 1, c);
  }
  function person(name, x, y, face = 1, pose = "idle", size = 1) {
    actorInk.clearRect(0, 0, 32, 32);
    Sprites.draw(actorInk, name, 0, 0, 1, face, pose, t);
    // The same character cel picks up the light at each station.
    actorInk.globalCompositeOperation = "source-atop";
    actorInk.fillStyle = mode === "dock" ? "#d67e5826" : mode === "pancake" ? "#e7a25a29" : "#e1c67c1c";
    actorInk.fillRect(0, 0, 32, 32);
    actorInk.globalCompositeOperation = "source-over";
    if (mode === "pancake") {
      function stitch(x, y, w, h, color) {
        actorInk.fillStyle = color;
        actorInk.fillRect(x, y, w, h);
      }
      const apron = name === "Swayze" ? "#edd0a4" : "#859a86";
      stitch(12, 21, 7, 6, apron);
      stitch(10, 25, 12, 4, apron);
      stitch(13, 25, 5, 2, "#ab886f");
      if (name === "Swayze") {
        stitch(9, 4, 14, 2, "#d98282");
        stitch(8, 2, 4, 3, "#ffc0a7");
      }
    }
    box(x + 7 * size, y + 30 * size, 18 * size, 2 * size, "#412c3555");
    ctx.drawImage(actorCel, Math.round(x), Math.round(y), 32 * size, 32 * size);
  }
  function fish(name, x, y, left) {
    const colors = {
      Bluegill: ["#5b98ad", "#a2dcbd"],
      Sunfish: ["#ce7758", "#ffd77f"],
      Perch: ["#66885c", "#d1c57b"],
    };
    const [body, fin] = colors[name];
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (left) ctx.scale(-1, 1);
    box(-9, -3, 3, 7, fin);
    box(-6, -2, 3, 5, body);
    box(-4, -4, 8, 8, body);
    box(4, -2, 3, 4, body);
    box(-3, -5, 5, 2, fin);
    box(-3, 1, 5, 2, fin);
    box(3, -2, 2, 2, "#243342");
    ctx.restore();
  }
  function backdrop(name, color) {
    box(0, 0, 320, 144, color);
    const image = arcadeBackdrops[name];
    if (image.complete && image.naturalWidth) ctx.drawImage(image, 0, 0, 320, 144);
  }
  if (mode === "tank") {
    backdrop("water", "#438b88");
    function fern(x, h) {
      for (let i = 0; i < h; i += 3) {
        const bend = Math.round(Math.sin(t + i * 0.1) * 2);
        box(x + bend, 126 - i, 2, 4, "#91b585");
        box(x + bend - (i % 2 ? 3 : 0), 124 - i, 5, 2, i % 2 ? "#579b88" : "#72ac84");
      }
    }
    for (const x of [4, 11, 17, 295, 301, 312]) fern(x, 18 + (x % 20));
    for (const d of state.tank.decor) {
      if (d.kind === "Fern") {
        fern(d.x, 37);
        fern(d.x + 6, 21);
      } else {
        box(d.x + 13, 112, 7, 9, "#e0b18f");
        box(d.x + 14, 114, 3, 4, "#326d7d");
        box(d.x, 109, 14, 16, "#d38e80");
        box(d.x, 109, 14, 3, "#ffe5b5");
        box(d.x + 4, 115, 5, 4, "#fff0bd");
      }
    }
    for (let i = 0; i < 16; i++) {
      const y = 120 - ((t * 9 + i * 23) % 113);
      box((i * 53 + Math.round(Math.sin(t + i) * 2)) % 320, y, 2, 2, "#a4d8ca");
    }
    const feeding = t - (play.lastFeed ?? -10);
    if (feeding < 3)
      for (let i = 0; i < 9; i++)
        box(122 + ((i * 29) % 63), 14 + feeding * 24 + (i % 5) * 2, 2, 2, "#f5be83");
    state.tank.fish.forEach((n, i) => {
      const phase = t * 0.32 + i * 1.8;
      const gather = feeding < 3 ? Math.sin((Math.PI * feeding) / 3) : 0;
      fish(
        n,
        157 + Math.sin(phase) * 114 * (1 - 0.8 * gather),
        45 + ((i * 23) % 57) * (1 - gather) + Math.sin(t + i) * 4,
        Math.cos(phase) < 0,
      );
    });
  } else if (mode === "pancake") {
    backdrop("kitchen", "#d8ab84");
    ctx.save();
    ctx.translate(0, 13);
    person("Swayze", play.chefX ?? 51, 66, 1);
    person("Axel", play.runnerX ?? 221, 66, -1);

    const pans = [62, 128];
    function cake(x, y, shade) {
      box(x - 10, y, 21, 3, "#985c32");
      box(x - 9, y - 2, 18, 3, shade);
      box(x - 6, y - 3, 10, 2, shade);
    }
    pans.forEach((x, index) => {
      box(x - 16, 94, 35, 4, "#493e3c");
      box(x - 14, 96, 29, 3, "#615149");
      box(x + 17, 92, 11, 3, "#664932");
      const pan = play.pans?.[index];
      if (pan && !(play.phase === "flight" && play.panSide === index)) {
        cake(x, 92, pan.heat < 0.3 ? "#f3db9e" : pan.heat < 0.7 ? "#dfaa61" : "#ad773d");
        const [lo, hi] = { light: [0.24, 0.48], golden: [0.45, 0.71], deep: [0.66, 0.92] }[
          play.recipe.layers[pan.layer]
        ];
        box(x - 24, 106, 48, 9, "#483329");
        box(x - 22, 108, 44, 5, "#966745");
        box(x - 22 + lo * 44, 108, Math.ceil((hi - lo) * 44), 5, "#a4c376");
        box(x - 22 + pan.heat * 42, 104, 2, 12, "#fff4c4");
        for (let i = 0; i < 3; i++) {
          const dy = (t * 13 + i * 5) % 16;
          box(x - 6 + i * 6 + Math.sin(t + i) * 2, 83 - dy, 2, 3, "#fff2cfaa");
        }
      }
    });
    const xs = [185, 237, 287],
      plateX = xs[play.plate ?? 1];
    const flight = play.phase === "flight";
    if (flight) {
      for (let i = 0; i < 3; i++) {
        box(xs[i] - 14, 103, 28, 2, i === play.landing ? "#ffdc76" : "#b99771");
        if (i === play.landing) {
          box(xs[i] - 16, 101, 2, 3, "#fff3b3");
          box(xs[i] + 14, 101, 2, 3, "#fff3b3");
        }
      }
      const p = Math.min(1, play.clock / 2.2);
      cake(
        pans[play.panSide] + (xs[play.landing] - pans[play.panSide]) * p,
        89 - 57 * Math.sin(Math.PI * p),
        "#e3ad65",
      );
    }
    box(plateX - 16, 96, 32, 3, "#f1ead5");
    box(plateX - 12, 99, 24, 2, "#91b7ac");
    for (let i = 0; i < (play.phase === "orders" ? 0 : play.served || 0); i++)
      cake(plateX, 93 - i * 4, "#edba77");
    if (play.phase === "orders") cake(62, 92, "#edba77");
    ctx.restore();
  } else if (mode === "date") {
    const pts = Outings.places.map((_, i) => [54 + (i % 3) * 106, 22 + Math.floor(i / 3) * 48]);
    backdrop("town", "#a8ac85");
    const labels = Outings.places;
    for (const [i, [x, y]] of pts.entries()) {
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      const w = Math.ceil(ctx.measureText(labels[i]).width);
      box(x - w / 2 - 3, y + 10, w + 6, 9, "#463026");
      box(x - w / 2 - 2, y + 11, w + 4, 7, "#edd7aa");
      ctx.fillStyle = "#4e372b";
      ctx.fillText(labels[i], x, y + 17);
      if (play.plan?.stops.includes(i) && !(play.trip.mask & (1 << play.plan.stops.indexOf(i)))) {
        box(x - 18, y - 13, 7, 9, "#a95440");
        box(x - 15, y - 12, 1, 4, "#ffeabc");
        box(x - 15, y - 7, 1, 1, "#ffeabc");
      }
    }
    ctx.textAlign = "left";
    if (play.plan && !play.trip.opened) {
      const [a, b] = play.plan.closed.map((n) => pts[n]);
      const x = (a[0] + b[0]) / 2,
        y = (a[1] + b[1]) / 2;
      box(x - 5, y - 3, 11, 6, "#884836");
      for (let i = 0; i < 3; i++) box(x - 4 + i * 4, y - 2, 2, 3, "#f7cb84");
    }
    const axel = play.pov === "Axel",
      [x, y] = pts[axel ? play.receiptSpot : state.route];
    const progress = Math.min(1, (t - (play.moveStarted ?? -1)) / 0.28);
    const [fromX, fromY] = !axel && play.departure !== undefined ? pts[play.departure] : [x, y];
    const walkX = fromX + (x - fromX) * progress,
      walkY = fromY + (y - fromY) * progress;
    person(
      axel ? "Axel" : "Swayze",
      walkX + 10,
      walkY - 10,
      x < fromX ? -1 : 1,
      progress < 1 ? "walk" : "idle",
      0.75,
    );
  } else {
    backdrop("lake", "#64818a");
    for (let i = 0; i < 22; i++)
      box((i * 59 + t * 2) % 320, 104 + ((i * 11) % 38), 2 + (i % 5), 1, "#ffeabd66");
    const landing = play.phase === "net" || play.phase === "caught";
    person("Axel", landing ? 98 : 38, 58);
    person("Swayze", 81, 58);
    if (landing) {
      line(118, 80, 157, 100, "#d6b295");
      line(157, 99, 170, 99, "#fae1bd");
      for (let j = 0; j < 5; j++) line(157 + j * 3, 100, 161 + j, 108, "#a2bdba");
      fish(play.kind || state.pending || "Bluegill", 164, 98, false);
    }
    line(103, 78, 143, 50, "#54434a");
    const castX = 174 + (play.zone || 0) * 23;
    const floatY =
      95 + Math.round(Math.sin(t * (play.phase === "bite" ? 15 : 2)) * (play.phase === "bite" ? 4 : 1));
    line(143, 50, castX, floatY, "#ead4b0");
    box(castX - 3, floatY, 6, 3, "#f5daca");
    box(castX - 2, floatY - 3, 4, 3, "#c7666d");
    if (play.phase === "bite") {
      box(castX - 1, floatY - 20, 3, 8, "#ffe5a5");
      box(castX - 1, floatY - 10, 3, 3, "#ffe5a5");
    }
    if (play.phase === "reel") {
      box(258, 10, 30, 121, "#302e45");
      box(262, 14, 16, 113, "#527889");
      box(262, 14 + (1 - play.bar) * 84, 16, 29, "#9dca8b");
      fish(play.kind, 270, 16 + (1 - play.target) * 108, false);
      box(281, 15 + (1 - play.fill) * 110, 3, Math.ceil(play.fill * 110), "#f4c480");
    }
  }
};
