/* Scenes share a 320 × 144 pixel grid with the original character cels. */
window.drawArcadeScene = function (canvas, mode, t, state, play = {}) {
  const ctx = canvas.getContext("2d");
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
  function person(name, x, y, face = 1) {
    Sprites.draw(ctx, name, x, y, 1, face, "idle", t);
  }
  function sky(colors, stop) {
    colors.forEach((c, i) =>
      box(0, Math.floor((stop * i) / colors.length), 320, Math.ceil(stop / colors.length), c),
    );
    for (let i = 0; i < 28; i++)
      box((i * 67 + 13) % 320, (i * 17 + 4) % Math.max(1, stop - 20), i % 4 === 0 ? 2 : 1, 1, "#ffe8bf");
  }
  function buildings(base, color, windows) {
    for (let i = 0; i < 19; i++) {
      const x = i * 19 - 3,
        h = 9 + ((i * 17) % 27);
      box(x, base - h, 16, h, color);
      box(x + 3, base - h - 3, 7, 3, color);
      for (let j = 0; j < h - 5; j += 7)
        for (let k = 0; k < 3; k++) if ((i + k + j) % 3) box(x + 2 + k * 4, base - h + 4 + j, 2, 2, windows);
    }
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
  if (mode === "tank") {
    sky(["#448a93", "#357c87", "#326d7d", "#305e74", "#304e69", "#31465d"], 144);
    for (let i = 0; i < 8; i++) {
      const x = i * 48;
      for (let j = 0; j < 8; j++) box(x + j * 2, 5 + j * 6, 8, 6, "#ffffff0b");
    }
    box(0, 124, 320, 20, "#b59877");
    box(0, 131, 320, 13, "#9a7a68");
    for (let i = 0; i < 90; i++)
      box((i * 41) % 320, 124 + ((i * 13) % 19), 3, 1, i % 2 ? "#ddbd91" : "#826c61");
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
    box(0, 0, 320, 144, "#d3a48c");
    for (let y = 0; y < 95; y += 11)
      for (let x = -16; x < 320; x += 24) {
        box(x + (y % 2) * 12, y, 23, 10, "#e6bf9d");
        box(x + (y % 2) * 12, y, 23, 1, "#f3d1ac");
      }
    box(89, 9, 131, 53, "#745966");
    box(93, 13, 123, 45, "#99c2bd");
    buildings(57, "#849ba1", "#ddcca9");
    box(0, 0, 87, 61, "#e6bf9d");
    box(222, 0, 100, 61, "#e6bf9d");
    for (let i = 0; i < 13; i++) box(88 + i * 10, 7, 10, 10 + (i % 2) * 3, i % 2 ? "#f5d6ae" : "#ba6e70");
    for (const x of [15, 236]) {
      box(x, 41, 61, 4, "#865e5c");
      for (let j = 0; j < 3; j++) {
        box(x + 5 + j * 17, 30 - j, 10, 11 + j, "#b67869");
        box(x + 5 + j * 17, 28 - j, 10, 3, "#f5dfb5");
      }
    }
    person("Swayze", 72, 63);
    person("Axel", 218, 63, -1);
    // Checkerboard trim on the counter and a syrup bottle by the griddle.
    for (let i = 0; i < 40; i++) box(i * 8, 91, 8, 3, i % 2 ? "#fff2d2" : "#c87c77");
    box(44, 80, 8, 11, "#ae694f");
    box(46, 77, 4, 4, "#dfbb85");
    box(44, 84, 8, 4, "#ffe4a8");
    box(0, 94, 320, 6, "#fff0c7");
    box(0, 100, 320, 6, "#956e6d");
    box(0, 106, 320, 38, "#5a8f88");
    for (let x = 4; x < 320; x += 40) {
      box(x, 111, 35, 26, "#50827e");
      box(x + 14, 115, 9, 2, "#eac491");
    }
    box(59, 89, 58, 5, "#3f4149");
    box(107, 87, 18, 3, "#554852");
    const catchStage = play.phase === "catch",
      meter = play.meter ?? 0.5;
    const plate = catchStage ? 127 + meter * 132 : 218;
    box(plate - 16, 91, 33, 3, "#e7e9d6");
    box(plate - 12, 94, 25, 2, "#b1beba");
    const x = catchStage ? 194 : 76,
      y = catchStage ? 78 - Math.abs(Math.sin(t * 3)) * 17 : 86;
    box(x, y, 21, 4, "#a56c4e");
    box(x + 2, y - 2, 17, 3, "#f5bb71");
    box(x + 7, y - 3, 5, 2, "#ffe4a1");
  } else if (mode === "date") {
    box(0, 0, 320, 144, "#8fa695");
    for (let i = 0; i < 120; i++) box((i * 47) % 320, (i * 29) % 143, 3, 1, "#a5b69b");
    const names = ["Pier", "Bakery", "Clock", "Park", "Bridge", "Books", "Florist", "Café", "Tram"];
    for (let i = 0; i < 9; i++) {
      const x = 24 + (i % 3) * 100,
        y = 7 + Math.floor(i / 3) * 45;
      box(0, y + 31, 320, 10, "#ddc8a7");
      box(x + 38, 0, 9, 144, "#ddc8a7");
    }
    for (let i = 0; i < 9; i++) {
      const x = 24 + (i % 3) * 100,
        y = 7 + Math.floor(i / 3) * 45;
      box(x, y + 6, 28, 17, "#e5c39d");
      box(x - 3, y + 3, 34, 5, ["#b86d75", "#668287", "#937a94"][i % 3]);
      box(x + 16, y + 12, 6, 11, "#795d60");
      box(x + 4, y + 12, 8, 6, "#819da2");
      ctx.fillStyle = "#3d3b49";
      ctx.font = "bold 8px monospace";
      ctx.fillText(names[i], x - 1, y + 31);
    }
    const pos = play.pov === "Axel" ? play.receiptSpot : state.route;
    person(play.pov === "Axel" ? "Axel" : "Swayze", 52 + (pos % 3) * 100, 8 + Math.floor(pos / 3) * 45);
  } else {
    sky(["#515579", "#6c688b", "#9b809a", "#ca99a0", "#efb498"], 88);
    box(240, 14, 16, 13, "#ffe3ac");
    box(243, 11, 10, 19, "#ffe3ac");
    buildings(83, "#666782", "#c89d9a");
    box(0, 83, 320, 61, "#427287");
    for (let i = 0; i < 78; i++)
      box(
        ((i * 59 + t * ((i % 3) + 1)) % 326) - 6,
        85 + ((i * 11) % 58),
        3 + (i % 10),
        1,
        i % 4 ? "#639498" : "#d3b39f",
      );
    box(0, 96, 146, 6, "#c6987e");
    box(0, 102, 146, 4, "#805e63");
    for (let i = 0; i < 6; i++) box(i * 27, 106, 5, 38, "#785c60");
    const landing = play.phase === "net" || play.phase === "caught";
    person("Axel", landing ? 119 : 38, 64);
    person("Swayze", 86, 64);
    if (landing) {
      line(141, 87, 157, 100, "#d6b295");
      line(157, 99, 170, 99, "#fae1bd");
      for (let j = 0; j < 5; j++) line(157 + j * 3, 100, 161 + j, 108, "#a2bdba");
      fish(play.kind || state.pending || "Bluegill", 164, 98, false);
    }
    line(108, 82, 143, 50, "#54434a");
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
