/* Hand-pixelled city sets, painted once per page of the card. */
(() => {
  'use strict';
  const WIDTH=640, HEIGHT=272;
  const backgrounds=new Map(), tiles=new Map();
  const locations=Object.freeze(['Bluebell Row','Afterhours Books','Moonflower Park','Lantern Lane','Starlight Harbor','The Silver Span','Rooftop Wishes','Nightingale Station','Starling Observatory','Moonlit Promenade']);
  const reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function px(ctx,color,x,y,w=1,h=1) {
    ctx.fillStyle=color;
    ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  }
  function rng(seed) {
    let state=seed>>>0;
    return () => {
      state=(Math.imul(state,1664525)+1013904223)>>>0;
      return state/4294967296;
    };
  }
  function mix(a,b,t) {
    const rgb=[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t));
    return '#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  function poly(ctx,color,points) {
    if(points.length<3)return;
    const ys=points.map(p=>p[1]);
    for(let y=Math.floor(Math.min(...ys));y<Math.ceil(Math.max(...ys));y++) {
      const edges=[],scan=y+.5;
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const [x0,y0]=points[j], [x1,y1]=points[i];
        if((y0<=scan&&y1>scan)||(y1<=scan&&y0>scan)) edges.push(x0+(scan-y0)*(x1-x0)/(y1-y0));
      }
      edges.sort((a,b)=>a-b);
      for(let i=0;i+1<edges.length;i+=2){
        const left=Math.round(edges[i]), right=Math.round(edges[i+1]);
        if(right>left)px(ctx,color,left,y,right-left,1);
      }
    }
  }
  function line(ctx,color,x1,y1,x2,y2,thickness=1) {
    x1=Math.round(x1);x2=Math.round(x2);y1=Math.round(y1);y2=Math.round(y2);
    const dx=Math.abs(x2-x1), dy=-Math.abs(y2-y1), sx=x1<x2?1:-1,sy=y1<y2?1:-1;
    let error=dx+dy;
    while(true){px(ctx,color,x1,y1,thickness,thickness);if(x1===x2&&y1===y2)break;
      const e=2*error;if(e>=dy){error+=dy;x1+=sx;}if(e<=dx){error+=dx;y1+=sy;}}
  }
  function oval(ctx,color,cx,cy,rx,ry) {
    if(rx<=0||ry<=0)return;
    for(let sy=-Math.ceil(ry);sy<=Math.ceil(ry);sy++){
      const half=Math.round(rx*Math.sqrt(Math.max(0,1-(sy*sy)/(ry*ry))));
      px(ctx,color,cx-half,cy+sy,half*2+1,1);
    }
  }
  function glow(ctx,x,y,r,color,strength=.15){
    ctx.save();const base=ctx.globalAlpha??1;
    for(const scale of [1,.75,.5,.28]){ctx.globalAlpha=base*strength*(scale>.6?.22:.42);oval(ctx,color,x,y,r*scale,r*scale);}
    ctx.restore();
  }
  function lamp(ctx,x,y,h=46,style=0){
    const post='#3d3c55',rim='#79728a',brass='#a08a81',cream='#f9cd9b',ry=y-h;
    px(ctx,post,x-3,y-3,7,3);px(ctx,rim,x-3,y-4,6,1);
    px(ctx,post,x-1,ry+3,3,h-5);px(ctx,rim,x-1,ry+4,1,h-11);
    px(ctx,brass,x-2,y-9,4,2);px(ctx,rim,x-2,ry+9,5,1);
    glow(ctx,x,ry,17,'#edb77e',.32);
    if(style%2){oval(ctx,'#ad8f87',x,ry,4,5);oval(ctx,cream,x-1,ry-1,3,4);px(ctx,'#ffe3b2',x-2,ry-3,2,3);}
    else{poly(ctx,post,[[x-5,ry-5],[x+5,ry-5],[x+3,ry+4],[x+1,ry+6],[x-1,ry+6],[x-3,ry+4]]);
      poly(ctx,cream,[[x-3,ry-4],[x+3,ry-4],[x+2,ry+2],[x,ry+3],[x-2,ry+2]]);px(ctx,'#fff0c5',x-2,ry-3,2,4);
      px(ctx,rim,x-5,ry-6,11,2);px(ctx,post,x-4,ry-7,8,1);px(ctx,rim,x-1,ry-9,2,2);}
  }
  function layer(w,h){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;}
  const skies=[
    // Zenith, horizon, low glow, cloud shade, shadow skyline, skyline light.
    ['#424772','#b68b9d','#da9c9d','#75678b','#77718b','#615f7c'],
    ['#333c66','#9e7f98','#d599a6','#676382','#6d6683','#565775'],
    ['#343966','#8b83a7','#af9dbb','#615b86','#666583','#515873'],
    ['#3a365d','#9a7088','#bf8391','#6f5679','#6c5876','#55516d'],
    ['#24345d','#8c8da8','#c69aa5','#556188','#646d8b','#505b79'],
    ['#2d345d','#8983a4','#bd9aa9','#565e83','#616982','#4a526d'],
    ['#35325c','#aa7895','#bd8f9e','#65597c','#735e80','#58506f'],
    ['#29314f','#747694','#a4879f','#515777','#5e647f','#4d526d'],
    ['#242945','#66658c','#aa8ba5','#4b5278','#555971','#484d67'],
    ['#323559','#9c859f','#da9aaf','#665c80','#70657e','#585b74']
  ];
  function sky(ctx, level, side){
    const p=skies[level],random=rng(586+level*957);
    const horizon=[158,144,158,146,140,142,160,151,171,136][level];
    const zenith=side?mix(p[0],'#615782',.07):p[0];
    for(let y=0;y<HEIGHT;y+=4){const t=Math.min(1,y/horizon), c=mix(zenith,p[1],t);
      px(ctx,c,0,y,WIDTH,4);
      if(y>0&&y<horizon)for(let j=0;j<5;j++)px(ctx,c,random()*WIDTH,y-1,Math.floor(random()*12)+1,1);
    }
    for(let i=0;i<55;i++){
      const x=Math.floor(random()*WIDTH),y=Math.floor((random()**1.3)*(horizon-21));
      const col=mix(p[1],i%5===0?'#f0d7be':'#cfbed0',.23+random()*.55);
      px(ctx,col,x,y);if(i%13===0&&y>12){px(ctx,mix(p[1],col,.4),x-1,y,3,1);px(ctx,mix(p[1],col,.4),x,y-1,1,3);px(ctx,col,x,y);}
    }
    const moonX=[455,441,319,383,462,412,489,169,381,316][level],moonY=[50,50,54,39,52,39,45,49,49,43][level];
    const radius=[12,11,15,10,14,13,12,12,15,16][level];
    glow(ctx,moonX,moonY,radius*2.45,'#e3bec6',.23);
    const moonColor=level<3?'#f3d6bc':'#e9d1cf';
    for(let my=-radius;my<=radius;my++){
      const rx=Math.floor(Math.sqrt(Math.max(0,radius*radius-my*my)));
      const start=moonX-rx;
      let end=moonX+rx;
      if(level===1||level===6||level===7){const inset=4;
        if(Math.abs(my+2)<radius-2)end=Math.min(end,moonX+inset-Math.floor(Math.sqrt((radius-2)**2-(my+2)**2)));}
      if(end>=start)px(ctx,my<radius*.58?moonColor:mix(moonColor,p[1],.15),start,moonY+my,end-start+1,1);
    }
    if(![1,6,7].includes(level)){
      const d=mix(moonColor,p[1],.22);
      px(ctx,d,moonX-5,moonY-5,3,1);px(ctx,d,moonX-6,moonY-4,4,2);px(ctx,d,moonX+4,moonY+3,3,2);
    }
    // Long and shallow cloud ribbons open up the sky above the player's path.
    for(let i=0;i<9;i++){
      const x=Math.round(i*83-30+random()*25),y=40+Math.round(random()*55), w=20+Math.round(random()*41);
      const c=mix(p[3],mix(zenith,p[1],y/horizon),.35);
      poly(ctx,c,[[x,y+5],[x+5,y+3],[x+w*.26,y+3],[x+w*.32,y],[x+w*.44,y-1],[x+w*.51,y+1],[x+w*.68,y+1],[x+w*.78,y+4],[x+w-4,y+4],[x+w,y+6],[x+w*.62,y+6],[x+w*.53,y+7],[x+w*.24,y+6]]);
      px(ctx,mix(c,p[2],.13),x+w*.35,y+6,Math.round(w*.41),1);
      if(i%2===0)px(ctx,c,x+w+3,y+6,7,1);
    }
    distantCity(ctx,level,horizon,p[4],p[5]);
  }
  function distantCity(ctx,level,horizon,far,near) {
    const random=rng(1920+level*131);
    for(let row=0;row<2;row++){
      const color=row?near:far;
      let x=-20;
      while(x<WIDTH){
        const w=Math.floor(random()*(row?23:19))+(row?12:8);
        const h=Math.round(5+random()*22+(Math.sin(x/66+level)+1)*8);
        const roof=horizon+row*24-h;
        px(ctx,color,x,roof,w,HEIGHT-roof);
        const kind=Math.floor(random()*5);
        if(kind===0){px(ctx,color,x+w*.2,roof-3,w*.57,3);px(ctx,color,x+w*.45,roof-6,2,3);}
        else if(kind===1){poly(ctx,color,[[x-1,roof+1],[x+w*.56,roof-7],[x+w+1,roof+1]]);}
        else if(kind===2){px(ctx,color,x+w-6,roof-4,3,4);}
        if(row&&w>=15){
          const warm=mix(color,level===2?'#ac9e9f':'#d5ac93',.29), cool=mix(color,'#aaa3b7',.27);
          for(let wy=roof+4;wy<Math.min(roof+44,horizon+24);wy+=5)for(let wx=x+3;wx<x+w-2;wx+=5){
            const value=random();if(value>.65)px(ctx,value>.86?warm:cool,wx,wy,value>.92?3:2,2);
          }
        }
        x+=w+Math.floor(random()*3)-1;
      }
    }
  }
  // Small building details repeat across the route in the same etched-pixel style.
  function laneWindow(c,x,y,w,h,lit,frame='#3f4764',shade='#57627a') {
    px(c,frame,x-1,y-2,w+2,h+3);
    px(c,lit ? '#b9988a' : shade,x,y,w,h);
    if (lit) {
      px(c,'#e0bb99',x+1,y+1,w-2,Math.max(2,Math.floor(h*.55)));
      poly(c,'#a18581',[[x,y],[x+3,y],[x+1,y+5],[x,y+6]]);
      px(c,'#b18e80',x+w-2,y,2,h);
    }
    px(c,frame,x+(w>>1),y,1,h); px(c,frame,x,y+(h>>1),w,1);
    px(c,'#7d7988',x-2,y+h,w+4,2);
  }
  function laneShrub(c,x,y,w,h,seed,colors) {
    const r=rng(seed), [dark,mid,light]=colors;
    oval(c,dark,x+w/2,y-h*.3,w/2,h*.52);
    for(let i=0;i<Math.ceil(w/3);i++){
      const t=r(), xx=Math.round(x+t*w), radius=2+Math.round(r()*3);
      const yy=Math.round(y-Math.sin(t*Math.PI)*h*.58-r()*h*.30);
      oval(c,mid,xx,yy,radius,Math.max(2,radius-1));
      if(r()>.6) px(c,light,xx-1,yy-2,2);
    }
  }
  function laneRoad(c,y,seed,base,trim) {
    const r=rng(seed);
    px(c,base,0,y,640,272-y); px(c,trim,0,y,640,2);
    for(let i=0;i<76;i++){
      const yy=y+4+Math.round(r()*(269-y)), x=Math.round(r()*640);
      px(c,mix(base,trim,.32+r()*.26),x,yy,2+Math.round(r()*8));
    }
  }
  function residential(c) {
    const r=rng(3477);
    // A street of little peaked roofs, varied in profile and shutter color.
    const homes=[[-14,60,153,34],[43,52,166,28],[90,62,158,33],[144,60,148,38],[200,53,169,28],[252,66,156,34],[310,65,165,29],[367,47,157,27],[409,71,145,38],[469,62,158,32],[526,66,167,30],[588,61,150,36]];
    const walls=['#6e6d83','#727789','#7c7585','#646e85'], roofs=['#525b76','#5b5a73','#53617a'];
    for(const [i,[x,w,y,h]] of homes.entries()){
      const ridge=x+Math.round(w*(.43+(i%3)*.06)), wall=walls[i%4], roof=roofs[i%3];
      px(c,'#545b73',x+w-14,y-19,6,19); px(c,'#777587',x+w-15,y-20,8,2);
      px(c,wall,x+3,y-1,w-6,218-y);
      poly(c,roof,[[x-3,y],[ridge,y-h],[x+w+3,y],[x+w-1,y+3],[x+1,y+3]]);
      line(c,'#898094',x-2,y-1,ridge,y-h); line(c,'#84829b',ridge,y-h,x+w+2,y);
      for(let j=0;j<14;j++){
        const xx=x+w*.25+r()*w*.47, yy=y-1-Math.round(r()*10);
        px(c,mix(roof,'#9090a0',.19),xx,yy,3+(j%3));
      }
      if (i%3!==0) {px(c,wall,ridge-3,y-11,7,12); poly(c,'#485570',[[ridge-6,y-10],[ridge,y-18],[ridge+7,y-10]]); px(c,'#c2a195',ridge-1,y-9,3,4);}
      laneWindow(c,x+9,y+9,9,13,i%4!==2);
      laneWindow(c,x+w-19,y+9,9,13,i%3!==0);
      const door=x+(w>>1)-3; px(c,'#4c516a',door,197,8,20);
      px(c,'#ad958c',door+2,199,4,7); px(c,'#bd9e87',door+4,210,1);
      px(c,'#798195',door-2,216,12,2);
      if(i%2===0){px(c,'#534e64',door+10,198,3,5); px(c,'#d3ae91',door+11,199,1,2);}
    }
    laneRoad(c,220,177,'#5c627a','#838295');
    // Front gardens and an irregular line of pale weathered pickets.
    for(let i=0;i<12;i++){
      const x=i*54-10, w=26+(i*7)%17;
      px(c,'#7f8191',x,213,w,2);
      for(let j=0;j<w;j+=6){px(c,'#92909d',x+j,209,2,10);px(c,'#a29ba3',x+j,208,1);}
      laneShrub(c,x+14,218,19,8,86+i,['#556578','#627481','#798b90']);
    }
    for(const [x,top] of [[73,98],[395,117],[611,107]]){
      px(c,'#535a73',x,top,3,123);px(c,'#828091',x,top,1,119);
      px(c,'#62657b',x-6,top+4,15,2);px(c,'#a499a4',x-5,top+1,2,4);px(c,'#a499a4',x+5,top+1,2,4);
    }
    const poles=[[-100,72],[73,98],[395,117],[611,107],[715,101]];
    for(let i=1;i<poles.length;i++){
      const [x0,y0]=poles[i-1],[x1,y1]=poles[i];
      for(let k=0;k<2;k++){
        let last=y0+3+k*3;
        for(let x=x0+1;x<=x1;x++){const u=(x-x0)/(x1-x0),y=Math.round(y0+(y1-y0)*u+Math.sin(Math.PI*u)*12)+3+k*3;line(c,'#77778b',x-1,last,x,y);last=y;}
      }
    }
    lamp(c,24,222,44); lamp(c,360,221,35); lamp(c,572,224,41);
  }

  function laneLetters(c,word,x,y,color,scale=1) {
    const glyph={B:['110','101','110','101','110'],O:['010','101','101','101','010'],K:['101','110','100','110','101'],S:['011','100','010','001','110'],C:['011','100','100','100','011'],A:['010','101','111','101','101'],F:['111','100','110','100','100'],E:['111','100','110','100','111']};
    for(const ch of word){const rows=glyph[ch];if(rows)rows.forEach((row,j)=>[...row].forEach((bit,i)=>{if(bit==='1')px(c,color,x+i*scale,y+j*scale,scale,scale);}));x+=scale*4;}
  }
  function bookshop(c) {
    const r=rng(2345),base=227;
    // Narrow upstairs flats, broad display windows and a real miniature bookcase.
    const blocks=[[-17,91,107,'#686d82'],[74,143,116,'#747083'],[217,107,131,'#69677a'],[324,109,102,'#656c81'],[433,148,124,'#777384'],[581,84,113,'#606a7c']];
    for(const [i,[x,w,y,color]] of blocks.entries()){
      px(c,color,x,y,w,base-y);
      px(c,'#8a8392',x-1,y-3,w+2,3);px(c,'#525671',x,y,w,3);
      px(c,'#626378',x+w-4,y+3,4,base-y-3);
      const count=Math.floor(w/29);
      for(let j=0;j<count;j++)laneWindow(c,x+9+j*(w-6)/count,y+10,12,15,(i+j)%3!==1);
      if(y<120) px(c,'#858092',x+5,y+34,w-10,2);
      for (let j=0;j<12;j++){const xx=x+Math.round(r()*(w-8)),yy=y+4+Math.round(r()*29);px(c,mix(color,'#b49ba2',.21),xx,yy,4);}
      const warm=i===1||i===4;
      px(c,'#4c5066',x+3,161,w-6,66); px(c,'#66617a',x+5,158,w-10,5);
      px(c,warm?'#bd9c8e':'#718394',x+6,179,w-14,38);
      const display=x+w-37;
      px(c,'#4c5066',display,177,3,44);
      laneWindow(c,display+7,184,15,25,warm);
      if(i===1){
        for(let row=0;row<3;row++){
          const sy=190+row*10;
          for(let bx=x+9;bx<display-2;){const bw=2+Math.floor(r()*3),bh=4+Math.floor(r()*5);
            px(c,['#786d78','#9d7c7c','#6f8092','#b3977e','#c4a58b'][Math.floor(r()*5)],bx,sy-bh,bw,bh);
            if(r()>.5)px(c,'#cfb398',bx,sy-3,bw,1);bx+=bw+1;}
          px(c,'#695f71',x+6,sy,display-x-6,2);
        }
        laneLetters(c,'BOOKS',x+49,165,'#edc7a3');
      } else if(i===4){
        for(const dx of [19,42,70]){
          px(c,'#716773',x+dx,180,1,8);poly(c,'#edcaa3',[[x+dx,187],[x+dx+5,191],[x+dx-5,191]]);
          px(c,'#746477',x+dx-7,209,14,2);px(c,'#766a77',x+dx-1,211,2,6);
        }
        laneLetters(c,'CAFE',x+54,165,'#f0c7a8');
      } else {
        for(let dx=17;dx<w-42;dx+=17)px(c,'#576275',x+dx,180,2,37);
      }
      const awning=warm?'#a17a80':'#68768b',stripe=warm?'#d1a693':'#9094a1';
      poly(c,awning,[[x,172],[x+w-1,172],[x+w+2,178],[x-3,178]]);
      for(let dx=0;dx<w-3;dx+=12)px(c,stripe,x+dx,173,5,6);
      px(c,'#615b70',x-2,179,w+4,2);
      px(c,'#635d71',x+1,218,w-2,6);
    }
    laneRoad(c,226,89,'#555e74','#8d8592');
    // A projecting coffee-cup sign and an A-frame outside the door.
    px(c,'#4f5068',565,157,18,2);px(c,'#60546d',578,159,1,6);
    px(c,'#956e7f',568,164,21,19);px(c,'#d7a29c',570,166,17,15);px(c,'#716879',571,167,15,13);
    px(c,'#f3ccae',574,172,6,4);px(c,'#edc3a8',580,172,3,1);px(c,'#edc3a8',582,173,1,2);px(c,'#edc3a8',580,175,2,1);px(c,'#e6b39c',573,177,10);px(c,'#e6b39c',575,169,1,2);px(c,'#e6b39c',578,168,1,2);
    for(const x of [172,542]){poly(c,'#a58e83',[[x,216],[x+8,216],[x+11,232],[x-2,232]]);px(c,'#556173',x+1,218,6,10);px(c,'#aa9e98',x+2,221,4);px(c,'#968f95',x+2,224,3);}
    lamp(c,34,227,43); lamp(c,369,226,47);
  }

  function park(c) {
    const r=rng(1807);
    // A promenade with curved paths looping around a two-tiered stone fountain.
    poly(c,'#596d78',[[-2,195],[53,187],[130,191],[212,183],[267,184],[333,179],[398,185],[458,178],[536,187],[594,183],[642,190],[642,272],[-2,272]]);
    poly(c,'#8c8390',[[100,272],[170,250],[268,234],[394,220],[425,213],[416,208],[347,198],[400,194],[474,207],[482,215],[467,222],[382,233],[306,248],[226,272]]);
    poly(c,'#7c7e8a',[[114,272],[176,251],[273,235],[391,223],[460,215],[452,209],[405,200],[469,211],[468,216],[395,226],[294,243],[191,272]]);
    function tree(x,y,s,seed){
      const t=rng(seed),xx=v=>x+Math.round(v*s),yy=v=>y+Math.round(v*s);
      const trunk='#57596e',lit='#857487';
      poly(c,trunk,[[xx(-5),y],[xx(-2),yy(-24)],[xx(-5),yy(-49)],[xx(-2),yy(-69)],[xx(4),yy(-70)],[xx(1),yy(-47)],[xx(4),yy(-27)],[xx(4),y]]);
      for(const [ax,ay,bx,by] of [[0,-39,-21,-70],[-3,-48,-24,-56],[1,-52,21,-73],[0,-37,22,-60],[1,-65,6,-83]]){
        line(c,trunk,xx(ax),yy(ay),xx(bx),yy(by),Math.max(1,Math.round(3*s)));
        line(c,lit,xx(ax),yy(ay-2),xx(bx),yy(by-2));
      }
      for(const [u,v,rx,ry] of [[-19,-63,19,12],[20,-65,19,14],[-5,-73,24,16],[10,-81,18,12],[-23,-74,12,9]]){
        const cx=xx(u),cy=yy(v);
        oval(c,'#5b6179',cx,cy,rx*s,ry*s);
        for(let k=0;k<22;k++){const a=t()*6.283,df=Math.sqrt(t()),lx=cx+Math.cos(a)*rx*s*df,ly=cy+Math.sin(a)*ry*s*df;
          oval(c,['#696b87','#79728b','#8a7e96','#a48d9f'][Math.floor(t()*4)],lx,ly,Math.max(1,(2+t()*4)*s),Math.max(1,(1+t()*2)*s));
        }
      }
    }
    tree(28,208,1.25,870); tree(157,191,.65,871); tree(477,194,.69,811);tree(614,212,1.32,824);
    for(const [x,y] of [[67,205],[207,200],[514,204]]){
      px(c,'#a38a88',x,y-9,24,2);px(c,'#796979',x,y-6,24,2);px(c,'#726b79',x-1,y-3,26,2);px(c,'#555d70',x+2,y-2,2,6);px(c,'#555d70',x+20,y-2,2,6);
    }
    const fx=327,fy=201;
    oval(c,'#596b79',fx,fy+4,51,12);oval(c,'#8d8b9a',fx,fy+1,51,10);
    oval(c,'#71899a',fx,fy-1,47,7);oval(c,'#8ea4ac',fx,fy-2,39,4);
    px(c,'#7c8592',fx-4,171,8,26);px(c,'#a6a2ad',fx-3,169,3,26);
    oval(c,'#79818f',fx,174,17,5);oval(c,'#b2a8b3',fx,171,19,4);oval(c,'#97afbb',fx,170,16,2);
    px(c,'#9a9eac',fx-2,153,4,17);oval(c,'#a6a6b2',fx,151,7,2);
    for(let branch=0;branch<8;branch++){
      const dir=branch%2?1:-1,span=(branch>>1)*5+7;
      let lx=fx,ly=153;
      for(let j=1;j<=13;j++){
        const t=j/13,xx=fx+dir*span*t,yy=151-(13+span*.28)*Math.sin(t*Math.PI)+((span<13)?17:44)*t*t;
        if(j%5!==0)line(c,branch%3?'#a2abb9':'#c0c1c8',lx,ly,xx,yy);
        lx=xx;ly=yy;
      }
    }
    for(let row=0;row<2;row++)for(let side=0;side<2;side++){
      const x=side?471:14,y=219+row*23,w=side?155:116;
      laneShrub(c,x,y,w,8+row*2,120+row+side*3,['#506775','#607983','#73898a']);
      for(let k=0;k<21;k++){const xx=x+Math.round(r()*w),yy=y-1-Math.round(r()*7);
        px(c,['#b7a0b2','#c1a897','#ac91ac','#929bb4'][k%4],xx,yy,1+(k%2),1);
        if(k%4===0)px(c,'#b7a0b2',xx,yy-1);}
    }
    lamp(c,102,211,43);lamp(c,433,203,32);lamp(c,570,219,44);
  }

  function alley(c) {
    // The alley turns in the middle distance; nearby eaves and lanterns frame that view.
    laneRoad(c,200,27,'#696777','#94818e');
    poly(c,'#7d7381',[[193,272],[284,216],[311,198],[343,197],[378,218],[463,272]]);
    for(const s of [-1,1]){
      const cx=320, mirror=x=>s<0?x:640-x;
      const blocks=[[0,101,90,133],[90,133,162,153],[162,153,219,169],[219,169,261,180],[261,180,293,186]];
      for(const [i,[a,top,b,bt]] of blocks.entries()){
        const xa=mirror(a),xb=mirror(b),w=Math.abs(xb-xa),xl=Math.min(xa,xb),bb=248-i*9;
        const wt=['#7a667b','#6b657c','#70677a','#7e7080','#7f7585'][i];
        poly(c,wt,[[xa,top],[xb,bt],[xb,bb-8],[xa,bb+6]]);
        const raf='#514f67';
        poly(c,raf,[[xa,top-12],[xb,bt-5],[xb+s*7,bt+4],[xa+s*14,top+1]]);
        line(c,'#b08b95',xa,top-12,xb,bt-5,2);
        const dx=(b-a)/(i<2?5:3);
        for(let j=0;j<(i<2?5:3);j++){
          const xx=a+dx*(j+.2), u=(xx-a)/(b-a),xx1=mirror(xx);
          const ww=Math.max(3,Math.floor(dx*.56)),yp=Math.round(top+(bt-top)*u)+9;
          if(i<3)laneWindow(c,s<0?xx1:xx1-ww,yp,ww,Math.max(6,14-i*2),(j+i)%3!==0,'#5c546c','#756c82');
        }
        const doorColor=['#bf9388','#ac8d89','#aa8c89','#a48b89','#a58e90'][i];
        const hi=Math.round((top+bt)*.50)+31-i*2, low=bb-3;
        px(c,'#625969',xl+3,hi,w-6,Math.max(6,low-hi));
        const panel=Math.max(4,Math.round(w/6));
        for(let j=1;j+panel<w-2;j+=panel){
          const xx=xl+j+2;
          px(c,doorColor,xx,hi+2,panel-3,Math.max(4,low-hi-4));
          px(c,'#7f6d78',xx,hi+Math.round((low-hi)*.58),panel-3,1);
          if(panel>8)px(c,'#87727b',xx+Math.floor(panel/2),hi+2,1,low-hi-4);
        }
        line(c,'#575567',xa,hi-5,xb,hi-1,3);
        for(let j=0;j<8-i;j++)px(c,'#8b7c8c',xl+4+(j*13)%(w-8),bt+4+(j*9)%9,3);
      }
    }
    function lantern(x,y,scale) {
      const w=Math.max(4,Math.round(9*scale)),h=Math.max(6,Math.round(13*scale)),half=w>>1,bodyY=y+3;
      px(c,'#77707e',x,y-3,1,6);glow(c,x,bodyY+h/2,12*scale,'#eb957c',.09);
      oval(c,'#9b747c',x,bodyY+h/2,w/2+1,h/2);oval(c,'#d18c82',x,bodyY+h/2,w/2-1,h/2);
      px(c,'#e7ac91',x-1,bodyY+2,2,Math.max(2,h-4));
      px(c,'#bd8280',x-half,bodyY+Math.floor(h*.5),w,1);
      px(c,'#705e70',x-half+1,bodyY,w-2,2);px(c,'#776070',x-half+1,bodyY+h-2,w-2,2);
      px(c,'#cb9991',x,bodyY+h,1,2);
    }
    const strings=[[0,69,640,67,36,11,1],[51,115,589,121,21,12,.72],[161,153,475,147,14,10,.46]];
    for(const [xa,ya,xb,yb,sag,count,size] of strings){
      let prev=ya;
      for(let x=xa+1;x<=xb;x++){const t=(x-xa)/(xb-xa),y=Math.round(ya+(yb-ya)*t+Math.sin(t*Math.PI)*sag);line(c,'#6b6278',x-1,prev,x,y);prev=y;}
      for(let j=0;j<count;j++){const t=(j+.4)/count,x=xa+(xb-xa)*t,y=ya+(yb-ya)*t+Math.sin(t*Math.PI)*sag;lantern(Math.round(x),Math.round(y),size);}
    }
    for(const [x,y] of [[34,236],[605,241],[145,226],[490,225]]){
      laneShrub(c,x-5,y-5,11,10,x,['#556575','#66777c','#849184']);px(c,'#9a7f82',x-4,y-4,8,5);px(c,'#796d7c',x-3,y+1,6,2);
    }
  }
  // Water in the three river chapters has a different surface and its own reflected lights.
  function tide(ctx, horizon, colors, lights, seed) {
    const random = rng(seed);
    const depth = 272 - horizon;
    for (let y = horizon; y < 272; y += 4) {
      px(ctx, mix(colors[0], colors[1], (y - horizon) / depth), 0, y, 640, 4);
    }
    px(ctx, colors[2], 0, horizon, 640, 1);
    for (const [x, color, length, width] of lights) {
      for (let d = 1; d < length; d += d > 28 ? 3 : 2) {
        const t = d / length;
        const wave = Math.sin(d * 0.37 + x) * (1.1 + 3 * t);
        const span = Math.max(1, Math.round(width * (0.18 + 0.82 * t) * (0.32 + random() * 0.68)));
        const shade = mix(colors[0], color, (0.2 + random() * 0.32) * (1 - t * 0.57));
        px(ctx, shade, x + wave - span / 2, horizon + d, span, 1);
        if (d > 8 && random() < 0.24) px(ctx, shade, x + wave - span - 4, horizon + d + 1, Math.max(1, span / 2), 1);
      }
    }
    for (let i = 0; i < depth * 2; i++) {
      const y = (random() * depth) | 0;
      const x = (random() * 640) | 0;
      const width = 2 + (random() * (4 + y * 0.11) | 0);
      px(ctx, mix(colors[2], colors[1], 0.26 + random() * 0.5), x, horizon + y, width);
    }
  }

  function portCrane(ctx, x, foot, height, facing, tint) {
    const at = d => x + facing * d;
    const crown = foot - height;
    px(ctx,tint,x-9,foot-4,21,4);
    line(ctx,tint,at(-8),foot-3,at(-1),crown+23,2);
    line(ctx,tint,at(11),foot-3,at(4),crown+23,2);
    for (let d=22; d<height-4; d+=10) {
      line(ctx,tint,at(-3 - (d-22)*.09),crown+d,at(5 + (d-22)*.08),crown+d+9,1);
    }
    px(ctx,tint,x-6,crown+18,15,8);
    px(ctx,'#7a6884',x-3,crown+19,9,2);
    line(ctx,tint,at(-14),crown+15,at(48),crown-4,2);
    line(ctx,tint,at(-13),crown+22,at(48),crown-4,1);
    for(let i=0;i<5;i++) line(ctx,tint,at(-11+i*10),crown+19-i*4,at(-4+i*10),crown+12-i*3,1);
    line(ctx,tint,x,crown+18,at(5),crown,2);
    line(ctx,tint,at(5),crown,at(48),crown-4);
    line(ctx,tint,at(45),crown-2,at(45),crown+22);
    px(ctx,tint,at(45)-1,crown+21,3,3);
  }

  function harbor(ctx) {
    const quay='#424568', wall='#555475', ink='#394260', trim='#7e718b';
    const horizon=184;
    // The working side of the harbor, with corrugated sheds, a pair of cranes and cargo boxes.
    px(ctx,wall,0,174,640,10);
    for(const [x,w,y] of [[-9,96,151],[91,64,161],[163,60,155],[401,96,151],[507,74,157],[579,75,145]]) {
      px(ctx,wall,x,y,w,184-y);
      poly(ctx,'#65607e',[[x-3,y],[x+12,y-8],[x+w-15,y-8],[x+w+3,y]]);
      px(ctx,quay,x-1,y,w+2,2);
      for(let j=8;j<w-8;j+=17) {
        px(ctx,quay,x+j,y+6,12,6);
        px(ctx,'#967881',x+j+1,y+7,5,3);
        px(ctx,'#897385',x+j+7,y+7,4,3);
      }
      for(let j=5;j<w-4;j+=7) px(ctx,'#605c79',x+j,y+15,1,Math.max(1,182-y-15));
    }
    portCrane(ctx,83,178,75,1,'#565574');
    portCrane(ctx,161,179,54,-1,'#615e7c');
    portCrane(ctx,566,179,65,-1,'#53536e');
    for(const [x,y,col] of [[15,174,'#725e7c'],[38,174,'#786980'],[34,168,'#68667f'],[422,174,'#896e7d'],[447,174,'#5d637c'],[591,174,'#856c7a'],[613,174,'#63647b']]) {
      px(ctx,col,x,y,21,7); px(ctx,ink,x,y+6,21);
      for(let j=3;j<19;j+=4) px(ctx,mix(col,ink,0.24),x+j,y+1,1,4);
    }
    px(ctx,ink,0,180,640,4); px(ctx,trim,0,180,640);
    const dockLights=[24,76,120,202,245,387,441,496,557,615];
    for(const x of dockLights) {
      px(ctx,ink,x,168,1,11); px(ctx,'#c79a8d',x-2,167,5,2); px(ctx,'#ead0ac',x-1,167,3);
    }
    tide(ctx,horizon,['#515b80','#383f62','#6d718c'],dockLights.map(x=>[x,'#eec39b',30+((x*7)%38),9]),911);
    // A snug double-deck passenger ferry, moored broadside to the quay.
    line(ctx,'#65617b',207,197,227,191); line(ctx,'#686079',379,198,395,190);
    poly(ctx,'#333f5a',[[214,188],[231,189],[238,192],[367,192],[383,186],[377,199],[361,206],[244,206],[226,201]]);
    poly(ctx,'#6b7587',[[215,187],[230,188],[242,191],[365,191],[383,186],[381,190],[365,195],[240,195],[223,191]]);
    px(ctx,'#aa7e80',234,196,133,2); px(ctx,'#6e6178',243,202,116,2);
    px(ctx,'#7f8492',238,174,124,15); px(ctx,'#a2959b',235,173,131,2);
    px(ctx,'#55627b',235,188,133,2); px(ctx,'#b39794',242,185,117);
    for(let x=244;x<355;x+=10) {
      px(ctx,ink,x,177,7,6); px(ctx,'#d3aa93',x+1,178,5,3); px(ctx,'#c39385',x+1,181,5);
    }
    px(ctx,'#858996',255,160,71,13); px(ctx,'#625e76',250,156,81,4);
    px(ctx,'#b89a98',249,155,83,2);
    for(let x=260;x<324;x+=10) {px(ctx,ink,x,162,7,8);px(ctx,'#c6a59a',x+1,163,4,4);}
    px(ctx,'#6d788d',328,163,16,10); px(ctx,'#c9a294',330,165,10,4);
    px(ctx,'#9f7c85',271,147,8,8); px(ctx,'#5c5a72',270,145,10,3);
    px(ctx,'#646a82',319,137,1,19);
    poly(ctx,'#c08a90',[[320,138],[328,140],[320,143]]);
    for(let x=235;x<365;x+=9) px(ctx,'#aaa0a5',x,168,1,5);
    px(ctx,'#aaa0a5',234,168,132);
    for(const x of [247,346]) {oval(ctx,'#c0988e',x,188,3,3);px(ctx,'#69738a',x-1,187,2,3);}
    px(ctx,'#dabb9e',377,187,2,1);
    for (const [x,y] of [[119,206],[412,221],[502,198]]) {
      px(ctx,'#363e59',x-3,y+1,7,2);px(ctx,'#ad737e',x-2,y-2,5,3);
      px(ctx,'#b69f98',x,y-5,1,4);px(ctx,'#d5af92',x,y-6);
      px(ctx,'#62728b',x-5,y+4,8);
    }
    // Foreground jetty stays at the edge of the playable world.
    poly(ctx,ink,[[0,229],[43,216],[93,216],[59,226],[0,242]]);
    line(ctx,'#7e7486',0,229,43,216);px(ctx,'#7e7486',44,216,49);
    for(const x of [11,43,68]) {
      const y=231-x*.19;px(ctx,'#3f455f',x,y,4,16);px(ctx,'#92808a',x-1,y-4,6,3);
    }
  }

  function suspensionSpan(ctx,x1,y1,x2,y2,deck,sag,bright) {
    let prevX=x1,prevY=y1;
    const span=x2-x1;
    for(let dx=3;dx<=span+2;dx+=3) {
      const x=Math.min(x2,x1+dx),t=(x-x1)/span;
      const y=Math.round(y1+(y2-y1)*t+4*sag*t*(1-t));
      line(ctx,bright?'#a086a0':'#5d607f',prevX,prevY,x,y,1);
      prevX=x;prevY=y;
    }
    for(let x=x1+7;x<x2;x+=12) {
      const t=(x-x1)/span,y=Math.round(y1+(y2-y1)*t+4*sag*t*(1-t));
      if(y<deck-1) line(ctx,bright?'#79768f':'#626783',x,y+1,x,deck-1);
      if(bright) {
        px(ctx,'#d6aa92',x-1,y,2,1);
        if(Math.round((x-x1)/12)%4===1) px(ctx,'#f0cba0',x,y-1);
      }
    }
  }

  function riverTower(ctx,x,crest,deck) {
    const iron='#454965',lit='#88768d',shadow='#363f5c';
    const bottom=207;
    for(const side of [-1,1]) {
      const leg=x+side*9;
      poly(ctx,iron,[[leg-2,crest],[leg+2,crest],[leg+3,deck-2],[leg+5,bottom],[leg-5,bottom],[leg-3,deck-2]]);
      px(ctx,lit,leg-2,crest+4,1,deck-crest-4);
      px(ctx,shadow,leg+1,crest+4,1,deck-crest-4);
      px(ctx,'#8e7a8d',leg-3,crest+1,7,2); px(ctx,'#c79491',leg,crest-2,2,2);
      px(ctx,shadow,leg-6,bottom-2,12,3);
    }
    for(let y=crest+6;y<deck-9;y+=23) {
      px(ctx,iron,x-8,y,16,3);
      line(ctx,iron,x-7,y+3,x+7,y+17,2);line(ctx,iron,x+7,y+3,x-7,y+17,2);
      line(ctx,'#817188',x-7,y+3,x+7,y+17);
    }
    px(ctx,'#544e68',x-14,bottom,29,5); px(ctx,'#80778a',x-14,bottom,29,1);
  }

  function bridge(ctx) {
    const horizon=190,deck=158,a=123,b=484;
    tide(ctx,horizon,['#50577d','#383d60','#6a6687'],[[a,'#b399ac',66,28],[198,'#c28e8e',53,13],[307,'#e0b192',60,11],[389,'#cb8e99',61,12],[b,'#d2a098',72,26],[538,'#d5a487',42,12]],343);
    // A second set of cables, offset in depth, gives the bridge a readable three-quarter view.
    suspensionSpan(ctx,-26,135,a-8,71,deck-5,18,false);
    suspensionSpan(ctx,a-8,71,b-8,83,deck-5,53,false);
    suspensionSpan(ctx,b-8,83,668,140,deck-5,21,false);
    px(ctx,'#525874',0,deck-6,640,4);
    for(let x=0;x<640;x+=13) {
      line(ctx,'#63617e',x,deck+7,x+7,deck+14,1);
      line(ctx,'#63617e',x+7,deck+14,x+13,deck+7,1);
    }
    px(ctx,'#51506c',0,deck+14,640,2);
    suspensionSpan(ctx,-20,137,a,64,deck,19,true);
    suspensionSpan(ctx,a,64,b,76,deck,57,true);
    suspensionSpan(ctx,b,76,660,146,deck,18,true);
    px(ctx,'#494964',0,deck,640,7);
    px(ctx,'#8b798c',0,deck+1,640,2);
    px(ctx,'#53536e',0,deck+6,640,2);
    riverTower(ctx,a,62,deck);
    riverTower(ctx,b,74,deck);
    for(const [x,col] of [[34,'#d6b199'],[75,'#c88288'],[192,'#e0b797'],[261,'#a682ab'],[306,'#d08b92'],[392,'#d8b09e'],[557,'#b4829b'],[604,'#d6ae94']]) {
      px(ctx,'#5c586f',x,deck-3,9,3);px(ctx,col,x+1,deck-3,4,1);px(ctx,'#e1b89f',x+8,deck-1);
    }
    for(let x=20;x<640;x+=47) {px(ctx,'#62617c',x,deck-9,1,8);px(ctx,'#d3aa92',x-2,deck-9,3);}
    // Navigation lights reflected below the footings.
    for(const [x,y] of [[a-9,212],[b+9,212],[209,230]]) {
      px(ctx,'#b68c9a',x-2,y,5);px(ctx,'#7c738d',x-4,y+2,10);
    }
  }

  function eveningTree(ctx,x,ground,scale,mirror) {
    const at = n=>Math.round(x+n*scale*mirror), ht=n=>Math.round(ground-n*scale);
    const bark='#464358',barkLight='#6b5d70',green='#42445f',leaf='#51516c',plum='#68566f';
    const branch=(ax,ay,bx,by,w)=>line(ctx,bark,at(ax),ht(ay),at(bx),ht(by),Math.max(1,Math.round(w*scale)));
    branch(0,0,-3,42,6);branch(-3,38,4,83,5);branch(-2,50,-25,81,4);
    branch(3,70,27,98,3);branch(2,76,-5,107,3);branch(-16,70,-32,90,2);
    line(ctx,barkLight,at(-2),ht(0),at(-5),ht(39),1);
    const rnd=rng(781+Math.round(x));
    for(const [cx,cy,rx,ry] of [[-30,92,17,9],[-21,103,19,12],[-3,116,26,15],[16,109,19,11],[28,101,19,11],[4,97,20,11],[-13,90,11,8]]) {
      oval(ctx,green,at(cx),ht(cy),Math.round(rx*scale),Math.round(ry*scale));
      oval(ctx,leaf,at(cx-3),ht(cy+4),Math.round((rx-3)*scale),Math.round((ry-3)*scale));
      for(let i=0;i<8;i++) {
        const dx=(rnd()-.5)*rx*1.55,dy=(rnd()-.5)*ry;
        px(ctx,rnd()>.7?'#96768a':plum,at(cx+dx),ht(cy+3+dy),Math.max(1,Math.round(3*scale)),1);
      }
    }
  }

  function promenade(ctx) {
    const coast='#615777',masonry='#635e7b',roof='#56536f',shadow='#464968';
    // A domed public hall and stepped civic clocktower anchor the far bank.
    const horizon=169;
    px(ctx,coast,0,162,640,8);
    for(const [x,w,h] of [[14,42,16],[91,59,19],[160,28,12],[193,38,18],[241,39,23],[296,49,17],[403,21,23],[442,52,18],[505,32,14],[548,52,21],[613,32,22]]) {
      const y=horizon-h;
      px(ctx,masonry,x,y,w,h);
      px(ctx,roof,x-1,y-2,w+2,3);
      for(let i=4;i<w-2;i+=7) if((i+x)%3) {px(ctx,'#9f8390',x+i,y+4,2,5);px(ctx,'#af8c90',x+i,y+4,2,2);}
    }
    const clock=365;
    px(ctx,masonry,clock-11,104,23,64);px(ctx,'#514f70',clock+5,103,7,65);
    px(ctx,roof,clock-13,114,27,3);px(ctx,'#8c788b',clock-12,114,25);
    px(ctx,roof,clock-13,102,27,3);
    poly(ctx,roof,[[clock-11,103],[clock-8,97],[clock-6,94],[clock-4,88],[clock+4,88],[clock+6,94],[clock+8,97],[clock+11,102]]);
    px(ctx,roof,clock-2,78,5,13);line(ctx,roof,clock+1,72,clock+1,81);
    px(ctx,'#a88794',clock+1,71);oval(ctx,'#827487',clock,109,5,5);
    oval(ctx,'#c8a69d',clock,109,4,4);line(ctx,roof,clock,109,clock+2,107);line(ctx,roof,clock,109,clock-2,109);
    for(const x of [clock-6,clock,clock+6]) {px(ctx,'#8f7a8a',x,125,2,12);px(ctx,'#b69695',x,125,2,4);}
    const hall=258;
    oval(ctx,roof,hall,140,20,14);px(ctx,roof,hall-22,140,45,3);
    px(ctx,roof,hall-1,119,3,8);px(ctx,'#9f8792',hall,117,1,3);
    px(ctx,'#a88890',hall-16,144,33,9);
    for(let i=-16;i<17;i+=7) {px(ctx,masonry,hall+i,143,3,12);}
    px(ctx,shadow,0,horizon-3,640,3);
    for(let x=9;x<640;x+=27) px(ctx,(x%4===0)?'#cc9c93':'#ab8f95',x,horizon-4,2);
    tide(ctx,horizon,['#656382','#444961','#77748f'],[[15,'#bc929e',29,12],[104,'#d8ac99',40,15],[221,'#b998a4',29,17],[258,'#ebba9e',55,23],[365,'#e4b4a3',54,23],[446,'#c6a1ac',43,18],[559,'#d6ada2',36,14],[620,'#bf8f9d',31,10]],719);
    // Ironwork and the little bench are part of the quiet footpath along the water.
    px(ctx,'#776b80',0,236,640,3);px(ctx,'#48495f',0,239,640,33);
    for(let y=247;y<272;y+=9) {
      px(ctx,'#515167',0,y,640);
      for(let x=(y%3)*12;x<640;x+=37) line(ctx,'#515167',x,y,x-3,y+8);
    }
    px(ctx,'#4f4b65',0,216,640,2);px(ctx,'#756a81',0,216,640);
    px(ctx,'#5d576f',0,229,640);
    for(let x=3;x<640;x+=19) {
      px(ctx,'#535169',x,217,2,19);
      if(x%2===1) {px(ctx,'#55536d',x-1,213,4,3);px(ctx,'#837589',x,213,2);}
      line(ctx,'#635d76',x+2,224,x+9,230);line(ctx,'#635d76',x+9,230,x+18,224);
    }
    eveningTree(ctx,12,241,1.13,1); eveningTree(ctx,626,240,1.04,-1);
    for(const [x,h] of [[53,63],[189,48],[455,48],[578,65]]) {
      lamp(ctx,x,238,h,0);
    }
    const bench=337, y=231;
    px(ctx,'#484358',bench-23,y+5,3,6);px(ctx,'#484358',bench+21,y+5,3,6);
    for(let i=0;i<2;i++) {px(ctx,'#70576c',bench-25,y-9+i*4,53,3);px(ctx,'#a4828c',bench-24,y-9+i*4,50);}
    for(const x of [bench-20,bench+20]) px(ctx,'#514a5f',x,y-10,2,13);
    px(ctx,'#997989',bench-27,y+1,56,2);px(ctx,'#63566c',bench-27,y+3,56,3);
    for(const x of [bench-26,bench+26]) {px(ctx,'#48475c',x,y-2,2,7);px(ctx,'#847281',x-1,y-3,4);}
    for(const [x,y] of [[68,241],[71,244],[149,244],[312,242],[517,249],[588,240],[601,248]]) px(ctx,'#9f798b',x,y,2);
  }
  function planter(ctx,x,y,w,seed){
    const r=rng(seed), base='#53526b',cut='#45465f';
    px(ctx,cut,x,y,w,9);px(ctx,'#78677c',x,y,w,2);
    px(ctx,'#665d75',x+2,y+2,w-4,6);px(ctx,base,x+3,y+7,w-6,1);
    for(let i=0;i<w*1.1;i++){
      const xx=x+2+r()*(w-4),h=3+r()*7;
      line(ctx,r()>.5?'#707981':'#546774',xx,y-1,xx+(r()-.5)*6,y-h);
      if(i%7===0)px(ctx,r()>.5?'#b58b9b':'#c89f9c',xx,y-h,2,1);
    }
  }
  function strung(ctx,x1,y1,x2,y2,sag,bulbs=12,lanterns=false){
    const getY=t=>y1*(1-t)+y2*t+4*sag*t*(1-t);
    let y=y1;
    for(let x=x1+1;x<=x2;x++){
      const yy=getY((x-x1)/(x2-x1));line(ctx,'#49465f',x-1,y,x,yy);y=yy;
    }
    for(let i=0;i<bulbs;i++){
      const t=(i+.6)/bulbs,x=Math.round(x1+(x2-x1)*t),yt=Math.round(getY(t));
      if(lanterns){const drop=(i%3)*2+4,lampY=yt+drop+5;
        px(ctx,'#494660',x,yt+1,1,drop);glow(ctx,x,lampY,13,'#f1b988',.19);
        oval(ctx,['#c18a9a','#d99d96','#c79c91'][i%3],x,lampY,5,6);
        px(ctx,'#a97b88',x-4,lampY-1,9,1);px(ctx,'#b9878b',x-4,lampY+2,9,1);
        px(ctx,'#edc099',x-2,lampY-3,3,5);px(ctx,'#856b82',x-2,lampY-6,5,1);px(ctx,'#8d7180',x-2,lampY+6,5,1);
        px(ctx,'#ba8b8c',x,lampY+7,1,3);
      }else{px(ctx,'#76687a',x,yt+1,1,2);px(ctx,'#dfb39c',x,yt+3,2,2);}
    }
  }
  function rooftop(ctx){
    // A water tank overlooks an inhabited terrace of shallow brick parapets and rooftop plants.
    const r=rng(733);
    const blocks=[[-25,163,127,79],[111,184,95,78],[199,173,90,76],[282,188,77,69],[351,163,96,91],[455,170,87,81],[537,154,118,85]];
    for(const [x,y,w,h] of blocks){
      const front='#655d77',side='#50526e';
      px(ctx,front,x,y,w,h+34);poly(ctx,side,[[x+w*.7,y],[x+w,y-6],[x+w,y+h+34],[x+w*.7,y+h+34]]);
      px(ctx,'#8a7585',x-2,y,w*.71+2,2);line(ctx,'#71687e',x+w*.7,y,x+w,y-6,2);
      const roofY=y-6;
      px(ctx,'#555570',x+7,roofY-5,14,9);px(ctx,'#817185',x+7,roofY-5,14,1);
      for(let xx=x+11;xx+5<x+w*.65;xx+=14){
        for(let yy=y+14;yy<y+h;yy+=18){
          const col=r()>.62?'#bf9a95':'#787186';
          px(ctx,'#51516e',xx-1,yy-2,8,11);px(ctx,col,xx,yy,6,7);px(ctx,'#58536e',xx+2,yy,1,7);
        }
      }
    }
    // Water tank body, ribbed metal hoops, cone, bent ladder and steel trestle.
    const tx=77,ty=102;
    for(const off of [-14,12]){
      line(ctx,'#51516b',tx+off,ty+29,tx+off*1.25,164,3);
      line(ctx,'#5f5872',tx+off,ty+35,tx-off,157,1);
    }
    px(ctx,'#766780',tx-21,ty,42,27);oval(ctx,'#74667e',tx,ty+26,21,4);
    poly(ctx,'#635d79',[[tx+6,ty],[tx+20,ty],[tx+21,ty+26],[tx+10,ty+29],[tx+6,ty+26]]);
    for(let x=tx-17;x<tx+20;x+=5)px(ctx,'#87768a',x,ty+3,1,21);
    [ty+4,ty+14,ty+24].forEach(y=>{px(ctx,'#585770',tx-21,y,42,2);px(ctx,'#978094',tx-20,y,27,1);});
    poly(ctx,'#625a75',[[tx-25,ty+1],[tx-13,ty-5],[tx,ty-12],[tx+24,ty],[tx+14,ty+3],[tx-13,ty+3]]);
    poly(ctx,'#9b8391',[[tx-23,ty],[tx,ty-12],[tx+3,ty-11],[tx-10,ty-1]]);px(ctx,'#afa0a4',tx-1,ty-15,2,3);
    px(ctx,'#45495f',tx+16,ty+10,1,48);px(ctx,'#51516b',tx+21,ty+9,1,48);
    for(let y=ty+12;y<ty+56;y+=5)px(ctx,'#898095',tx+16,y,6,1);
    // Warm paper globes hanging from a pair of aerial posts, a few pots and folding furniture.
    px(ctx,'#4c4b65',27,50,3,113);px(ctx,'#877485',27,49,1,32);
    px(ctx,'#514e68',590,43,3,112);px(ctx,'#8a7284',590,43,1,30);
    px(ctx,'#534f68',407,53,2,110);
    strung(ctx,-11,57,28,58,8,3,true);
    strung(ctx,29,58,407,55,28,14,true);
    strung(ctx,408,55,592,49,22,8,true);
    strung(ctx,592,49,650,70,5,3,true);
    for(const [x,y,w,seed] of [[9,156,36,18],[120,177,48,19],[212,166,30,22],[368,157,51,29],[542,148,24,33],[600,149,31,37]])planter(ctx,x,y,w,seed);
    px(ctx,'#6e647d',270,147,2,26);poly(ctx,'#b18491',[[252,149],[270,136],[290,149]]);poly(ctx,'#946f86',[[270,136],[290,149],[273,148]]);
    px(ctx,'#b99396',258,158,25,2);px(ctx,'#665a72',269,160,2,12);
    for(const cx of [251,288]){px(ctx,'#9a8390',cx,158,1,9);px(ctx,'#917786',cx-3,164,7,2);line(ctx,'#65586d',cx-2,166,cx-3,173);line(ctx,'#65586d',cx+2,166,cx+4,173);}
    px(ctx,'#514e69',0,241,640,31);px(ctx,'#76677e',0,241,640,2);
  }

  function trainCar(ctx,x,y,w,color){
    const body='#63738b',dark='#48556d';
    poly(ctx,dark,[[x+4,y],[x+w-5,y],[x+w-1,y+5],[x+w-1,y+22],[x+2,y+22],[x,y+18],[x,y+5]]);
    px(ctx,body,x+2,y+3,w-4,16);px(ctx,'#9395a5',x+5,y+1,w-10,2);
    px(ctx,color,x+2,y+14,w-4,3);px(ctx,'#a8a2ae',x+2,y+18,w-4,1);
    px(ctx,'#48536a',x+9,y+3,10,16);px(ctx,'#b5a3a2',x+10,y+5,3,6);px(ctx,'#bca6a3',x+15,y+5,3,6);
    for(let i=22;i<w-7;i+=10){px(ctx,'#4b5570',x+i,y+4,8,8);px(ctx,(i%3===0?'#c3aca5':'#ac9ea1'),x+i+1,y+5,6,5);px(ctx,'#7d7d90',x+i+4,y+5,1,5);}
    px(ctx,'#494861',x+10,y+21,9,4);px(ctx,'#494861',x+w-20,y+21,9,4);
  }
  function station(ctx){
    const w=640,deck=211, truss='#555771', light='#9790a2';
    // Distant overhead catenary and a stopped silver commuter train.
    for(const mast of [22,171,317,474,625]){
      px(ctx,'#5f607d',mast,103,2,107);line(ctx,'#73718c',mast-17,110,mast+32,106,1);
      line(ctx,'#625e7c',mast,120,mast+15,108,1);
    }
    for(let x=0;x<640;x+=2){px(ctx,'#706782',x,110+4*Math.sin(x/60),2);px(ctx,'#726a84',x,120+3*Math.sin(x/60),2);}
    for(const [i,x] of [-18,80,178,276,374,472].entries())trainCar(ctx,x,163,96,i%2?'#988996':'#a38b91');
    px(ctx,'#64657d',0,189,w,3);px(ctx,'#474e67',0,193,w,7);
    for(let x=-15;x<640;x+=19)px(ctx,'#83788c',x,191,8,2);
    // Near station canopy: deliberately open in the center to reveal city and train.
    poly(ctx,'#4c4d67',[[-8,124],[71,102],[167,103],[217,122],[210,128],[47,122],[-8,133]]);
    poly(ctx,'#81788e',[[-9,123],[72,100],[167,101],[219,121],[212,122],[163,105],[74,104],[-9,127]]);
    px(ctx,'#9592a3',16,124,75,2);px(ctx,'#d1b6a8',98,121,63,2);
    for(const x of [37,155]){px(ctx,truss,x,122,6,86);px(ctx,'#7b778a',x,124,2,77);line(ctx,truss,x+3,140,x+20,123,2);line(ctx,truss,x+1,141,x-16,125,2);}
    poly(ctx,'#454b65',[[433,117],[463,105],[615,93],[651,89],[651,109],[463,120],[437,123]]);
    line(ctx,light,438,116,466,106,2);line(ctx,'#9291a1',466,106,647,90,2);
    line(ctx,'#d1b6a6',483,118,558,113,2);
    for(const x of [469,591]){px(ctx,'#545570',x,115,6,89);px(ctx,'#78768b',x,122,1,77);line(ctx,'#6d6981',x+3,136,x+17,117,2);}
    // Platform clock and the repeated light bars of an amber departure board.
    px(ctx,'#655f78',177,124,2,10);oval(ctx,'#595770',178,142,10,10);oval(ctx,'#a8a0ac',178,142,8,8);
    oval(ctx,'#d4c2b5',178,142,7,7);line(ctx,'#6a657a',178,142,178,137);line(ctx,'#6a657a',178,142,182,143);px(ctx,'#eee1c3',176,136);
    px(ctx,'#61617a',471,117,1,10);px(ctx,'#61617a',506,114,1,13);px(ctx,'#454c63',465,126,50,15);px(ctx,'#887e90',466,126,48,1);
    for(let r=0;r<3;r++){px(ctx,'#c6a297',469,129+r*3,4,1);px(ctx,'#ab9095',477,129+r*3,9+r*2,1);px(ctx,'#bfa197',497,129+r*3,9-r*2,1);}
    px(ctx,'#74728a',0,202,w,6);px(ctx,'#ba9e92',0,202,w,1);px(ctx,'#535871',0,208,w,9);
    for(let x=0;x<w;x+=12)px(ctx,'#9b8993',x,204,5,1);
    for(let x=-30;x<640;x+=89){
      px(ctx,'#53536b',x,215,11,57);px(ctx,'#7e7185',x+1,218,2,54);
      line(ctx,'#5d5a73',x+10,242,x+38,216,3);line(ctx,'#605c74',x,241,x-27,217,3);
    }
    for(const x of [81,267,390,552]){px(ctx,'#8b7889',x,192,25,2);px(ctx,'#635c75',x+3,194,2,8);px(ctx,'#635c75',x+20,194,2,8);px(ctx,'#9c8692',x,187,24,3);}
    lamp(ctx,350,202,54,1);
    px(ctx,'#48506a',0,256,640,16);px(ctx,'#626780',0,255,640,2);
  }

  function observatory(ctx){
    const slope='#56596f';
    // Constellation and smaller guide stars lead towards the open silver dome.
    const stars=[[62,52],[78,46],[97,55],[112,44],[126,39],[143,45]];
    for(let i=1;i<stars.length;i++)line(ctx,'#686582',...stars[i-1],...stars[i]);
    stars.forEach(([x,y],i)=>{px(ctx,'#c6b7c1',x-1,y,3);px(ctx,'#ad9fac',x,y-1,1,3);if(i===4)px(ctx,'#efe1cb',x,y);});
    const hills=[[0,176],[35,165],[66,168],[95,158],[119,165],[156,154],[203,157],[227,148],[276,150],[312,146],[352,155],[389,150],[433,156],[465,143],[498,143],[520,131],[549,137],[576,128],[600,133],[640,128],[640,272],[0,272]];
    poly(ctx,slope,hills);
    poly(ctx,'#4c5168',[[0,194],[41,179],[102,174],[139,184],[174,176],[202,178],[243,168],[277,159],[323,164],[349,168],[380,165],[407,153],[442,147],[481,137],[522,145],[563,138],[609,131],[640,130],[640,272],[0,272]]);
    const trees=rng(167);for(let i=0;i<100;i++){
      const x=Math.round(trees()*640),y=182-Math.round(x*.062)+Math.round(trees()*12),h=4+Math.round(trees()*7);
      poly(ctx,'#4d536a',[[x-3,y],[x,y-h],[x+3,y]]);}
    const cx=475,base=140,r=36;
    for(let dy=-r;dy<=0;dy++){
      const span=Math.floor(Math.sqrt(r*r-dy*dy));
      px(ctx,'#9c96a8',cx-span,base+dy,2*span+1,1);
      px(ctx,'#85869d',cx-span*.43,base+dy,Math.round(span*1.43)+1,1);
      px(ctx,'#686f8b',cx+span*.47,base+dy,Math.max(1,Math.round(span*.53)),1);
      if(dy<-4){px(ctx,'#b9acb6',cx-span*.65,base+dy,1,1);px(ctx,'#6a6d88',cx+span*.18,base+dy,1,1);}
    }
    // A dark slit between the curved dome panels and the telescope peeking out.
    poly(ctx,'#4b506d',[[464,107],[467,105],[473,105],[481,116],[487,135],[487,140],[478,140],[477,129],[473,116]]);
    line(ctx,'#a6a4ae',476,121,487,97,4);line(ctx,'#747b98',480,121,490,99,2);line(ctx,'#c9b9ba',485,97,490,99,2);
    px(ctx,'#5b607c',cx-r-3,base-1,r*2+6,4);px(ctx,'#aca2af',cx-r-3,base-2,r*2+6,2);
    px(ctx,'#858295',cx-r+2,base+3,r*2-4,27);px(ctx,'#686e85',cx+19,base+3,14,27);
    for(let x=cx-r+6;x<cx+r-6;x+=12){px(ctx,'#626981',x,base+7,8,15);px(ctx,'#b8a4a5',x+2,base+9,4,11);px(ctx,'#77798c',x+4,base+10,1,11);}
    px(ctx,'#6e7189',cx-r-6,base+25,r*2+12,5);px(ctx,'#aaa0a8',cx-r-5,base+25,r*2+10,1);
    px(ctx,'#60667d',cx-r-8,base+30,r*2+16,20);
    for(let i=0;i<4;i++){px(ctx,i%2?'#888297':'#75758c',cx-r-12-i*4,base+49+i*3,r*2+24+i*8,3);}
    // A second, smaller observatory and a low path with a railing.
    const rx=122,ry=160;for(let y=0;y<17;y++){const s=Math.sqrt(1-((16-y)/17)**2)*21;px(ctx,'#757991',rx-s,ry-17+y,s*2,1);px(ctx,'#666d88',rx+s*.36,ry-17+y,s*.64,1);}
    px(ctx,'#9490a2',rx-23,ry-1,46,2);px(ctx,'#686e86',rx-20,ry+1,40,18);
    for(let x=rx-15;x<rx+18;x+=10){px(ctx,'#9b949e',x,ry+6,5,8);px(ctx,'#747789',x+2,ry+6,1,8);}
    line(ctx,'#77758b',23,206,405,185,2);line(ctx,'#8a8091',23,201,405,180,1);
    for(let x=25;x<405;x+=20){const y=Math.round(201-(x-23)*21/382);px(ctx,'#6c6a81',x,y,2,8);}
    for(const [x,y] of [[72,211],[235,201],[389,192],[557,180]]){px(ctx,'#66667b',x,y-8,2,8);px(ctx,'#ba9d9a',x-1,y-10,4,2);}
    // A switchback on the hillside follows the observatory's descending stairs.
    poly(ctx,'#606179',[[503,199],[517,200],[503,205],[428,211],[396,216],[414,220],[455,224],[472,228],[469,232],[444,236],[368,242],[324,249],[301,247],[350,237],[422,231],[450,228],[439,226],[405,223],[379,218],[376,215],[394,211],[426,207],[492,203]]);
    const brush=rng(384);
    for(let i=0;i<95;i++){
      const x=Math.round(brush()*640), y=205+Math.round(brush()*35)-Math.round(x*.024);
      if(x>362&&x<525&&y>198&&y<224)continue;
      px(ctx,'#585b71',x,y,2+Math.round(brush()*6),1);
      if(i%3===0){px(ctx,'#606377',x+1,y-1,2,1);px(ctx,'#585b71',x-1,y-2,1,2);}
    }
    for(const [x,y] of [[112,225],[190,219],[329,210],[425,200],[577,199],[604,198]]){
      oval(ctx,'#474e65',x,y,10,3);oval(ctx,'#535b71',x-3,y-2,5,3);px(ctx,'#64687a',x-5,y-5,4,1);
    }
    px(ctx,'#484d63',0,242,640,30);px(ctx,'#636379',0,242,640,1);
  }
  // Front edges are deliberately brighter than any adjoining masonry in the background.
  const materials=[
    ['#393448','#6a5264','#8c6b78','#b49a9e','#d5b4ac'],
    ['#3d3349','#6a4e61','#8a636d','#b69192','#e3bca4'],
    ['#383649','#605362','#79626b','#77917e','#bcc4a0'],
    ['#3c344a','#694e62','#8d666e','#ab7f82','#dba998'],
    ['#353347','#625363','#926d75','#b38c90','#d9b3a2'],
    ['#323346','#4e5067','#687389','#9099a5','#c3c0bc'],
    ['#393347','#67505f','#906975','#ae878b','#d6aca1'],
    ['#333448','#56566c','#72768a','#a99aa0','#d6b596'],
    ['#38374d','#59596c','#797c91','#a49eaf','#d3c5c7'],
    ['#373349','#5f5265','#806777','#b09298','#debbab']
  ];
  function paper(ctx,w,h,level) {
    const d=Math.min(h,13), torn=level===7;
    const shades=torn?['#6c5368','#a8838a','#c5a29b','#ebc5a8']:['#704b64','#af7586','#d3959f','#f3bdaf'];
    poly(ctx,shades[0],[[0,0],[w,0],[w-1,d-3],[w-5,d-4],[w-8,d],[5,d],[3,d-3],[0,d-3]]);
    poly(ctx,shades[1],[[0,1],[w,1],[w-3,6],[w-8,d-3],[w-18,d-4],[w-21,d-1],[6,d-1],[8,6],[3,5]]);
    px(ctx,shades[2],1,0,w-2,4);px(ctx,shades[3],1,0,w-2,1);
    for(let i=4;i<w-5;i+=9){px(ctx,shades[3],i,3,4);px(ctx,shades[0],i+5,6,2);}
  }
  function dock(ctx,w,h,seed,boat){
    const r=rng(seed*91+5),pal=materials[4];
    if(boat){
      poly(ctx,'#40394c',[[0,0],[w,0],[w-4,8],[w-12,15],[8,15],[3,9]]);
      poly(ctx,'#716071',[[1,1],[w-1,1],[w-5,8],[w-12,12],[7,12],[4,8]]);
      poly(ctx,'#ab817f',[[2,3],[w-2,3],[w-5,7],[5,7]]);
      px(ctx,'#d3aa96',1,0,w-2,2);
      for(let x=12;x<w-8;x+=12){px(ctx,'#4c475b',x-1,7,5,3);px(ctx,'#c09a91',x,7,3,2);}
      return;
    }
    px(ctx,pal[0],0,0,w,9);px(ctx,pal[3],0,0,w,4);px(ctx,pal[4],0,0,w,1);
    for(let x=5;x<w;x+=8){px(ctx,pal[2],x,1,1,3);px(ctx,pal[0],x+2,2);}
    px(ctx,pal[1],1,5,w-2,3);
    const d=Math.min(h,155);
    for(let x=4;x<w-2;x+=21){
      const ph=d-(w>90?0:Math.round(r()*6));
      px(ctx,pal[0],x,7,5,Math.max(1,ph-7));px(ctx,pal[1],x+1,8,3,Math.max(1,ph-9));
      px(ctx,pal[2],x+1,8,1,Math.max(1,ph-14));px(ctx,'#92808c',x-1,10,7,2);
      if(x+23<w)line(ctx,pal[1],x+4,Math.min(d-3,23),x+20,8,2);
    }
  }
  function truss(ctx,w,h,level){
    const p=materials[level],d=Math.min(h,24),rail=level===7;
    px(ctx,p[0],0,0,w,7);px(ctx,p[3],0,0,w,3);px(ctx,p[4],0,0,w,1);
    px(ctx,mix(p[4],'#ffe0bf',.29),0,0,w,1);
    for(let x=3;x<w-2;x+=10){px(ctx,rail?'#625567':p[2],x,1,rail?4:1,rail?2:1);}
    for(let x=3;x<w-2;x+=15){const width=Math.min(15,w-2-x);
      line(ctx,p[1],x,6,x+Math.floor(width/2),d-3,2);line(ctx,p[2],x+Math.floor(width/2),d-3,x+width,6,1);
      px(ctx,p[3],x,5,2,2);
    }
    px(ctx,p[0],2,d-3,w-4,4);px(ctx,p[2],2,d-3,w-4,1);
    if(h>35)for(let x=10;x<w-4;x+=35){px(ctx,p[0],x,d,6,h-d);px(ctx,p[1],x+1,d,2,h-d);line(ctx,p[1],x+4,d+15,x+15,d,2);}
  }
  function stone(ctx,w,h,seed,level,leftEnd,rightEnd){
    const pal=materials[level],r=rng(seed*1391+83), garden=level===2, deep=h>40;
    const d=deep?h:Math.min(h,25);
    function limits(y){
      const start=Math.round((garden?d*.36:d*.47));
      const bevel=deep?0:Math.max(0,Math.floor((y-start)/(garden?2.8:4)));
      return [leftEnd?0:bevel,rightEnd?w:w-bevel];
    }
    // Courses are laid in running bond; the lower edge steps in on the floating ledges.
    for(let y=0;y<d;y++){
      const [a,b]=limits(y);px(ctx,y>d-4?pal[0]:pal[1],a,y,b-a,1);
    }
    let row=0;
    for(let y=6;y<d-3;y+=7,row++){
      const [a,b]=limits(Math.min(d-1,y+7));
      for(let xx=-12+(row%2)*8;xx<b;xx+=16){
        const x=Math.max(a+1,xx+1),end=Math.min(b-1,xx+15),bw=end-x;
        if(bw<2)continue;
        const color=mix(pal[1],pal[2],.18+r()*.4);
        px(ctx,color,x,y,bw,Math.min(5,d-3-y));
        if(r()>.35)px(ctx,mix(color,pal[2],.55),x,y,Math.max(1,Math.round(bw*.65)),1);
        if(r()>.74&&bw>5)px(ctx,pal[1],x+3,y+2,3);
      }
    }
    px(ctx,pal[0],0,3,w,3);px(ctx,pal[3],0,0,w,3);px(ctx,pal[4],0,0,w,1);
    if(garden){
      for(let x=1;x<w-3;x+=3){const down=2+Math.round(r()*3);px(ctx,'#607766',x,2,3,down);px(ctx,'#8a9b81',x,1,2,down-1);}
      for(let x=4;x<w-4;x+=7+Math.round(r()*10)){
        px(ctx,'#8fa68b',x,-3,1,3);px(ctx,'#bdc6a1',x-1,-4,1,2);px(ctx,'#899e83',x+2,-2,2,2);
        if(r()>.55){px(ctx,'#a698aa',x+3,-5,1,5);px(ctx,'#d4b3b7',x+2,-6,3,2);}
        if(r()>.74){const len=Math.min(d-1,6+Math.round(r()*10));px(ctx,'#687c6d',x,3,1,len);for(let k=6;k<len+1;k+=4)px(ctx,'#82937a',x-(k%8?1:0),k,3,2);}
      }
    }else{
      const slab=level===8?21:level===3?12:17;
      for(let x=4+(seed%8);x<w-1;x+=slab){px(ctx,pal[2],x,1,1,2);px(ctx,mix(pal[4],pal[3],.5),x+1,1,2,1);}
      if(level===9||level===8)for(let x=6;x<w-3;x+=16){px(ctx,'#ae9295',x,5,3,1);}
    }
  }
  const painters=[residential,bookshop,park,alley,harbor,bridge,rooftop,station,observatory,promenade];
  function background(ctx,levelIndex=0,time=0,side=0){
    const level=Math.max(0,Math.min(9,Math.trunc(levelIndex)||0)),flip=side?1:0;
    const key=level*2+flip;
    if(!backgrounds.has(key)){
      if(backgrounds.size>=4)backgrounds.delete(backgrounds.keys().next().value);
      const c=layer(WIDTH,HEIGHT),g=c.getContext('2d');
      sky(g,level,flip);painters[level](g);
      backgrounds.set(key,c);
    }
    ctx.drawImage(backgrounds.get(key),0,0);
    if(reducedMotion)return;
    const t=Number.isFinite(time)?time:0;
    // Garden fireflies and rippling lights stay behind the characters. No collision overlays.
    if(level===2){
      for(let i=0;i<6;i++)if(Math.sin(t*1.36+i)>0){const x=i*95+49+Math.sin(t*.42+i)*4,y=209-i%3*8+Math.sin(t*.82+i)*2;px(ctx,'#c7b892',x,y,2,1);}
    }else if([4,5,9].includes(level)){
      const count=level===9?5:8;
      for(let i=0;i<count;i++)if(Math.sin(t*.86+i*2)>.32){const x=32+i*77+Math.sin(t*.91+i)*2,y=194+(i*13)%41;px(ctx,'#9b8d9d',x,y,2+(i%3),1);}
    }else if(level===8){
      const phase=(t+2)%17;if(phase<.65){const x=213+phase*65,y=33+phase*21;line(ctx,'#9f99ac',x-6,y-2,x,y);px(ctx,'#c9bcc5',x,y);}
    }
  }
  function platform(ctx,x,y,w,height,seed=0,type='ground',levelIndex=0){
    const level=Math.max(0,Math.min(9,Math.trunc(levelIndex)||0));
    const width=Math.max(2,Math.round(w)),h=Math.max(3,Math.min(HEIGHT+10,Math.round(height)));
    const left=x<=0,right=x+w>=WIDTH,s=Number.isFinite(seed)?Math.round(seed):0;
    const key=[width,h,s,type,level,left,right].join('/');
    if(!tiles.has(key)){
      if(tiles.size>=120)tiles.delete(tiles.keys().next().value);
      const c=layer(width+4,h+15),g=c.getContext('2d');g.translate(2,9);
      if(level===4)dock(g,width,h,s,type==='ribbon');
      else if(type==='ribbon'||type==='heart')paper(g,width,h,level);
      else if(level===5||level===7)truss(g,width,h,level);
      else stone(g,width,h,s,level,left,right);
      tiles.set(key,c);
    }
    ctx.drawImage(tiles.get(key),Math.round(x)-2,Math.round(y)-9);
  }
  window.Scenery=Object.freeze({background,platform,locations});
})();
