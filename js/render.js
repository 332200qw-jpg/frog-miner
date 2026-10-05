function drawText(txt, x, y, size, color, stroke){
  ctx.font = size + 'px ' + FONT;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, size / 9);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke || 'rgba(0,0,0,0.55)';
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = color;
  ctx.fillText(txt, x, y);
}
function roundRect(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* 确定性伪随机（草叶/小花的位置与高度每帧一致，不闪烁） */
function hashN(i){ var x = Math.sin(i * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x); }

function drawCloud(x, y, s){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  var puffs = [[0, 0, 24, 15], [20, -8, 19, 13], [42, -2, 22, 14], [21, 5, 28, 13]];
  for(var i = 0; i < puffs.length; i++){
    ctx.beginPath(); ctx.ellipse(puffs[i][0], puffs[i][1], puffs[i][2], puffs[i][3], 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawBg(){
  var t = performance.now() / 1000;
  /* 天空 */
  var sky = ctx.createLinearGradient(0, 0, 0, 152);
  sky.addColorStop(0, '#8ec9ff'); sky.addColorStop(1, '#e9f7ff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 152);
  /* 太阳 + 光晕 */
  var sunGlow = ctx.createRadialGradient(108, 42, 6, 108, 42, 60);
  sunGlow.addColorStop(0, 'rgba(255,244,190,0.95)');
  sunGlow.addColorStop(0.35, 'rgba(255,232,140,0.55)');
  sunGlow.addColorStop(1, 'rgba(255,232,140,0)');
  ctx.fillStyle = sunGlow; ctx.beginPath(); ctx.arc(108, 42, 60, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffef9e';
  ctx.beginPath(); ctx.arc(108, 42, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(101, 35, 7, 0, Math.PI * 2); ctx.fill();
  /* 流云（速度各异，缓慢飘过） */
  drawCloud(((t * 7 + 80) % (W + 260)) - 130, 30, 1.0);
  drawCloud(((t * 4.5 + 520) % (W + 280)) - 140, 74, 0.72);
  drawCloud(((t * 5.5 + 900) % (W + 300)) - 150, 12, 0.5);
  /* 远山剪影（两层，近深远淡） */
  ctx.fillStyle = 'rgba(126,180,140,0.55)';
  ctx.beginPath(); ctx.moveTo(0, 152);
  ctx.quadraticCurveTo(120, 96, 260, 152);
  ctx.quadraticCurveTo(380, 108, 520, 152);
  ctx.quadraticCurveTo(660, 100, 800, 152);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(88,150,104,0.6)';
  ctx.beginPath(); ctx.moveTo(0, 152);
  ctx.quadraticCurveTo(180, 116, 360, 152);
  ctx.quadraticCurveTo(560, 112, 800, 152);
  ctx.closePath(); ctx.fill();
  /* 草地：渐变 + 草叶 + 小花 */
  var grass = ctx.createLinearGradient(0, 130, 0, 158);
  grass.addColorStop(0, '#71c45c'); grass.addColorStop(0.7, '#4f9a44'); grass.addColorStop(1, '#3f8038');
  ctx.fillStyle = grass; ctx.fillRect(0, 132, W, 26);
  ctx.strokeStyle = 'rgba(46,110,42,0.8)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for(var gi = 0; gi < 58; gi++){
    var gx = gi * 14 + hashN(gi) * 9;
    var gh = 4 + hashN(gi + 100) * 6;
    var lean = (hashN(gi + 200) - 0.5) * 5;
    ctx.beginPath(); ctx.moveTo(gx, 135); ctx.lineTo(gx + lean, 135 - gh); ctx.stroke();
  }
  for(var fi = 0; fi < 9; fi++){
    var fx = 20 + fi * 88 + hashN(fi + 300) * 40, fy = 139 + hashN(fi + 400) * 12;
    var fc = ['#ffd1e8', '#fff6c9', '#ffb3a7'][fi % 3];
    ctx.fillStyle = fc;
    for(var pi = 0; pi < 4; pi++){
      var pa = pi * Math.PI / 2 + fi;
      ctx.beginPath(); ctx.arc(fx + Math.cos(pa) * 2.4, fy + Math.sin(pa) * 2.4, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f5a623';
    ctx.beginPath(); ctx.arc(fx, fy, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  /* 土层：渐变 + 层理 + 顶部透光 + 底部暗角 */
  var soil = ctx.createLinearGradient(0, 158, 0, H);
  soil.addColorStop(0, '#8a5a2b'); soil.addColorStop(0.5, '#7a4a21'); soil.addColorStop(1, '#4d2f14');
  ctx.fillStyle = soil; ctx.fillRect(0, 158, W, H - 158);
  ctx.fillStyle = 'rgba(255,226,160,0.10)'; ctx.fillRect(0, 158, W, 5);
  for(var si = 0; si < 3; si++){
    var sy = 268 + si * 112;
    ctx.fillStyle = 'rgba(0,0,0,0.055)'; ctx.fillRect(0, sy, W, 26);
    ctx.fillStyle = 'rgba(255,220,150,0.035)'; ctx.fillRect(0, sy - 3, W, 3);
  }
  var shaft = ctx.createRadialGradient(400, 160, 20, 400, 160, 300);
  shaft.addColorStop(0, 'rgba(255,240,200,0.14)');
  shaft.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = shaft; ctx.fillRect(100, 158, 600, 320);
  var vg = ctx.createLinearGradient(0, H - 130, 0, H);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.26)');
  ctx.fillStyle = vg; ctx.fillRect(0, H - 130, W, 130);
  for(var i = 0; i < G.deco.length; i++){
    var d = G.deco[i];
    if(d.c === 'root'){
      ctx.strokeStyle = 'rgba(40,22,8,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(d.x, d.y);
      ctx.quadraticCurveTo(d.x + Math.cos(d.ang) * d.len * 0.5, d.y - 10, d.x + Math.cos(d.ang) * d.len, d.y - 18);
      ctx.stroke();
    } else {
      ctx.fillStyle = d.c;
      ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawHouse(){
  var hx = 490; // 房子固定不动
  var t = performance.now() / 1000;
  /* 烟囱 + 炊烟（三团循环上升，淡出） */
  ctx.fillStyle = '#5d3a20';
  ctx.fillRect(hx + 34, 22, 14, 26);
  ctx.fillStyle = '#472a14';
  ctx.fillRect(hx + 32, 20, 18, 6);
  for(var p = 0; p < 3; p++){
    var ph = ((t * 0.32 + p / 3) % 1);
    var py = 18 - ph * 34;
    var px = hx + 41 + Math.sin(ph * 5 + p * 2.1) * (3 + ph * 6);
    ctx.fillStyle = 'rgba(240,235,225,' + (0.34 * (1 - ph)).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(px, py, 3.5 + ph * 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#8a4b22';
  ctx.beginPath(); ctx.moveTo(hx - 72, 66); ctx.lineTo(hx + 72, 66); ctx.lineTo(hx, 38); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a05c2a';
  ctx.beginPath(); ctx.moveTo(hx - 72, 66); ctx.lineTo(hx + 72, 66); ctx.lineTo(hx, 44); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6b4226';
  roundRect(hx - 58, 66, 116, 64, 6); ctx.fill();
  ctx.fillStyle = '#57321a';
  roundRect(hx - 58, 66, 116, 12, 6); ctx.fill();
  /* 门 */
  ctx.fillStyle = '#4a2c14';
  roundRect(hx - 48, 96, 18, 34, 5); ctx.fill();
  ctx.fillStyle = '#caa44e';
  ctx.beginPath(); ctx.arc(hx - 34, 113, 1.8, 0, Math.PI * 2); ctx.fill();
  /* 窗户：暖光轻微呼吸 */
  var glow = 0.85 + 0.15 * Math.sin(t * 1.8);
  ctx.fillStyle = 'rgba(255,233,160,' + glow.toFixed(3) + ')';
  roundRect(hx - 20, 80, 40, 28, 5); ctx.fill();
  ctx.strokeStyle = '#57321a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(hx, 80); ctx.lineTo(hx, 108); ctx.moveTo(hx - 20, 94); ctx.lineTo(hx + 20, 94); ctx.stroke();
  ctx.fillStyle = '#3a2410';
  ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y + 3, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#caa44e';
  ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y + 3, 4, 0, Math.PI * 2); ctx.fill();
}

function drawDandan(){
  var x = G.dandanX, y = G.dandanY;
  // 高兴连跳两下：0.5 秒内两个抛物线
  if(G.dandanJump > 0){
    var jp = 1 - G.dandanJump / 0.5; // 0..1
    var jump = Math.abs(Math.sin(jp * Math.PI * 2)) * -12;
    y += jump;
  }
  ctx.save();
  // 身体始终原色，永远不黑
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 14);
  ctx.moveTo(x - 14, y + 6);
  ctx.lineTo(x, y + 8);
  ctx.lineTo(x + 14, y + 6);
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x - 8, y + 26);
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x + 8, y + 26);
  ctx.stroke();
  var headSize = 36;
  var headCy = y - 20;
  if(IMG.dandan && IMG.dandan.complete && IMG.dandan.naturalWidth > 0){
    ctx.drawImage(IMG.dandan, x - headSize/2, headCy - headSize/2, headSize, headSize);
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, headCy, headSize/2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.stroke();
  }
  if(G.dandanFaceDead){
    ctx.fillStyle = 'rgba(20,20,20,0.82)';
    ctx.beginPath(); ctx.arc(x, headCy, headSize/2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawOdPlane(){
  if(G.scene !== 'play') return;
  var x = G.planeX, y = G.planeY;
  var angry = G.odAngry > 0;
  ctx.save();
  // 飞机阴影
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(x, y + 14, 32, 4, 0, 0, Math.PI * 2); ctx.fill();
  // 机身（白色椭圆）
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#9ab8d6'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, 34, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // 座舱
  ctx.fillStyle = '#cfe6ff';
  ctx.beginPath(); ctx.ellipse(x - 6, y - 4, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
  // 机翼
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#9ab8d6'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 2); ctx.lineTo(x - 10, y - 22); ctx.lineTo(x + 6, y - 22); ctx.lineTo(x + 12, y - 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 尾翼
  ctx.beginPath();
  ctx.moveTo(x + 24, y - 4); ctx.lineTo(x + 32, y - 16); ctx.lineTo(x + 38, y - 4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 螺旋桨（旋转）+ 尾迹（向后飘的烟点）
  var pt = performance.now() / 1000;
  for(var ti = 0; ti < 3; ti++){
    var tph = ((pt * 1.6 + ti / 3) % 1);
    var tpx = x + 36 + tph * 30, tpy = y + 2 + Math.sin(tph * 4 + ti) * 2.5;
    ctx.fillStyle = 'rgba(220,225,230,' + (0.30 * (1 - tph)).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(tpx, tpy, 1.6 + tph * 2.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.translate(x - 42, y);
  ctx.strokeStyle = 'rgba(90,90,90,0.9)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for(var bi = 0; bi < 2; bi++){
    ctx.save(); ctx.rotate(pt * 28 + bi * Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 34, y); ctx.lineTo(x - 42, y); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x - 42, y, 2, 8, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(136,136,136,0.5)'; ctx.fill();
  // od 只露上半身（从源图裁上半部分）
  if(IMG.od && IMG.od.complete && IMG.od.naturalWidth > 0){
    var ow = IMG.od.naturalWidth, oh = IMG.od.naturalHeight;
    // 源图上半部分（头+肩）
    var srcH = oh * 0.45;
    var dw = 30, dh = dw * srcH / ow;
    ctx.drawImage(IMG.od, 0, 0, ow, srcH, x - dw/2, y - dh - 2, dw, dh);
  }
  if(angry){
    ctx.fillStyle = '#ff6b3a';
    ctx.beginPath(); ctx.arc(x - 6, y - 40, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 2, y - 44, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8, y - 38, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath(); ctx.arc(x + 2, y - 44, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawBomb(){
  if(!G.bomb || G.bomb.exploded) return;
  ctx.save();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(G.bomb.x, G.bomb.y, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#666';
  ctx.beginPath(); ctx.arc(G.bomb.x - 3, G.bomb.y - 3, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function roundRectPath(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function drawAngryCutscene(){
  if(!G.angryState) return;
  var a = G.angryState;
  // od：占右下角一大半，到腰部，保持比例不拉伸
  var odW = 340;
  var srcHratio = 0.72; // 裁到腰部
  var natW = IMG.angry ? IMG.angry.naturalWidth : 1664;
  var natH = IMG.angry ? IMG.angry.naturalHeight : 2368;
  var srcH = natH * srcHratio;
  var odH = odW * (srcH / natW); // 保持比例
  var targetX = W - odW - 0, odY = H - odH;
  var slideT = Math.min(a.timer / 0.35, 1);
  var ease = 1 - Math.pow(1 - slideT, 3);
  var odX = W + 30 - (W + 30 - targetX) * ease;
  var swing = Math.sin(a.timer * 14) * 0.08;
  ctx.save();
  ctx.translate(odX + odW/2, odY + odH * 0.5);
  ctx.rotate(swing);
  ctx.translate(-(odX + odW/2), -(odY + odH * 0.5));
  if(IMG.angry && IMG.angry.complete && IMG.angry.naturalWidth > 0){
    ctx.drawImage(IMG.angry, 0, 0, natW, srcH, odX, odY, odW, odH);
  }
  ctx.restore();
  // 对话框：移到底部居中，黄色圆角按钮形状（和图二一致）
  var bw = 280, bh = 56;
  var bx = (W - bw) / 2, by = H - bh - 8;
  ctx.fillStyle = '#ffd75e';
  ctx.strokeStyle = '#a06810';
  ctx.lineWidth = 3;
  roundRectPath(bx, by, bw, bh, 14);
  ctx.fill(); ctx.stroke();
  // 打字机效果
  var chars = Math.min(a.quote.length, Math.floor((a.timer - 0.35) * 12));
  if(chars > 0){
    ctx.fillStyle = '#4a2c0f';
    ctx.font = 'bold 18px ' + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(a.quote.substring(0, chars), bx + bw/2, by + bh/2);
  }
  // 子弹
  if(!a.bullet.hit){
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(a.bullet.x, a.bullet.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6b3a';
    ctx.beginPath(); ctx.arc(a.bullet.x - 2, a.bullet.y - 2, 2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawChain(){
  var c = G.claw, t = tip();
  if(c.item && c.item.type === 'big' && c.st === 'retract'){
    t.x += (Math.random() - 0.5) * 3.2; t.y += (Math.random() - 0.5) * 3.2;
  }
  ctx.strokeStyle = '#caa44e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(PIVOT.x, PIVOT.y + 4); ctx.lineTo(t.x, t.y); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PIVOT.x + 1.5, PIVOT.y + 4); ctx.lineTo(t.x + 1.5, t.y); ctx.stroke();
  ctx.save();
  ctx.translate(t.x, t.y); ctx.rotate(c.angle);
  ctx.fillStyle = '#43331f';
  ctx.fillRect(-6, 0, 12, 10);
  var spread = c.item ? 0.1 : 0.5;
  ctx.strokeStyle = '#6b5a33'; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(-5, 10);
  ctx.quadraticCurveTo(-5 - 8 * spread, 17, -2 - 7 * spread, 26); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, 10);
  ctx.quadraticCurveTo(5 + 8 * spread, 17, 2 + 7 * spread, 26); ctx.stroke();
  ctx.restore();
}

function drawShadow(x, y, w, h){
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath(); ctx.ellipse(x, y + h * 0.47, w * 0.44, h * 0.11, 0, 0, Math.PI * 2); ctx.fill();
}

function drawDiamond(x, y, s, t){
  ctx.save(); ctx.translate(x, y);
  var tw = 0.65 + 0.35 * Math.sin(t * 4.2);
  ctx.globalAlpha = tw;
  var h = s, w = s;
  var g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#c8f0ff'); g.addColorStop(0.7, '#5db4ec'); g.addColorStop(1, '#1f6bd0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(w * 0.4, -h * 0.42);
  ctx.lineTo(w / 2, h * 0.05);
  ctx.lineTo(0, h / 2);
  ctx.lineTo(-w / 2, h * 0.05);
  ctx.lineTo(-w * 0.4, -h * 0.42);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(w * 0.4, -h * 0.42);
  ctx.lineTo(0, -h * 0.34);
  ctx.lineTo(-w * 0.4, -h * 0.42);
  ctx.closePath(); ctx.fill();
  var fl = (0.5 + 0.5 * Math.sin(t * 5)) * s * 0.42;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-fl, 0); ctx.lineTo(fl, 0);
  ctx.moveTo(0, -fl * 1.2); ctx.lineTo(0, fl * 0.8);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-w * 0.15, -h * 0.1, s * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawRock(x, y, w, h, off){
  var pts = 7;
  if(!off || off.length < pts){ off = [0.9, 0.85, 0.95, 0.88, 0.92, 0.84, 0.9]; }
  ctx.save(); ctx.translate(x, y);
  var g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, '#9a9186'); g.addColorStop(1, '#6f675c');
  ctx.fillStyle = g;
  ctx.beginPath();
  for(var j = 0; j < pts; j++){
    var a = (j / pts) * Math.PI * 2;
    var px = Math.cos(a) * w / 2 * off[j], py = Math.sin(a) * h / 2 * off[j];
    if(j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,32,22,0.5)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(40,32,22,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-w * 0.16, -h * 0.22); ctx.lineTo(-w * 0.03, h * 0.06); ctx.lineTo(-w * 0.18, h * 0.24); ctx.stroke();
  ctx.restore();
}

function drawLaughFrame(x, y, scale, clock){
  var fr = Math.floor(clock / 0.09) % SHEET_N;
  var w = SHEET_W * scale, h = SHEET_H * scale;
  ctx.drawImage(IMG.sheet, fr * SHEET_W, 0, SHEET_W, SHEET_H, x - w / 2, y - h / 2, w, h);
}

/* ============ 小矮人（Canvas 矢量绘制，独立函数，后续可整体替换贴图） ============
   造型参照黄金矿工里的矮人/地精：安全帽 + 矿灯、大胡子、背带裤、小短腿。
   dir：移动方向（1 向右，-1 向左），用于镜像；grabbedWiggle：被抓时挣扎摆动。 */
function drawDwarf(x, y, w, h, dir, t, grabbedWiggle){
  ctx.save();
  ctx.translate(x, y);
  if(dir < 0) ctx.scale(-1, 1);
  if(grabbedWiggle) ctx.rotate(Math.sin(t * 22) * 0.28);   // 被抓挣扎：快速左右扭
  var uw = w / 38, uh = h / 40;                            // 以 38×40 为基准缩放
  ctx.scale(uw, uh);
  // 小短腿（走动交替）
  var step = grabbedWiggle ? 0 : Math.sin(t * 10) * 3;
  ctx.strokeStyle = '#4a2f16'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(-6 + step, 19); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 12); ctx.lineTo(6 - step, 19); ctx.stroke();
  // 背带裤身体
  ctx.fillStyle = '#3e6db5';
  roundRectPath(-11, -2, 22, 16, 6); ctx.fill();
  ctx.strokeStyle = '#27497f'; ctx.lineWidth = 2; ctx.stroke();
  // 手臂（走路摆动）
  ctx.strokeStyle = '#f0c08a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(-15, 8 - step * 0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(11, 2); ctx.lineTo(15, 8 + step * 0.8); ctx.stroke();
  // 头
  ctx.fillStyle = '#f6cf9f';
  ctx.beginPath(); ctx.arc(0, -10, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1.5; ctx.stroke();
  // 大胡子
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.moveTo(-8, -8);
  ctx.quadraticCurveTo(0, 6, 8, -8);
  ctx.quadraticCurveTo(0, -2, -8, -8); ctx.closePath(); ctx.fill();
  // 眼睛
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-3.5, -12, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5, -12, 1.4, 0, Math.PI * 2); ctx.fill();
  // 安全帽 + 矿灯
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath(); ctx.arc(0, -13, 9, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillRect(-10, -14, 20, 3);
  ctx.strokeStyle = '#a06810'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -13, 9, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#fff6c9';
  ctx.beginPath(); ctx.arc(0, -16, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a6b1a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, -16, 2.6, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

/* ============ 问号袋（Canvas 矢量绘制，独立函数，后续可整体替换贴图） ============ */
function drawBag(x, y, w, h, t){
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2.2) * 1.5);   // 轻微浮动
  var uw = w / 46, uh = h / 50;
  ctx.scale(uw, uh);
  // 袋身
  var g = ctx.createLinearGradient(0, -22, 0, 24);
  g.addColorStop(0, '#b07b3f'); g.addColorStop(1, '#7a4a21');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-13, -10);
  ctx.quadraticCurveTo(-20, 4, -15, 16);
  ctx.quadraticCurveTo(-8, 24, 0, 24);
  ctx.quadraticCurveTo(8, 24, 15, 16);
  ctx.quadraticCurveTo(20, 4, 13, -10);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4d2f14'; ctx.lineWidth = 2.5; ctx.stroke();
  // 扎口
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(9, -10); ctx.lineTo(5, -18); ctx.lineTo(-5, -18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4d2f14'; ctx.lineWidth = 2; ctx.stroke();
  // 绳结
  ctx.strokeStyle = '#ffd75e'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-8, -9); ctx.quadraticCurveTo(0, -6, 8, -9); ctx.stroke();
  // 问号
  ctx.fillStyle = '#ffe14d';
  ctx.font = 'bold 22px ' + FONT;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, 8);
  ctx.restore();
}

/* ============ 大字幕（奖励关 / 已达标 / 过关提示）：非阻塞，绘制在场地中上方 ============ */
function drawSubtitle(){
  if(!G.subtitle) return;
  var s = G.subtitle;
  var a = Math.min(1, s.life / (s.max * 0.35));   // 末尾淡出
  var pop = Math.min(1, (s.max - s.life) / 0.18); // 开头弹入
  ctx.save();
  ctx.globalAlpha = Math.max(0, a);
  var size = 34 + (1 - pop) * 10;
  // 底板
  ctx.font = size + 'px ' + FONT;
  var tw = ctx.measureText(s.txt).width;
  ctx.fillStyle = 'rgba(22,11,3,0.72)';
  roundRectPath(400 - tw / 2 - 22, 196 - size / 2 - 12, tw + 44, size + 24, 14);
  ctx.fill();
  drawText(s.txt, 400, 196, size, s.color);
  ctx.restore();
}

function drawItems(t){
  for(var i = 0; i < G.items.length; i++){
    var it = G.items[i];
    if(it.collected) continue;
    var attached = it.grabbed;
    if(it.type !== 'rare') drawShadow(it.x, it.y, it.w, it.h);
    if(it.type === 'big'){
      if(attached){
        var shrink = 1, lift = 0;
        if(G.claw.st === 'retract'){
          var l = G.claw.len;
          shrink = Math.max(0.06, (l - MINLEN) / 140);
          lift = (1 - shrink) * 55;
        }
        drawLaughFrame(it.x, it.y - 10 - lift, (it.h * 1.5 * shrink) / SHEET_H, G.laughClock);
      } else {
        // wander 时根据方向镜像翻转
        if(it.wander && it.wander.dir < 0){
          ctx.save();
          ctx.translate(it.x, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(IMG.big, -it.w/2, it.y - it.h/2, it.w, it.h);
          ctx.restore();
        } else {
          ctx.drawImage(IMG.big, it.x - it.w / 2, it.y - it.h / 2, it.w, it.h);
        }
      }
    } else if(it.type === 'small' || it.type === 'tiny'){
      var scale = it.type === 'tiny' ? 0.72 : 1;
      ctx.drawImage(IMG.small, it.x - it.w * scale / 2, it.y - it.h * scale / 2, it.w * scale, it.h * scale);
    } else if(it.type === 'rare'){
      var rim = IMG.rare[it.rareId];
      var rh = it.h;
      var rw = rim && rim.naturalWidth ? rh * rim.naturalWidth / rim.naturalHeight : rh * 0.9;
      // 发光光晕
      var glowR = rh * 0.9;
      var glow = ctx.createRadialGradient(it.x, it.y, 0, it.x, it.y, glowR);
      glow.addColorStop(0, 'rgba(255,225,77,0.55)');
      glow.addColorStop(0.5, 'rgba(255,157,61,0.25)');
      glow.addColorStop(1, 'rgba(255,157,61,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(it.x, it.y, glowR, 0, Math.PI*2); ctx.fill();
      // 旋转光束（6条）
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(t * 1.5);
      for(var ri = 0; ri < 6; ri++){
        ctx.rotate(Math.PI / 3);
        var rayGrad = ctx.createLinearGradient(0, 0, glowR, 0);
        rayGrad.addColorStop(0, 'rgba(255,240,150,0.6)');
        rayGrad.addColorStop(1, 'rgba(255,240,150,0)');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(glowR, -1);
        ctx.lineTo(glowR, 1);
        ctx.lineTo(0, 4);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(it.x, it.y + rh * 0.46, rw * 0.4, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(rim, it.x - rw / 2, it.y - rh / 2, rw, rh);
    } else if(it.type === 'diamond'){
      drawDiamond(it.x, it.y, it.w, t);
    } else if(it.type === 'rock'){
      drawRock(it.x, it.y, it.w, it.h, it.offs);
    } else if(it.type === 'ice'){
      var iimg = IMG.ice[Math.max(0, Math.min(2, it.cubes - 1))];
      if(iimg && iimg.naturalWidth){
        // 保持图片原始宽高比，按当前尺寸缩放（随融化变小）
        var ar = iimg.naturalWidth / iimg.naturalHeight;
        var dw = it.w, dh = it.w / ar;
        if(dh > it.h){ dh = it.h; dw = it.h * ar; }
        ctx.save();
        // 融化中的冰稍微透明一点，显得正在消融
        ctx.globalAlpha = 0.72 + 0.28 * Math.max(0, Math.min(1, it.sizeRatio));
        ctx.drawImage(iimg, it.x - dw / 2, it.y - dh / 2, dw, dh);
        ctx.restore();
      }
    } else if(it.type === 'dwarf'){
      drawDwarf(it.x, it.y, it.w, it.h, it.dwarfDir || 1, t, attached);
    } else if(it.type === 'bag'){
      drawBag(it.x, it.y, it.w, it.h, t);
    }
  }
}

function drawLaughBursts(){
  for(var i = 0; i < G.laughs.length; i++){
    var l = G.laughs[i];
    var s = l.scale * (0.75 + 0.25 * (l.life / 3.0));
    drawLaughFrame(l.x, l.y, s, performance.now() / 1000);
  }
}

function drawFx(){
  for(var i = 0; i < G.fx.length; i++){
    var f = G.fx[i];
    var a = Math.max(0, f.life / f.max);
    ctx.save(); ctx.globalAlpha = a;
    ctx.translate(f.x, f.y); ctx.rotate(f.rot);
    drawText(f.txt, 0, 0, f.size, f.color);
    ctx.restore();
  }
  for(var j = 0; j < G.parts.length; j++){
    var p = G.parts[j];
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function draw(){
  if(G.scene === 'ninja'){ drawNinja(); return; }
  ctx.save();
  if(G.shake > 0){
    ctx.translate((Math.random() - 0.5) * G.shake * 16, (Math.random() - 0.5) * G.shake * 16);
  }
  drawBg();
  drawItems(performance.now() / 1000);
  drawChain();
  drawHouse();
  drawDandan();
  drawOdPlane();
  drawBomb();
  drawAngryCutscene();
  drawLaughBursts();
  drawFx();
  drawSubtitle();
  ctx.restore();
}

