/* Hand-drawn, palette-indexed 32 × 32 character cels. Coordinates are native pixels. */
(() => {
  "use strict";

  const palette = {
    k: "#382e39", d: "#52363e", b: "#754449", a: "#995d53", h: "#bb7965",
    B: "#24232f", A: "#333340", H: "#474352",
    t: "#424354", m: "#555363", g: "#716473",
    f: "#ffcdab", l: "#ffe0bd", s: "#e5a084", c: "#f08f93", w: "#fff4d9",
    o: "#4f414f", u: "#26746d", v: "#459d8b", n: "#81c3a1", j: "#aaddb7",
    e: "#a44460", p: "#da6178", r: "#f38898", i: "#ffb0a8",
    z: "#80504c", y: "#e8ae68"
  };

  const heads = {
    Axel: [
      "          kk  kk",
      "         kttkktkk",
      "        ktmmtttttkk kk",
      "      kktmggmmttmmtttk",
      "      ktmmmttttttmmtttk",
      "    kktmtttmmtttttmmtkk",
      "   kttttmmmmmtttmmttttkk",
      "    kttmmttttttttmmtttttk",
      "   kttttttttttktttttmttk",
      "    kttttktttksttttktttk",
      "    ktttksktkffkttkskttk",
      "   kkttksfktfflktsfffktk",
      "    ktkflflwwffkklwwfsk",
      "    kkffllfkkfflkfkkffk",
      "    ksffllfkkffllfkkffk",
      "     ksfcclffllffllccsk",
      "      ksfflllllbfbfffsk",
      "       kssfflllfbfllsk",
      "         kssffffffssk",
      "           kksssskk"
    ],
    Swayze: [
      "          kkkkkk",
      "        kkBBBAABkk",
      "       kBBAAHHABBAkk",
      "      kBBAAHHABBBBAABk",
      "     kBBAAAABBBABBBAABk",
      "     kBAAAABBssfsBBAAAk",
      "    kBAAAAABBsfffsBBAAAk",
      "    kBAAAABBsffffffsABBk",
      "    kBAAABBsfflllffffsBk",
      "    kBAABsffllllfffffsBk",
      "    kBABsffhhlllffffhABk",
      "    kBABfflllfflfffhffBk",
      "    kBBslflwwfffllwwfBBk",
      "    kBssllfkkffllfkkfsBBk",
      "    kBssllfkkffllfkkfsBBk",
      "    kBBsccfffllffllccsBBk",
      "    kBBBsflllllbfbfffsBAk",
      "    kBAABssflllfbfllskBAk",
      "     kBAABssffffffsskBABk",
      "     kBBABkksssssskkBAAk",
      "      kBBBBk      kBBBk",
      "       kkkk        kkk"
    ]
  };

  const ribbon = [
    "keek   kkk",
    "kripe kepk",
    "krippekirk",
    " keppwprrk",
    "  kkpeekk",
    "    kpkk",
    "    kek"
  ];

  const bodies = {
    Axel: [
      "   kuuuuuuk",
      "  kvnvvnnnuk",
      " kvnnuwwuvvuk",
      " kvnvuwynvvuk",
      " kvvvuwunvvuk",
      "  kuuuwwuvuuk",
      "  ktttootttk",
      "   kttkkttk"
    ],
    Swayze: [
      "   kssffsk",
      "  kerwkkwrek",
      " kpripppprrpk",
      "  kpripyprek",
      "   keppppeek",
      "  kprriiprrpk",
      " kprriprprirpk",
      " kpwiiwiwwiwpk",
      "  keeeeeeeeek"
    ]
  };

  const sleeves = {
    Axel: [" kk", "kvnk", "kuvk", "kusk", " kfk", "  k"],
    Swayze: [" kk", "krik", "kprk", " ksk", " kfk", "  k"]
  };
  const boots = {
    Axel: ["kttk", "ktmk", "kzzzk", "kbaak", " kkkk"],
    Swayze: ["ksfk", "kwwk", "kepk", "krrpk", " kkkk"]
  };

  function ink(ctx, rows, x, y, flip = false) {
    for (let row = 0; row < rows.length; row++) {
      const pixels = rows[row];
      for (let column = 0; column < pixels.length; column++) {
        const color = palette[pixels[column]];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x + (flip ? -column : column), y + row, 1, 1);
      }
    }
  }

  // Every cel is painted once at native resolution so display scaling always stays crisp.
  const cache = new Map();
  function getFrame(name, stride, jumping, blink, bob) {
    const key = [name, stride, jumping, blink, bob].join("/");
    if (cache.has(key)) return cache.get(key);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext("2d");
    const swayze = name === "Swayze";
    const torsoY = (swayze ? 19 : 20) + bob;
    const footY = jumping ? 26 : 27;
    ink(ctx, boots[name], 10 - stride - 2 * Number(jumping), footY - Number(stride < 0));
    ink(ctx, boots[name], 18 + stride + 2 * Number(jumping), footY - Number(stride > 0) - Number(jumping));
    const sleeveY = torsoY + (jumping ? -2 : 1);
    ink(ctx, sleeves[name], 7 - Number(jumping), sleeveY + stride);
    ink(ctx, sleeves[name], 24 + Number(jumping), sleeveY - stride, true);
    ink(ctx, bodies[name], 9, torsoY);
    if (!swayze) {
      const scarf = jumping ? ["kvvuk", "knnvvuuk", " kkuukkk"] : ["   kvvuk", "  kvnvuk", " kvnvuk", "  kuukk", "   kk"];
      ink(ctx, scarf, jumping ? 4 : 5, torsoY);
      ink(ctx, ["kuvvvnuk", " kvnjuuk"], 12, torsoY);
    }
    const headY = 1 + bob;
    ink(ctx, heads[name], 0, headY);
    if (swayze) ink(ctx, ribbon, 18, headY + 2);
    if (!blink) {
      ink(ctx, ["wk", "ko"], 11, headY + 13);
      ink(ctx, ["wk", "ko"], 18, headY + 13);
    }
    if (blink) {
      // The two bottom eye rows close together into a smiling crescent.
      const close = ["fff", "fff", "dkd"];
      ink(ctx, close, 10, headY + 12);
      ink(ctx, close, 17, headY + 12);
    }
    cache.set(key, canvas);
    return canvas;
  }

  function draw(ctx, name, x, y, scale = 1, facing = 1, pose = "idle", time = 0) {
    const character = name === "Swayze" ? "Swayze" : "Axel";
    const phase = Math.floor(time * 8) % 4;
    const stride = pose === "walk" ? [0, 2, 0, -2][phase] : 0;
    const bob = pose === "walk" ? Number(phase % 2 === 0) : 0;
    const blink = pose === "idle" && (time + (character === "Swayze" ? 1.3 : 0)) % 3.7 > 3.55;
    const frame = getFrame(character, stride, pose === "jump", blink, bob);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x) + (facing < 0 ? 32 * scale : 0), Math.round(y));
    ctx.scale(facing < 0 ? -scale : scale, scale);
    ctx.drawImage(frame, 0, 0);
    ctx.restore();
  }

  window.Sprites = Object.freeze({ draw });
})();
