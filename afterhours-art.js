/* Pixel props for the second half of Axel and Swayze's night walk. */
(() => {
  'use strict';

  const P = {
    k:'#383449', v:'#5b4860', b:'#a66a65', w:'#f9e6bc', h:'#fff9de', s:'#d8be98',
    n:'#a0abb9', u:'#6f849c', a:'#b6e4dd', i:'#6dacaf', e:'#547583', m:'#fdadb0',
    r:'#ca6f89', p:'#ec92a4', d:'#914e71', g:'#ffc675', t:'#d29660', y:'#ffeea4', l:'#bdc782'
  };
  const sprites = {
    // The three little pleated dumplings sit in a banded bamboo steamer.
    dumpling: [
      '.............b...........', '.......bb...bwb..........','...bb.bwwb.bwhwb...bb....',
      '..bhwbhwssbwhwswb.bwwb...', '.bhshhbbwwbhwswshbhshwb..','.bwwswbwwwwbwswwsbhwwsb..',
      '..bbbbbbbbbbbbbbbbbbbb...', '.kkbbbbbbbbbbbbbbbbbbkk..','kgggggggggggggggggggggtk.',
      'ktytttggtttgggtttggtttbk.', '.kbttbbtttbbtttbbtttbk..','.ktgggggggggggggggggtk..',
      '..kbtttbbtttbbtttbbbk...', '...kkbbbbbbbbbbbbkkk....','.....kkkkkkkkkkkk.......'
    ],
    photo: [
      '.....kkkkk...kkk.....','....kuunnnk.knnnk....','..kkkkkkkkkkkkkkkkk..',
      '.kvnnnnnnnnnnnnnnnvk.','.kiiaaikkkkkkkiaaiek.','.keeekvaauuuvkieeek.',
      '.keeekuaaiiuvkieeek.','.keeekuiievukieeeek.','.keeeekuvvvkieeeeek.',
      '.kvvvvkkkkkkvvvvvvk.','..kkkkkkkvkkkkkkkkk..','........kunuk........',
      '........kunk.........','.......kukkuk........','.......ku..kuk.......',
      '......kuk..kuk.......','.....kuk....kuk......','.....ku......uk......',
      '....kuk......kuk.....','...kvk........kvk....'
    ],
    kite: [
      '.........k.........','........kmg........','.......kmmgg.......','......kmmmmgg......',
      '.....kmmhmmmyg.....','....kmmmmmkggyg....','...kmmmmmkvgggyg...','..kmmmmkvvvggggyg..',
      '.kmmmkvaaiaakgggyg.','kmmkvvaaiiiaakggggg','..kvaaaiiiiaavkkk..','...kvaaiiiaavk.....',
      '....kvaaiiaak......','.....kvaaiak.......','......kvaak........','.......kvk.........',
      '........k..........'
    ],
    ticket: [
      '...kkkkkkkkkkkkkkkkk...', '..kgggyyyyyyyyyyygggk..','..kgwyhhhhhhhhhhhywgk..',
      '.kgwwygwwwwwwwgwwywwgk.','.kwwtygkkkwwwwkwgygwwk.','..kwwygkagggggkwgywwk..',
      '...kwygkiiaiiikwgywk...','..kwwygkkkkkkkwwgywwk..','.kwwtygwkvvvkvwwgygwwk.',
      '.kgwwygwwwwwwwgwgywwgk.','..kgwyhhhhhhhhhhhywgk..','..kgggyyyyyyyyyyygggk..',
      '...kkkkkkkkkkkkkkkkk...'
    ],
    stamp: [
      '..........ww.ww.ww.ww..........', '.........wkwwkwwkwwkwk.........',
      '.........kmmmmmmmmmmmk.........', '.ww......kmhhhhhhhhhmk......ww.',
      'whhw.....kmhrrrrrrrhmk.....whhw', '.whhw....kmhrhhrrhrhmk....whhw.',
      'wwhhhw...kmhrhhhhrhhmk...whhhww', '.wsshhww.kmhrhhrhhrrmk.wwhhssw.',
      '..whsshhwkmhrrhrrrrhmkwhhsshw..', '...wshhhwkmhrrrrrrrhmkwhhhsw...',
      '....wssw.kmhhhhhhhhhmk.wssw....', '.....ww..kmmmmmmmmmmmk..ww.....',
      '.........wkwwkwwkwwkwk.........', '..........ww.ww.ww.ww..........'
    ],
    rideTop: [
      '....gg.............','...gyyg............','....gkrrrrrr.......','....kvpmlppprk.....',
      '....kvmhhmmppprk...','....kvpmhmmpppprk..','....kvppphhhpprk...','....kvppphpprk.....',
      '....kvrrrrrr.......','....kb.............','....kb.............','....kb.............',
      '....kb.............','....kb.............','...kvbk............','..kkkkkk...........'
    ]
  };
  const digits = {
    1:['.1.','11.','.1.','.1.','111'], 2:['11.','..1','.1.','1..','111'],
    3:['11.','..1','.1.','..1','11.'], 4:['1.1','1.1','111','..1','..1']
  };
  const chimeInks = [
    ['#ffde83','#d79854'],['#ffb0c9','#ba6c97'],['#a7e5d2','#6eaa9e'],['#c4b7ff','#9584ce']
  ];
  const moon = ['..gg..','.gy...','gy....','gy....','.gy..g','..ggg.'];
  const heart = ['.rr.rr.','rmmrmmr','rmmmmmr','.rmmmr.','..rmr..','...r...'];

  function rect(ctx,color,x,y,w,h) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x),Math.round(y),w,h);
  }

  function compile(rows) {
    const runs = [];
    rows.forEach((row,y) => {
      for(let x=0; x<row.length;) {
        const start=x, ink=row[x++];
        while(x<row.length && row[x]===ink) x++;
        if(ink!=='.') runs.push([start,y,x-start,ink]);
      }
    });
    return {w:Math.max(...rows.map(row=>row.length)),h:rows.length,runs};
  }
  const marks = Object.fromEntries(Object.entries(sprites).map(([k,v])=>[k,compile(v)]));
  const symbols = [compile(moon),compile(heart)];
  const numerals = Object.fromEntries(Object.entries(digits).map(([k,v])=>[k,compile(v)]));
  function draw(ctx,image,x,bottom,inks=P) {
    const left=Math.round(x-image.w/2), top=Math.round(bottom)-image.h;
    for(const [dx,dy,w,c] of image.runs) rect(ctx,inks[c],left+dx,top+dy,w,1);
  }
  function line(ctx,color,x1,y1,x2,y2) {
    let x=Math.round(x1), y=Math.round(y1);
    const ex=Math.round(x2), ey=Math.round(y2);
    const dx=Math.abs(ex-x), dy=-Math.abs(ey-y), sx=x<ex?1:-1, sy=y<ey?1:-1;
    let err=dx+dy;
    for(;;) {
      rect(ctx,color,x,y,1,1);
      if(x===ex && y===ey) break;
      const e2=2*err;
      if(e2>=dy) { err+=dy; x+=sx; }
      if(e2<=dx) { err+=dx; y+=sy; }
    }
  }
  function shine(ctx,x,y,color=P.h) {
    rect(ctx,color,x-2,y,5,1); rect(ctx,color,x,y-2,1,5);
  }
  function check(ctx,x,y) {
    rect(ctx,P.k,x-4,y-4,9,8); rect(ctx,P.a,x-3,y-3,7,6);
    rect(ctx,P.e,x-2,y,1,1); rect(ctx,P.e,x-1,y+1,2,1);
    rect(ctx,P.e,x+1,y-1,1,2); rect(ctx,P.e,x+2,y-2,1,1);
  }

  const motionQuery = typeof window.matchMedia==='function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const motionTime = time => motionQuery?.matches ? 0 : time;

  function chime(ctx,x,y,time,active,done,value) {
    const index=Math.min(4,Math.max(1,Math.round(value)||1));
    const [light,shade]=chimeInks[index-1];
    const swing=active ? Math.round(Math.sin(time*3.8)) : 0;
    // Twin bamboo feet and a hanging bell keep the numeral clear of the figure.
    rect(ctx,P.k,x-10,y-33,3,33); rect(ctx,P.t,x-9,y-31,1,29);
    rect(ctx,P.k,x-11,y-34,23,3); rect(ctx,P.g,x-9,y-34,19,1);
    rect(ctx,P.b,x-9,y-26,2,2); rect(ctx,P.b,x-9,y-13,2,2);
    rect(ctx,P.k,x-12,y-2,8,2);
    line(ctx,P.w,x+2,y-31,x+2+swing,y-26);
    const cx=x+2+swing;
    rect(ctx,P.k,cx-4,y-26,9,2); rect(ctx,P.k,cx-6,y-24,13,11);
    rect(ctx,P.k,cx-7,y-14,15,3); rect(ctx,P.k,cx-2,y-11,5,3);
    rect(ctx,done?P.a:light,cx-4,y-24,9,9);
    rect(ctx,done?P.i:shade,cx-5,y-23,2,9);
    rect(ctx,done?P.i:shade,cx+4,y-23,2,9);
    rect(ctx,P.h,cx-5,y-14,11,1); rect(ctx,shade,cx-6,y-13,13,1);
    draw(ctx,numerals[index],cx,y-16,{'1':P.k});
    rect(ctx,P.g,cx-1,y-11,3,2);
    if(done) check(ctx,cx+8,y-27);
    else if(active) shine(ctx,cx+10,y-24);
  }

  function photoPrint(ctx,x,y) {
    rect(ctx,P.k,x-7,y-8,14,16); rect(ctx,P.w,x-6,y-7,12,14);
    rect(ctx,'#897599',x-5,y-6,10,9); rect(ctx,'#e3aa9c',x-5,y-2,10,5);
    rect(ctx,P.y,x+1,y-5,3,3);
    for(let i=0;i<5;i++) rect(ctx,'#678489',x-5+i,y+1-Math.min(i,4-i),3,3);
    rect(ctx,P.v,x-5,y+2,10,1); rect(ctx,P.r,x+2,y+4,2,1);
  }

  function marker(ctx,kind,x,feetY,time=0,active=false,done=false,value=0,fraction=0) {
    if(!marks[kind] && kind!=='chime') return;
    time=motionTime(time);
    x=Math.round(x); const y=Math.round(feetY);
    if(kind==='chime') { chime(ctx,x,y,time,active,done,value); return; }
    const floats=kind==='kite'||kind==='ticket'||kind==='stamp';
    if(done && floats) return;
    const bob=active ? Math.round(2*Math.sin(time*3+x*.05)) : 0;
    const bottom=floats ? y-17+bob : y;
    if(kind==='kite') {
      const end=x+Math.round(2*Math.sin(time*2.5));
      line(ctx,P.w,x-1,bottom-1,end-2,bottom+4);
      line(ctx,P.w,end-2,bottom+4,end-5,bottom+7);
      line(ctx,P.w,end-5,bottom+7,end-3,bottom+10);
      rect(ctx,P.r,end-7,bottom+6,2,3); rect(ctx,P.m,end-5,bottom+7,3,1);
    }
    draw(ctx,marks[kind],x,bottom);
    if(kind==='dumpling') {
      if(done) check(ctx,x+9,y-18);
      else for(let i=0;i<2;i++) {
        const puffY=y-15-i*3-Math.round((time*5+i*2)%5);
        const dx=x-4+i*8;
        rect(ctx,P.s,dx,puffY,1,3); rect(ctx,P.w,dx+1,puffY-2,1,2);
      }
    }
    if(kind==='photo') {
      if(done) photoPrint(ctx,x+12,y-23);
      else if(fraction>0) {
        const fill=Math.min(18,Math.max(1,Math.ceil(fraction*18)));
        rect(ctx,P.k,x-10,y-28,20,5); rect(ctx,P.e,x-9,y-27,18,3);
        rect(ctx,P.y,x-9,y-27,fill,3);
      } else if(active) rect(ctx,P.m,x+7,y-17,2,2);
    }
    if(kind==='rideTop' && done) check(ctx,x+9,y-17);
    if(active && !done && (kind==='ticket'||kind==='stamp'||kind==='kite'||kind==='rideTop')) {
      const dy = time && Math.sin(time*3)<-.25 ? 1 : 0;
      shine(ctx,x+marks[kind].w/2+1,bottom-marks[kind].h+3+dy);
    }
  }

  function wind(ctx,zone,time=0) {
    if(!(zone.w>0 && zone.h>0) || (!zone.dx && !(zone.dy<0))) return;
    time=motionTime(time);
    const x=Math.round(zone.x), y=Math.round(zone.y);
    const vertical=zone.dy<0 && !zone.dx;
    const sign=vertical ? -1 : Math.sign(zone.dx);
    const length=Math.max(9,Math.floor(vertical?zone.h:zone.w)-8);
    const cross=Math.max(7,Math.floor(vertical?zone.w:zone.h)-6);
    const bands=Math.max(1,Math.floor(cross/18));
    const along=Math.max(1,Math.ceil(length/40));
    ctx.save();
    ctx.beginPath(); ctx.rect(x,y,zone.w,zone.h); ctx.clip();
    for(let row=0;row<bands;row++) for(let i=0;i<along;i++) {
      const offset=(i*length/along + row*17 + time*15) % length;
      const lead=4+(sign===1 ? offset : length-offset);
      const lane=3+(row+.5)*cross/bands + Math.round(Math.sin(time+row*2+i)*1.2);
      const ax=Math.round(x+(vertical?lane:lead)), ay=Math.round(y+(vertical?lead:lane));
      const arrow=(row+i)%3===0;
      ctx.globalAlpha=.6;
      if(vertical) {
        rect(ctx,P.a,ax,ay,1,arrow?6:4);
        if(arrow) { rect(ctx,P.h,ax,ay,1,2); rect(ctx,P.a,ax-1,ay+1,1,2); rect(ctx,P.a,ax+1,ay+1,1,2); }
        rect(ctx,P.a,ax,ay+8,1,1);
      } else {
        line(ctx,P.a,ax-sign*5,ay,ax,ay);
        if(arrow) { rect(ctx,P.h,ax,ay,1,1); rect(ctx,P.a,ax-sign,ay-1,1,1); rect(ctx,P.a,ax-sign,ay+1,1,1); }
        rect(ctx,P.a,ax-sign*8,ay,1,1);
      }
    }
    ctx.restore();
  }

  function platform(ctx,p,time=0,solid=true) {
    time=motionTime(time);
    const x=Math.round(p.x), y=Math.round(p.y), w=Math.round(p.w);
    if(w<=0) return;
    if(p.affinity===0 || p.affinity===1) {
      const rose=p.affinity===1, bright=rose?P.m:P.y, dark=rose?P.d:P.t;
      ctx.save();
      if(solid) {
        rect(ctx,P.k,x,y,w,2);
        if(w>2) rect(ctx,bright,x+1,y,w-2,1);
        for(let i=3;i<w-3;i+=8) rect(ctx,dark,x+i,y+2,3,1);
      } else {
        ctx.globalAlpha=.85;
        for(let i=0;i<w;i+=6) {
          rect(ctx,dark,x+i,y,Math.min(4,w-i),1);
          rect(ctx,bright,x+i,y+1,Math.min(3,w-i),1);
        }
      }
      const count=Math.max(1,Math.floor(w/29));
      for(let i=0;i<count;i++) {
        const sx=x+Math.floor((i+.5)*w/count);
        if(solid) {
          rect(ctx,P.k,sx-5,y+2,11,8);
          rect(ctx,rose?'#6c485d':'#6d584f',sx-4,y+3,9,6);
          draw(ctx,symbols[p.affinity],sx,y+9);
        } else {
          draw(ctx,symbols[p.affinity],sx,y+9,rose?{r:P.d,m:P.r}:{g:P.t,y:P.s});
        }
      }
      ctx.restore();
    }
    if(p.belt) {
      const dir=Math.sign(p.belt), stagger=Math.floor(time*Math.min(12,Math.abs(p.belt)/5))%14;
      rect(ctx,P.k,x,y,w,6);
      for(let i=0;i<w;i+=7) rect(ctx,P.u,x+i,y+5,Math.min(4,w-i),1);
      for(let i=-14+dir*stagger;i<w;i+=14) {
        const cx=x+i+6;
        if(cx<x+2 || cx>=x+w-3) continue;
        rect(ctx,P.y,cx-dir,y+1,2,1); rect(ctx,P.g,cx,y+2,2,1); rect(ctx,P.y,cx-dir,y+3,2,1);
      }
    }
    if(p.gondola) {
      // Suspension sits along the back of the car, leaving open boarding edges.
      const cx=Math.round(x+w/2), inset=Math.min(6,Math.floor(w/4));
      for(const end of [x+inset,x+w-inset-1]) {
        line(ctx,P.k,cx,y-35,end,y-13); line(ctx,P.s,cx+1,y-34,end+1,y-13);
        rect(ctx,P.k,end,y-13,2,13);
      }
      rect(ctx,P.k,cx-3,y-38,7,5); rect(ctx,P.u,cx-2,y-37,5,2);
      rect(ctx,P.y,cx,y-37,1,2);
      rect(ctx,P.k,x,y,w,2);
      if(w>2) rect(ctx,P.w,x+1,y,w-2,1);
      for(let i=2;i<w-8;i+=12) {
        rect(ctx,P.d,x+i,y+3,8,5); rect(ctx,P.m,x+i+1,y+3,6,1);
      }
    }
  }

  function carried(ctx,kind,x,y,time) {
    const bob=y+Math.round(Math.sin(motionTime(time)*3)*2);
    if(kind==='print') photoPrint(ctx,x,bob-4);
    else draw(ctx,marks[kind],x,bob);
    shine(ctx,x+13,bob-8);
  }

  window.AfterhoursArt={marker,wind,platform,carried};
})();
