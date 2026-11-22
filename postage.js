(() => {
  'use strict';

  const heart = [
    '................',
    '................',
    '..ooo.....ooo...',
    '.ommmmo.oommmo..',
    'omppppmomppppmo.',
    'omphhppppppppmo.',
    'omphpppppppppmo.',
    '.ompppppppppmo..',
    '..ompppppppmo...',
    '...ompppppmo....',
    '....ompppmo.....',
    '.....ompmo......',
    '......omo.......',
    '.......o........',
    '................',
    '................'
  ];
  const colors = {o:'#714257', m:'#bf5a70', p:'#ed7987', h:'#ffcabd'};
  const flower = [
    '........................',
    '..........bb............',
    '.........bwwb...........',
    '......bbbwwwwbb.........',
    '.....bwwwbwwwbbb........',
    '.....bwwwwwbwwwb........',
    '......bwwgggwwwb........',
    '.....bwwwgygwwb.........',
    '.....bwwwgggwwbb........',
    '......bbbwwwbwwb........',
    '........bwwwbbb.........',
    '.........bbbd...........',
    '...........ds....ddd....',
    '...........ds...dlsd....',
    '.....ddd....ds.dllsd....',
    '.....dlsd...dsdlssd.....',
    '......dlsd..dssssd......',
    '.......dssd.dssd........',
    '........dssdssd.........',
    '..........dssd..........',
    '...........ds...........',
    '..........ds............',
    '..........d.............',
    '........................'
  ];
  const botanical = {b:'#b8958e',w:'#fff8db',g:'#dfa251',y:'#ffdc73',d:'#536b50',s:'#83a46a',l:'#acc286'};
  const alph = {
    P:['110','101','110','100','100'], O:['010','101','101','101','010'],
    S:['011','100','010','001','110'], T:['111','010','010','010','010'],
    A:['010','101','111','101','101'], '+':['000','010','111','010','000']
  };

  function stampPixels(ctx, rows, palette, x, y) {
    rows.forEach((row, dy) => [...row].forEach((pixel, dx) => {
      if (palette[pixel]) {
        ctx.fillStyle = palette[pixel];
        ctx.fillRect(x + dx, y + dy, 1, 1);
      }
    }));
  }

  function lettering(ctx, text, x, y) {
    [...text].forEach((char, i) => {
      if (alph[char]) stampPixels(ctx, alph[char], {'1':'#a78085'}, x + 4*i, y);
    });
  }

  function envelope(ctx) {
    // Inverse-rotate the tiny painted envelope by sampling its original grid.
    for (let y = 0; y < 25; y++) for (let x = 0; x < 30; x++) {
      const dx = x - 14, dy = y - 12;
      const u = Math.round(dx * .988 - dy * .155) + 12;
      const v = Math.round(dx * .155 + dy * .988) + 8;
      if (u < 0 || u > 25 || v < 0 || v > 16) continue;
      const edge = u === 0 || u === 25 || v === 0 || v === 16;
      const flap = Math.round(Math.min(u,25-u) * .70);
      const bottomFold = 15 - Math.round(Math.min(u,25-u) * .65);
      let ink = v <= flap ? '#fff3db' : '#efcdb3';
      if (v === flap + 1 || v === bottomFold) ink = '#ad827f';
      if (v > bottomFold) ink = '#f6ddc3';
      if (v === 15) ink = '#d6a899';
      if (v === 1 && u > 1 && u < 24) ink = '#fff9df';
      if (edge) ink = '#593e51';
      ctx.fillStyle = ink;
      ctx.fillRect(x, y, 1, 1);
    }
    stampPixels(ctx, ['.aa.aa.','abbaaab','abbbbba','.abbba.','..aba..','...a...'],
      {a:'#a34c60',b:'#f18b90'}, 11, 11);
    ctx.fillStyle='#ffbeb1'; ctx.fillRect(12,12,2,1);
  }

  function postmark(ctx) {
    // The upturned stamp is composed directly on the pixel grid for clean edges.
    const cx=125, cy=30, sx=0.982, sy=0.191;
    for (let y=0; y<62; y++) for (let x=95; x<150; x++) {
      const dx=x-cx, dy=y-cy;
      const u=Math.round(dx*sx + dy*sy)+19, v=Math.round(-dx*sy + dy*sx)+24;
      if (u < 0 || u > 38 || v < 0 || v > 48) continue;
      const scallop = (u % 6 === 0 || u % 6 === 1) && (v < 2 || v > 46)
        || (v % 6 === 0 || v % 6 === 1) && (u < 2 || u > 36);
      if (scallop) continue;
      const rim = Math.min(u,38-u,v,48-v);
      let ink = rim < 1 ? '#bd8b92' : '#fff0d6';
      if (rim === 3 || rim === 5) ink='#bb7b87';
      if (rim > 5) ink='#e9a5aa';
      const hx=Math.floor((u-3)/2), hy=Math.floor((v-9)/2);
      const pixel=heart[hy]?.[hx];
      if (pixel && colors[pixel]) ink=colors[pixel];
      if ((u === 10 && v >= 12 && v <= 16) || (v === 14 && u >= 8 && u <= 12)
        || (u === 28 && v >= 32 && v <= 36) || (v === 34 && u >= 26 && u <= 30)
        || (u === 29 && v === 11) || (u === 9 && v === 35)) ink='#fff4d9';
      ctx.fillStyle=ink; ctx.fillRect(x,y,1,1);
    }
    // Broken ink, shallow waves, and concentric rings mimic a postal cancellation.
    const ringX=75, ringY=32;
    for(let x=0; x<=110; x++) {
      for(let band=0; band<4; band++) {
        const y=Math.round(18 + band*8 + 2.5*Math.sin(x/6.7));
        if (Math.hypot(x-ringX,y-ringY) < 25 || (x*13+band*7)%43===0) continue;
        ctx.fillStyle = x%19===2 ? '#cda7a6' : '#bb969a';
        ctx.fillRect(x,y,1,1);
      }
    }
    for(let y=8; y<57; y++) for(let x=51; x<=99; x++) {
      const d=Math.hypot(x-ringX,y-ringY);
      if ((Math.abs(d-23)<.58 || Math.abs(d-20)<.55) && (x+19*y)%71!==0) {
        ctx.fillStyle='#ae8a90'; ctx.fillRect(x,y,1,1);
      }
    }
    lettering(ctx,'POST',68,18);
    lettering(ctx,'A+S',70,41);
    stampPixels(ctx,['.oo.oo.','ooooooo','ooooooo','.ooooo.','..ooo..','...o...'],
      {o:'#b97683'},72,29);
    ctx.fillStyle='#b69091';
    ctx.fillRect(61,31,4,1); ctx.fillRect(86,31,4,1);
  }

  const assets = {
    postmark: [150,62,postmark],
    envelope: [30,25,envelope],
    heart: [16,16,ctx => stampPixels(ctx,heart,colors,0,0)],
    flower: [24,24,ctx => stampPixels(ctx,flower,botanical,0,0)]
  };
  window.drawPostage = (canvas, kind) => {
    if (!canvas || !assets[kind]) return;
    const [width,height,paint]=assets[kind];
    canvas.width=width;
    canvas.height=height;
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    paint(ctx);
  };
})();
