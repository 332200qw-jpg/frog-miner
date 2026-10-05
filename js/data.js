'use strict';
var W = 800, H = 600;
var SOIL_TOP = 152;
var PIVOT = { x: 400, y: 128 };
var MINLEN = 54, MAXLEN = 470;
var MAXA = 1.05, FREQ = 0.5;
var DROP_SPEED = 330, RETRACT_EMPTY = 420;
var LEVEL_TIME = 45;              // 每关倒计时（秒），两种模式相同
var SPEED = { small: 250, tiny: 285, big: 70, diamond: 330, rock: 90, rare: 260, ice: 120, dwarf: 380, bag: 240 };
var FONT = "'ZCOOL KuaiLe','Microsoft YaHei','PingFang SC',sans-serif";
var SHEET_W = 144, SHEET_H = 192, SHEET_N = 20;

/* ================= 提示时长统一配置（秒） =================
   所有会消失的提示都在这里调，不要在逻辑里写魔法数字。
   飘字 = 得分等跟随文字；大字幕 = 奖励关/达标/过关等居中大字。 */
var UI_TIMING = {
  pop: 2.2,        // 普通飘字（原 1.1）
  popBig: 2.6,     // 重要飘字（新图鉴 +50%、袋中价值揭晓等）
  subtitle: 3.2,   // 大字幕（奖励关！/ 已达标！/ 过关提示）
  rareShow: 3.0    // 稀有奶蛙全屏展示（原 2.2）
};

/* ================= 奶娃价值：按体型分四档 =================
   体型（w×h）：tiny 42×40 < small 58×56 < rare 72×80 < big 90×126
   对应价值：最小 = 50，最大 = 500 */
var FROG_VALUE = { tiny: 50, small: 100, rare: 250, big: 500 };
var DEX_BONUS = 0.5;              // 图鉴首次解锁：该次得分额外 +50%（×1.5）
var DIAMOND_VALUE = 600;          // 钻石固定价值（黄金矿工原作钻石也是 600）

/* ================= 物品配置表 ================= */
var ITEMCFG = {
  small:   { r: 30, w: 58, h: 56, value: function(){ return FROG_VALUE.small; } },
  tiny:    { r: 24, w: 42, h: 40, value: function(){ return FROG_VALUE.tiny; } },
  big:     { r: 50, w: 90, h: 126, value: function(){ return FROG_VALUE.big; } },
  diamond: { r: 18, w: 26, h: 26, value: function(){ return DIAMOND_VALUE; } },
  rock:    { r: 38, w: 56, h: 54, value: function(){ return 1 + Math.floor(Math.random() * 10); } },
  rare:    { r: 36, w: 72, h: 80, value: function(){ return FROG_VALUE.rare; } },
  // 小矮人：尺寸 ≈ 小奶蛙的 65%（58×56 → 38×40），可抓，价值 2
  dwarf:   { r: 20, w: 38, h: 40, value: function(){ return DWARF.value; } },
  // 问号袋：价值在生成关卡时一次性随机确定（1~800 均匀分布），抓到才揭晓
  bag:     { r: 24, w: 46, h: 50, value: function(){ return BAG.valueMin + Math.floor(Math.random() * (BAG.valueMax - BAG.valueMin + 1)); } }
};

/* ================= 小矮人（仅无限模式出现） =================
   查证（黄金矿工原作）：会移动的地下生物（猪/老鼠）横向来回跑动、可被钩子抓住、
   价值 $2、抱钻石时 $602——来源 goldmineronline.com、百度百科“黄金矿工”词条。
   未查到官方移动速度数值；原作文字描述为“移动迅速”。本实现按“横穿场地约 10 秒”
   标定为 70 px/s（可自行调整 speed）。触摧毁毁物品为本次自行设计的规则，原作没有。 */
var DWARF = {
  scale: 0.65,           // 相对小奶蛙的缩放（要求 60%~70%，取 65%）
  speed: 70,             // 移动速度，像素/秒
  value: 2,              // 抓取价值（原作 $2）
  escapeChance: 0.15,    // 被抓后挣脱概率（每次抓取在收钩中途判定一次）
  minCount: 3,           // 每次出现数量下限
  maxCount: 6,           // 每次出现数量上限
  /* 出现概率曲线（仅无限模式，第 n 关）：
     p(n) = min(probMax, probPerLevel × (n − 1))
     第 1 关 p=0（不出现）；第 2 关 25%；第 3 关 50%；第 4 关 75%；第 5 关起封顶 85%。
     判定通过后，本关生成 minCount~maxCount 只。 */
  probPerLevel: 0.25,
  probMax: 0.85,
  marginX: 30            // 折返边界：距场地左右边缘的边距（留出建模宽度）
};

/* ================= 问号袋 ================= */
var BAG = {
  w: 46, h: 50, r: 24,
  valueMin: 1, valueMax: 800,  // 均匀随机，生成关卡时确定，抓到才揭晓
  normalCount: 1,              // 普通模式每关袋数（与钻石同级的稀有掉落位）
  infWeight: 4                 // 无限模式物品池权重（见 genLevelInfinite）
};

/* ================= 奖励关（仅无限模式） =================
   第 6、12、18… 关（n % every === 0）以 chance 概率触发：
   全场只有钻石和奶蛙，钻石数 diamondMin~diamondMax 均匀随机。 */
var BONUS = { every: 6, chance: 0.4, diamondMin: 4, diamondMax: 12 };

/* ================= 无限模式 =================
   目标分逐关叠加：第 n 关新增 Δtarget(n) = base + growth × (n−1)^pow，
   四舍五入到 round 的倍数，且不超过 cap（涨幅越来越大，但保证后期关卡可完成）。
     L1 +600 → 累计 600
     L2 +860 → 累计 1460    L5 +1880 → 累计约 6060
     L10 封顶 +2600          之后每关 +2600
   物品价值不随关卡放大；场上物品总数固定（见 FIELD），
   越往后高价值物品占比越高（权重见 genLevelInfinite）。 */
var INF_TARGET = { base: 600, growth: 260, pow: 1.15, cap: 2600, round: 50 };
var FIELD = { count: 13, gap: 18 };  // 无限模式每场物品总数（含稀有蛙）、最小间距

var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = W * dpr; canvas.height = H * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

var loadCount = 0, loadNeeded = 15;
function tickLoad(){
  loadCount++;
  if(loadCount >= loadNeeded){
    hide('ovLoading');
    show('ovFactory');
  }
}
// 800ms 兜底：防止图片加载卡住一直转圈
setTimeout(function(){
  hide('ovLoading');
  show('ovFactory');
}, 800);
function loadImg(src){ var im = new Image(); im.onload = tickLoad; im.onerror = tickLoad; im.src = src; return im; }
var RARE = [
  { id:1, name:'呐喊蛙',   img:'assets/frog-rare-1.webp', value:600 },
  { id:2, name:'洛丽塔蛙', img:'assets/frog-rare-2.webp', value:650 },
  { id:3, name:'艺术蛙',   img:'assets/frog-rare-3.webp', value:650 },
  { id:4, name:'奶茶蛙',   img:'assets/frog-rare-4.webp', value:600 },
  { id:5, name:'吸猫蛙',   img:'assets/frog-rare-5.webp', value:700 },
  { id:6, name:'蹦蹦蛙',   img:'assets/frog-rare-6.webp', value:550 },
  { id:7, name:'耶耶蛙',   img:'assets/frog-rare-7.webp', value:600 },
  { id:8, name:'花束蛙',   img:'assets/frog-rare-8.webp', value:650 },
  { id:9, name:'生气蛙',   img:'assets/frog-rare-9.webp', value:550 },
  { id:10, name:'打工奶龙', img:'assets/frog-rare-10.webp', value:620 },
  { id:11, name:'摆烂奶龙', img:'assets/frog-rare-11.webp', value:657 },
  { id:12, name:'摸鱼奶龙', img:'assets/frog-rare-12.webp', value:694 },
  { id:13, name:'搬砖奶龙', img:'assets/frog-rare-13.webp', value:731 },
  { id:14, name:'加班奶龙', img:'assets/frog-rare-14.webp', value:768 },
  { id:15, name:'干饭奶龙', img:'assets/frog-rare-15.webp', value:805 },
  { id:16, name:'追剧奶龙', img:'assets/frog-rare-16.webp', value:842 },
  { id:17, name:'打游戏奶龙', img:'assets/frog-rare-17.webp', value:579 },
  { id:18, name:'睡觉奶龙', img:'assets/frog-rare-18.webp', value:616 },
  { id:19, name:'拼豆奶鼠', img:'assets/frog-rare-19.webp', value:653 },
  { id:20, name:'萌脸奶龙', img:'assets/frog-rare-20.webp', value:690 },
  { id:21, name:'眨眼奶龙', img:'assets/frog-rare-21.webp', value:727 },
  { id:22, name:'全员奶蛙', img:'assets/frog-rare-22.webp', value:764 },
  { id:23, name:'气鼓鼓蛙', img:'assets/frog-rare-23.webp', value:801 },
  { id:24, name:'野生奶蛙', img:'assets/frog-rare-24.webp', value:838 },
  { id:25, name:'送花蛙一', img:'assets/frog-rare-25.webp', value:575 },
  { id:26, name:'送花蛙二', img:'assets/frog-rare-26.webp', value:612 },
  { id:27, name:'宇宙奶蛙', img:'assets/frog-rare-27.webp', value:649 },
  { id:28, name:'日常蛙一', img:'assets/frog-rare-28.webp', value:686 },
  { id:29, name:'日常蛙二', img:'assets/frog-rare-29.webp', value:723 },
  { id:30, name:'瞅一眼蛙一', img:'assets/frog-rare-30.webp', value:760 },
  { id:31, name:'日常蛙三', img:'assets/frog-rare-31.webp', value:797 },
  { id:32, name:'日常蛙四', img:'assets/frog-rare-32.webp', value:834 },
  { id:33, name:'瞅一眼蛙二', img:'assets/frog-rare-33.webp', value:571 },
  { id:34, name:'日常蛙五', img:'assets/frog-rare-34.webp', value:608 },
  { id:35, name:'瞅一眼蛙三', img:'assets/frog-rare-35.webp', value:645 },
  { id:36, name:'日常蛙六', img:'assets/frog-rare-36.webp', value:682 },
  { id:37, name:'瞅一眼蛙四', img:'assets/frog-rare-37.webp', value:719 },
  { id:38, name:'瞅一眼蛙五', img:'assets/frog-rare-38.webp', value:756 },
  { id:39, name:'瞅一眼蛙六', img:'assets/frog-rare-39.webp', value:793 },
  { id:40, name:'美人蛙', img:'assets/frog-rare-40.webp', value:830 },
  { id:41, name:'喵喵蛙一', img:'assets/frog-rare-41.webp', value:567 },
  { id:42, name:'喵喵蛙二', img:'assets/frog-rare-42.webp', value:604 },
  { id:43, name:'喵喵蛙三', img:'assets/frog-rare-43.webp', value:641 },
  { id:44, name:'乐跑奶龙', img:'assets/frog-rare-44.webp', value:678 },
  { id:45, name:'打工奶龙二', img:'assets/frog-rare-45.webp', value:715 },
  { id:46, name:'打工奶龙三', img:'assets/frog-rare-46.webp', value:752 },
  { id:47, name:'打工奶龙四', img:'assets/frog-rare-47.webp', value:789 }
];
var IMG = {
  big: loadImg('assets/frog-big.webp'),
  small: loadImg('assets/frog-small.webp'),
  sheet: document.getElementById('sheetImg'),
  dandan: document.getElementById('dandanImg'),
  od: document.getElementById('odImg'),
  angry: document.getElementById('odAngryImg'),
  diamond: loadImg('assets/diamond-small.webp'),
  ice: [loadImg('assets/ice-1.webp'), loadImg('assets/ice-2.webp'), loadImg('assets/ice-3.webp')],
  rare:{}
};
IMG.sheet.onload = tickLoad; IMG.sheet.onerror = tickLoad;
IMG.dandan.onload = tickLoad; IMG.dandan.onerror = tickLoad;
IMG.od.onload = tickLoad; IMG.od.onerror = tickLoad;
if(IMG.sheet.complete && IMG.sheet.naturalWidth > 0) tickLoad();
if(IMG.dandan.complete && IMG.dandan.naturalWidth > 0) tickLoad();
if(IMG.od.complete && IMG.od.naturalWidth > 0) tickLoad();
RARE.forEach(function(r){ IMG.rare[r.id] = loadImg(r.img); });
try { document.fonts.load('16px "ZCOOL KuaiLe"'); } catch(e){}

function loadDex(){ try{ return JSON.parse(localStorage.getItem('frogDex') || '[]'); }catch(e){ return []; } }
function saveDex(a){ try{ localStorage.setItem('frogDex', JSON.stringify(a)); }catch(e){} }
/* 普通奶蛙在图鉴里的键（与稀有蛙的数字 id 共存于同一数组） */
var DEX_KEY = { tiny: 'tiny', small: 'small', big: 'big' };
function loadVol(){
  try{
    var v = JSON.parse(localStorage.getItem('frogVol') || 'null');
    if(v){
      var b = Number(v.bgm), f = Number(v.fx);
      if(isFinite(b) && isFinite(f)){
        if(b > 1) b /= 100;
        if(f > 1) f /= 100;
        return { bgm: Math.min(1, Math.max(0, b)), fx: Math.min(1, Math.max(0, f)) };
      }
    }
  }catch(e){}
  return { bgm: 0.1, fx: 1 };   // 默认背景音乐音量（原 0.25 太吵，下调至 0.10）
}
var VOL = loadVol();
var settingsPrevState = 'menu';

function $(id){ return document.getElementById(id); }
function show(id){ var el = $(id); if(el) el.classList.remove('hidden'); }
function hide(id){ var el = $(id); if(el) el.classList.add('hidden'); }
