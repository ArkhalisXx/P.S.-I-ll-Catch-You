/* P.S. I'll Catch You — one little platforming puzzle on each fold of the card. */
(() => {
  'use strict';
  const WIDTH = 640, HEIGHT = 272, DT = 1 / 120;
  const NAMES = ['Axel', 'Swayze'];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const slide = (a, b, amount) => a + clamp(b - a, -amount, amount);
  const ease = t => t * t * (3 - 2 * t);

  // Platforms are listed from the starting edge to the letter. A heart or ribbon
  // platform unfolds after the first or second pickup, on both faces of the card.
  function land(x, y, w, h = 26, features = {}) {
    return {x, y, w, h, needs: 0, side: -1, ...features};
  }
  function heartStep(x, y, w, features = {}) {
    return land(x, y, w, 19, {needs: 1, ...features});
  }
  function ribbon(x, y, w, features = {}) {
    return land(x, y, w, 16, {needs: 2, ...features});
  }
  function fold(name, side, reversed, left, right, shelves, marks, note) {
    const platforms = [land(0, left[1], left[0], HEIGHT - left[1] + 18),
      ...shelves, land(right[0], right[1], WIDTH - right[0], HEIGHT - right[1] + 18)];
    if (reversed) for (const p of platforms) p.x = WIDTH - p.x - p.w;
    const orient = x => reversed ? WIDTH - x : x;
    return {name, side, reversed, note, platforms,
      start: {x: orient(64), y: left[1]},
      friend: {x: orient(548), y: right[1]},
      goal: {x: orient(580), y: right[1], side},
      hearts: marks.map(([x,y], i) => ({x: orient(x), y, side: i === 1 ? 1 - side : side}))};
  }
  const LEVELS = [
    fold('The First Fold', 0, false, [177,213], [494,199],
      [land(209,184,72), land(311,209,53), land(406,223,60),
       ribbon(302,153,67), heartStep(404,176,63)],
      [[242,151],[433,144],[334,119]], 'Leap to the pink heart.'),
    fold('Written in the Margins', 1, true, [124,197], [516,214],
      [land(144,175,58), land(216,142,65), ribbon(313,124,74),
       heartStep(403,151,63), land(471,179,42)],
      [[244,112],[432,121],[348,93]], 'Climb the little steps to the heart.'),
    fold('A Daisy for You', 0, false, [139,220], [510,209],
      [land(163,191,61,28,{spring:true}), land(232,122,60),
       ribbon(304,146,58), heartStep(396,162,58), land(473,183,34)],
      [[256,90],[424,131],[330,114]], 'Jump from the daisy for an extra lift.'),
    fold('The Ribbon Knot', 1, true, [163,183], [500,189],
      [land(207,209,72), ribbon(294,173,72,{drift:10}), heartStep(392,142,72)],
      [[240,181],[426,113],[328,141]], 'Drop to the heart along the lower edge.'),
    fold('Cloud Stationery', 1, false, [124,217], [509,206],
      [land(139,184,56), land(205,150,56), land(272,123,48),
       ribbon(332,107,49), heartStep(407,136,54), land(470,170,38)],
      [[292,93],[432,105],[355,75]], 'Follow the staircase up into the clouds.'),
    fold('The Blushing Bridge', 0, true, [158,208], [513,214],
      [land(181,184,55,24), land(250,161,55),
       ribbon(323,146,57,{drift:12}), heartStep(403,167,64,{drift:7}), land(475,191,30)],
      [[276,128],[435,135],[352,115]], 'Follow the stitched edge to the pink heart.'),
    fold('A Little Lift', 0, false, [148,223], [497,211],
      [land(167,210,67,32,{spring:true}), land(234,142,73),
       ribbon(317,121,68), heartStep(415,143,64), land(475,178,37)],
      [[265,112],[443,111],[348,88]], 'Bounce from the daisy to the high ledge.'),
    fold('Wrong Side Up', 1, true, [130,170], [510,198],
      [land(158,201,57), land(229,217,51), ribbon(296,184,60),
       heartStep(376,148,63,{drift:8}), land(462,164,40)],
      [[251,188],[404,115],[324,154]], 'Hop down to the heart in the hollow.'),
    fold('Under One Sky', 1, false, [133,215], [513,192],
      [land(146,177,53), land(216,142,60), ribbon(300,123,68,{drift:12}),
       heartStep(398,147,63), land(466,174,40)],
      [[244,108],[426,115],[326,92]], 'Jump the terraces, then fold the sky.'),
    fold('P.S. I’ll Catch You', 0, false, [134,209], [514,177],
      [land(159,177,62), land(238,143,59), ribbon(332,129,66),
       heartStep(436,154,44)],
      [[264,110],[460,124],[364,99]], 'One last heart trail to the other side.')
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
        if(this.level>=0) this.draw();
        requestAnimationFrame(this.frame);
      };
      requestAnimationFrame(this.frame);
    }
    load(index) {
      if (!Number.isInteger(index) || index<0 || index>=LEVELS.length) return;
      this.level=index; this.layout=LEVELS[index]; this.side=this.layout.side;
      this.hearts=this.layout.hearts.map(h=>({...h,taken:false}));
      this.count=0; this.time=0; this.foldTime=0; this.finishTime=0; this.finished=false;
      this.activeEnding=false; this.jumpBuffer=0; this.flash=0; this.paused=false;
      this.confetti=[]; this.newInk=[]; this.firstFold=false;
      this.keys={left:false,right:false,jump:false,fold:false};
      this.actors=[];
      const toRight=this.layout.reversed?-1:1;
      this.actors[this.side]=makeActor(this.layout.start,toRight);
      this.actors[1-this.side]=makeActor(this.layout.friend,-toRight);
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
      if(action!=='fold' || this.foldTime>0) return;
      this.side=1-this.side; this.foldTime=0.3; this.jumpBuffer=0; this.firstFold=true;
      this.sound('fold'); this.speak();
    }
    sound(kind) { this.hooks.onSound?.(kind); }
    speak() {
      const next=this.hearts[this.count], goal=this.layout.goal;
      let hint;
      if(next && next.side!==this.side) hint='Fold to '+NAMES[next.side]+' for the next heart.';
      else if(this.count===0) hint=this.layout.note;
      else if(this.count===1) hint='Find the heart on the pink paper step.';
      else if(this.count===2) hint='Jump to the heart on the new ribbon.';
      else if(goal.side!==this.side) hint='Fold to '+NAMES[goal.side]+' to finish the card.';
      else if(this.level===9) hint='Jump into Swayze’s arms!';
      else hint='Reach the sealed letter to finish this fold.';
      this.hooks.onUpdate?.({level:this.level,name:this.layout.name,character:NAMES[this.side],
        hearts:this.count,hint});
    }
    platsAt(time) {
      return this.layout.platforms.map((p,index)=>({...p,index,
        x:p.x+(p.drift?Math.sin(time*1.4+index)*p.drift:0)}));
    }
    solids() {
      return this.platsAt(this.time).filter(p=>p.needs<=this.count && (p.side===-1||p.side===this.side));
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
          if(surface.needs===0 && !surface.drift && a.x>surface.x+9 && a.x<surface.x+surface.w-9)
            a.checkpoint={x:a.x,y:a.y};
        }
      }
      if(a.y>HEIGHT+38) {
        Object.assign(a,{...a.checkpoint,vx:0,vy:0,grounded:true,coyote:0.1,floor:null,lastPlatform:null});
        this.flash=0.23;this.sound('fall');
      }
      const heart=this.hearts[this.count];
      if(heart && heart.side===this.side && Math.abs(a.x-heart.x)<16 && Math.abs(a.y-17-heart.y)<20) {
        heart.taken=true; this.count++; this.newInk[this.count]=this.time;
        this.sound('heart'); this.burst(heart.x,heart.y,['#fff3ce','#f47d92','#d65479'],17);
        if(this.count===3 && this.level===9) {
          // Swayze arrives at the heart window to receive Axel's last jump.
          const friend=this.actors[1-this.side];
          Object.assign(friend,{x:this.layout.goal.x,y:this.layout.goal.y,vx:0,vy:0,grounded:true,floor:null});
          this.burst(friend.x,friend.y-12,['#ffc5be','#fff0d8'],10);
        }
        this.speak();
      }
      const goal=this.layout.goal;
      const inReach = Math.abs(a.x - goal.x) < 19;
      const meetsGoal = this.level === 9
        ? !a.grounded && a.y < goal.y - 6 && a.y > goal.y - 52
        : Math.abs(a.y - goal.y) < 27;
      if (this.count === 3 && this.side === goal.side && inReach && meetsGoal) this.completeFold();
    }
    completeFold() {
      this.activeEnding=true; this.finishTime=0;
      const a=this.actors[this.side], goal=this.layout.goal;
      this.catchStart={x:a.x,y:a.y};
      this.burst(goal.x,goal.y-25,['#fb8898','#fbe9b6','#bd7f9a','#e8b776'],22);
      this.sound('complete');
    }
    draw() {
      if(this.level<0) return;
      const ctx=this.ctx, time=this.time, goal=this.layout.goal, ending=this.activeEnding;
      ctx.save(); ctx.imageSmoothingEnabled=false;
      window.Scenery.background(ctx,this.level,time,this.side);
      const platforms=this.platsAt(time);
      for(const p of platforms) {
        const open=p.needs<=this.count && (p.side===-1 || p.side===this.side);
        if(open) {
          const style=p.needs===1?'heart':p.needs===2?'ribbon':'ground';
          window.Scenery.platform(ctx,Math.round(p.x),p.y,p.w,p.h,this.level*11+p.index,style);
          if(p.spring) flowerSpring(ctx,p);
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
      if(this.level!==9 || this.count<3) letter(ctx,goal.x,goal.y,this.count===3,time);
      else {
        ctx.save();ctx.globalAlpha=0.69;
        pixelHeart(ctx,goal.x+1,goal.y-40,3,true);
        ctx.restore();
      }
      for(let i=0;i<this.hearts.length;i++) {
        const h=this.hearts[i]; if(h.taken) continue;
        const current=i===this.count && h.side===this.side;
        const bob=Math.round(Math.sin(time*2.5+i)*2);
        ctx.save();ctx.globalAlpha=current?1:0.72;
        pixelHeart(ctx,h.x,h.y+bob,1,!current);
        if(current) {
          glint(ctx,h.x-9,h.y-6+bob);
          if(Math.sin(time*3)>0.1) rect(ctx,'#fff2d9',h.x+9,h.y+bob+3,2,2);
        }
        ctx.restore();
      }
      const order=[1-this.side,this.side];
      for(const id of order) {
        const a=this.actors[id]; let x=a.x, y=a.y, facing=a.facing;
        let pose=a.grounded ? (id===this.side && Math.abs(a.vx)>10 && !ending?'walk':'idle'):'jump';
        if(ending && this.level===9) {
          const t=clamp(this.finishTime/0.5,0,1);
          if(id===this.side) {
            x=this.catchStart.x+(goal.x-9-this.catchStart.x)*ease(t);
            y=this.catchStart.y+(goal.y-this.catchStart.y)*ease(t)-Math.sin(t*Math.PI)*15;
            pose=t<0.85?'jump':'idle';facing=1;
          } else { x=goal.x+4-2*Math.sin(t*Math.PI);y=goal.y;facing=-1;pose='idle'; }
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
