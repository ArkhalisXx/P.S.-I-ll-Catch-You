/* P.S. I'll Catch You — one little platforming puzzle on each fold of the card. */
(() => {
  'use strict';
  const WIDTH = 640, HEIGHT = 272, DT = 1 / 120;
  const NAMES = ['Axel', 'Swayze'];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const slide = (a, b, amount) => a + clamp(b - a, -amount, amount);
  const ease = t => t * t * (3 - 2 * t);

  const ground = (x, y, w, h = 28, extra = {}) => ({x, y, w, h, needs:0, ...extra});
  const shore = (x, y, w) => ground(x, y, w, HEIGHT - y + 18);
  const ribbon = (x, y, w, needs, extra = {}) => ground(x, y, w, 18, {style:'ribbon', needs, ...extra});
  const spring = (x, y, w) => ground(x, y, w, 26, {spring:true});
  const loose = (x, y, w) => ground(x, y, w, 16, {style:'ribbon', crumble:true});
  const point = (x, y) => ({x,y});
  const task = (kind, x, y, side, progress, hint) => ({kind,x,y,side,progress,hint});

  // Objective positions use the character's feet. Each chapter owns its movement
  // route, its starting positions and its win condition, including the reunion.
  const LEVELS = [
    {name:'The First Fold', side:0, starts:[point(64,213),point(548,199)], goalLabel:'Deliver a heart',
      platforms:[shore(0,213,177),ground(209,184,72),ground(311,166,62),
        ground(406,184,60),shore(494,199,146)],
      steps:[task('heart',243,184,0,'Heart 0/1','Jump to the pink heart on the first island.'),
        task('arrive',580,199,0,'Heart 1/1','Carry the heart to the envelope on the far right.')]},
    {name:'Written in the Margins',side:1,starts:[point(337,153),point(584,207)],goalLabel:'Relay the letter',
      platforms:[shore(0,180,110),ground(143,158,57),ground(230,136,52),ground(305,153,65),
        ground(407,178,55),ground(492,194,51),shore(560,207,80)],
      steps:[task('carry',516,194,1,'Find the note','Pick up the handwritten note on the first ledge to the left.'),
        task('handoff',337,153,1,'Pass the note','“I wrote you something, baby.” Bring Swayze’s note to Axel in the middle.'),
        task('drop',60,180,0,'Deliver the note','“I’ve got it, baby.” Carry Swayze’s note left to the envelope.')]},
    {name:'A Daisy for You',side:0,starts:[point(51,218),point(569,198)],goalLabel:'Gather a bouquet',
      platforms:[shore(0,218,127),spring(153,200,64),ground(224,133,64),ground(276,213,87),
        ground(359,162,58),ground(435,187,49),shore(511,198,129)],
      steps:[task('petal',250,133,0,'Daisies 0/3','Pick three daisies in any order. The spring flower reaches the high one.'),
        task('petal',315,213,0,'Daisies 1/3','Look on both the upper and lower paths for your bouquet.'),
        task('petal',386,162,0,'Daisies 2/3','One more daisy for Swayze.'),
        task('arrive',568,198,0,'Bouquet ready','Take the bouquet to Swayze’s envelope.')]},
    {name:'The Ribbon Knot',side:1,starts:[point(586,184),point(53,211)],goalLabel:'Untie the bridge',
      platforms:[shore(0,211,117),ground(157,181,56),ribbon(243,149,56,1),
        ribbon(342,160,55,2),ribbon(429,182,56,2),shore(529,184,111)],
      steps:[task('switch',183,181,1,'Knots 0/2','Touch the first pink bow to unfurl a ribbon.'),
        task('switch',271,149,1,'Knots 1/2','Climb onto the new ribbon and loosen the second bow.'),
        task('arrive',60,211,0,'Bridge untied','Cross the two ribbons to the envelope on the left.')]},
    {name:'Cloud Stationery',side:1,starts:[point(571,191),point(59,211)],goalLabel:'Ride the mail ferry',
      platforms:[shore(0,211,123),ground(148,186,66),
        ribbon(304,169,67,0,{drift:106, speed:0.95, phase:-Math.PI/2, ferry:true}),
        ground(461,154,47),shore(536,191,104)],
      steps:[task('ride',445,169,1,'Catch the ferry','Board the striped mail ferry. Ride it to the little flag on the right.'),
        task('arrive',583,191,1,'Ferry arrived','Hop off at the far bank and deliver the mail.')]},
    {name:'The Blushing Bridge',side:0,starts:[point(54,211),point(587,210)],goalLabel:'Hold the bridge',
      platforms:[shore(0,211,120),ground(146,180,53),ground(220,158,66),
        ribbon(321,153,65,1),ribbon(419,178,57,1),shore(522,210,118)],
      steps:[task('plate',252,158,0,'Hold the plate','Stand on the pink plate to lift the bridge for Swayze.'),
        task('gate',231,158,1,'Bridge held','Cross the bridge from the right to the little flag near Axel.'),
        task('drop',57,211,1,'Bridge latched','The bridge is latched. Deliver the parcel to the left envelope.')]},
    {name:'A Little Lift',side:0,starts:[point(58,225),point(587,133)],goalLabel:'Light the lanterns',
      platforms:[shore(0,225,112),spring(141,207,64),spring(221,136,67),ground(310,77,60),
        ground(400,110,42,24,{drift:16,speed:1.35,phase:0}),ground(480,151,40),shore(548,133,92)],
      steps:[task('lantern',244,136,0,'Lanterns 0/2','The daisy is a spring. Jump from it to light the first lantern.'),
        task('lantern',341,77,0,'Lanterns 1/2','Bounce again to light the lantern at the top of the card.'),
        task('arrive',586,133,0,'Lanterns lit','Time your landing on the swaying ledge, then hop down to the envelope.')]},
    {name:'Wrong Side Up',side:1,starts:[point(63,207),point(591,152)],goalLabel:'Cross the loose paper',
      platforms:[shore(0,207,103),loose(137,167,48),loose(222,141,42),ground(307,176,45),
        loose(397,201,46),loose(481,173,46),shore(561,152,79)],
      steps:[task('arrive',60,207,1,'Loose paper','Cross left before the cracked paper falls. The solid middle ledge is safe to rest on.')]},
    {name:'Under One Sky',side:1,starts:[point(52,213),point(579,215)],goalLabel:'Meet beneath the pennant',
      platforms:[shore(0,213,104),ground(140,176,55),ground(219,145,36,24,{drift:13,speed:1.4,phase:0}),
        ribbon(289,124,64,2),ground(389,146,35,24,{drift:15,speed:1.55,phase:2.1}),ground(465,175,54),shore(558,215,82)],
      steps:[task('lantern',491,175,1,'Beacons 0/2','Light Swayze’s beacon on the right.'),
        task('lantern',167,176,0,'Beacons 1/2','Light Axel’s beacon on the left to open the middle of the card.'),
        task('plate',305,124,0,'Meet in the middle','Time Axel’s jump from the moving ledge. Stand on the pink plate under the pennant.'),
        task('gate',335,124,1,'Axel is waiting','Bring Swayze up to the pennant beside Axel.')]},
    {name:'P.S. I’ll Catch You',side:0,starts:[point(58,211),point(563,192)],goalLabel:'Find Swayze',reunion:true,
      platforms:[shore(0,211,153),ground(181,185,65),ground(273,160,62),
        ground(348,180,48),shore(398,192,242)],
      steps:[task('reunion',563,192,0,'Find Swayze','“There you are, baby!” Follow the promenade and walk into Swayze’s arms.')]},
  ];

  const HEART = [
    '..ooo..ooo..', '.oPPPoPPPPo.', 'oPwwPPPPPPPo', 'oPwPPPPPPPpo',
    'oPPPPPPPPppo', '.oPPPPPPppo.', '..oPPPPppo..', '...oPPppo...',
    '....oppo....', '.....oo.....'
  ];
  function pixelHeart(ctx, x, y, scale = 1, ghost = false) {
    const palette = ghost ? {o:'#a86b7d',P:'#ffdbd1',p:'#e8a9ad',w:'#fff2d6'} :
      {o:'#8e4358',P:'#fc8091',p:'#df627b',w:'#ffe4d2'};
    const l = Math.round(x - 6 * scale), top = Math.round(y - 5 * scale);
    HEART.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const color = palette[row[i]];
        if (color) { ctx.fillStyle = color; ctx.fillRect(l + i*scale,top + j*scale,scale,scale); }
      }
    });
  }
  function rect(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function glint(ctx, x, y, color = '#fff7d5') {
    rect(ctx,color,x-2,y,5,1); rect(ctx,color,x,y-2,1,5);
  }
  function letter(ctx, x, y, ready, time) {
    x = Math.round(x); y = Math.round(y);
    rect(ctx,'#725746',x-2,y-20,4,20);
    rect(ctx,'#c89168',x-1,y-19,2,18);
    y -= 24;
    rect(ctx,'#855960',x-11,y-7,22,14);
    rect(ctx,'#bb826b',x-10,y+7,20,1);
    rect(ctx,'#fff2cf',x-10,y-6,20,11);
    rect(ctx,'#f7d8b6',x-9,y+4,18,2);
    for(let i=0;i<5;i++) {
      rect(ctx,'#cd9b8b',x-10+i*2,y-5+i,2,1);
      rect(ctx,'#cd9b8b',x+8-i*2,y-5+i,2,1);
      rect(ctx,'#e6bba1',x-10+i,y+4-i,2,1);
      rect(ctx,'#e6bba1',x+8-i,y+4-i,2,1);
    }
    rect(ctx,'#c75966',x-2,y-1,2,2); rect(ctx,'#c75966',x+1,y-1,2,2);
    rect(ctx,'#c75966',x-1,y+1,3,1); rect(ctx,'#c75966',x,y+2,1,1);
    if (ready) glint(ctx,x+13,y-8+Math.round(Math.sin(time*4)*2));
  }
  function flowerSpring(ctx,p) {
    const x=Math.round(p.x+p.w/2), y=p.y;
    rect(ctx,'#687444',x-10,y-2,21,3); rect(ctx,'#99b266',x-9,y-3,18,2);
    rect(ctx,'#fff3b9',x-4,y-8,8,6); rect(ctx,'#fff3b9',x-7,y-6,14,3);
    rect(ctx,'#d99e56',x-2,y-6,4,3);
  }
  function makeActor(point, facing) {
    return {...point, vx:0, vy:0, facing, grounded:true, coyote:0.1, floor:null,
      checkpoint:{...point}, lastPlatform:null};
  }

  // The paper props are drawn on the same pixel grid as the characters.
  const markerInk = {
    k:'#76545c', b:'#ad7c6f', i:'#f1d1ad', w:'#fff0ca', h:'#fff9df',
    r:'#b95f74', p:'#ee8797', l:'#ffb6b0', t:'#6e9180', s:'#acc39a',
    g:'#d99c51', y:'#ffcf76', u:'#a9a4ac', d:'#826b79'
  };
  const markerArt = {
    petal: [
      '......bbb......','.....bhwwb.....','.....bhwwb.....','..bbb.bwb.bbb..',
      '.bhwwbbgbbwwwb.','.bwhwwgyggwhwb.','..bbbyggygwbb..','...bbwgyggbb...',
      '..bwwwbgbwwwb..','..bhwwbtbwhwb..','...bbbktkbbb...','......ktk.ss...',
      '...tttktksts...','....stktsts....','.....tktt......','......kt.......'
    ],
    switch: [
      '..kkk.......kkk..','.krllkk...kkllrk.','krppllrk.krllpprk',
      'krppplprkrplppprk','krrppprppprppprrk','.krrrkrlllrkrrrk.',
      '..kkkkrppprkkkk..','....krkrrrkrk....','...krpk...kprk...',
      '..krlpk...kplrk..','.krlpk.....kplrk.','.krrk.......krrk.',
      '..kk.........kk..'
    ],
    carry: [
      '..kkkkkkkkk...','..khhhhhhikw..','..khwwwwwkbk..','..khwwwwwibik.',
      '..khwbbbwwbbk.','..khwwwwwwwwk.','..khwbbbbbwwk.','..khwwwwwwwwk.',
      '..khwbbbwwwwk.','..khwwwwwrwrk.','..khwwwwwrrrk.','..khwwwwwwrwk.',
      '..kiiiiiiiiik.','...kkkkkkkkk..'
    ],
    lantern: [
      '......kkk......','.....kbwbk.....','.....kb.bk.....','....kkkkkkk....',
      '...kbwwiwwbk...','..kkkkkkkkkkk..','...kbwwwwwbk...','...kuuuuuuuk...',
      '...kuuiuuuuk...','...kuuuuuuuk...','...kuuuuuuuk...','...kuuuuuuuk...',
      '...kuuuuuuuk...','...kbuuuuubk...','..kbbbbbbbbbk..','..kkkkkkkkkkk..',
      '.....kbwbk.....','.....kbbbk.....','.....kbbbk.....','....kkkkkkk....'
    ],
    gate: [
      '...gg..........','..gyyg.........','...gkrrrrrrk...','...kblppppprk..',
      '...kblppwwpprk.','...kblpwhwpprk.','...kblppwppprk.','...kbrppppprk..',
      '...kbrrrrrrk...','...kb..........','...kb..........','...kb..........',
      '...kb..........','...kb..........','...kb..........','..kbbk.........'
    ]
  };

  // Combine adjacent pixels of the same color into one canvas operation.
  function inkRuns(rows) {
    const runs = [];
    const width = Math.max(...rows.map(row => row.length));
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const ink = row[x], start = x++;
        while (x < row.length && row[x] === ink) x++;
        if (ink !== '.') runs.push([start - Math.floor(width / 2), y - rows.length, x - start, ink]);
      }
    });
    return runs;
  }
  const markerRuns = Object.fromEntries(Object.entries(markerArt).map(([kind, rows]) => [kind, inkRuns(rows)]));

  function drawTaskMarker(ctx, step, time, current, taken = false) {
    const {kind} = step;
    const x = Math.round(step.x), feet = Math.round(step.y);
    if (kind === 'plate') {
      const height = taken ? 2 : 5;
      rect(ctx,'#785d5c',x-12,feet-2,25,3);
      rect(ctx,'#a37c69',x-11,feet-1,23,2);
      rect(ctx,taken?'#55786d':'#8c5963',x-9,feet-height-1,19,height);
      rect(ctx,taken?'#b9d2a3':'#f4a29b',x-8,feet-height-1,17,2);
      rect(ctx,'#fff1c9',x-2,feet-height-1,5,1);
      return;
    }
    if (kind !== 'heart' && !markerRuns[kind]) return;
    const grounded = kind === 'lantern' || kind === 'gate';
    if (taken && !grounded) return;
    const bob = current ? Math.round(Math.sin(time * 3) * 2) : 0;
    const bottom = grounded ? feet : feet - 19 + bob;
    ctx.save();
    if (!current && !taken && !grounded) ctx.globalAlpha *= 0.64;
    if (kind === 'heart') {
      pixelHeart(ctx,x,feet-27+bob,1,!current);
    } else {
      for (const [dx,dy,w,ink] of markerRuns[kind]) {
        rect(ctx,markerInk[ink],x+dx,bottom+dy,w,1);
      }
    }
    if (kind === 'lantern' && taken) {
      rect(ctx,'#efa658',x-3,bottom-12,7,5);
      rect(ctx,'#ffcf78',x-2,bottom-13,5,5);
      rect(ctx,'#fff0b4',x-1,bottom-12,3,4);
      if (Math.sin(time*4)>0) rect(ctx,'#fff8ce',x,bottom-14,1,3);
    }
    if (current && !taken && Math.sin(time*3+x)>0) {
      glint(ctx,x+10,grounded?bottom-17:bottom-12);
    }
    ctx.restore();
  }

  function drawFragile(ctx, p, remaining, time) {
    const active = Number.isFinite(remaining);
    const urgent = active && remaining < 0.3;
    const color = urgent && Math.sin(time*24)>0 ? '#fff1c4' : '#845c61';
    for (let dx=6; dx<p.w-5; dx+=13) {
      const x=Math.round(p.x+dx), y=Math.round(p.y);
      rect(ctx,'#edc4a2',x-2,y,4,1);
      rect(ctx,color,x,y+1,1,2);
      rect(ctx,color,x-1,y+3,1,2);
      if (active) rect(ctx,color,x-2,y+5,1,urgent?4:2);
    }
  }

  class PaperGame {
    static levelNames = LEVELS.map(level => level.name);
    constructor(canvas, hooks = {}) {
      this.canvas=canvas; this.ctx=canvas.getContext('2d');
      this.hooks=hooks; this.level=-1; this.paused=false; this.time=0;
      this.keys={left:false,right:false,jump:false,fold:false};
      this.lastFrame=null; this.accumulator=0;
      this.frame = stamp => {
        if (this.lastFrame === null) this.lastFrame=stamp;
        this.accumulator+=Math.min(0.06,(stamp-this.lastFrame)/1000);
        this.lastFrame=stamp;
        while(this.accumulator>=DT) { this.step(DT); this.accumulator-=DT; }
        if(this.level>=0 && !this.paused) this.draw();
        requestAnimationFrame(this.frame);
      };
      requestAnimationFrame(this.frame);
    }
    load(index) {
      if (!Number.isInteger(index) || index<0 || index>=LEVELS.length) return;
      this.level=index; this.layout=LEVELS[index]; this.side=this.layout.side;
      this.count = 0;
      this.time = 0;
      this.foldTime = 0;
      this.finishTime = 0;
      this.finished = false;
      this.activeEnding = false;
      this.jumpBuffer = 0;
      this.flash = 0;
      this.paused = false;
      this.confetti = [];
      this.newInk = [];
      this.picked = this.layout.steps.map(() => false);
      this.cracks = {};
      this.keys = {left:false, right:false, jump:false, fold:false};
      this.actors = this.layout.starts.map((start, id) =>
        makeActor(start, start.x < this.layout.starts[1 - id].x ? 1 : -1));
      this.speak(); this.draw();
    }
    restart() { this.load(this.level); }
    setPaused(value) {
      this.paused=Boolean(value);
      this.keys={left:false,right:false,jump:false,fold:false};
      this.jumpBuffer=0;
    }
    action(action,pressed=true) {
      if (!(action in this.keys) || this.level<0) return;
      if(this.paused || this.activeEnding || this.finished) return;
      const was=this.keys[action];
      this.keys[action]=Boolean(pressed);
      if(!pressed || was) return;
      if(action==='jump') this.jumpBuffer=0.14;
      if(action!=='fold' || this.foldTime>0 || this.layout.reunion) return;
      this.side=1-this.side; this.foldTime=0.3; this.jumpBuffer=0;
      this.sound('fold'); this.speak();
    }
    sound(kind) { this.hooks.onSound?.(kind); }
    speak() {
      const {goalLabel, steps, name} = this.layout;
      const task = steps[Math.min(this.count, steps.length - 1)];
      const hint = task.side === this.side
        ? task.hint
        : 'Fold to ' + NAMES[task.side] + '. ' + task.hint;
      this.hooks.onUpdate?.({level:this.level, name, character:NAMES[this.side],
        progress:task.progress, goalLabel, hint});
    }
    platsAt(time) {
      return this.layout.platforms.map((p,index) => ({...p, index,
        x:p.x + (p.drift ? Math.sin(time * p.speed + p.phase) * p.drift : 0)}));
    }
    isSolid(p) {
      const crack = this.cracks[p.index];
      return this.count >= p.needs && !(crack && this.time >= crack.fallsAt && this.time < crack.returnsAt);
    }
    solids() {
      return this.platsAt(this.time).filter(p => this.isSolid(p));
    }
    touching(a, b, width) {
      return Math.abs(a.x - b.x) <= width && Math.abs(a.y - b.y) < 24;
    }
    checkObjective(a, floor) {
      const steps = this.layout.steps;
      let task = steps[this.count];
      const previous = steps[this.count - 1];
      // The bridge stays up only while the partner is still on the plate.
      if (previous?.kind === 'plate' && task.kind === 'gate') {
        const holder = this.actors[previous.side];
        if (!holder.grounded || Math.abs(holder.x - previous.x) > 13 ||
            Math.abs(holder.y - previous.y) > 3) {
          this.count--;
          this.speak();
          return;
        }
      }
      if (task.side !== this.side) return;

      const nearMark = mark => Math.abs(a.x - mark.x) < 14 && Math.abs(a.y - mark.y) < 24;
      let targetIndex = this.count;
      if (task.kind === 'petal') {
        targetIndex = steps.findIndex((s, i) => s.kind === 'petal' && !this.picked[i] && nearMark(s));
        if (targetIndex < 0) return;
        task = steps[targetIndex];
      }
      const other = this.actors[1 - this.side];
      let x = task.x, y = task.y;
      switch (task.kind) {
        case 'handoff':
        case 'reunion':
          if (!this.touching(a, other, task.kind === 'reunion' ? 15 : 17)) return;
          x = other.x; y = other.y;
          break;
        case 'plate':
        case 'gate':
          if (!a.grounded || Math.abs(a.x - x) > 12 || Math.abs(a.y - y) > 3) return;
          break;
        case 'ride':
          if (!floor?.ferry || floor.x + floor.w / 2 < x - 4) return;
          break;
        default:
          if (!nearMark(task)) return;
      }
      this.picked[targetIndex] = true;
      this.count++;
      this.newInk[this.count] = this.time;
      if (this.count === steps.length) {
        this.completeFold({x, y});
        return;
      }
      const effect = {plate:'switch', gate:'switch', switch:'switch', lantern:'switch', handoff:'pass', ride:'pass'};
      this.sound(effect[task.kind] || 'heart');
      this.burst(x, y - 18, ['#fff3ce','#f47d92','#d65479'], 12);
      this.speak();
    }
    burst(x,y,colors,n=10) {
      for(let i=0;i<n;i++) {
        const a=2*Math.PI*i/n, speed=15+(i*17%40);
        this.confetti.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-17,
          age:0,life:0.35+(i%5)*0.09,color:colors[i%colors.length],size:i%3===0?2:1});
      }
    }
    step(dt) {
      if(this.level<0 || this.paused || this.finished) return;
      this.time+=dt;
      for(const c of this.confetti) {c.age+=dt;c.vy+=78*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;}
      this.confetti=this.confetti.filter(c=>c.age<c.life);
      this.flash=Math.max(0,this.flash-dt);
      if(this.activeEnding) {
        this.finishTime+=dt;
        if(this.finishTime>= (this.level===9?1.65:0.82)) {
          this.finished=true; this.hooks.onComplete?.(this.level);
        }
        return;
      }
      if(this.foldTime>0) {this.foldTime=Math.max(0,this.foldTime-dt);return;}
      const a=this.actors[this.side], platforms=this.solids();
      const current=platforms.find(p=>p.index===a.floor);
      if(a.grounded && current?.drift && a.lastPlatform!==null) a.x+=current.x-a.lastPlatform;
      const dir=Number(this.keys.right)-Number(this.keys.left);
      a.vx=slide(a.vx,dir*150,(dir?1500:1900)*dt);
      if(dir) a.facing=dir;
      if(this.jumpBuffer>0 && (a.grounded || a.coyote>0)) {
        a.vy=current?.spring?-355:-291; a.grounded=false; a.coyote=0; a.floor=null;
        this.jumpBuffer=0; this.sound(current?.spring?'spring':'jump');
        this.burst(a.x,a.y-1,current?.spring?['#fff2b5','#eaa76e']:['#f8ddac','#b6be87'],5);
      }
      this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
      a.coyote=Math.max(0,a.coyote-dt);
      a.x=clamp(a.x+a.vx*dt,9,WIDTH-9);
      const prevY=a.y;
      a.vy=Math.min(470,a.vy+740*dt);
      a.y+=a.vy*dt; a.grounded=false; a.floor=null; a.lastPlatform=null;
      if(a.vy>=0) {
        let surface=null;
        for(const p of platforms) {
          if(a.x+6<p.x || a.x-6>p.x+p.w || prevY>p.y+0.65 || a.y<p.y) continue;
          if(!surface || p.y<surface.y) surface=p;
        }
        if(surface) {
          a.y=surface.y;a.vy=0;a.grounded=true;a.coyote=0.105;
          a.floor=surface.index;a.lastPlatform=surface.x;
          if(surface.crumble && (!this.cracks[surface.index] || this.time >= this.cracks[surface.index].returnsAt)) {
            this.cracks[surface.index] = {fallsAt:this.time + 0.64, returnsAt:this.time + 2.35};
            this.sound('crumble');
          }
          if(surface.needs===0 && !surface.drift && !surface.crumble && a.x>surface.x+9 && a.x<surface.x+surface.w-9)
            a.checkpoint={x:a.x,y:a.y};
        }
      }
      if(a.y>HEIGHT+38) {
        Object.assign(a,{...a.checkpoint,vx:0,vy:0,grounded:true,coyote:0.1,floor:null,lastPlatform:null});
        this.flash=0.23;this.sound('fall');
      }
      this.checkObjective(a, platforms.find(p => p.index === a.floor));
    }
    completeFold(goal) {
      this.activeEnding = true;
      this.finishTime = 0;
      const a = this.actors[this.side];
      this.catchStart = {x:a.x, y:a.y};
      this.burst(goal.x,goal.y-25,['#fb8898','#fbe9b6','#bd7f9a','#e8b776'],22);
      this.sound('complete');
    }
    draw() {
      if(this.level<0) return;
      const ctx = this.ctx, time = this.time, ending = this.activeEnding;
      const {steps, reunion} = this.layout;
      const goal = reunion ? this.actors[1] : steps[steps.length - 1];
      ctx.save(); ctx.imageSmoothingEnabled=false;
      window.Scenery.background(ctx,this.level,time,this.side);
      const platforms=this.platsAt(time);
      for(const p of platforms) {
        const open = this.isSolid(p);
        if(open) {
          const style = p.style || 'ground';
          window.Scenery.platform(ctx,Math.round(p.x),p.y,p.w,p.h,this.level*11+p.index,style,this.level);
          if(p.spring) flowerSpring(ctx,p);
          if(p.crumble) drawFragile(ctx, p, this.cracks[p.index]?.fallsAt - time, time);
          if(p.ferry) {
            rect(ctx, '#805665', p.x+5, p.y-15, 2, 15);
            rect(ctx, '#ed8799', p.x+7, p.y-15, 10, 5);
          }
          if(p.needs && time-this.newInk[p.needs]<0.9) {
            const d=(time-this.newInk[p.needs])/0.9;
            for(let i=0;i<3;i++) glint(ctx,p.x+8+i*(p.w-16)/2,p.y-4-Math.round(d*6)-i%2*3);
          }
        } else {
          // Tiny basting stitches show where the next fold will place its paper.
          ctx.save();ctx.globalAlpha=0.65;
          const x=Math.round(p.x);
          for(let i=2;i<p.w-3;i+=7) {
            rect(ctx,'#ad797e',x+i,p.y,4,1);
            rect(ctx,'#ffe6d2',x+i,p.y-1,4,1);
          }
          for(const ex of [x,x+p.w-1]) {
            rect(ctx,'#be9293',ex,p.y+1,1,4);rect(ctx,'#fff0d5',ex-1,p.y,2,1);
          }
          ctx.restore();
        }
      }
      if (reunion) {
        pixelHeart(ctx, goal.x, goal.y - 43 + Math.round(Math.sin(time * 2)), 1);
      } else {
        for (const [i, mark] of steps.entries()) {
          const active = mark.side === this.side && (i === this.count ||
            (mark.kind === 'petal' && steps[this.count]?.kind === 'petal' && !this.picked[i]));
          const done = mark.kind === 'petal' ? this.picked[i] : i < this.count;
          if (mark.kind === 'arrive' || mark.kind === 'drop') {
            letter(ctx, mark.x, mark.y, active, time);
          } else if (mark.kind === 'ride') {
            drawTaskMarker(ctx, {...mark, kind:'gate', y:mark.y+7}, time, active, done);
          } else if (mark.kind === 'handoff' && active) {
            const partner = this.actors[1 - this.side];
            drawTaskMarker(ctx, {...mark, kind:'carry', x:partner.x, y:partner.y-22}, time, true);
          } else {
            drawTaskMarker(ctx, mark, time, active, done);
          }
        }
      }
      const order=[1-this.side,this.side];
      for(const id of order) {
        const a=this.actors[id]; let x=a.x, y=a.y, facing=a.facing;
        let pose=a.grounded ? (id===this.side && Math.abs(a.vx)>10 && !ending?'walk':'idle'):'jump';
        if(ending && this.level===9) {
          const t=clamp(this.finishTime/0.5,0,1);
          if(id===this.side) {
            const approach = this.catchStart.x <= goal.x ? 1 : -1;
            x=this.catchStart.x+(goal.x-12*approach-this.catchStart.x)*ease(t);
            y=this.catchStart.y+(goal.y-this.catchStart.y)*ease(t);
            pose='idle';facing=approach;
          } else { facing=this.catchStart.x <= goal.x ? -1 : 1;pose='idle'; }
        }
        if(a.grounded && !ending) {
          ctx.save();ctx.globalAlpha=0.22;
          rect(ctx,'#615144',x-7,y-1,14,2);ctx.restore();
        }
        window.Sprites.draw(ctx,NAMES[id],Math.round(x)-16,Math.round(y)-32,1,facing,pose,time);
        if(id===this.side && !ending && this.flash===0) {
          const markerY=Math.round(y)-38 + Math.round(Math.sin(time*2)*1);
          rect(ctx,'#8b4e61',x-2,markerY,5,1);rect(ctx,'#fff1ce',x-2,markerY-1,5,1);
          rect(ctx,'#8b4e61',x-1,markerY+1,3,1);rect(ctx,'#8b4e61',x,markerY+2,1,1);
        }
      }
      if(ending && this.level===9 && this.finishTime>0.42) {
        const lift=Math.round(clamp((this.finishTime-0.42)*9,0,8));
        pixelHeart(ctx,goal.x-2,goal.y-35-lift,1); glint(ctx,goal.x+11,goal.y-40-lift);
      }
      for(const c of this.confetti) rect(ctx,c.color,c.x,c.y,c.size,c.size);
      if(this.flash>0) {
        ctx.save();ctx.globalAlpha=this.flash*0.75;rect(ctx,'#ffeed1',0,0,WIDTH,HEIGHT);ctx.restore();
      }
      if(this.foldTime>0) {
        const t=1-this.foldTime/0.3;
        const x=Math.round((this.side===1?t:1-t)*WIDTH);
        const w=Math.round(12+18*Math.sin(Math.PI*t));
        ctx.save();ctx.globalAlpha=0.2;
        rect(ctx,'#b47973',x-w,0,w,HEIGHT);rect(ctx,'#fff3d9',x,0,w,HEIGHT);
        ctx.globalAlpha=0.55;rect(ctx,'#fff2d9',x,0,2,HEIGHT);
        ctx.restore();
      }
      ctx.restore();
    }
  }
  window.PaperGame=PaperGame;
})();
