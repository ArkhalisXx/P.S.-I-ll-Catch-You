/* Hand-pixelled city sets, painted once per page of the card. */
(() => {
  'use strict';
  const WIDTH=640, HEIGHT=272;
  const backgrounds=new Map(), tiles=new Map();
  const locations=Object.freeze(['Bluebell Row','Afterhours Books','Moonflower Park','Lantern Lane','Starlight Harbor','The Silver Span','Rooftop Wishes','Nightingale Station','Starling Observatory','Moonlit Promenade',
    'Midnight Market','Vinyl Arcade','Moonbeam Glasshouse','Firefly Pier','Rainlight Alley','Kite Hill','Copperline Depot','Bell Tower Square','Airmail Terminal','Firstlight Overlook']);
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
    ['#323559','#9c859f','#da9aaf','#665c80','#70657e','#585b74'],
    ['#343252','#987487','#bb8993','#685675','#695c77','#564f68'],
    ['#34325c','#89769a','#bc99b2','#64577d','#696280','#514f6e'],
    ['#2b405b','#8998a8','#abc4c4','#576c82','#647788','#506777'],
    ['#2c355a','#8483a7','#c09bab','#595e87','#666c87','#535b78'],
    ['#2f334b','#776d8b','#ad899d','#545974','#605c75','#4a4c64'],
    ['#3c4666','#9b90ab','#bca8b5','#6e7291','#74778a','#5e647e'],
    ['#393650','#988298','#bb9eaa','#675a76','#70667f','#55546c'],
    ['#454261','#b894a6','#cca7b4','#766980','#857389','#6e627a']
  ];
  function sky(ctx, level, side){
    const p=skies[level],random=rng(586+level*957);
    const horizon=[158,144,158,146,140,142,160,151,171,136,145,160,169,167,151,165,149,161][level];
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
    const moonX=[455,441,319,383,462,412,489,169,381,316,385,225,449,491,337,449,181,462][level],moonY=[50,50,54,39,52,39,45,49,49,43,50,45,46,47,50,47,43,49][level];
    const radius=[12,11,15,10,14,13,12,12,15,16,13,11,14,12,9,12,10,12][level];
    glow(ctx,moonX,moonY,radius*2.45,'#e3bec6',.23);
    const moonColor=level<3?'#f3d6bc':'#e9d1cf';
    for(let my=-radius;my<=radius;my++){
      const rx=Math.floor(Math.sqrt(Math.max(0,radius*radius-my*my)));
      const start=moonX-rx;
      let end=moonX+rx;
      if([1,6,7,10,14,16,17].includes(level)){const inset=4;
        if(Math.abs(my+2)<radius-2)end=Math.min(end,moonX+inset-Math.floor(Math.sqrt((radius-2)**2-(my+2)**2)));}
      if(end>=start)px(ctx,my<radius*.58?moonColor:mix(moonColor,p[1],.15),start,moonY+my,end-start+1,1);
    }
    if(![1,6,7,10,14,16,17].includes(level)){
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
    ['#373349','#5f5265','#806777','#b09298','#debbab'],
    ['#3d3040','#72505d','#976b6b','#bd9183','#e8ba98'],
    ['#343145','#564d69','#806783','#b093a7','#e3bcd0'],
    ['#2d3844','#475b61','#698078','#83a79a','#c3d7b4'],
    ['#373245','#5e5062','#8a6973','#b89593','#e0bca6'],
    ['#333346','#51526b','#6c6685','#9a93a3','#d6bac5'],
    ['#343a47','#555e5d','#78816f','#8da187','#c6c9a5'],
    ['#393344','#695360','#8f7272','#b99484','#e1b89c'],
    ['#3a3346','#615468','#876c7f','#b998a4','#ddc0b6'],
    ['#39364b','#635b70','#887b8c','#ad9ba3','#d9c3b5'],
    ['#524252','#88717b','#aa8891','#c9a5a3','#edc9ad']
  ];
  function paper(ctx,w,h,level) {
    const d=Math.min(h,13), torn=level===7;
    const shades=torn?['#6c5368','#a8838a','#c5a29b','#ebc5a8']:['#704b64','#af7586','#d3959f','#f3bdaf'];
    poly(ctx,shades[0],[[0,0],[w,0],[w-1,d-3],[w-5,d-4],[w-8,d],[5,d],[3,d-3],[0,d-3]]);
    poly(ctx,shades[1],[[0,1],[w,1],[w-3,6],[w-8,d-3],[w-18,d-4],[w-21,d-1],[6,d-1],[8,6],[3,5]]);
    px(ctx,shades[2],1,0,w-2,4);px(ctx,shades[3],1,0,w-2,1);
    for(let i=4;i<w-5;i+=9){px(ctx,shades[3],i,3,4);px(ctx,shades[0],i+5,6,2);}
  }
  function dock(ctx,w,h,seed,boat,level=4){
    const r=rng(seed*91+5),pal=materials[level];
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
    const p=materials[level],d=Math.min(h,24),rail=level===7||level===16;
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
    const pal=materials[level],r=rng(seed*1391+83), garden=level===2||level===12||level===15, deep=h>40;
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
  // Small hand-lettered shopfronts are painted directly into the scene pixels.
  function afterhoursSign(c,word,x,y,ink,size=1) {
    const letters={
      A:[2,5,7,5,5],C:[3,4,4,4,3],D:[6,5,5,5,6],E:[7,4,6,4,7],F:[7,4,6,4,4],
      H:[5,5,7,5,5],I:[7,2,2,2,7],K:[5,6,4,6,5],L:[4,4,4,4,7],M:[5,7,7,5,5],
      N:[5,7,7,7,5],O:[2,5,5,5,2],P:[6,5,6,4,4],R:[6,5,6,5,5],S:[3,4,2,1,6],
      T:[7,2,2,2,2],U:[5,5,5,5,7],V:[5,5,5,5,2],Y:[5,5,2,2,2]
    };
    for(const ch of word){const rows=letters[ch];if(rows)for(let row=0;row<5;row++)for(let col=0;col<3;col++){
      if(rows[row]&(4>>col))px(c,ink,x+col*size,y+row*size,size,size);
    }x+=4*size;}
  }

  function market(c) {
    const r=rng(9461);
    laneRoad(c,199,62,'#686575','#95808a');
    // Stone joints and a turning lane lead between the far booths.
    for(let x=-160;x<850;x+=52)line(c,'#746d7b',319+(x-319)*.08,201,x,272);
    for(const y of [207,218,237,263])px(c,'#776f7c',0,y,640,1);
    function stall(x,y,w,h,cloth,edge,fill) {
      const counter=y+h*.7,post='#635765';
      px(c,fill,x+5,y+4,w-10,h-4);px(c,mix(fill,'#b0928c',.22),x+7,y+11,w-14,6);
      for(let xx=x+5;xx<x+w-3;xx+=Math.floor(w/7))px(c,mix(fill,'#423d58',.27),xx,y+8,2,h-10);
      for(const xx of [x+3,x+w-5]){px(c,post,xx,y,3,h+3);px(c,'#aa8b80',xx,y+2,1,h);}
      poly(c,cloth,[[x-4,y+4],[x+12,y-12],[x+w-13,y-12],[x+w+3,y+4]]);
      line(c,edge,x+12,y-12,x+w-13,y-12);px(c,mix(cloth,edge,.65),x-4,y+3,w+8,2);
      for(let j=0;j<w;j+=11){
        const fold=mix(cloth,edge,j%2?.13:.34);
        poly(c,fold,[[x+j,y+5],[x+j+9,y+5],[x+j+8,y+10],[x+j+5,y+12],[x+j,y+9]]);
      }
      px(c,'#9d817c',x+1,counter,w-2,3); px(c,'#645b6b',x+2,counter+3,w-4,2);
      px(c,'#8e706f',x+4,counter+5,w-8,h*.3-2);
      for(let j=9;j<w-6;j+=10)px(c,'#a08077',x+j,counter+6,1,h*.3-3);
    }
    stall(189,151,66,58,'#7c8387','#a9b2a3','#7e7180');
    stall(249,163,53,40,'#987784','#c29f95','#746b80');
    stall(336,160,55,45,'#8b7477','#c39b86','#81707c');
    stall(391,146,72,65,'#766a83','#b19bad','#877a87');
    // A dumpling stall and a produce seller bookend the little aisle.
    stall(-12,134,187,96,'#a16d76','#d6a08b','#857581');
    stall(458,128,188,104,'#777693','#aaa1ad','#827380');
    stall(150,156,65,63,'#8f8189','#bbaa9a','#857682');
    const steam=(x,y)=>{for(let i=0;i<3;i++){const xx=x+i*5;
      line(c,'#c1a9a5',xx,y,xx-2,y-4);line(c,'#c1a9a5',xx-2,y-4,xx+1,y-7);
      line(c,'#ad9ba1',xx+1,y-8,xx-1,y-11); px(c,'#ac9aa0',xx-1,y-13);}};
    function basket(x,y,rad,layers,dumplings) {
      const h=rad>=14?5:3;
      for(let i=0;i<layers;i++){
        const yy=y-i*h;
        oval(c,'#886f69',x,yy+1,rad,h);px(c,'#b3957f',x-rad,yy-h,rad*2+1,h+1);
        oval(c,'#c5a58a',x,yy-h,rad,h-1);
        for(let k=-rad+3;k<rad-2;k+=4)px(c,'#a88775',x+k,yy-h+2,1,Math.max(1,h-2));
        px(c,'#d1af90',x-rad+2,yy,rad*2-3);
      }
      const yy=y-(layers-1)*h-h;
      if(dumplings){oval(c,'#967c70',x,yy,rad-2,Math.max(1,h-2));
        for(const d of [-.58,-.14,.34,.62]){const xx=x+rad*d,by=yy+(d===-.14?0:-2);
          oval(c,'#d9b99c',xx,by,3,2);px(c,'#ebd1ab',xx-1,by-2,2);px(c,'#b2907b',xx+2,by,1);}}
    }
    for(const [x,y,rad,layers,food] of [[19,198,15,3,false],[53,197,19,2,true],[99,198,14,3,true],[127,198,10,1,false],[172,196,8,2,true]])basket(x,y,rad,layers,food);
    steam(49,182); steam(95,178);
    // Crockery and condiment jars catch the window light at the back stalls.
    for(const [x,y] of [[202,188],[222,190],[244,188],[262,188],[278,187],[345,187],[359,188],[377,187],[405,187],[428,188],[450,188]]) {
      for(let k=0;k<2;k++){const xx=x+k*5,hh=3+(x+k)%4;px(c,'#a69c93',xx,y-hh,3,hh);px(c,'#c3b29b',xx,y-hh,3,1);}
    }
    for(const [x,y] of [[201,172],[224,171],[350,177],[414,166],[435,166]]){px(c,'#877381',x,y,8,10);
      px(c,'#b7958b',x+1,y+1,6,8);px(c,'#997c80',x+2,y+3,4);px(c,'#997c80',x+3,y+5,2);}
    for(const [x,y] of [[7,150],[29,150],[61,150],[81,150],[485,149],[521,149],[582,149],[620,149]]) {
      line(c,'#a1918d',x,y-6,x,y-1);oval(c,'#b8a196',x,y,3,2);px(c,'#cbb39c',x-1,y-1,2);
    }
    // Neatly clipped noren panels with tiny embroidered dumpling emblems.
    for(let j=0;j<3;j++){const x=122+j*10;px(c,j===1?'#9c7284':'#ad8390',x,146,9,19-j%2*3);
      px(c,'#d9ada1',x+1,148,7);oval(c,'#d6afa1',x+4,155,3,2);px(c,'#e1bfab',x+4,152,1,2);}
    afterhoursSign(c,'STEAM',22,153,'#dbc0a1');
    for(let i=0;i<4;i++){const x=482+i*35;basket(x,198,13,2,false);
      for(let j=0;j<7;j++){const xx=x-8+(j%4)*5+(j>3?2:0), yy=188-(j>3?4:0);
        oval(c,['#b37f7e','#c99a80','#98a18b','#bf8d89'][i],xx,yy,3,3);px(c,'#838878',xx,yy-3,1);}}
    for(const [x,y] of [[465,145],[486,145],[547,145],[608,144]]){px(c,'#c2a694',x,y,11,17);px(c,'#a67c7d',x+2,y+2,7,1);for(let j=4;j<12;j+=3)px(c,'#987e80',x+3,y+j,4+j%2);}
    // Paper lanterns follow the natural sag of two long strings.
    for(const [xa,ya,xb,yb,sag,n] of [[-16,77,326,119,16,10],[317,119,655,70,14,10]]){
      let py=ya;for(let xx=xa+1;xx<=xb;xx++){const t=(xx-xa)/(xb-xa),yy=ya+(yb-ya)*t+4*sag*t*(1-t);line(c,'#706780',xx-1,py,xx,yy);py=yy;}
      for(let j=0;j<n;j++){const t=(j+.55)/n,xx=xa+(xb-xa)*t,yy=ya+(yb-ya)*t+4*sag*t*(1-t);
        px(c,'#7c6c7b',xx,yy,1,5);glow(c,xx,yy+9,10,'#e9ad81',.16);oval(c,j%3?'#ce9183':'#c8a185',xx,yy+9,4,6);
        px(c,'#e4b495',xx-1,yy+5,2,8);px(c,'#926e78',xx-2,yy+3,5);px(c,'#936f79',xx-2,yy+14,5);px(c,'#b98882',xx,yy+15,1,2);}
    }
  }

  function vinylArcade(c) {
    const r=rng(984);
    laneRoad(c,225,412,'#555d75','#897a91');
    const front='#615d79',rim='#898093',plum='#6f5f78',slate='#525770';
    const storefront=(x,y,w,h,wall)=>{
      px(c,wall,x,y,w,h);px(c,rim,x-2,y-4,w+4,3);px(c,'#4e506c',x,y,w,3);
      for(let yy=y+9;yy<y+h-8;yy+=7){for(let xx=x+4+(yy%3)*3;xx<x+w-5;xx+=12){if(r()>.65)px(c,mix(wall,rim,.31),xx,yy,4,1);}}
    };
    storefront(-14,117,103,109,front);storefront(92,101,257,126,plum);storefront(351,133,89,93,front);storefront(442,110,207,116,'#586779');
    for(const [x,y,w] of [[-7,137,84],[99,116,239],[452,124,176]])for(let j=0;j<Math.floor(w/23);j++)laneWindow(c,x+j*23,y,12,11,j%3===1);
    // A narrow recessed fly-poster wall divides the two shops.
    px(c,'#53566c',360,157,71,62);px(c,'#7b7889',361,158,69,1);
    for(let j=0;j<6;j++){const x=366+j%3*20,y=165+Math.floor(j/3)*23;
      const paper=['#8e8498','#9aa1a5','#b1919b','#aaa197','#a093a7','#8e9ba6'][j];
      px(c,paper,x,y,14,18);px(c,'#6b6d83',x+2,y+2,10,2);
      if(j%2)oval(c,'#74778a',x+7,y+9,3,3);else poly(c,'#77768b',[[x+2,y+13],[x+6,y+6],[x+12,y+13]]);
      px(c,'#706e82',x+3,y+15,8);}
    // A full-sized record and the shop's hand-painted marquee.
    function record(x,y,rad,face,center,detail) {
      oval(c,'#514e65',x,y+2,rad+1,rad+1);oval(c,face,x,y,rad,rad);
      for(let n=rad-2;n>rad*.43;n-=3){oval(c,mix(face,detail,.48),x,y,n,n);oval(c,face,x,y,n-1,n-1);}
      oval(c,center,x,y,Math.max(2,Math.round(rad*.34)),Math.max(2,Math.round(rad*.34)));
      px(c,'#d4bfa9',x-1,y-1,2,2);
      for(let i=0;i<3;i++){const d=(rad-i*3)*.71;px(c,detail,x-d,y-d,2,1);px(c,detail,x+d,y+d,2,1);}
    }
    px(c,'#4e4b68',90,137,259,28);px(c,'#b588a1',94,139,250,1);px(c,'#b397aa',95,161,248,1);
    record(120,144,22,'#504f6c','#c091a3','#94a7ad');
    afterhoursSign(c,'VINYL',150,144,'#d4a1af',2);
    for(const [xx,hh] of [[201,4],[206,6],[211,11],[216,8],[221,7],[226,4],[231,9],[236,12],[241,6],[246,8],[251,5]])px(c,'#86a9ac',xx,153-hh,2,hh);
    px(c,'#92a9b1',257,148,70,1);px(c,'#a98da5',266,151,61,1);
    px(c,'#474e66',98,166,239,53);px(c,'#8d8191',101,169,200,46);
    // Square sleeve art with records showing behind a few covers.
    const jackets=['#b78292','#8eacac','#bc9c89','#9985a1','#a4a89c'];
    for(let row=0;row<2;row++)for(let i=0;i<9;i++){
      const x=107+i*20,y=173+row*21,color=jackets[(row*3+i)%jackets.length];
      px(c,'#6f697f',x-1,y,16,18);px(c,color,x,y+1,15,15);
      if((i+row)%3===0){oval(c,'#69697f',x+7,y+8,5,5);oval(c,color,x+7,y+8,2,2);}
      else if((i+row)%3===1){poly(c,'#7d7992',[[x+1,y+14],[x+6,y+5],[x+9,y+10],[x+13,y+7],[x+14,y+14]]);px(c,'#dcc2a6',x+10,y+3,2,2);}
      else{px(c,'#e0baab',x+3,y+3,7,1);px(c,'#7e7388',x+6,y+6,3,7);px(c,'#b29aa6',x+2,y+12,4);}
    }
    px(c,'#636173',99,192,201,2);px(c,'#5a576e',99,214,202,4);laneWindow(c,308,170,22,39,false,'#555369','#8797a3');
    px(c,'#657b89',444,141,194,24);px(c,'#9cbdba',446,142,190,1);px(c,'#b58ba0',448,162,186,1);
    afterhoursSign(c,'ARCADE',491,148,'#cbd4bd',2);
    for(const x of [450,556,579,604]){
      const shift=x%3;poly(c,'#59586f',[[x+2,176],[x+15,176],[x+14,188],[x+12,195],[x+17,199],[x+15,220],[x,220],[x,200],[x+4,196]]);
      px(c,'#ad8b9b',x+3,177,11,3);px(c,'#739ca4',x+4,184,9,7);px(c,'#b2c1ac',x+7,186,2);px(c,'#9d859c',x+1,198,14,2);px(c,'#b5a3ab',x+5,196,1,3);px(c,'#bf96a0',x+10+shift,197,2);
    }
    // Brass-and-rose tabletop jukebox with a lit horseshoe surround.
    function jukebox(x,y){oval(c,'#585267',x,y+12,12,13);px(c,'#5d5267',x-12,y+12,25,30);
      for(const [rad,col] of [[11,'#b28b94'],[9,'#ceae9b'],[7,'#94b2ad'],[5,'#67667b']]){oval(c,col,x,y+12,rad,rad);px(c,col,x-rad,y+12,2,21);px(c,col,x+rad-1,y+12,2,21);}
      px(c,'#69657b',x-5,y+13,11,22);px(c,'#d0aa9a',x-5,y+15,11,3);px(c,'#94abac',x-3,y+21,7,2);
      for(let j=0;j<3;j++)px(c,'#ad969e',x-3,y+25+j*3,7,1);px(c,'#9f8892',x-11,y+37,23,2);}
    jukebox(505,178);record(39,172,17,'#53566f','#a993a5','#839aa9');
    // Pavement listening crates, full of sleeves at uneven angles.
    for(const x of [187,231]){for(let j=0;j<9;j++){const yy=219-(j%3)*2;px(c,jackets[j%5],x+2+j*3,yy,8,10);}
      px(c,'#8a747c',x,226,36,10);px(c,'#ae8e85',x-1,225,38,2);px(c,'#aa8b86',x+2,231,32,1);}
  }

  function rainlight(c) {
    const r=rng(33576), blue='#90b7c1',pink='#d69cb2',gold='#d2b098';
    laneRoad(c,199,341,'#536078','#798599');
    // Steep street drains, tiled sidewalls and short rain chains run toward the opening.
    poly(c,'#616c85',[[0,260],[240,209],[322,196],[351,196],[482,222],[640,248],[640,272],[0,272]]);
    const facades=[
      [-7,94,122,221,'#626780'],[115,120,79,96,'#616980'],[193,145,63,61,'#717388'],[252,166,39,36,'#777a8e'],
      [363,160,45,44,'#78778b'],[407,142,66,69,'#68697f'],[473,111,82,107,'#66677e'],[555,90,91,138,'#62647c']
    ];
    for(const [i,[x,y,w,h0,wall]] of facades.entries()){
      const h=Math.min(h0,226-y);px(c,wall,x,y,w,h);px(c,'#787a8d',x,y-2,w,2);
      px(c,mix(wall,'#353c58',.34),x+w-5,y,5,h);
      const columns=Math.floor(w/24);
      for(let j=0;j<columns;j++)laneWindow(c,x+6+j*23,y+9,10,10,(i+j)%3===0,'#53596f','#76849a');
      if(h>73){for(let j=0;j<columns;j++)laneWindow(c,x+6+j*23,y+31,10,10,(i+j)%4===2,'#53596f','#74839a');}
      for(let j=0;j<15;j++){const xx=x+3+r()*(w-8),yy=y+3+r()*(h-8);px(c,mix(wall,'#9190a2',.25),xx,yy,3,1);}
      for(const delta of [2,w-10]){px(c,'#505970',x+delta,y+4,2,h-4);for(let yy=y+12;yy<y+h;yy+=17)px(c,'#7d8294',x+delta-1,yy,4,1);}
    }
    const terrace=(x,y,w)=>{
      px(c,'#505a72',x,y-1,w,3);px(c,'#88909e',x,y-10,w,1);px(c,'#68778b',x,y-7,w,1);
      for(let j=0;j<w;j+=5)px(c,'#6f7d8e',x+j,y-10,1,9);
    };
    terrace(17,143,70);terrace(489,154,58);terrace(562,138,57);terrace(432,181,32);
    for(const [x,y,w] of [[73,102,28],[153,151,20],[576,98,25],[500,121,20]]){px(c,'#626579',x,y,w,10);px(c,'#9092a1',x,y,w,2);
      oval(c,'#565e75',x+6,y+6,4,3);px(c,'#83899b',x+4,y+6,5,1);for(let j=11;j<w-3;j+=3)px(c,'#7f8496',x+j,y+3,1,5);}
    // The projecting neon signs use a tiny colored core above a quiet halo.
    function verticalSign(x,y,w,h,col,mode) {
      px(c,'#58586b',x-7,y+3,9,2);px(c,'#58586b',x-5,y+h-7,9,2);
      glow(c,x+w/2,y+h/2,Math.max(w,h)*.55,col,.18);px(c,'#55546e',x,y,w,h);
      px(c,col,x+1,y+1,w-2,1);px(c,col,x+1,y+h-2,w-2);px(c,mix(col,'#666780',.3),x+1,y+2,1,h-4);
      if(mode===0){for(let j=5;j<h-8;j+=12){px(c,col,x+4,y+j,w-8,1);px(c,col,x+w/2,y+j-1,1,8);px(c,col,x+4,y+j+5,w-9,1);}}
      if(mode===1){for(let j=5;j<h-7;j+=10){line(c,col,x+4,y+j,x+w-5,y+j+3);line(c,col,x+w-5,y+j+3,x+4,y+j+6);}}
    }
    verticalSign(91,127,14,48,pink,0);verticalSign(182,149,10,33,blue,1);
    verticalSign(486,116,15,47,blue,1);verticalSign(568,150,12,40,gold,0);
    px(c,'#60576d',25,173,48,14);px(c,'#b692af',27,175,44,1);px(c,'#b692af',27,184,44,1);
    for(let j=0;j<4;j++){const x=32+j*9;line(c,pink,x,180,x+3,177);line(c,pink,x+3,177,x+5,180);line(c,pink,x+5,180,x+3,182);}
    px(c,'#555968',599,161,28,17);px(c,blue,601,162,24,1);px(c,blue,602,175,22,1);afterhoursSign(c,'CAFE',606,167,'#b7c3be');
    // A nostalgic self-service photo booth, with a striped curtain and sample strip.
    const bx=366,by=143;
    glow(c,bx+34,by+9,37,'#c090ad',.13);
    px(c,'#535568',bx+2,by+5,69,79);px(c,'#c29aa4',bx,by,70,76);
    px(c,'#927b91',bx+1,by+15,67,56);px(c,'#ac8c9b',bx+3,by+17,62,49);
    px(c,'#685e78',bx+5,by+17,43,50);px(c,'#bb8e9f',bx+6,by+17,40,3);
    px(c,'#877183',bx+6,by+20,17,44);
    for(const [dx,w,col] of [[8,3,'#a18192'],[11,2,'#c09aa5'],[13,3,'#947586'],[17,3,'#bd94a1']])px(c,col,bx+dx,by+20,w,44-dx%3);
    px(c,'#827184',bx+23,by+61,23,4);px(c,'#b9959d',bx+27,by+53,16,4);px(c,'#987f8d',bx+33,by+57,3,4);
    px(c,'#c8a9ac',bx+51,by+19,12,32);px(c,'#f0c8b5',bx+53,by+21,8,28);
    for(let j=0;j<3;j++){const yy=by+23+j*8;px(c,'#8d8696',bx+54,yy,6,6);px(c,'#d8af9e',bx+56,yy+1,2,3);px(c,'#bd93a1',bx+55,yy+4,4,2);}
    px(c,'#72667d',bx+52,by+55,11,5);px(c,'#a3b4b5',bx+54,by+56,7,1);
    px(c,'#c8a3a9',bx+1,by+1,67,11);px(c,'#786b84',bx+3,by+2,63,9);
    afterhoursSign(c,'PHOTO',bx+19,by+4,'#efd0c0');px(c,'#d2abb3',bx+3,by+69,63,2);
    px(c,'#7b6e83',bx-1,by+75,72,4);px(c,'#a093a6',bx-2,by+79,74,1);
    // Broken vertical neon reflections dissolve into wet asphalt.
    for(const [x,y,col,count] of [[48,225,pink,15],[96,221,pink,19],[187,210,blue,13],[399,226,pink,20],[495,223,blue,22],[575,227,gold,20],[612,226,blue,13]]){
      for(let j=0;j<count;j++){const t=j/count,yy=y+t*(272-y),spread=3+t*11;
        const xx=x+(r()-.5)*spread*2, ww=2+r()*(4+13*t);
        px(c,mix('#616c85',col,.22+r()*.49),xx,yy,ww,1+(j%8===0?1:0));}
    }
    for(const [x,y,w] of [[137,243,22],[285,251,34],[370,230,16],[467,262,37],[533,240,18],[67,259,26]]){
      const rim='#8b96a8';px(c,rim,x+3,y-2,w-6,1);px(c,'#9ca4b3',x,y-1,5);px(c,rim,x+w-5,y,5);px(c,'#8794a6',x+5,y+1,w-10,1);
    }
    for(let j=0;j<65;j++){const x=Math.floor(r()*640),y=76+Math.floor(r()*161),h=2+Math.floor(r()*4);
      line(c,mix('#83899f','#a6a1b4',.25),x,y,x-1,y+h);}
  }
  function glasshouse(ctx) {
    const random = rng(13295);
    const ink = '#475665', frame = '#697a87', moon = '#9aa6aa', darkLeaf = '#4d666d';
    const center = 334, foot = 206, spring = 146, radius = 78, rise = 57;
    const lawn = [[0,200],[42,192],[108,196],[172,187],[241,192],[315,183],[372,193],
      [444,182],[513,187],[587,175],[640,181],[640,272],[0,272]];
    poly(ctx, '#536a6d', lawn);
    for (let i = 0; i < 59; i++) {
      const x = i * 12 - 10, y = 198 - Math.sin(x / 56) * 6 - x / 60;
      oval(ctx, '#52666d', x, y, 8 + random() * 7, 5 + random() * 8);
    }
    // Small projecting galleries have their own clerestory, tied to the central nave.
    function gallery(x, w, right) {
      const y = 157, ends = x + w;
      poly(ctx, '#516a77', [[x,y],[x+15,y-22],[ends-10,y-22],[ends,y],[ends,202],[x,202]]);
      poly(ctx, '#7e8b95', [[x+1,y],[x+16,y-21],[ends-12,y-21],[ends-2,y]]);
      for (let i = x + 12; i < ends - 2; i += 14) {
        const shift = right ? -7 : 7;
        line(ctx, '#5e7181', i, y-1, Math.max(x+15,Math.min(ends-12,i+shift)), y-21);
        if (i % 3) line(ctx,'#8997a1',i+3,y-7,i+5,y-13);
      }
      px(ctx, '#687a88', x+10, y-15, w-18);
      px(ctx, '#586e7b', x+5, y-7, w-10);
      px(ctx, moon, x+15, y-23, w-24);
      for (let i=x+20;i<ends-10;i+=13) {
        px(ctx, frame,i,y-26,1,3);px(ctx,moon,i-1,y-27,3);
      }
      px(ctx,'#6f8388',x+1,y,w-2,40);
      for(let i=x+3;i<ends-5;i+=16) {
        const width=Math.min(14,ends-3-i);
        px(ctx,['#7e9093','#71878b','#8a9693','#6b838b'][Math.floor(random()*4)],
          i,y+2,width,35);
        if (i%4===1) {
          px(ctx,'#aaa29a',i+2,y+17,Math.max(1,width-4),16);
          px(ctx,'#b8ab98',i+3,y+17,2,10);
        }
        line(ctx,'#87969c',i+2,y+10,i+5,y+4);
      }
      for(let i=x+7;i<ends-6;i+=15) {
        const tip = 174+random()*10;
        line(ctx,darkLeaf,i+2,194,i,tip);
        poly(ctx,'#5c7778',[[i,tip+7],[i-6,tip+5],[i-9,tip-1],[i-4,tip+1]]);
        poly(ctx,'#547070',[[i+1,tip+10],[i+3,tip+4],[i+9,tip+1],[i+6,tip+6]]);
        oval(ctx,'#546d71',i,193,6+random()*3,3+random()*3);
      }
      px(ctx,frame,x,171,w,1);px(ctx,ink,x,188,w,1);
      for(let i=x+1;i<ends-1;i+=16){px(ctx,ink,i,157,2,40);px(ctx,'#8d999b',i,158,1,36);}
      px(ctx,ink,x-2,155,w+4,3);px(ctx,moon,x-1,155,w+2);
      px(ctx,'#777e88',x,197,w,8);px(ctx,'#92939a',x-1,196,w+2,2);
      for(let i=x+5;i<ends;i+=22){px(ctx,'#646e7a',i,200,1,4);px(ctx,'#899096',i+2,199,13);}
    }
    gallery(85,181,false);
    gallery(403,157,true);

    // Pale blue and bronze panes form one continuous elliptic vault.
    for(let dy=-rise;dy<=0;dy++) {
      const span=Math.max(1, Math.floor(radius*Math.sqrt(1-(dy/rise)**2)));
      px(ctx,'#697e89',center-span,spring+dy,span*2+1);
      px(ctx,'#788c96',center-span+1,spring+dy,span*1.02);
      px(ctx,'#86969d',center-span*.76,spring+dy,span*.34);
      px(ctx,'#728794',center+span*.46,spring+dy,span*.46);
    }
    px(ctx,'#778889',center-radius+1,spring,radius*2-2,55);
    for(let i=0;i<13;i++) {
      const x=center-radius+4+i*12, w=10;
      const glass=['#8b9896','#8c9794','#aaa293','#809294','#aaa69b'][i%5];
      px(ctx,glass,x,spring+2,w,45);
      px(ctx,mix(glass,'#d4b693',.28),x,spring+26,w,17);
      line(ctx,'#97a2a0',x+1,spring+12,x+4,spring+6);
      if(i%3===1)px(ctx,'#acb0a8',x+2,spring+9,1,3);
    }

    function palm(x,y,h,lean) {
      const crest=x+lean, top=y-h;
      poly(ctx,'#546571',[[x-3,y],[x-1,y-12],[crest-1,top],[crest+1,top],[x+2,y-12],[x+3,y]]);
      for (let i=0;i<7;i++) {
        const reach=[-21,-17,-12,-4,9,15,23][i], lift=[2,-6,-11,-16,-12,-6,0][i];
        const midX=crest+reach*.48, midY=top+lift*.92-4, endY=top+lift+4;
        line(ctx,'#586d74',crest,top,midX,midY);
        line(ctx,'#586d74',midX,midY,crest+reach,endY);
        for(let j=1;j<6;j++) {
          const t=j/6;
          const xx=crest+reach*t;
          const yy=top+(lift+4)*t-Math.sin(t*Math.PI)*6;
          const feather=2+Math.sin(t*Math.PI)*4;
          line(ctx,i%2?'#5e7377':'#556b73',xx,yy,xx-Math.sign(reach)*2,yy+feather);
        }
      }
    }
    palm(284,194,34,3);palm(385,193,40,-4);
    for(let i=0;i<30;i++) {
      const x=260+random()*147,y=193-random()*4,dir=random()<.5?1:-1,h=5+random()*9;
      poly(ctx,i%2?'#627b76':'#536e70',[[x,y],[x+dir*2,y-h*.6],[x+dir*8,y-h],[x+dir*5,y-h*.32]]);
    }

    function ribs(t, color, breadth=1) {
      let last=null;
      for(let j=0;j<=32;j++) {
        const a=Math.PI*.5*j/32, x=center+radius*t*Math.sin(a), y=spring-rise*Math.cos(a);
        if(last) line(ctx,color,last[0],last[1],x,y,breadth);
        last=[x,y];
      }
    }
    // Iron ribs bend outward and spring from the wall piers.
    for(const t of [-1,-.80,-.55,-.27,0,.27,.55,.80,1]) {
      ribs(t, Math.abs(t)===1?ink:'#59717e', Math.abs(t)===1?2:1);
      if(Math.abs(t)>.99)ribs(t*.978,moon);
    }
    for(const dy of [-45,-31,-15]) {
      const span=Math.floor(radius*Math.sqrt(1-(dy/rise)**2));
      px(ctx,'#647a87',center-span,spring+dy,span*2);
      px(ctx,'#95a2a6',center-span+2,spring+dy-1,span*2-3);
    }
    // A vent lantern and slender filigree finial crown the nave.
    px(ctx,ink,326,84,17,6);px(ctx,'#97a1a4',328,85,13,4);
    for(const x of [330,334,338])px(ctx,frame,x,84,1,5);
    poly(ctx,'#8896a2',[[324,84],[331,80],[334,78],[338,80],[345,84]]);
    px(ctx,moon,326,83,16);
    px(ctx,'#9a979e',334,70,1,9);px(ctx,'#abb0b0',331,74,7);
    px(ctx,'#baafa5',333,69,3,3);
    px(ctx,'#a9a6a9',334,66,1,3);
    px(ctx,ink,center-radius-3,spring-1,radius*2+6,4);
    px(ctx,moon,center-radius-2,spring-2,radius*2+4);
    for(let x=center-radius+2;x<=center+radius-2;x+=12) {
      px(ctx,ink,x,spring+1,2,50);px(ctx,'#9aa5a1',x,spring+2,1,47);
      line(ctx,frame,x+2,spring+10,x+6,spring+4);
      line(ctx,frame,x+6,spring+4,x+11,spring+10);
    }
    px(ctx,frame,center-radius,161,radius*2);
    px(ctx,'#686f7a',center-radius-3,194,radius*2+6,10);
    px(ctx,'#9b9b9b',center-radius-4,193,radius*2+8,2);
    // Brass-framed doors beneath an arched fanlight.
    oval(ctx,ink,center,169,18,20);
    px(ctx,ink,center-18,168,37,35);
    oval(ctx,'#b5a28c',center,170,14,16);
    px(ctx,'#a39284',center-14,170,29,31);
    for (const sx of [-1,1]) {
      const x=center+(sx<0?-13:2);
      px(ctx,'#8a8583',x,172,11,28);
      px(ctx,'#c1aa91',x+2,174,7,14);px(ctx,'#8d8e8b',x+2,191,7,7);
      px(ctx,'#e0bc94',x+(sx<0?8:2),189,2,2);
    }
    for(const a of [-1.08,-.54,0,.54,1.08]){
      line(ctx,'#7b8488',center,170,center+Math.sin(a)*14,170-Math.cos(a)*15);
    }
    px(ctx,frame,center-15,170,31);
    for(let i=0;i<3;i++){
      px(ctx,i===2?'#838590':'#929399',center-21-i*4,201+i*2,42+i*8,2);
      px(ctx,'#aaa5a4',center-21-i*4,201+i*2,42+i*8,1);
    }
    for(const x of [249,419]) {
      px(ctx,'#6e7b80',x,188,5,15);px(ctx,'#919c9a',x-1,187,7,2);
      oval(ctx,'#738891',x+2,184,3,3);px(ctx,'#adaca8',x+1,181,2,2);
    }
    poly(ctx,'#687b78',[[0,209],[57,202],[122,211],[184,207],[260,210],[312,208],
      [350,210],[431,208],[504,206],[561,199],[640,202],[640,272],[0,272]]);
    // A gravel S-curve is the moonlight's path to the greenhouse.
    poly(ctx,'#939295',[[315,207],[355,207],[342,213],[323,219],[320,222],[324,225],
      [357,230],[388,237],[398,243],[397,249],[371,258],[349,272],[266,272],
      [283,261],[324,251],[348,244],[354,240],[352,237],[332,233],[306,229],[298,224],[298,221],[305,216],[322,210]]);
    const edging = [[315,207],[322,210],[305,216],[298,221],[298,224],[306,229],[332,233],[352,237],[354,240],[348,244],[324,251],[283,261],[266,272]];
    for(let i=1;i<edging.length;i++)line(ctx,'#a4a1a0',...edging[i-1],...edging[i]);
    function moonflowerPot(x,y,wide,seed) {
      const rand=rng(seed),rim='#91878d',clay='#776b77';
      poly(ctx,clay,[[x-wide/2,y],[x+wide/2,y],[x+wide*.34,y+10],[x-wide*.34,y+10]]);
      px(ctx,rim,x-wide/2-1,y,wide+2,3);px(ctx,'#a29b9b',x-wide/2,y,wide,1);
      for(let i=0;i<wide;i++) {
        const dx=(rand()-.5)*wide, h=5+rand()*10;
        line(ctx,'#62776f',x+dx*.54,y,x+dx,y-h);
        px(ctx,i%3?'#778d7d':'#91a193',x+dx-1,y-h,2,2);
        if(i%4===0){
          px(ctx,'#b5b1b6',x+dx-2,y-h-1,4,2);px(ctx,'#c9bfb8',x+dx-1,y-h-2,2,4);
          px(ctx,'#b8a792',x+dx,y-h-1);
        }
      }
    }
    for(const [x,y,w,seed] of [[64,208,21,16],[172,211,17,32],[267,211,20,99],[401,211,19,48],
      [508,210,17,65],[583,208,23,28],[95,239,31,81],[525,237,28,38]]){
      moonflowerPot(x,y,w,seed);
    }
    // The gardener trains flowering vines over the two door piers.
    for(const side of [-1,1]) {
      let last=[center+side*21,196];
      for(let i=0;i<15;i++){
        const t=i/14,xx=center+side*(24-10*t)+Math.sin(t*8+side)*2, yy=196-37*t;
        line(ctx,'#688279',last[0],last[1],xx,yy);
        if(i%2===0)poly(ctx,'#839780',[[xx,yy+1],[xx-3*side,yy],[xx-5*side,yy-3],[xx-2*side,yy-2]]);
        if(i%4===2){px(ctx,'#ccc0b3',xx,yy-2,2,4);px(ctx,'#e0cdb7',xx-1,yy-1,4);}
        last=[xx,yy];
      }
    }
    for(const [x,y,w] of [[193,231,48],[459,224,36],[19,253,50],[601,248,56]]) {
      oval(ctx,'#627874',x,y,w,4);oval(ctx,'#74867a',x,y-2,w-3,4);
      for(let i=0;i<w*1.4;i++){
        const t=random()*2-1,xx=x+w*t, yy=y-random()*6*(1-t*t);
        px(ctx,i%4?'#849480':'#b4aaac',xx,yy,2,1);
        if(i%5===0)px(ctx,'#c3b8b3',xx+1,yy-1,2,1);
      }
    }
    for(let i=0;i<140;i++){
      const x=random()*640,y=212+random()*60;if(x>265&&x<407)continue;
      px(ctx,i%4?'#70827c':'#829387',x,y,2+Math.floor(random()*5),1);
      if(i%7===0)px(ctx,'#9d9c9c',x+1,y-1,2,2);
    }
    lamp(ctx,37,218,43,1);lamp(ctx,610,217,44,1);
  }

  function kiteHill(ctx) {
    const random=rng(16043);
    // The hill climbs towards a long view over the city on the right.
    const rearY=x=>171-8*Math.cos(x/60)-12*Math.sin(x/112+.5);
    const middleY=x=>183+9*Math.sin(x/76+.2)-17*Math.cos(x/117-.6);
    const hillY=x=>208+11*Math.cos(x/82-.8)-24*Math.cos(x/147)+8*Math.sin(x/48);
    function hillside(contour,color){
      const edge=[];for(let x=-4;x<=644;x+=4)edge.push([x,Math.round(contour(x))]);
      poly(ctx,color,[...edge,[644,272],[-4,272]]);
    }
    hillside(rearY,'#647487');
    for(let x=-4;x<644;x+=5){
      const y=rearY(x),h=2+random()*6;
      poly(ctx,'#647487',[[x-4,y+1],[x-1,y-h],[x+5,y]]);
    }
    hillside(middleY,'#617783');
    for(let x=-8;x<648;x+=9){
      const y=middleY(x),r=3+random()*5;
      oval(ctx,'#617783',x,y-1,r,r*.67);
      px(ctx,'#738590',x-r*.45,y-r*.65,2,1);
    }
    hillside(hillY,'#627b77');
    // Long, broken strokes follow the wind and give the hill its roundness.
    for(let i=0;i<430;i++){
      const x=random()*650-5,y=hillY(x)+2+random()*75;
      const c=['#6d857c','#597474','#758b80','#627e77'][i%4],long=2+random()*7;
      px(ctx,c,x,y,long,1);
      if(i%3===0){
        px(ctx,c,x+long-1,y-1,3,1);
        if(i%2===0)line(ctx,c,x+1,y,x+4,y-3);
      }
    }
    for(let x=1;x<640;x+=2+Math.floor(random()*5)){
      const y=hillY(x),h=1+random()*4;
      line(ctx,'#748b82',x,y+1,x+h*1.4,y-h);
      if(x%3===0)px(ctx,'#97a399',x+h*1.4,y-h,2);
    }
    // A narrow footpath disappears over the crest and opens toward the player.
    const path=[[286,194],[290,194],[291,199],[286,204],[271,211],[266,216],[270,220],
      [292,225],[336,229],[369,235],[383,242],[387,251],[383,260],[367,272],
      [326,272],[347,260],[357,252],[359,246],[355,242],[343,237],[321,234],
      [279,230],[258,225],[251,220],[251,216],[257,211],[274,205],[285,200]];
    poly(ctx,'#989191',path);
    for(let i=1;i<12;i++)line(ctx,'#a39991',...path[i-1],...path[i]);
    for(const [x,y,w] of [[276,209,3],[265,216,4],[272,223,5],[290,227,8],[342,233,7],[363,242,8],[370,248,10],[357,263,9]]){
      px(ctx,'#aca198',x,y,w,1);px(ctx,'#878889',x+w+1,y+2,4,1);
    }

    function windPine(x,y,scale){
      const X=n=>x+n*scale,Y=n=>y+n*scale;
      const pts=a=>a.map(([u,v])=>[X(u),Y(v)]);
      poly(ctx,'#555963',pts([[-7,2],[-1,-13],[1,-30],[8,-44],[11,-59],[15,-74],
        [18,-74],[14,-54],[13,-39],[8,-27],[6,-12],[8,0]]));
      poly(ctx,'#7e7779',pts([[-1,0],[2,-13],[3,-29],[10,-43],[13,-58],[14,-47],[12,-39],[6,-26],[4,-12],[5,0]]));
      for(const [from,bend,tip] of [
        [[3,-28],[14,-40],[48,-47]],[[6,-37],[24,-51],[52,-51]],[[11,-52],[23,-59],[58,-63]],
        [[14,-63],[22,-73],[41,-76]],[[13,-55],[-1,-61],[-17,-61]],[[6,-38],[-4,-45],[-18,-48]]]){
        line(ctx,'#5a6268',X(from[0]),Y(from[1]),X(bend[0]),Y(bend[1]),Math.max(1,Math.round(2*scale)));
        line(ctx,'#6e7273',X(bend[0]),Y(bend[1]),X(tip[0]),Y(tip[1]));
      }
      const boughs=[[-15,-51,14,5],[-8,-63,14,6],[11,-70,15,5],[26,-76,19,6],
        [42,-77,13,4],[22,-65,17,5],[46,-64,18,5],[61,-65,10,3],
        [21,-53,21,6],[43,-52,15,5],[54,-54,11,3],[12,-42,18,5],[36,-46,17,5]];
      const n=rng(821+Math.round(x*7));
      for(const [u,v,rx,ry] of boughs){
        poly(ctx,'#516b70',pts([[u-rx,v+1],[u-rx*.72,v-ry*.55],[u-rx*.2,v-ry],[u+rx*.7,v-ry*.67],
          [u+rx*1.3,v-ry*.5],[u+rx*.58,v],[u+rx*.4,v+ry*.45],[u-rx*.25,v+ry],[u-rx*.8,v+ry*.6]]));
        for(let i=0;i<13;i++){
          const ox=(n()-.5)*rx*1.65,oy=(n()-.5)*ry*.9;
          px(ctx,i%5?'#657d79':'#8a9387',X(u+ox),Y(v+oy-1),Math.max(1,Math.round((2+n()*4)*scale)),1);
        }
      }
    }
    windPine(33,205,1.02);windPine(600,197,.62);

    // The threads bow in the breeze; their anchoring pegs stand at different distances.
    function cord(start,end,bend,color){
      let prev=start;
      for(let i=1;i<=36;i++){
        const t=i/36,u=1-t;
        const next=[u*u*start[0]+2*u*t*bend[0]+t*t*end[0],u*u*start[1]+2*u*t*bend[1]+t*t*end[1]];
        line(ctx,color,...prev,...next);prev=next;
      }
    }
    function bow(x,y,c){
      poly(ctx,c,[[x-3,y-2],[x,y],[x-3,y+2]]);poly(ctx,c,[[x,y],[x+3,y-1],[x+3,y+2]]);
    }
    function diamond(x,y,s,col,trim){
      const tr=([dx,dy])=>[x+dx*s,y+dy*s];
      const T=tr([0,-12]),L=tr([-10,0]),B=tr([2,15]),R=tr([11,-2]),O=tr([0,0]);
      poly(ctx,col,[T,L,B,R]);
      poly(ctx,mix(col,'#484e70',.38),[L,B,O]);
      poly(ctx,trim,[T,O,R]);
      poly(ctx,mix(col,'#f4cbb3',.24),[T,L,O]);
      line(ctx,mix(trim,'#f2d0ae',.2),...T,...B);
      line(ctx,mix(col,'#e4c4b2',.29),...L,...R);
      line(ctx,mix(col,'#514f69',.4),...B,...R);
      let last=B;
      for(let i=1;i<=8;i++){
        const q=tr([2+i*2.2+Math.sin(i*.8)*3,15+i*1.5+Math.cos(i*.6)*2]);
        line(ctx,'#a39aa7',...last,...q);
        if(i%3===0)bow(q[0],q[1],i%2?col:trim);last=q;
      }
    }
    const cords=[
      [[127,196],[179,62],[133,143],'#989ba5'],
      [[208,203],[253,85],[212,141],'#89959f'],
      [[285,192],[326,68],[284,135],'#969aa5'],
      [[439,221],[468,81],[433,147],'#9b9ca5'],
      [[506,220],[560,67],[517,159],'#9399a3']
    ];
    for(const [peg,kite,bend,color] of cords){
      cord(peg,kite,bend,color);
      line(ctx,'#6c6973',peg[0]-1,peg[1]+2,peg[0]+1,peg[1]-7,2);
      px(ctx,'#a29591',peg[0],peg[1]-6,3);
    }
    diamond(179,60,1,'#c58e9c','#d1ac9d');
    diamond(253,84,.57,'#aa9bb2','#b8b4b3');
    diamond(560,66,.73,'#8babae','#beb8b1');

    // Swallow-shaped kite. Two pointed wings and a forked tail echo the nearby tree.
    poly(ctx,'#8c859e',[[308,60],[318,60],[324,63],[326,67],[330,66],[340,57],[338,66],
      [333,71],[328,72],[329,79],[325,76],[321,80],[324,70],[319,68]]);
    poly(ctx,'#ba9fb0',[[308,60],[319,60],[324,64],[326,68],[320,65]]);
    poly(ctx,'#a89daf',[[327,69],[331,67],[340,57],[337,66],[332,70]]);
    px(ctx,'#c9b8b8',325,66,3,3);px(ctx,'#ad96a3',327,65,2);

    // Carp windsock: an open oval mouth, stitched scales, a split streamer tail.
    const fish=[[467,73],[474,72],[484,74],[492,73],[502,70],[507,69],[508,74],
      [518,73],[522,75],[512,79],[514,82],[507,82],[501,82],[493,84],
      [483,87],[473,87],[469,85],[465,85],[463,81],[464,76]];
    poly(ctx,'#a88089',fish);
    poly(ctx,'#c49699',[[466,75],[474,73],[483,75],[494,74],[506,70],[501,77],
      [490,81],[477,83],[467,83]]);
    poly(ctx,'#c7aaa2',[[467,74],[476,73],[484,75],[481,76],[470,77],[466,79]]);
    poly(ctx,'#b59aa7',[[494,76],[505,70],[508,69],[507,76],[501,80]]);
    poly(ctx,'#d1b6a5',[[503,78],[512,75],[520,75],[513,78],[507,79]]);
    poly(ctx,'#b497a7',[[502,80],[511,79],[516,81],[523,80],[520,83],[514,84]]);
    poly(ctx,'#9a889a',[[487,74],[489,69],[495,69],[492,73]]);
    poly(ctx,'#9b8394',[[478,85],[484,86],[483,90],[480,92],[481,88]]);
    oval(ctx,'#cbb3a6',466,80,3,6);oval(ctx,'#8d8294',465,80,2,4);
    px(ctx,'#cdb1ab',465,76,1,3);
    oval(ctx,'#d4beb0',473,78,3,2);px(ctx,'#676b81',473,77,2,2);
    for(const [x,y] of [[477,76],[480,80],[484,77],[487,80],[490,76],[494,76],[496,78]]){
      px(ctx,'#dbb9ad',x,y,1,2);px(ctx,'#d0a7a6',x+1,y+2,2);px(ctx,'#b08d9a',x+2,y+1);
    }
    line(ctx,'#b8a1a4',461,80,465,75);line(ctx,'#ac99a2',461,80,465,85);
    // A short run of low pennants and the festival's painted wooden winding reels.
    cord([88,199],[154,205],[124,211],'#717679');
    for(const [i,col] of ['#ad8a91','#a49b95','#8c9b9e','#a595a4','#b09b92'].entries()){
      const t=(i+1)/6,x=88+66*t,y=199*(1-t)**2+422*t*(1-t)+205*t*t;
      poly(ctx,col,[[x,y],[x+6,y+1],[x+3,y+7]]);
    }
    for(const [x,y] of [[88,199],[154,205]])px(ctx,'#72797a',x,y-2,2,13);
    function reel(x,y,s){
      oval(ctx,'#576f70',x,y+4,11*s,3*s);
      px(ctx,'#977e80',x-6*s,y-2*s,13*s,5*s);
      for(let i=0;i<7;i++)line(ctx,i%2?'#c1aa9c':'#aaa099',x-4*s+i*s,y-2*s,x-5*s+i*s,y+2*s);
      for(const side of [-1,1]){
        oval(ctx,'#94858a',x+side*6*s,y,2*s,5*s);
        px(ctx,'#b19b95',x+side*6*s,y-4*s,1,6*s);
      }
      px(ctx,'#77727c',x+7*s,y,4*s,2*s);px(ctx,'#a99394',x+10*s,y-2*s,2*s,3*s);
    }
    reel(166,225,.95);reel(455,243,1.2);
    // A folded canvas and spare kite wait beside a wooden picnic seat.
    const bx=521,by=225;
    px(ctx,'#576b70',bx-13,by+1,3,7);px(ctx,'#576b70',bx+11,by+1,3,7);
    px(ctx,'#887e83',bx-17,by-1,34,3);px(ctx,'#aaa093',bx-16,by-1,32);
    px(ctx,'#73747a',bx-13,by-7,2,8);px(ctx,'#73747a',bx+12,by-7,2,8);
    px(ctx,'#8d8587',bx-16,by-7,32,3);px(ctx,'#a89a95',bx-16,by-7,32);
    poly(ctx,'#a08991',[[bx-5,by-5],[bx+4,by-4],[bx+11,by-1],[bx+4,by+2],[bx-4,by+1]]);
    px(ctx,'#af999e',bx-3,by-3,7);px(ctx,'#a89896',bx+4,by+1,5,2);
    poly(ctx,'#a58e9c',[[bx+18,by+6],[bx+29,by+2],[bx+39,by+5],[bx+30,by+9]]);
    poly(ctx,'#c5a59d',[[bx+18,by+6],[bx+29,by+2],[bx+30,by+6]]);
    line(ctx,'#c1aaa0',bx+29,by+2,bx+30,by+9);
    cord([bx+30,by+9],[bx+43,by+11],[bx+32,by+14],'#999299');

    for(const [x,y] of [[10,230],[42,244],[186,232],[226,251],[385,256],[553,250],[593,223],[631,252]]){
      for(let i=0;i<5;i++){
        const xx=x+i*2,yy=y+(i%2)*2,h=4+Math.round(random()*6);
        line(ctx,'#5d7671',xx,yy,xx+4+i%3,yy-h);
        px(ctx,i%3?'#a7a58f':'#b7a4a3',xx+3+i%3,yy-h,3);
      }
    }
  }
  function fireflyPier(ctx) {
    const base='#545572', deep='#45475f', steel='#777185', gilt='#bf9990';
    const deck=179, horizon=191;
    const x=373,y=104,r=59;
    const wheel=(radius,angle,offset=0)=>[x+Math.cos(angle)*radius+offset,y+Math.sin(angle)*radius];
    // The inside and outside rims form a fine painted truss; the hanging cars remain upright.
    const segments=48;
    for(let n=0;n<segments;n++) {
      const angle=n*Math.PI*2/segments, next=(n+1)*Math.PI*2/segments;
      line(ctx,base,...wheel(r,angle,-4),...wheel(r,next,-4));
      if(n%4===0)line(ctx,'#80788d',x-3,y,...wheel(r-2,angle,-4));
      line(ctx,steel,...wheel(r,angle),...wheel(r,next));
      line(ctx,'#8e8091',...wheel(r-3,angle),...wheel(r-3,next));
      if(n%2===0)line(ctx,'#8b7d8d',...wheel(r,angle),...wheel(r-3,next));
    }
    for(let n=0;n<12;n++) {
      const a=n*Math.PI/6;
      const [cx,cy]=wheel(r,a);
      line(ctx,'#9b8596',x,y,cx,cy);
      const tones=['#bf8b84','#a28b9b','#bd9b83','#8392a5'];
      const color=tones[n%tones.length];
      line(ctx,base,cx,cy,cx-4,cy+5);line(ctx,base,cx,cy,cx+4,cy+5);
      px(ctx,deep,cx-4,cy+5,9,4);px(ctx,color,cx-4,cy+4,9,2);
      px(ctx,'#867c91',cx-3,cy+8,7);px(ctx,'#cab29f',cx-2,cy+5,3);
    }
    for(let n=0;n<48;n++) {
      const [cx,cy]=wheel(r,n*Math.PI*2/48);
      px(ctx,n%3===0?'#e6c9a7':'#cda8a1',cx,cy,1+(n%4===0),1);
    }
    for(const leg of [-37,37]) {
      poly(ctx,base,[[x-2,y],[x+2,y],[x+leg+3,deck],[x+leg-3,deck]]);
      line(ctx,'#918290',x+(leg<0?-2:1),y+2,x+leg-2,deck);
    }
    line(ctx,'#67667d',x-26,deck-19,x+26,deck-19,2);
    oval(ctx,'#656178',x,y,7,7);oval(ctx,gilt,x,y,5,5);oval(ctx,'#e3bc96',x-1,y-1,2,2);
    for(let i=0;i<3;i++) { const ax=314+i*59;px(ctx,steel,ax,deck-25-(i%2)*7,1,26);poly(ctx,['#a27b93','#b68b83','#8492a2'][i],[[ax+1,deck-25-(i%2)*7],[ax+11,deck-22-(i%2)*7],[ax+1,deck-19-(i%2)*7]]); }
    function kiosk(left,bottom,width,height,shade) {
      const top=bottom-height;
      px(ctx,'#625e78',left,top,width,height);
      poly(ctx,shade,[[left-5,top+1],[left+4,top-7],[left+width-5,top-7],[left+width+5,top+1]]);
      px(ctx,deep,left-5,top+1,width+10,2);
      for(let j=3;j<width-3;j+=6) {
        px(ctx,j%2===0?'#ad8d94':'#b59d9c',left+j,top+5,4,4);
        px(ctx,j%2===0?'#d6af98':'#c79f97',left+j,top+9,4,2);
      }
      px(ctx,'#96818c',left+2,top+12,width-4,2);
      for(let j=5;j<width;j+=9)px(ctx,'#746a80',left+j,top+16,1,height-16);
    }
    kiosk(38,deck,65,24,'#85718b');kiosk(113,deck,43,25,'#a17c86');
    kiosk(179,deck,41,23,'#827c91');kiosk(253,deck,32,19,'#977487');kiosk(463,deck,48,22,'#987e8a');
    for(const p of [25,109,166,230,291,459,524]) {
      px(ctx,deep,p,deck-19,1,19);px(ctx,'#d8b399',p-1,deck-21,3,2);
    }
    px(ctx,'#9d8a96',0,deck,558,2);px(ctx,deep,0,deck+2,558,5);
    for(let p=8;p<552;p+=30){px(ctx,base,p,deck+7,4,9);line(ctx,steel,p+4,deck+11,p+12,deck+6);}
    tide(ctx,horizon,['#615e83','#3e4668','#7a738e'],[[26,'#d7b59c',41,8],[80,'#ce9fa4',30,21],[139,'#e2b792',53,21],[192,'#b29caa',37,16],[272,'#dfb69b',43,11],[322,'#c7a2a3',62,15],[370,'#edc5a5',69,19],[421,'#d5a09b',53,10],[491,'#d1b397',39,19],[528,'#dcc698',34,8]],774);
    // Wild reed pockets at the water's edge catch pinpoints of firefly light.
    for(const [left,width] of [[0,62],[568,72]]) {
      const random=rng(left+113);
      for(let j=0;j<width;j+=2) {
        const h=4+Math.floor(random()*16);
        line(ctx,j%6?'#4a4f66':'#5c586f',left+j,271,left+j-2-h%5,271-h);
      }
    }
    for(const [fx,fy] of [[14,222],[33,246],[70,219],[84,231],[139,243],[525,225],[553,210],[586,231],[611,209],[625,237]]) {
      glow(ctx,fx,fy,5,'#e5d79b',.25);px(ctx,'#dcca91',fx,fy);if(fx%2===0)px(ctx,'#f1ddac',fx+1,fy);
    }
  }

  function copperDepot(ctx) {
    const iron='#494861',ink='#3d4056',stone='#6c627a',edge='#8b7885',cream='#dfc59f';
    // Paved arrival courtyard, tracks disappearing around a curve, and the shallow eaves of the depot.
    px(ctx,'#5d5970',0,182,640,90);
    for(let x=0;x<640;x+=31) {px(ctx,'#635e74',x,228,15);px(ctx,'#565469',x+8,254,19);}
    for(const [y,offset] of [[216,0],[222,4],[245,22],[253,28]]) {
      const points=[[-2,y+offset*.08],[98,y-1],[190,y-2],[392,y-2],[501,y+1],[558,y+6],[610,y+15+offset*.16],[644,y+22+offset*.3]];
      for(let k=1;k<points.length;k++)line(ctx,'#8e7c86',...points[k-1],...points[k],2);
    }
    const walls=[[0,136,143],[126,117,110],[439,132,94],[535,120,110]];
    for(const [bx,by,bw] of walls) {
      px(ctx,stone,bx,by,bw,190-by);px(ctx,iron,bx-2,by-2,bw+4,4);
      px(ctx,edge,bx,by+2,bw,1);
      for(let wx=bx+8;wx<bx+bw-8;wx+=18) {
        px(ctx,iron,wx,by+8,10,14);px(ctx,'#9a8290',wx+1,by+9,3,10);px(ctx,'#ab9190',wx+5,by+9,3,10);
        px(ctx,'#796f83',wx,by+14,10);
      }
    }
    for(const p of [27,60,93,154,194,468,497,558,595]) {
      px(ctx,'#514f66',p,165,13,25);px(ctx,'#746d80',p+1,167,11,18);
      for(let by=170;by<183;by+=4)px(ctx,'#635f74',p+2,by,9);
    }
    // Ticket shelter and its hanging brass clock.
    poly(ctx,'#625b73',[[13,153],[31,143],[147,143],[155,152]]);
    px(ctx,'#96808a',13,152,144,2);px(ctx,ink,14,154,140,3);
    for(const p of [24,88,146]) {px(ctx,iron,p,156,3,57);px(ctx,edge,p,157,1,44);line(ctx,iron,p+2,166,p+12,157,2);}
    px(ctx,iron,93,157,1,5);oval(ctx,'#535066',94,169,9,9);
    oval(ctx,'#a68d87',94,169,7,7);oval(ctx,'#dfc5a8',94,169,5,5);
    line(ctx,iron,94,169,94,165);line(ctx,iron,94,169,97,171);
    px(ctx,'#6c5a69',38,199,32,3);
    for(const p of [40,66]) {px(ctx,iron,p,202,2,6);}
    // Overhead feed wire meets the tram's two-piece diamond pantograph.
    for(const p of [47,477,606]) {px(ctx,'#59556e',p,89,2,101);line(ctx,'#6c657c',p+1,98,p+22,88);}
    line(ctx,'#757087',0,89,222,96);line(ctx,'#757087',222,96,490,89);line(ctx,'#757087',490,89,639,92);
    const left=191,right=427,roofY=143;
    line(ctx,'#7e7387',295,roofY-3,321,116,2);line(ctx,'#7e7387',321,116,302,96,2);
    line(ctx,iron,304,roofY-3,332,116,2);line(ctx,iron,332,116,309,95,2);
    px(ctx,'#ad9292',296,94,22,2);px(ctx,iron,288,roofY-4,25,3);
    // One copper streetcar with a projecting rounded cab in three-quarter view.
    poly(ctx,ink,[[left,196],[left+3,168],[left+9,151],[left+20,145],[right-29,145],[right-10,151],[right-2,162],[right,191],[right-8,204],[right-23,210],[left+15,210]]);
    poly(ctx,'#996b68',[[left+2,163],[left+11,151],[left+18,147],[right-30,147],[right-16,151],[right-8,159],[right-7,195],[right-21,200],[left+7,198]]);
    px(ctx,'#a87b72',left+11,153,188,42);
    poly(ctx,'#bd8c76',[[right-35,149],[right-19,152],[right-10,159],[right-9,186],[right-16,191],[right-34,185]]);
    poly(ctx,'#645a69',[[left+1,156],[left+9,146],[left+23,141],[right-35,141],[right-19,145],[right-12,150],[right-27,148],[left+20,148],[left+10,151]]);
    px(ctx,'#a28b8c',left+17,142,180,2);
    for(const p of [209,225,240,255,286,301,316,331,346,362,377]) {
      px(ctx,iron,p,155,12,22);px(ctx,'#c49e8a',p+1,157,10,16);
      px(ctx,'#e0bf9c',p+2,157,8,4);px(ctx,'#a48482',p+1,171,10,2);
      px(ctx,iron,p,162,12);px(ctx,'#766779',p+6,165,1,8);
    }
    px(ctx,'#725e6a',268,153,14,42);
    for(const p of [270,276]) {px(ctx,iron,p,156,5,36);px(ctx,'#baa292',p+1,158,3,16);px(ctx,'#947981',p+1,180,2,8);}
    px(ctx,'#d9b895',left+13,180,184,2);px(ctx,'#805e67',left+11,184,188,1);
    for(let p=210;p<381;p+=19)px(ctx,'#c08e7a',p,191,2);
    poly(ctx,'#705f69',[[right-33,155],[right-17,157],[right-13,160],[right-13,171],[right-32,169]]);
    poly(ctx,'#d0b599',[[right-30,158],[right-20,159],[right-17,160],[right-17,167],[right-30,166]]);
    px(ctx,ink,right-34,151,18,5);px(ctx,'#dabe93',right-32,153,6);px(ctx,'#caa988',right-24,153,5);
    oval(ctx,'#766372',right-23,183,5,5);oval(ctx,cream,right-23,183,3,3);
    poly(ctx,'#6e5a65',[[right-34,189],[right-10,190],[right-13,201],[right-29,205]]);
    px(ctx,'#b99b8b',right-28,195,13,2);
    px(ctx,'#544958',left+9,198,187,6);
    for(const p of [222,243,358,379]) {oval(ctx,ink,p,205,7,6);oval(ctx,'#786a79',p,205,3,3);}
    px(ctx,'#7c6877',left+2,207,194,2);
    lamp(ctx,539,217,66,1);
    for(const [bx,by] of [[17,219],[568,222]]) {
      px(ctx,'#66596b',bx,by-11,23,11);px(ctx,'#9a7e84',bx-1,by-12,25,3);
      for(let k=0;k<5;k++){oval(ctx,'#576575',bx+3+k*4,by-13-k%2*2,4,4);px(ctx,'#ae8f93',bx+2+k*4,by-16,2,1);}
    }
  }

  function bellSquare(ctx) {
    const umber='#514b60',stone='#8a7884',stoneLit='#a18a90',slate='#605670',arch='#575269';
    const plaza=210;
    px(ctx,'#71677c',0,plaza,640,62);
    for(let y=214;y<272;y+=7+Math.floor((y-210)/16)) {
      px(ctx,'#7d7081',0,y,640);
      const width=20+Math.floor((y-210)*.45);
      for(let x=(y%3)*8;x<640;x+=width)line(ctx,'#685e74',x,y-1,x-1-(y%3),y+5,1);
    }
    const fronts=[[-18,102,71],[75,72,54],[145,91,61],[230,90,50],[312,63,55],[362,46,46],[505,79,61],[578,80,81]];
    fronts.forEach(([bx,w,h],id)=>{
      const roofY=plaza-h;
      const wall=['#837382','#756b80','#90808a','#7d7181'][id%4];
      poly(ctx,wall,[[bx,roofY+5],[bx+w*.48,roofY-19],[bx+w,roofY+5],[bx+w,plaza],[bx,plaza]]);
      poly(ctx,slate,[[bx-4,roofY+7],[bx+w*.48,roofY-22],[bx+w+3,roofY+7],[bx+w-3,roofY+9],[bx+w*.48,roofY-15],[bx+2,roofY+9]]);
      for(const j of [5,w/2,w-5])px(ctx,'#6a596d',bx+j,roofY+7,2,h-7);
      line(ctx,'#6a596d',bx+6,roofY+9,bx+w-6,roofY+26,2);
      line(ctx,'#6a596d',bx+w-6,roofY+9,bx+6,roofY+26,2);
      px(ctx,'#695d71',bx,roofY+28,w,3);
      for(let j=13;j<w-10;j+=17) {
        px(ctx,arch,bx+j,roofY+11,8,12);px(ctx,'#baa090',bx+j+1,roofY+12,6,9);
        px(ctx,slate,bx+j+4,roofY+12,1,10);px(ctx,slate,bx+j+1,roofY+16,6,1);
      }
      px(ctx,'#5c5267',bx+8,plaza-21,w-16,21);
      for(let j=12;j<w-14;j+=14){px(ctx,'#a48a87',bx+j,plaza-18,10,13);px(ctx,'#ceac92',bx+j,plaza-18,10,3);}
      for(let j=5;j<w-5;j+=6) {const c=(j-5)%12?'#a78a92':'#8d7388';poly(ctx,c,[[bx+j+1,plaza-27],[bx+j+6,plaza-27],[bx+j+8,plaza-22],[bx+j,plaza-22]]);}
    });
    // The campanile is cut from rose-grey stone. Its west bell hangs in a lit, open belfry.
    const x=442;
    px(ctx,'#75697c',x-24,97,49,114);px(ctx,stone,x-23,97,34,114);
    px(ctx,stoneLit,x-21,99,3,104);px(ctx,'#95828d',x+13,98,2,106);
    for(let y=101;y<205;y+=9) {
      px(ctx,'#7e7180',x-20,y,31);
      px(ctx,'#877687',x+13,y,9);
      px(ctx,'#7d7180',x-18+(y%3)*9,y+1,1,8);
    }
    px(ctx,'#665d73',x-27,106,55,5);px(ctx,'#b19b9b',x-28,105,57,2);px(ctx,'#9b8490',x-24,111,50,2);
    px(ctx,'#6b6177',x-23,69,46,36);px(ctx,stoneLit,x-22,72,3,32);
    function archway(cx,bottom,w,h) {
      const rad=Math.floor(w/2),centerY=bottom-h+rad;
      oval(ctx,arch,cx,centerY,rad,rad);px(ctx,arch,cx-rad,centerY,w,bottom-centerY);
      px(ctx,'#a78a91',cx-rad-1,centerY,1,bottom-centerY);px(ctx,'#a78a91',cx+rad,centerY,1,bottom-centerY);
    }
    for(const cx of [x-10,x+9]) {
      archway(cx,103,16,29);
      px(ctx,'#a08c8b',cx-6,82,12,2);px(ctx,'#bf9a83',cx-1,84,2,3);
      poly(ctx,'#b29888',[[cx-1,86],[cx+1,86],[cx+4,89],[cx+4,94],[cx+6,97],[cx-6,97],[cx-4,94],[cx-4,89]]);
      px(ctx,'#d7b49a',cx-3,89,2,5);
      px(ctx,'#c5a790',cx-6,96,13,2);px(ctx,'#806d79',cx,98,2,2);
    }
    px(ctx,slate,x-27,68,54,4);px(ctx,'#a78a91',x-25,67,50,2);
    poly(ctx,slate,[[x-26,68],[x-18,61],[x-13,56],[x-9,53],[x-5,44],[x-1,40],[x+2,40],[x+6,46],[x+9,54],[x+14,57],[x+18,62],[x+25,67]]);
    line(ctx,'#9a8794',x-22,65,x-13,58);line(ctx,'#917e90',x-13,58,x-6,48);
    px(ctx,umber,x-1,34,3,9);px(ctx,'#c6a093',x,30,1,5);px(ctx,'#ba9b96',x-2,32,5);
    oval(ctx,'#6a6073',x-3,130,12,12);oval(ctx,'#ac9290',x-3,130,10,10);
    oval(ctx,'#cbaf9b',x-3,130,8,8);
    for(const [dx,dy] of [[-7,0],[7,0],[0,-7],[0,7]])px(ctx,'#8c7681',x-3+dx,130+dy);
    line(ctx,'#716271',x-3,130,x-3,124);line(ctx,'#716271',x-3,130,x+1,132);
    px(ctx,'#a0888c',x-25,151,51,2);px(ctx,'#6a5e73',x-25,153,51,2);
    archway(x-4,209,19,34);px(ctx,'#847282',x-10,189,13,18);px(ctx,'#6d5c71',x-4,188,1,19);
    px(ctx,'#af9694',x-29,207,59,3);px(ctx,'#807482',x-32,210,65,3);
    // Small fountain with an amber copper finial, a carved bowl and separate streams.
    const f=180;
    oval(ctx,'#615d76',f,228,42,9);oval(ctx,'#a39098',f,226,41,7);
    oval(ctx,'#66778a',f,225,36,4);oval(ctx,'#87929c',f-6,225,22,2);
    px(ctx,'#6d677d',f-4,207,8,16);px(ctx,'#a39196',f-3,207,2,15);
    poly(ctx,'#8e8090',[[f-19,202],[f+19,202],[f+15,207],[f+5,210],[f-5,210],[f-15,207]]);
    oval(ctx,'#a99aa0',f,202,20,4);oval(ctx,'#7c8d9b',f,201,16,2);
    px(ctx,'#9b8c94',f-2,185,4,16);oval(ctx,'#b6a09c',f,184,3,4);
    for(const dir of [-1,1]) {
      let ax=f,ay=186;
      for(let i=1;i<=9;i++){const t=i/9,dx=f+dir*t*10,dy=186-20*t+33*t*t;line(ctx,'#b8afb6',ax,ay,dx,dy);ax=dx;ay=dy;}
      for(const k of [12,16]){px(ctx,'#9ea9b3',f+dir*k,206,1,13-(k%5));px(ctx,'#bdafb6',f+dir*k,221,2);}
    }
    lamp(ctx,58,220,53,0);lamp(ctx,539,217,45,0);
    // A market bucket and clusters of cut blooms sit beside the last shop.
    for(let k=0;k<3;k++){const ex=565+k*13,ey=218-k%2*2;poly(ctx,'#756a7e',[[ex-4,ey-7],[ex+5,ey-7],[ex+3,ey],[ex-3,ey]]);
      for(let j=0;j<4;j++){const dx=ex-5+j*3,dy=ey-12-(j*7+k)%5;line(ctx,'#637473',ex,ey-5,dx,dy);px(ctx,j%2?'#c09b9e':'#a78aa3',dx-1,dy,3,2);}}
  }
  // The last two sets span first light. Independent sky tones keep the earlier ten
  // moonlit cards identical when a player returns to the first half of the walk.
  function dawnSky(ctx,level,side){
    const morning=level===19,random=rng(281+level*51);
    const zenith=morning?(side?'#a29cc0':'#9799bd'):(side?'#635c85':'#585c85');
    const middle=morning?'#f2bcb5':'#b18aa3', horizon=morning?'#ffe3b9':'#f6bdad';
    for(let y=0;y<HEIGHT;y+=3){
      const t=Math.min(y/141,1),col=t<.52?mix(zenith,middle,t/.52):mix(middle,horizon,(t-.52)/.48);
      px(ctx,col,0,y,WIDTH,3);
      if(y<134)for(let i=0;i<7;i++)px(ctx,col,random()*WIDTH,y-1,1+Math.floor(random()*12),1);
    }
    const stars=morning?7:27;
    for(let i=0;i<stars;i++){const x=Math.round(random()*640),y=Math.round(random()*(morning?31:64));px(ctx,morning?'#d1bbca':'#b8a2b8',x,y);}
    const cx=morning?337:512,cy=morning?99:118,r=morning?17:11;
    glow(ctx,cx,cy,r*2.8,morning?'#fce6c0':'#ffd5ac',.37);
    oval(ctx,morning?'#fff0ca':'#f7d9b7',cx,cy,r,r);
    for(const [i,[x,y,w]] of [[-13,77,75],[41,45,89],[144,58,64],[223,31,83],[271,98,93],[368,68,72],[439,42,68],[506,87,96],[584,58,81]].entries()){
      const y0=y+(morning?0:6),col=morning?'#e4adad':'#938099',lit=morning?'#ffd4bc':'#cf9caa';
      poly(ctx,col,[[x,y0+7],[x+w*.12,y0+5],[x+w*.25,y0+5],[x+w*.35,y0+1],[x+w*.43,y0],[x+w*.51,y0+2],[x+w*.57,y0+2],[x+w*.65,y0+5],[x+w*.83,y0+5],[x+w,y0+8],[x+w*.47,y0+8],[x+w*.32,y0+9]]);
      px(ctx,lit,x+w*.20,y0+8,w*.58,1);px(ctx,lit,x+w*.39,y0+9,w*.23,1);
      if(i%2===0)px(ctx,lit,x+w+4,y0+8,8,1);
    }
    const far=morning?'#d4a5ae':'#a587a0',ridges=morning?'#bd9bac':'#927e98';
    poly(ctx,far,[[-2,131],[22,126],[40,127],[71,120],[90,121],[115,113],[132,118],[154,120],[175,116],[203,125],[220,122],[247,126],[273,119],[303,122],[326,118],[341,119],[368,112],[403,123],[429,119],[452,110],[471,115],[507,106],[543,117],[569,112],[599,118],[625,111],[642,114],[642,273],[-2,273]]);
    poly(ctx,ridges,[[-2,143],[29,134],[48,137],[76,130],[96,131],[115,125],[136,129],[176,128],[209,139],[241,134],[263,139],[284,133],[311,138],[343,125],[370,131],[391,129],[417,137],[450,127],[482,124],[506,132],[539,127],[573,136],[606,125],[642,123],[642,273],[-2,273]]);
    distantCity(ctx,level,morning?159:164,morning?'#bd9daa':'#94849b',morning?'#a58e9e':'#81778f');
  }
  function postPlane(ctx,x,y,s,col){
    const [paper,fold,back]=col;
    const pts=points=>points.map(([a,b])=>[x+a*s,y+b*s]);
    poly(ctx,paper,pts([[0,0],[40,-10],[20,12],[16,4]]));
    poly(ctx,back,pts([[0,0],[40,-10],[16,4]]));
    poly(ctx,fold,pts([[16,4],[40,-10],[18,10],[17,14]]));
    line(ctx,paper,x+2*s,y,x+39*s,y-10*s);
  }
  function airmail(ctx){
    // A curved corrugated hangar doubles as a postal sorting office. Its open bay
    // holds a folded aircraft with its nose turned towards the brightening runway.
    const r=rng(1408), base=206;
    px(ctx,'#89849a',0,194,640,78);px(ctx,'#aa94a4',0,194,640,2);
    poly(ctx,'#77788f',[[0,216],[205,204],[422,199],[640,204],[640,215],[390,210],[190,216],[0,234]]);
    poly(ctx,'#948b9c',[[35,263],[288,224],[450,210],[640,208],[640,219],[466,218],[302,234],[75,272],[0,272]]);
    // Runway guide lights turn into little apricot dots towards the horizon.
    for(let i=0;i<24;i++){const x=8+i*29,y=Math.round(226-(x/640)*20);px(ctx,'#645f79',x,y,3,2);px(ctx,'#e2b99d',x,y-1,3,1);}
    for(let i=0;i<46;i++){const x=r()*640,y=218+r()*54;px(ctx,'#858195',x,y,2+r()*8,1);}
    // Front-facing brick/post envelope wing, canopy with a blue and coral airmail trim.
    px(ctx,'#82788a',16,141,99,59);px(ctx,'#6b657e',15,141,12,59);
    px(ctx,'#a1909f',14,139,103,3);px(ctx,'#626079',15,142,101,3);
    px(ctx,'#6b687f',20,154,91,39);px(ctx,'#b2a0a2',27,159,43,24);
    for(let x=30;x<66;x+=9){px(ctx,'#d2b7a6',x,159,6,19);px(ctx,'#e3c1ab',x,159,6,4);}
    px(ctx,'#938697',26,174,44,2);px(ctx,'#a998a2',78,155,19,36);px(ctx,'#cdb0a5',82,158,11,16);
    px(ctx,'#d9b89d',91,182,2,2);px(ctx,'#b098a4',15,149,101,2);
    for(let i=0;i<18;i++)poly(ctx,i%2?'#7f85a1':'#c88e92',[[16+i*5.5,150],[20+i*5.5,150],[22+i*5.5,154],[18+i*5.5,154]]);
    // Panels follow the barrel roof's curve; the side recedes towards a smaller curved roof.
    const cx=209,roofBase=153,rx=87,ry=42;
    poly(ctx,'#687089',[[cx,roofBase-ry],[cx+59,roofBase-ry-8],[cx+140,roofBase-5],[cx+140,192],[cx+rx,202],[cx+28,185]]);
    for(let j=9;j<141;j+=10)line(ctx,'#82829b',cx+j,138-j*.12,cx+j,193-j*.03);
    for(let x=-rx;x<=rx;x++){
      const rise=Math.sqrt(Math.max(0,1-(x/rx)**2))*ry;
      const y=roofBase-Math.round(rise),lit=x<0?'#9b93a4':'#89869b';
      px(ctx,lit,cx+x,y,1,base-y);px(ctx,'#c3a9af',cx+x,y,1,2);
      if((x+rx)%8===0)px(ctx,x<0?'#b3a2ae':'#a29aa8',cx+x,y+3,1,Math.max(1,base-y-4));
    }
    // Simplified shape of the hangar entrance with the partly-raised sectional door.
    poly(ctx,'#615f78',[[cx-65,base],[cx-65,149],[cx-49,136],[cx-29,129],[cx+22,129],[cx+47,135],[cx+62,147],[cx+62,base]]);
    poly(ctx,'#6f6a82',[[cx-59,base],[cx-59,152],[cx-42,142],[cx-28,138],[cx+20,138],[cx+41,143],[cx+57,153],[cx+57,base]]);
    for(let x=cx-57;x<cx+53;x+=17)px(ctx,'#797388',x,155,3,45);
    for(let i=0;i<3;i++)px(ctx,'#a89ba9',cx-44+i*3,140-i*3,86-i*6,1);
    px(ctx,'#858193',cx-66,200,128,4);px(ctx,'#b39aaa',cx-86,203,172,2);
    px(ctx,'#796e85',184,115,48,12);px(ctx,'#b29da8',184,115,48,1);afterhoursSign(ctx,'AIR MAIL',192,119,'#ecd0b5');
    // The large display aircraft is literally folded from blush air-mail paper.
    postPlane(ctx,167,166,1.9,['#e0c0b5','#aa8f9d','#c3a6aa']);
    px(ctx,'#766c81',200,188,4,13);px(ctx,'#8d7f91',220,183,3,18);px(ctx,'#958994',191,200,44,2);
    for(const x of [139,274]){px(ctx,'#746778',x,192,6,11);px(ctx,'#bf9a91',x+1,193,4,3);}
    // Compact control tower and a classic striped windsock.
    const tx=446;
    px(ctx,'#817a8e',tx-8,143,16,53);px(ctx,'#a296a3',tx-7,143,4,53);
    poly(ctx,'#68687f',[[tx-15,127],[tx+15,127],[tx+12,144],[tx+6,150],[tx-7,149],[tx-13,143]]);
    poly(ctx,'#b1a2ae',[[tx-12,127],[tx+13,127],[tx+10,138],[tx-10,138]]);
    px(ctx,'#74788f',tx-4,128,2,10);px(ctx,'#78798d',tx+4,128,1,10);
    px(ctx,'#63647d',tx-17,125,34,3);px(ctx,'#b49ca9',tx-16,124,32,2);px(ctx,'#917f93',tx,109,1,15);px(ctx,'#e7aa9f',tx-1,109,3,2);
    const wx=368,wy=151;px(ctx,'#7d7588',wx,wy-42,2,70);px(ctx,'#a7929e',wx-1,wy-43,4,3);
    const bands=['#dfafa1','#e4c8b5','#c78d90','#e2c1b0','#c18a90'];
    for(let i=0;i<5;i++)poly(ctx,bands[i],[[wx+1+i*5,wy-42+i*.6],[wx+6+i*5,wy-42+(i+1)*.6],[wx+6+i*5,wy-33-(i+1)*.7],[wx+1+i*5,wy-33-i*.7]]);
    // Mail trolleys are loaded for the morning route. A few letters rest against the baskets.
    for(const [x,y] of [[94,196],[321,199],[508,193]]){
      px(ctx,'#6e677d',x,y+5,27,3);px(ctx,'#736c7e',x+2,y+8,4,3);px(ctx,'#736c7e',x+21,y+8,4,3);
      px(ctx,'#b79c96',x+1,y-5,14,10);px(ctx,'#c6aaa0',x+3,y-3,10,4);px(ctx,'#9c848c',x+7,y-5,2,10);
      px(ctx,'#b8a7ae',x+16,y-3,9,7);line(ctx,'#8f8298',x+16,y-3,x+20,y);line(ctx,'#8f8298',x+20,y,x+24,y-3);
    }
    // A gate, a fingerboard and distant lighting masts trace the airfield perimeter.
    for(const x of [386,521,602]){px(ctx,'#817a90',x,154,2,39);px(ctx,'#817a90',x-7,151,15,3);px(ctx,'#d4ada3',x-6,154,4,2);px(ctx,'#d4ada3',x+3,154,4,2);}
    px(ctx,'#736b81',562,141,3,58);poly(ctx,'#a48b98',[[553,149],[577,149],[581,153],[577,156],[553,156]]);px(ctx,'#d6b8ac',556,151,13,1);
    postPlane(ctx,555,72,.55,['#cfb4bd','#a294ac','#b6a9ba']);
  }

  function overlookBranch(ctx,origin,mirror){
    const x=u=>origin+mirror*u;
    const wood='#72637f',bark='#967d8b', foliage=['#9e8498','#b594a2','#cca3aa','#dfb4b3','#e5bfba'];
    const arms=[ [0,147,6,119,7],[6,119,16,96,5],[15,96,25,81,4],[20,90,42,77,3],[38,78,64,72,2],[17,96,7,78,3],[9,83,1,64,2],[25,81,34,65,2],[31,70,48,60,1],[6,119,32,106,3],[32,106,44,96,2],[44,96,56,91,1] ];
    for(const [a,b,c,d,n] of arms){line(ctx,wood,x(a),b,x(c),d,n);if(n>2)line(ctx,bark,x(a+2),b,x(c+1),d,1);}
    const r=rng(mirror<0?675:963);
    const clusters=[[1,64,19,9],[8,78,21,12],[26,70,20,10],[42,62,18,11],[58,69,18,9],[70,72,12,7],[37,80,16,8],[47,93,15,8],[18,91,14,9],[0,88,13,8]];
    for(const [cx,cy,rx,ry] of clusters){
      oval(ctx,foliage[0],x(cx),cy,rx,ry);
      for(let i=0;i<42;i++){
        const a=r()*Math.PI*2,t=Math.sqrt(r()),dx=Math.cos(a)*rx*t,dy=Math.sin(a)*ry*t;
        const shade=Math.max(0,Math.min(4,Math.floor(2.6-dy/ry+r()*1.5)));
        oval(ctx,foliage[shade],x(cx+dx),cy+dy,1+r()*3,1+r()*1.4);
      }
    }
  }
  function firstlight(ctx){
    const r=rng(62019);
    // At the end of the walk, morning light reaches the river before it reaches the rooftops.
    const waterY=179;
    for(let y=waterY;y<236;y+=2)px(ctx,mix('#c5a5ac','#9b91a7',(y-waterY)/57),0,y,640,2);
    px(ctx,'#d2b4b4',0,waterY,640,1);
    for(let i=0;i<190;i++){
      const x=r()*640,y=waterY+1+r()*50;
      const glint=Math.abs(x-337)<(y-waterY)*1.26+8;
      px(ctx,glint?(i%2?'#f1c5b1':'#e3b9b0'):(i%2?'#b69da9':'#c4a5ad'),x,y,2+r()*(glint?11:7),1);
    }
    // Traces of last night's lamps run along the far embankment below the waking city.
    px(ctx,'#9f8e9e',0,177,640,2);
    for(let x=2;x<640;x+=12){const y=174+Math.round(r()*2);px(ctx,'#a68f9d',x,y,1,179-y);if(r()>.7)px(ctx,'#e2b79f',x-1,y-1,3);}
    // A gently arched footbridge with five open bays and a lattice rail.
    const curve=x=>Math.round(182-8*Math.sin(Math.PI*(x-216)/179));
    for(let x=216;x<396;x++){
      const y=curve(x);px(ctx,'#9b8496',x,y,1,4);px(ctx,'#c1a1a7',x,y,1,1);
      if((x-216)%32<4)px(ctx,'#988897',x,y+4,1,192-y-4);
      if((x-216)%7===0)px(ctx,'#a08b9a',x,y-5,1,5);
      px(ctx,'#b599a3',x,y-5,1,1);
    }
    // Spires and tall bay windows catch the warm sun; most windows have gone dark.
    for(const [x,y,w,h] of [[76,143,25,31],[153,148,17,26],[391,143,19,31],[492,132,21,42],[532,148,25,26]]){
      px(ctx,'#aa909f',x,y,w,h);px(ctx,'#bda0a8',x,y,w*.44,h);
      poly(ctx,'#ac90a2',[[x-2,y],[x+w*.5,y-9],[x+w+2,y]]);
      px(ctx,'#aa8d9e',x+w*.5,y-13,1,5);
      for(let wx=x+3;wx<x+w-2;wx+=5)for(let wy=y+3;wy<y+h-2;wy+=6)px(ctx,r()>.86?'#e0bba8':'#95899e',wx,wy,2,3);
    }
    // Sunlit balustrade and terrace laid with long rose-limestone bands.
    px(ctx,'#a38d9d',0,233,640,39);px(ctx,'#c3a6aa',0,233,640,3);
    for(let y=246;y<272;y+=12){px(ctx,'#b097a2',0,y,640,1);for(let x=(y%3)*23;x<640;x+=68)line(ctx,'#948596',x,y-10,x-8,y);}
    const railY=x=>Math.round(211+4*Math.cos((x+28)/110));
    for(let x=0;x<640;x++){
      const y=railY(x);px(ctx,'#8e7e90',x,y,1,3);px(ctx,'#c3a5a7',x,y-1,1,1);
      px(ctx,'#ad94a0',x,y+18,1,3);px(ctx,'#c2a4aa',x,y+18,1,1);
    }
    for(let x=8;x<640;x+=15){const y=railY(x)+3;
      px(ctx,'#ad959f',x-2,y,6,2);px(ctx,'#ba9fa6',x-1,y+2,4,3);
      px(ctx,'#a08898',x,y+5,2,5);px(ctx,'#af94a0',x-1,y+10,4,3);px(ctx,'#ae939c',x-2,y+13,6,3);
    }
    for(const x of [17,122,243,366,486,610]){
      const y=railY(x)-2;px(ctx,'#947e91',x-3,y,8,22);px(ctx,'#b39aa2',x-2,y+1,4,19);px(ctx,'#bb9fa5',x-5,y-2,12,4);px(ctx,'#cfb2af',x-5,y-2,12,1);
    }
    // The two-seater bench at the overlook faces the sun.
    // The couple can reach the upper terrace from either path. A low wall silhouettes
    // the waiting bench against the far shore and keeps its legs aligned to the landing.
    poly(ctx,'#a88e9d',[[423,182],[453,174],[640,174],[640,186],[423,186]]);
    line(ctx,'#d2afac',424,181,454,174,1);px(ctx,'#c5a4a8',454,174,186,1);
    for(let x=461;x<640;x+=15){px(ctx,'#a48a99',x,167,2,7);}
    px(ctx,'#b99da4',458,166,182,2);
    const bx=521,by=163;
    for(const x of [bx-25,bx+24]){line(ctx,'#766a80',x,by-2,x+2,by+18,2);line(ctx,'#766a80',x+1,by+11,x-2,by+19,2);}
    for(let i=0;i<3;i++){px(ctx,'#947889',bx-31,by+i*3,62,2);px(ctx,'#c09b9d',bx-30,by+i*3,60,1);}
    px(ctx,'#927789',bx-32,by+9,64,3);px(ctx,'#c29e9e',bx-32,by+9,64,1);
    // A scenic viewpoint telescope and a small trail of flowers frame the final walk.
    const tx=131;px(ctx,'#7f738c',tx,195,3,34);px(ctx,'#ab909a',tx,195,1,32);px(ctx,'#978297',tx-4,228,11,2);
    line(ctx,'#7f748a',tx-7,196,tx+9,190,4);line(ctx,'#b7a1aa',tx-8,194,tx+9,188,2);px(ctx,'#8b7c90',tx+8,188,3,6);
    for(const [x,y,w] of [[5,221,37],[66,225,30],[317,225,28],[545,220,40],[606,219,27]]){
      px(ctx,'#aa8994',x,y,w,9);px(ctx,'#b9979c',x-1,y,w+2,2);
      for(let i=0;i<w;i+=2){const yy=y-1-Math.floor(r()*5);px(ctx,i%4?'#8b9291':'#a2a28d',x+i,yy,2,y-yy);
        if(r()>.24){px(ctx,i%4?'#d8a7aa':'#e2bdb4',x+i-1,yy-1,3,2);}}
    }
    overlookBranch(ctx,-3,1);overlookBranch(ctx,644,-1);
    for(let i=0;i<16;i++){const y=81+r()*111,x=i%2?r()*65:640-r()*59;px(ctx,i%3?'#e0b6b4':'#c5a0ae',x,y,2,1);}
    for(const [x,y] of [[219,69],[229,67],[424,78],[434,73]]){
      px(ctx,'#ac94a5',x-2,y-1,2,1);px(ctx,'#ac94a5',x,y,2,1);px(ctx,'#ac94a5',x+2,y-1,2,1);
    }
  }
  const painters=[residential,bookshop,park,alley,harbor,bridge,rooftop,station,observatory,promenade,
    market,vinylArcade,glasshouse,fireflyPier,rainlight,kiteHill,copperDepot,bellSquare,airmail,firstlight];
  function background(ctx,levelIndex=0,time=0,side=0){
    const level=Math.max(0,Math.min(painters.length-1,Math.trunc(levelIndex)||0)),flip=side?1:0;
    const key=level*2+flip;
    if(!backgrounds.has(key)){
      if(backgrounds.size>=4)backgrounds.delete(backgrounds.keys().next().value);
      const c=layer(WIDTH,HEIGHT),g=c.getContext('2d');
      if(level>=18)dawnSky(g,level,flip);else sky(g,level,flip);
      painters[level](g);
      backgrounds.set(key,c);
    }
    ctx.drawImage(backgrounds.get(key),0,0);
    if(reducedMotion)return;
    const t=Number.isFinite(time)?time:0;
    // Garden fireflies and rippling lights stay behind the characters. No collision overlays.
    if(level===2||level===12||level===13){
      for(let i=0;i<6;i++)if(Math.sin(t*1.36+i)>0){const x=i*95+49+Math.sin(t*.42+i)*4,y=209-i%3*8+Math.sin(t*.82+i)*2;px(ctx,'#c7b892',x,y,2,1);}
    }else if([4,5,9].includes(level)){
      const count=level===9?5:8;
      for(let i=0;i<count;i++)if(Math.sin(t*.86+i*2)>.32){const x=32+i*77+Math.sin(t*.91+i)*2,y=194+(i*13)%41;px(ctx,'#9b8d9d',x,y,2+(i%3),1);}
    }else if(level===14){
      for(let i=0;i<10;i++){
        const x=Math.round((31+i*67+9*Math.sin(i)-t*11)%WIDTH+WIDTH)%WIDTH;
        const y=Math.round((i*49+t*55)%216+22);
        line(ctx,'#8e849c',x,y,x-1,y+3);
      }
    }else if(level===19){
      for(let i=0;i<5;i++){
        const drift=(i*27+t*3)%112,x=i%2?600-drift*.48:14+drift*.52;
        px(ctx,'#dbadad',x+Math.sin(t+i)*3,83+drift,2);
      }
    }else if(level===8){
      const phase=(t+2)%17;if(phase<.65){const x=213+phase*65,y=33+phase*21;line(ctx,'#9f99ac',x-6,y-2,x,y);px(ctx,'#c9bcc5',x,y);}
    }
  }
  function platform(ctx,x,y,w,height,seed=0,type='ground',levelIndex=0){
    const level=Math.max(0,Math.min(painters.length-1,Math.trunc(levelIndex)||0));
    const width=Math.max(2,Math.round(w)),h=Math.max(3,Math.min(HEIGHT+10,Math.round(height)));
    const left=x<=0,right=x+w>=WIDTH,s=Number.isFinite(seed)?Math.round(seed):0;
    const key=[width,h,s,type,level,left,right].join('/');
    if(!tiles.has(key)){
      if(tiles.size>=120)tiles.delete(tiles.keys().next().value);
      const c=layer(width+4,h+15),g=c.getContext('2d');g.translate(2,9);
      if(level===4)dock(g,width,h,s,type==='ribbon');
      else if(level===13&&type==='ground')dock(g,width,h,s,false,level);
      else if(type==='ribbon'||type==='heart')paper(g,width,h,level);
      else if([5,7,16,18].includes(level))truss(g,width,h,level);
      else stone(g,width,h,s,level,left,right);
      tiles.set(key,c);
    }
    ctx.drawImage(tiles.get(key),Math.round(x)-2,Math.round(y)-9);
  }
  window.Scenery=Object.freeze({background,platform,locations});
})();
