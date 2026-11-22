(() => {
  'use strict';

  const WIDTH = 640;
  const HEIGHT = 272;
  const backdrops = new Map();
  const islands = new Map();

  function randomSource(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function between(random, low, high) {
    return low + Math.floor(random() * (high - low + 1));
  }

  function pixel(ctx, color, x, y, w = 1, h = 1) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function mix(a, b, t) {
    const rgb = [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t));
    return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // Rasterize silhouettes on a stepped grid. All the source art uses solid pixel marks.
  function shape(ctx, color, vertices, step = 2) {
    const minY = Math.floor(Math.min(...vertices.map(p => p[1])) / step) * step;
    const maxY = Math.max(...vertices.map(p => p[1]));
    for (let y = minY; y < maxY; y += step) {
      const scan = y + step / 2;
      const edges = [];
      for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const [x1, y1] = vertices[i], [x2, y2] = vertices[j];
        if ((y1 <= scan && y2 > scan) || (y2 <= scan && y1 > scan)) edges.push(x1 + (scan - y1) * (x2 - x1) / (y2 - y1));
      }
      edges.sort((a, b) => a - b);
      for (let i = 0; i + 1 < edges.length; i += 2) {
        const left = Math.round(edges[i] / step) * step;
        const right = Math.round(edges[i + 1] / step) * step;
        if (right > left) pixel(ctx, color, left, y, right - left, step);
      }
    }
  }

  function makeLayer(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  // Sky, horizon, cloud light, cloud shade, mountain light, mountain shadow, woodland,
  // woodland shade, and grass are hand chosen for each pair of facing pages.
  const themes = [
    ['#f6bbb3','#ffe5bf','#fff0ce','#eab4ac','#efb8ae','#dca3a3','#c8c295','#a5b393','#87a980'],
    ['#f5bec0','#ffe8cb','#fff4db','#e8b4bd','#ebbfbb','#d6a8b0','#c3c79f','#9eb59a','#82a997'],
    ['#eebbc2','#ffe2bd','#ffead5','#d9a7b4','#e6b4bb','#cea1ad','#d5bf96','#b7b08b','#99a780'],
    ['#b7c4da','#fbe2ce','#fff0d8','#c7b9c9','#dcc5c3','#baadb9','#b9c6ac','#95b5a8','#79a79a'],
    ['#edb294','#ffe7b1','#fff1c9','#eab39c','#e4b5a1','#cd9991','#bfc491','#a6af80','#8fa378'],
    ['#cfb9d6','#ffddc3','#fff1d8','#d6b3c6','#e0b4bf','#c59fb1','#c2c2a9','#9cb3a0','#81a295'],
    ['#edb5bd','#ffe2c1','#ffecd0','#e1aab3','#eab9b2','#d3a2ab','#c8c49d','#a8b597','#8aa98c'],
    ['#d0aec8','#fbd8bb','#ffe7cf','#d2a4be','#d9a7b6','#b690aa','#c2b3a3','#aaab9c','#8c9e94'],
    ['#afa7c9','#f1c9bd','#ffe1cc','#c4a4bb','#cdaabb','#b093ac','#b7afa6','#99a29d','#84998e'],
    ['#8787b4','#e9b8bf','#ffe1cb','#b598b6','#c39eb6','#a084a8','#aba5a7','#93979f','#798d8e']
  ];

  function cloud(ctx, x, y, scale, kind, p) {
    // Deliberately asymmetrical banks, with flatter bases, small detached wisps and warm rims.
    const forms = [
      [[0,16],[9,14],[13,9],[19,8],[21,3],[29,2],[32,0],[39,2],[43,7],[49,6],[55,10],[60,11],[64,14],[76,16]],
      [[0,15],[9,13],[12,10],[20,10],[22,6],[31,6],[35,2],[42,1],[49,4],[51,8],[57,7],[61,11],[70,11],[74,14],[85,15]],
      [[0,14],[8,13],[14,8],[20,8],[24,3],[30,2],[35,4],[39,8],[46,7],[52,12],[62,13],[66,14]]
    ];
    const form = forms[kind % 3];
    const width = form[form.length - 1][0];
    const transform = points => points.map(([cx, cy]) => [Math.round(x + cx * scale), Math.round(y + cy * scale)]);
    shape(ctx, p[3], transform([...form,[width - 3,20],[width * .67,20],[width * .59,22],[width * .32,21],[width * .26,19],[4,19]]));
    shape(ctx, p[2], transform([...form,[width - 7,16],[width * .79,16],[width * .74,14],[width * .61,15],[width * .57,11],[width * .49,11],[width * .43,15],[width * .30,15],[width * .25,17],[3,17]]));
    const mid = mix(p[2],p[3],.37);
    shape(ctx, mid, transform([[10,16],[width*.28,16],[width*.31,14],[width*.39,14],[width*.43,12],[width*.51,12],[width*.55,14],[width*.47,15],[width*.44,17],[width*.37,16],[width*.32,18],[width*.18,18]]),1);
    pixel(ctx, mid, x + width * scale * .66, y + 17 * scale, Math.max(3, Math.round(12 * scale)), Math.max(1, Math.round(scale)));
    pixel(ctx, p[3], x - 5 * scale, y + 20 * scale, Math.max(3, Math.round(10 * scale)), Math.max(1,Math.round(scale)));
    pixel(ctx, p[2], x + (width + 1) * scale, y + 16 * scale, Math.max(3,Math.round(9 * scale)), Math.max(1,Math.round(scale)));
  }

  function sun(ctx, p, night) {
    const x = 461, y = 66, r = night ? 18 : 21;
    const warm = mix(p[2],'#fff5ba',.64);
    for (let sy = -r; sy <= r; sy += 2) {
      const span = Math.round(Math.sqrt(Math.max(0, r*r - (sy+.5)*(sy+.5))) / 2) * 2;
      if (span > 0) pixel(ctx, sy > r * .56 ? mix(warm,p[1],.38) : warm, x - span, y + sy, span * 2, 2);
    }
    if (night) {
      pixel(ctx, mix(warm,p[1],.53), x-8,y-6,5,2);
      pixel(ctx, mix(warm,p[1],.53), x+5,y+5,3,2);
    } else {
      for (const [dx,dy] of [[-28,-11],[-18,-22],[0,-28],[18,-22],[28,-11],[29,6]]) {
        pixel(ctx,warm,x+dx,y+dy,dx===0?2:3,dy < -17?3:2);
        pixel(ctx,warm,x+dx+Math.sign(dx)*2,y+dy+Math.sign(dy)*2,2,2);
      }
    }
  }

  function ridge(ctx, color, points) {
    shape(ctx,color,[[-2,HEIGHT+4],...points,[WIDTH+2,HEIGHT+4]]);
  }

  function littlePine(ctx, x, y, size, dark, light) {
    const high = Math.max(3, Math.floor(size));
    for (let row=0; row<high-1; row++) {
      const half = Math.floor((row / high) * high * .34) + (row % 4 === 2 ? 1 : 0);
      pixel(ctx,dark,x-half,y-high+row,half*2+1,1);
      if (half>1 && row%4!==0) pixel(ctx,light,x-half,y-high+row,half,1);
    }
    pixel(ctx,dark,x,y-2,1,2);
  }

  function roll(x, layer, offset) {
    if (layer===0) return Math.round(171+14*Math.sin((x+offset)/69)+6*Math.sin((x+offset)/30)+3*Math.cos(x/14));
    if (layer===1) return Math.round(191+12*Math.sin((x+offset+50)/62)+8*Math.sin((x+offset+9)/37));
    if (layer===2) return Math.round(212+10*Math.sin((x+offset+19)/42)+11*Math.sin((x+offset-31)/89));
    return Math.round(243+10*Math.sin((x+offset+21)/40)+8*Math.sin((x+offset+5)/26));
  }

  function landscape(ctx,p,level,side) {
    const rand = randomSource(98471 + level*591 + side*73);
    const offset = level * 12 + side * 21;
    const mountain = [[-4,150],[18,140],[34,142],[54,129],[66,127],[81,118],[97,131],[110,128],[136,146],[151,145],[181,122],[202,106],[211,107],[222,117],[231,114],[254,135],[271,129],[297,150],[319,146],[342,124],[350,126],[365,114],[373,117],[397,140],[414,137],[426,128],[446,140],[469,119],[480,120],[497,101],[505,103],[520,117],[527,116],[558,142],[578,138],[604,115],[618,121],[645,109]];
    ridge(ctx, p[4], mountain);
    const shadow = mix(p[4],p[5],.68);
    [ [[81,118],[96,131],[111,128],[137,146],[139,161],[112,150],[102,141],[100,145],[85,132],[76,129],[64,133]],
      [[202,106],[212,107],[222,117],[231,114],[254,135],[272,129],[297,150],[278,153],[256,141],[249,144],[236,132],[230,133],[216,118],[216,126],[211,124],[206,117],[201,119],[190,122]],
      [[365,114],[373,117],[397,140],[413,137],[402,152],[384,145],[372,130],[365,128],[358,133],[363,122],[354,127]],
      [[497,101],[505,103],[520,117],[527,116],[556,140],[544,139],[529,129],[522,130],[513,120],[510,125],[501,116],[494,114],[481,125]],
      [[604,115],[619,121],[645,109],[644,133],[625,131],[616,133],[608,124],[597,125]] ].forEach(v=>shape(ctx,shadow,v));
    const lit = mix(p[4],p[1],.36);
    shape(ctx,lit,[[179,123],[201,105],[210,107],[217,117],[207,113],[201,114],[197,112],[191,119],[186,118]]);
    shape(ctx,lit,[[481,120],[496,101],[505,103],[513,112],[505,110],[498,106],[491,114],[487,114]]);
    const second = [[-3,170],[13,161],[32,159],[53,145],[66,151],[88,138],[98,140],[115,134],[140,149],[159,147],[184,165],[205,162],[227,151],[248,153],[263,145],[280,148],[298,137],[319,149],[333,146],[353,157],[381,148],[397,149],[416,136],[430,140],[439,135],[456,144],[479,140],[495,153],[510,148],[529,151],[549,136],[570,139],[588,129],[608,136],[622,131],[644,139]];
    ridge(ctx, mix(p[4],p[5],.8),second);
    const slope = mix(p[5],p[3],.15);
    [[[88,138],[98,140],[105,137],[111,146],[119,151],[103,148],[98,149]],[[298,137],[319,149],[334,146],[347,155],[321,152],[314,155]],[[416,136],[431,140],[440,135],[456,144],[472,143],[450,150],[436,144],[428,147]],[[588,129],[608,136],[623,131],[644,139],[642,152],[614,143],[602,145]]].forEach(v=>shape(ctx,slope,v));
    const ridgeColors=[mix(p[5],p[6],.21),p[6],p[7],p[8]];
    for (let n=0;n<4;n++) {
      const color=ridgeColors[n];
      const top=[];
      for(let x=-2;x<=WIDTH+2;x+=4)top.push([x,roll(x,n,offset)]);
      ridge(ctx,color,top);
      const darker=mix(color, n===0?p[5]:'#688e7e',n===0?.25:.23);
      const lighter=mix(color,p[1],n===0?.17:.21);
      // Pocket forests interrupted by winding clearings and field lines.
      for(let group=0;group<(n===0?19:12);group++){
        const cx=between(rand,-10,WIDTH+10);
        const cy=between(rand,1,7);
        const radius=between(rand,3,n>1?14:9);
        for(let dx=-radius;dx<=radius;dx+=between(rand,2,4)) {
          const size=Math.max(3,Math.round((n+2)*1.35+(1-Math.abs(dx)/radius)*3+rand()*2));
          littlePine(ctx,cx+dx,roll(cx+dx,n,offset)+cy+between(rand,-1,2),size,darker, color);
        }
      }
      for(let i=0;i< (n===0?22:55);i++){
        const x=between(rand,0,WIDTH), y=roll(x,n,offset)+between(rand,7,30);
        const width=between(rand,3,16);
        pixel(ctx,rand()<.55?lighter:darker,x,y,width,1);
        if(width>10)pixel(ctx,lighter,x+3,y-1,width-8,1);
      }
    }
    // A winding sunlit brook appears in the lowest valley between the islands.
    const brook=mix(p[1],p[7],.46), water=mix(p[6],'#c3d1b7',.5);
    shape(ctx,water,[[365,219],[383,222],[379,225],[352,229],[344,231],[354,234],[397,238],[420,242],[417,246],[385,252],[362,254],[345,258],[349,261],[403,267],[434,273],[391,273],[359,268],[330,265],[317,261],[322,256],[339,252],[367,248],[398,244],[402,242],[390,240],[351,236],[334,233],[337,229],[352,226],[373,223]],1);
    [[345,231,10],[381,239,12],[395,244,11],[354,253,16],[335,259,7],[350,265,14]].forEach(([x,y,w])=>pixel(ctx,brook,x,y,w));
  }

  function paintBackdrop(ctx,level,side) {
    const p = [...themes[level % themes.length]];
    if(side) {p[0]=mix(p[0],'#efd3db',.22);p[4]=mix(p[4],'#e6bfd0',.28);}
    const rand=randomSource(785+level*183+side*5);
    for(let i=0;i<12;i++){
      const y=i*13, blend=i/11;
      const band=mix(p[0],p[1],blend);
      pixel(ctx,band,0,y,WIDTH,i===11?HEIGHT-y:13);
      if(i>0){
        for(let n=0;n<18;n++)pixel(ctx,band,between(rand,0,WIDTH),y-1,between(rand,1,13));
      }
    }
    const night=level>=8;
    if(night)for(let i=0;i<33;i++){
      const x=between(rand,5,636), y=between(rand,3,97);
      pixel(ctx,mix(p[2],p[0],.33),x,y);
      if(i%7===0) {pixel(ctx,p[2],x-1,y,3);pixel(ctx,p[2],x,y-1,1,3);}
    }
    sun(ctx,p,night);
    const dx=side?8:0;
    cloud(ctx,-31+dx,43,1.31,0,p);
    cloud(ctx,72-dx,77,.83,2,p);
    cloud(ctx,170+dx,33,1.03,1,p);
    cloud(ctx,287-dx,66,1.17,0,p);
    cloud(ctx,427+dx,82,.56,2,p);
    cloud(ctx,528+dx,34,1.02,1,p);
    const wisp=mix(p[2],p[1],.2);
    [[24,95,22],[47,96,8],[132,62,13],[145,61,8],[266,94,25],[294,93,10],[390,42,11],[403,43,6],[499,86,19]].forEach(([x,y,w])=>pixel(ctx,wisp,x+dx,y,w,2));
    landscape(ctx,p,level,side);
    cherryTree(ctx,level);
  }
function cherryTree(ctx, variant = 0) {
  const palettes = [
    ['#ac6e83','#cd8191','#e996a1','#f9acb0','#ffc8bd','#ffe3cf','#745961','#946c6d','#c48d7f'],
    ['#9f6e92','#bd82a0','#d895ad','#eda9b8','#ffc6c8','#ffe5d5','#71586c','#896e7b','#bd9391'],
    ['#ab7484','#cb8995','#e69fa7','#f4b2af','#ffd2bf','#ffeece','#735d65','#977476','#c79985'],
  ];
  const [deep, shadow, bloom, pink, petal, cream, bark, wood, lightWood] = palettes[Math.abs(Math.floor(variant)) % palettes.length];
  let state = 749837;
  function random() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  }
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  // Scan-converted silhouettes keep the bark edges crisp at a single pixel.
  function shape(color, points) {
    const ys = points.map(p => p[1]);
    ctx.fillStyle = color;
    for (let y = Math.min(...ys); y < Math.max(...ys); y++) {
      const edges = [];
      const scan = y + .5;
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i];
        const [bx, by] = points[(i + 1) % points.length];
        if ((ay <= scan && by > scan) || (by <= scan && ay > scan)) {
          edges.push(ax + (scan - ay) * (bx - ax) / (by - ay));
        }
      }
      edges.sort((a, b) => a - b);
      for (let i = 0; i + 1 < edges.length; i += 2) {
        const left = Math.round(edges[i]);
        ctx.fillRect(left, y, Math.round(edges[i + 1]) - left, 1);
      }
    }
  }

  // The old tree reaches over the garden, splitting from one twisted trunk.
  shape(bark, [[595,245],[606,237],[610,225],[610,216],[604,202],[604,190],
    [611,174],[611,165],[607,156],[599,149],[585,143],[574,134],[560,131],
    [549,125],[546,118],[551,119],[555,124],[568,127],[579,129],[586,135],
    [598,139],[608,145],[605,134],[595,126],[582,122],[575,113],[569,108],
    [576,110],[584,118],[593,120],[587,110],[586,99],[589,100],[591,110],
    [599,121],[606,125],[610,131],[613,137],[615,120],[613,112],[610,99],
    [604,92],[609,94],[615,100],[617,107],[621,93],[629,83],[625,94],
    [620,113],[620,125],[620,133],[628,123],[635,120],[641,113],[644,106],
    [645,114],[638,124],[631,130],[625,141],[622,149],[627,146],[635,139],
    [646,138],[653,132],[654,135],[649,141],[640,145],[634,151],[625,156],
    [622,163],[624,174],[621,185],[615,199],[615,207],[621,219],
    [623,231],[627,237],[637,243],[628,244],[622,242],[617,244],[606,244]]);
  shape(wood, [[602,241],[611,234],[613,223],[612,214],[608,203],[609,192],
    [615,177],[615,162],[611,154],[602,147],[588,141],[576,132],[565,129],
    [578,131],[589,138],[603,143],[614,149],[617,153],[617,141],[620,136],
    [623,135],[620,146],[621,156],[619,164],[621,176],[617,188],[612,199],
    [612,207],[617,218],[619,231],[621,238],[626,242],[620,241],[616,237],
    [613,241]]);
  shape(lightWood, [[607,194],[611,184],[615,177],[616,167],[617,177],[615,186],
    [611,193],[609,200],[610,205],[608,203]]);
  shape(lightWood, [[614,222],[616,229],[615,235],[611,239],[614,234]]);
  shape(lightWood, [[583,137],[591,140],[599,143],[601,145],[593,142],[586,140]]);
  shape(wood, [[585,121],[596,123],[608,131],[612,140],[612,144],[608,134],[603,129],[598,126]]);
  shape(wood, [[625,146],[634,139],[640,139],[636,141],[630,145]]);
  rect(612,208,2,3,wood);
  rect(612,199,1,3,bark);

  // A hanging twig and a few tips remain visible below the blossom crown.
  shape(bark, [[555,128],[548,131],[539,130],[533,126],[539,128],[545,129],[553,125]]);
  shape(wood, [[580,136],[574,141],[565,144],[562,149],[562,145],[566,141],[572,139],[576,134]]);
  shape(bark, [[599,146],[592,149],[584,151],[580,155],[581,151],[588,147],[596,143]]);

  // Each blossom bough uses irregular, stepped lobes, directed light,
  // and little pairs of petals among broad quiet areas of colour.
  function cluster(cx, cy, rx, ry, shade = 0) {
    const tone = shade === 2 ? [deep, shadow, bloom, pink]
      : shade === 1 ? [shadow, bloom, pink, petal]
      : [bloom, pink, petal, cream];
    const phase = random() * 6.28;
    const rows = [];
    const top = cy - ry;
    const bottom = cy + ry;
    for (let y = top; y < bottom; y += 2) {
      const ny = (y + 1 - cy) / ry;
      const width = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(ny), 2.1)), .52);
      let left = Math.round((cx - rx * width + Math.sin(y * .48 + phase) * 1.5) / 2) * 2;
      let right = Math.round((cx + rx * width + Math.cos(y * .37 - phase) * 1.7) / 2) * 2;
      if (right <= left) continue;
      rows.push([left, right]);
      rect(left, y, right - left, 2, tone[0]);
      if (ny < .65) {
        const litEdge = Math.min(right, Math.round(cx + rx * (.69 - .42 * ny) + Math.sin(y * .36 + phase) * 3));
        rect(left, y, Math.max(1, litEdge - left), 2, tone[1]);
      }
      if (ny < -.15) {
        const litEdge = Math.min(right, Math.round(cx + rx * (-.13 - ny * .85) + Math.cos(y * .49 - phase) * 2));
        rect(left, y, Math.max(1, litEdge - left), 2, tone[2]);
      }
    }
    const marks = Math.round(rx * ry / 16);
    for (let i = 0; i < marks; i++) {
      const row = Math.floor(random() * rows.length);
      const [left, right] = rows[row];
      const x = left + Math.floor(random() * Math.max(1, right - left - 3));
      const y = top + row * 2;
      const upper = row < rows.length * .52;
      const c = upper ? (random() < .44 ? tone[3] : tone[2]) : (random() < .44 ? tone[1] : tone[2]);
      const w = random() < .12 ? 4 : 2;
      rect(x, y, w, 1, c);
      if (random() < .46) rect(x + 1, y - 1, 2, 1, c);
    }
  }

  // Deep interior branches first; separated sweeps leave windows of sky.
  [
    [628,115,31,19],[653,104,30,24],[604,117,23,16],[588,118,13,12],
    [572,124,19,10],[551,124,15,8],[541,118,12,7],[614,92,25,18],
    [644,137,20,11],[622,131,13,12],[589,103,18,14],
  ].forEach(p => cluster(...p,2));
  [
    [647,85,24,20],[624,78,25,16],[603,84,20,15],[583,93,17,13],
    [572,102,20,13],[549,115,17,9],[537,114,10,6],[560,115,13,11],
    [576,119,14,10],[587,112,13,12],[610,103,20,18],[632,107,19,13],
    [641,124,15,11],[655,129,17,12],[605,128,15,10],
  ].forEach(p => cluster(...p,1));
  [
    [635,62,15,7],[620,66,17,9],[605,74,15,10],[590,83,13,8],[581,82,8,6],
    [577,90,13,7],[561,97,12,8],[555,102,11,6],[550,99,9,6],[539,109,10,5],
    [545,111,13,6],[568,111,11,7],[584,101,11,7],[605,92,13,9],
    [625,85,15,9],[644,93,13,9],[633,113,12,8],[645,116,11,7],
    [597,120,10,7],[580,123,8,6],
  ].forEach(p => cluster(...p));

  // Isolated blossom sprays soften the branch ends.
  function flower(x, y, col, tip) {
    rect(x, y, 2, 4, col);
    rect(x - 1, y + 1, 4, 2, col);
    rect(x, y + 1, 1, 1, tip);
  }
  [[541,110],[555,101],[565,112],[579,96],[591,84],[609,76],
   [597,121],[609,104],[626,91],[635,65],[635,116]].forEach(([x,y],i) => {
    flower(x, y, petal, cream);
    if (i % 3 === 0) {
      rect(x - 3, y + 2, 2, 1, cream);
      rect(x + 3, y - 2, 2, 1, petal);
    }
  });
  [[529,119],[536,127],[541,130],[550,130],[557,135],[562,144],
   [562,148],[569,142],[579,151],[582,148],[592,146],[625,143],[638,148],
   [554,94],[569,85],[589,74],[604,63],[630,53]].forEach(([x,y],i) => {
    flower(x, y, i < 12 ? bloom : petal, cream);
    if (i % 3 === 0) rect(x - 3, y + 4, 2, 1, pink);
  });
}
  function stem(ctx,x,y,height,style) {
    const stemGreen='#689057',leaf='#89a761';
    pixel(ctx,stemGreen,x,y-height,1,height);
    pixel(ctx,leaf,x-2,y-4,2,1);pixel(ctx,stemGreen,x-3,y-5,2,1);
    if(height>7){pixel(ctx,stemGreen,x+1,y-5,2,1);pixel(ctx,leaf,x+2,y-6,2,1);}
    const color=style===0?'#fff4cf':style===1?'#ed9b99':'#d0808c';
    const shade=style===0?'#dec89e':'#c97d84';
    pixel(ctx,shade,x-2,y-height+1,4,1);
    pixel(ctx,color,x-2,y-height-1,2,2);pixel(ctx,color,x+1,y-height-1,2,2);
    pixel(ctx,color,x-1,y-height-3,2,2);pixel(ctx,color,x-1,y-height+1,2,1);
    pixel(ctx,style===0?'#db9f58':'#ffd69a',x,y-height-1,1,2);
  }

  function grassClump(ctx,x,y,small) {
    const dark='#678754',mid='#8ead61',lit='#b2c970';
    pixel(ctx,dark,x-3,y-2,7,2);pixel(ctx,mid,x-3,y-3,2,2);
    pixel(ctx,mid,x-1,y-5,2,4);pixel(ctx,lit,x-2,y-6,1,2);
    pixel(ctx,mid,x+2,y-3,2,2);pixel(ctx,lit,x+3,y-4,2,1);
    if(!small){pixel(ctx,dark,x+1,y-7,1,5);pixel(ctx,lit,x+1,y-9,1,3);pixel(ctx,mid,x+2,y-10,1,2);}
  }

  function vine(ctx,x,y,length,dir) {
    for(let i=0;i<length;i++){
      if(i%6===0) x+=dir * (Math.floor(i/6)%2===0?1:-1);
      pixel(ctx,'#608052',x,y+i,1,1);
      if(i%4===1&&i<length-1){
        const dx=(Math.floor(i/4)%2===0?1:-1);
        pixel(ctx,'#648456',x+(dx>0?1:-3),y+i-1,3,2);
        pixel(ctx,'#8eaa64',x+dx*3,y+i-2,1,2);
      }
    }
  }

  function paperBridge(ctx,w,h,type) {
    const ribbon=type==='ribbon';
    const shades=ribbon?['#776e9a','#a292ba','#cbbada','#ecdaed']:['#b76e7a','#d88d95','#efb4ae','#ffdac2'];
    const depth=Math.min(h,12);
    shape(ctx,shades[0],[[0,0],[w,0],[w-2,depth-2],[w-7,depth-4],[w-9,depth],[6,depth],[5,depth-3],[1,depth-1]],1);
    shape(ctx,shades[1],[[1,0],[w-1,0],[w-3,5],[w-7,5],[w-9,depth-2],[7,depth-2],[8,6],[3,6]],1);
    pixel(ctx,shades[2],1,0,w-2,4);pixel(ctx,shades[3],2,0,w-4,1);
    for(let i=4;i<w-5;i+=10){pixel(ctx,shades[3],i,3,4);pixel(ctx,shades[0],i+4,6,2);}
  }

  function terrain(ctx,w,h,seed,openLeft,openRight,type) {
    if(type==='heart'||type==='ribbon'){paperBridge(ctx,w,h,type);return;}
    const rand=randomSource(seed*913+Math.round(w)*1321+47);
    const moss='#708c52', mossLight='#a6bc66', edge='#516e49';
    const soil='#b58265',shade='#996d5b',deep='#835d53',clay='#c39670';
    const phase=rand()*8;
    function depthAt(x){
      let side=1;
      if(!openLeft)side=Math.min(side,.19+.81*Math.min(1,x/(w*.30)));
      if(!openRight)side=Math.min(side,.19+.81*Math.min(1,(w-x)/(w*.32)));
      const indent=3*Math.sin(x*.14+phase)+2.5*Math.sin(x*.39+phase);
      return Math.min(h,Math.max(6,Math.round((h*side+indent)/3)*3));
    }
    for(let x=0;x<w;x+=2){
      const d=depthAt(x), col=Math.min(2,w-x);
      pixel(ctx,deep,x,0,col,d);
      const edgeDepth=Math.max(1,Math.min(d-2,Math.round(d*.85+(Math.sin(x*.2)*2))));
      pixel(ctx,shade,x,0,col,edgeDepth);
      if(edgeDepth>1)pixel(ctx,soil,x,0,col,Math.max(1,Math.round(edgeDepth*.78+Math.sin(x*.19+phase)*2)));
    }
    // Small angled facets and narrow rock seams describe the cutaway soil.
    for(let i=0;i<Math.ceil(w*h/115);i++) {
      const x=between(rand,2,Math.max(2,w-7)),d=Math.min(depthAt(x),depthAt(x+6),h);
      if(d<13)continue;
      const y=between(rand,7,d-5), width=between(rand,2,Math.min(7,w-x)), height=between(rand,1,3);
      const color=y>d*.65?deep:rand()<.52?shade:clay;
      pixel(ctx,color,x+1,y,width-1,1);pixel(ctx,color,x,y+1,width,height);
      if(width>=6)pixel(ctx,color,x+1,y+height+1,width-3,1);
    }
    for(let x=0;x<w;x+=2){
      const col=Math.min(2,w-x);
      const hanging=Math.max(4,Math.round(6+2*Math.sin(x*.25+phase)+1.8*Math.sin(x*.57)));
      pixel(ctx,edge,x,0,col,hanging);
      pixel(ctx,moss,x,0,col,Math.max(2,hanging-2));
      pixel(ctx,'#91aa61',x,0,col,Math.max(2,hanging-4));
      pixel(ctx,mossLight,x,-1,col,2);
    }
    for(let x=1;x<w-3;x+=between(rand,7,14)){
      pixel(ctx,'#ced57f',x,-1,between(rand,2,5),1);
      if(x%2===0)pixel(ctx,'#b5c871',x+2,2,2,1);
    }
    for(let x=3;x<w-4;x+=between(rand,13,27)){
      grassClump(ctx,x,-1,rand()>.25);
      if(rand()<.48)grassClump(ctx,Math.min(w-4,x+5),0,true);
    }
    const flowerCount=w>115?Math.ceil(w/45):Math.max(1,Math.floor(w/36));
    for(let i=0;i<flowerCount;i++){
      const x=Math.round((i+.48+(rand()-.5)*.48)*w/flowerCount);
      const style=between(rand,0,2);
      stem(ctx,x,-1,between(rand,4,9),style);
      if(w>43&&rand()>.3)stem(ctx,Math.min(w-3,x+between(rand,3,7)),0,between(rand,3,6),style);
    }
    for(let x=5;x<w-3;x+=between(rand,23,36)){
      if(x<10||x>w*.7||rand()>.6)vine(ctx,x,5,between(rand,7,Math.min(22,h+4)),rand()>.5?1:-1);
    }
  }

  function background(ctx,levelIndex=0,time=0,side=0){
    const level=Math.max(0,Math.min(9,Math.trunc(levelIndex)||0));
    const flip=side?1:0;
    const key=level+'-'+flip;
    if(!backdrops.has(key)){
      if(backdrops.size>=4)backdrops.delete(backdrops.keys().next().value);
      const layer=makeLayer(WIDTH,HEIGHT);
      paintBackdrop(layer.getContext('2d'),level,flip);
      backdrops.set(key,layer);
    }
    ctx.drawImage(backdrops.get(key),0,0);
    const t=Number.isFinite(time)?time:0;
    for(let i=0;i<10;i++){
      const x=Math.round(((i*89-t*(2.7+i%3)+Math.sin(t*.4+i)*4)%WIDTH+WIDTH)%WIDTH);
      const y=Math.round(46+((i*47+t*(2+i%2))%195)+Math.sin(t+i*4)*2);
      const face=Math.sin(t*.8+i*3)>.05;
      pixel(ctx,i%3===0?'#dc969d':'#f6c0b9',x,y,face?3:1,1);
      if(face)pixel(ctx,'#ffe0c9',x+1,y-1,2,1);
    }
  }

  function platform(ctx,x,y,w,height,seed=0,type='ground'){
    const width=Math.max(2,Math.round(w)),h=Math.max(3,Math.min(HEIGHT+10,Math.round(height)));
    const openLeft=x<=0,openRight=x+w>=WIDTH;
    const s=Number.isFinite(seed)?Math.round(seed):0;
    const key=[width,h,s,type,openLeft,openRight].join('/');
    if(!islands.has(key)){
      if(islands.size>=128)islands.delete(islands.keys().next().value);
      const c=makeLayer(width+8,h+44),g=c.getContext('2d');
      g.translate(4,16);
      terrain(g,width,h,s,openLeft,openRight,type);
      islands.set(key,c);
    }
    ctx.drawImage(islands.get(key),Math.round(x)-4,Math.round(y)-16);
  }

  window.Scenery=Object.freeze({background,platform});
})();
