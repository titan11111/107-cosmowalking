// ============================================================
// 【1】定数・フェーズ定義（ゲーム進行の状態を一意に管理）
// ============================================================
const TOTAL_STAGES = 6;
const GAME_PHASE = {
TITLE: 'title',
PROLOGUE: 'prologue',
STAGE_INTRO: 'stageIntro',
PLAYING: 'playing',
STAGE_CLEAR: 'stageClear',
ENDING: 'ending',
GAMEOVER: 'gameover'
};

// ============================================================
// 【2】音声システム（進行とは独立）
// ============================================================
const AudioSys = {
ctx: null,
init() {
  if (!this.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
  }
},
resume() {
  if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
},
startAmbient() {
  if(this.ambientStarted||!this.ctx) return;
  this.ambientStarted=true;
  const t=this.ctx.currentTime;
  const master=this.ctx.createGain();
  master.gain.setValueAtTime(0,t);
  master.gain.linearRampToValueAtTime(0.055,t+5);
  master.connect(this.ctx.destination);
  [130.8,196.0,261.6].forEach((freq,i)=>{
    const osc=this.ctx.createOscillator();
    const g=this.ctx.createGain();
    g.gain.value=0.33;
    osc.type='sine';
    osc.frequency.value=freq*(1+i*0.003);
    osc.connect(g); g.connect(master);
    osc.start(t);
  });
},
play(type) {
  if (!this.ctx) return;
  const t = this.ctx.currentTime;
  const osc = this.ctx.createOscillator();
  const gn = this.ctx.createGain();
  osc.connect(gn); gn.connect(this.ctx.destination);

  if (type === 'throw') {
    osc.frequency.setValueAtTime(400, t); osc.frequency.linearRampToValueAtTime(800, t+0.1);
    gn.gain.setValueAtTime(0.1, t); gn.gain.linearRampToValueAtTime(0, t+0.15);
    osc.start(t); osc.stop(t+0.15);
  } else if (type === 'hello') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t); osc.frequency.setValueAtTime(900, t+0.1);
    gn.gain.setValueAtTime(0.1, t); gn.gain.linearRampToValueAtTime(0, t+0.2);
    osc.start(t); osc.stop(t+0.2);
  } else if (type === 'hit') {
    osc.type = 'square'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(50, t+0.1);
    gn.gain.setValueAtTime(0.1, t); gn.gain.linearRampToValueAtTime(0, t+0.1);
    osc.start(t); osc.stop(t+0.1);
  } else if (type === 'damage') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, t); osc.frequency.linearRampToValueAtTime(50, t+0.3);
    gn.gain.setValueAtTime(0.1, t); gn.gain.linearRampToValueAtTime(0, t+0.3);
    osc.start(t); osc.stop(t+0.3);
  } else if (type === 'heal') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(400, t); osc.frequency.linearRampToValueAtTime(800, t+0.3);
    gn.gain.setValueAtTime(0.1, t); gn.gain.linearRampToValueAtTime(0, t+0.3);
    osc.start(t); osc.stop(t+0.3);
  } else if (type === 'clear') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(659, t+0.15);
    osc.frequency.setValueAtTime(783, t+0.3);
    osc.frequency.setValueAtTime(1046, t+0.45);
    gn.gain.setValueAtTime(0.12, t); gn.gain.linearRampToValueAtTime(0, t+0.9);
    osc.start(t); osc.stop(t+0.9);
  } else if (type === 'prologue') {
    // 静かなキラキラ音
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1200, t+0.4);
    osc.frequency.linearRampToValueAtTime(600, t+0.8);
    gn.gain.setValueAtTime(0.04, t); gn.gain.linearRampToValueAtTime(0, t+1.0);
    osc.start(t); osc.stop(t+1.0);
  } else if (type === 'stageStart') {
    // ステージ開始ジングル
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(392, t);      // ソ
    osc.frequency.setValueAtTime(523, t+0.12);  // ド
    osc.frequency.setValueAtTime(659, t+0.24);  // ミ
    gn.gain.setValueAtTime(0.1, t); gn.gain.linearRampToValueAtTime(0, t+0.5);
    osc.start(t); osc.stop(t+0.5);
  } else if (type === 'tension') {
    // 不穏な音
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(120, t+0.6);
    osc.frequency.linearRampToValueAtTime(60, t+1.2);
    gn.gain.setValueAtTime(0.05, t); gn.gain.linearRampToValueAtTime(0, t+1.2);
    osc.start(t); osc.stop(t+1.2);
  } else if (type === 'ending') {
    // あたたかいコード
    const play = (freq, delay, dur) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.connect(g); g.connect(this.ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t + delay);
      g.gain.setValueAtTime(0.06, t + delay);
      g.gain.linearRampToValueAtTime(0, t + delay + dur);
      o.start(t + delay); o.stop(t + delay + dur);
    };
    play(523, 0, 1.5);   // ド
    play(659, 0, 1.5);   // ミ
    play(783, 0, 1.5);   // ソ
    play(659, 0.5, 1.0); // ミ
    play(783, 0.5, 1.0); // ソ
    play(1046, 0.5, 1.5);// ド
    play(523, 1.2, 2.0); // ド（低）
    play(783, 1.2, 2.0); // ソ
    play(1046, 1.2, 2.0);// ド（高）
    return; // 複数osc使うのでここでreturn
  } else if (type === 'textAppear') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000 + Math.random()*400, t);
    gn.gain.setValueAtTime(0.03, t); gn.gain.linearRampToValueAtTime(0, t+0.08);
    osc.start(t); osc.stop(t+0.08);
  }
}
};

// ============================================================
// 【3】ストーリーデータ（ステージ定義・6ステージでエンディングまで）
// ============================================================
const STORY = {
stages: [
  {
    rank: 1,
    title: '— ちいさな さわぎ —',
    message: 'あそこに ヘンテコたちがいる。\nなんだか そわそわしてるみたい…',
    enemies: (lvl) => {
      const arr = [];
      for (let i = 0; i < 4; i++) {
        arr.push({
          x: Math.random() < 0.5 ? -50 : 850,
          y: 100 + Math.random() * 400,
          hp: 45, maxHp: 45, def: 0, atk: 5,
          isBoss: false, name: 'ヘンテコ',
          attackCooldown: 0, attached: [], wobble: Math.random()*100,
          color: ['#a29bfe','#fd79a8','#63cdda'][Math.floor(Math.random()*3)]
        });
      }
      return arr;
    },
    clearMessage: 'おとなしくなった！\nでも まだ おくから おおきな こえが…'
  },
  {
    rank: 2,
    title: '— もっと おくへ —',
    message: 'こえが おおきくなってきた。\nヘンテコたちが もっと あつまってる！',
    enemies: (lvl) => {
      const arr = [];
      for (let i = 0; i < 6; i++) {
        arr.push({
          x: Math.random() < 0.5 ? -50 : 850,
          y: 100 + Math.random() * 400,
          hp: 55, maxHp: 55, def: 0, atk: 8,
          isBoss: false, name: 'ヘンテコ',
          attackCooldown: 0, attached: [], wobble: Math.random()*100,
          color: ['#a29bfe','#fd79a8','#63cdda','#ffa502'][Math.floor(Math.random()*4)]
        });
      }
      return arr;
    },
    clearMessage: 'みんな おちついた！\nまだ さわぎが おわらない…'
  },
  {
    rank: 3,
    title: '— おくの ヘンテコ —',
    message: 'おくの ヘンテコが たくさん。\nひとつずつ なだめていこう。',
    enemies: (lvl) => {
      const arr = [];
      for (let i = 0; i < 7; i++) {
        arr.push({
          x: Math.random() < 0.5 ? -50 : 850,
          y: 100 + Math.random() * 400,
          hp: 60, maxHp: 60, def: 1, atk: 9,
          isBoss: false, name: 'ヘンテコ',
          attackCooldown: 0, attached: [], wobble: Math.random()*100,
          color: ['#a29bfe','#fd79a8','#63cdda','#ffa502','#00b894'][Math.floor(Math.random()*5)]
        });
      }
      return arr;
    },
    clearMessage: 'おちついてきた！\n…あれ、おおきな かげが…'
  },
  {
    rank: 4,
    title: '— ちかづく おおきな きもち —',
    message: 'おおきな ヘンテコが みえてきた。\nちいさいのを たくさん つれてる！',
    enemies: (lvl) => {
      const arr = [];
      for (let i = 0; i < 5; i++) {
        arr.push({
          x: Math.random() < 0.5 ? -50 : 850,
          y: 100 + Math.random() * 400,
          hp: 65, maxHp: 65, def: 2, atk: 10,
          isBoss: false, name: 'ヘンテコ',
          attackCooldown: 0, attached: [], wobble: Math.random()*100,
          color: ['#fab1a0','#ff7675','#e17055'][Math.floor(Math.random()*3)]
        });
      }
      arr.push({
        x: 750, y: 280,
        hp: 180, maxHp: 180, def: 3, atk: 12,
        isBoss: true, name: 'でっかいヘンテコ',
        attackCooldown: 0, attached: [], wobble: Math.random()*100,
        color: '#e17055'
      });
      return arr;
    },
    clearMessage: 'でっかいのも おとなしくなった！\nさいごの ひとが まってる…'
  },
  {
    rank: 5,
    title: '— まえの ばしょへ —',
    message: 'もうすぐ コスモのうみの まんなか。\nパパヘンテコが まってる。',
    enemies: (lvl) => {
      const arr = [];
      for (let i = 0; i < 4; i++) {
        arr.push({
          x: Math.random() < 0.5 ? -50 : 850,
          y: 100 + Math.random() * 400,
          hp: 70, maxHp: 70, def: 2, atk: 11,
          isBoss: false, name: 'ヘンテコ',
          attackCooldown: 0, attached: [], wobble: Math.random()*100,
          color: ['#fab1a0','#ff7675','#e17055','#ff7675'][Math.floor(Math.random()*4)]
        });
      }
      arr.push({
        x: 780, y: 320,
        hp: 220, maxHp: 220, def: 4, atk: 13,
        isBoss: true, name: 'ママヘンテコ',
        attackCooldown: 0, attached: [], wobble: Math.random()*100,
        color: '#fd79a8'
      });
      return arr;
    },
    clearMessage: 'ママも おちついた！\nあとは パパヘンテコだけ…'
  },
  {
    rank: 6,
    title: '— パパヘンテコ —',
    message: 'おおきな ヘンテコが あらわれた！\nすごく おこってる… ちがう、ないてる？',
    enemies: (lvl) => {
      const arr = [];
      arr.push({
        x: 800, y: 300,
        hp: 300, maxHp: 300, def: 5, atk: 15,
        isBoss: true, name: 'パパヘンテコ',
        attackCooldown: 0, attached: [], wobble: Math.random()*100,
        color: '#ff7675'
      });
      for (let i = 0; i < 3; i++) {
        arr.push({
          x: Math.random() < 0.5 ? -50 : 850,
          y: 100 + Math.random() * 400,
          hp: 50, maxHp: 50, def: 2, atk: 10,
          isBoss: false, name: 'ヘンテコ',
          attackCooldown: 0, attached: [], wobble: Math.random()*100,
          color: ['#fab1a0','#ff7675','#e17055'][Math.floor(Math.random()*3)]
        });
      }
      return arr;
    },
    clearMessage: null // ステージ6クリア → エンディングへ
  }
]
};

// ============================================================
// 【4】ゲーム進行制御（フェーズ遷移はここだけで行う）
// ============================================================
function goToPhase(phase, payload) {
const overlay = document.getElementById('overlay');
const titleEl = document.getElementById('titleContainer');
const prologueEl = document.getElementById('prologueContainer');
const stageOverlayEl = document.getElementById('stageOverlay');
const endingEl = document.getElementById('endingContainer');
const gameoverEl = document.getElementById('gameoverContainer');
const statsEl = document.getElementById('stats');
const swarmEl = document.getElementById('swarmCounter');
const stageIndEl = document.getElementById('stageIndicator');

game.phase = phase;

switch (phase) {
  case GAME_PHASE.TITLE:
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden');
    titleEl.style.display = 'flex';
    prologueEl.style.display = 'none';
    stageOverlayEl.style.display = 'none';
    endingEl.style.display = 'none';
    gameoverEl.style.display = 'none';
    statsEl.style.display = 'none';
    swarmEl.style.display = 'none';
    stageIndEl.style.display = 'none';
    document.querySelectorAll('.ending-line').forEach(l => l.classList.remove('visible'));
    document.querySelectorAll('.prologue-line').forEach(l => l.classList.remove('visible'));
    if (document.getElementById('endingSVG')) document.getElementById('endingSVG').classList.remove('visible');
    if (document.getElementById('prologueSkip')) document.getElementById('prologueSkip').classList.remove('visible');
    break;
  case GAME_PHASE.PROLOGUE:
    titleEl.style.display = 'none';
    prologueEl.style.display = 'flex';
    stageOverlayEl.style.display = 'none';
    endingEl.style.display = 'none';
    gameoverEl.style.display = 'none';
    break;
  case GAME_PHASE.STAGE_INTRO:
    overlay.style.display = 'none';
    stageOverlayEl.style.display = 'flex';
    statsEl.style.display = 'flex';
    swarmEl.style.display = 'block';
    stageIndEl.style.display = 'block';
    endingEl.style.display = 'none';
    gameoverEl.style.display = 'none';
    break;
  case GAME_PHASE.PLAYING:
    overlay.style.display = 'none';
    stageOverlayEl.style.display = 'none';
    statsEl.style.display = 'flex';
    swarmEl.style.display = 'block';
    stageIndEl.style.display = 'block';
    if (payload != null && payload.stageIndex != null) {
      game.currentStage = payload.stageIndex;
      const stage = STORY.stages[payload.stageIndex];
      if (stage && stageIndEl) {
        document.getElementById('stageLabel').textContent = `${stage.rank} / ${TOTAL_STAGES}`;
      }
    }
    break;
  case GAME_PHASE.STAGE_CLEAR:
    // 演出中はループだけ止める。画面はそのまま。
    break;
  case GAME_PHASE.ENDING:
    overlay.style.display = 'flex';
    titleEl.style.display = 'none';
    prologueEl.style.display = 'none';
    stageOverlayEl.style.display = 'none';
    endingEl.style.display = 'flex';
    gameoverEl.style.display = 'none';
    statsEl.style.display = 'none';
    swarmEl.style.display = 'none';
    stageIndEl.style.display = 'none';
    break;
  case GAME_PHASE.GAMEOVER:
    overlay.style.display = 'flex';
    titleEl.style.display = 'none';
    prologueEl.style.display = 'none';
    stageOverlayEl.style.display = 'none';
    endingEl.style.display = 'none';
    gameoverEl.style.display = 'flex';
    statsEl.style.display = 'none';
    swarmEl.style.display = 'none';
    stageIndEl.style.display = 'none';
    break;
  default:
    break;
}
}

// ============================================================
// 【5】ゲーム本体（プレイデータ・プレイロジック・描画）
// ============================================================
const game = {
phase: GAME_PHASE.TITLE,
player: { x:400, y:300, vx:0, vy:0, hp:100, maxHp:100, rank:1, atk:5, swarm:[], maxSwarm:10, animTime:0 },
stars:[], enemies:[], items:[], bubbles:[], trails:[], keys:{}, shake:0, time:0, currentStage:0,
stageClearPending: false,

phrases: {
  throw: ["いっけー！","とぉ！","おねがい！"],
  hit: ["ポカッ","ベシッ","ドカッ"],
  damage: ["イテッ","うわっ","ひどい！"],
  hello: ["ハーイ！","あそぼ！","ヤッホー"]
},

// ---- 初期化 ----
init() {
  this.svg = document.getElementById('gameSVG');
  this.world = document.getElementById('gameWorld');
  this.bg = document.getElementById('bgLayer');
  this.ui = document.getElementById('uiLayer');

  // 背景の星
  for(let i=0; i<80; i++) {
    const s = document.createElementNS('http://www.w3.org/2000/svg','circle');
    s.setAttribute('cx', Math.random()*800);
    s.setAttribute('cy', Math.random()*600);
    s.setAttribute('r', Math.random()*1.5+0.3);
    const bright = 0.2 + Math.random()*0.5;
    s.setAttribute('fill', `rgba(255,255,255,${bright})`);
    this.bg.appendChild(s);
  }

  // イベント
  window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
  this.svg.addEventListener('mousedown', (e) => {
    if (this.phase === GAME_PHASE.PLAYING) this.throwSwarmMouse(e);
  });
  this.svg.addEventListener('touchstart', (e) => {
    if (this.phase === GAME_PHASE.PLAYING && e.changedTouches[0]) {
      e.preventDefault();
      this.throwSwarmTouch(e.changedTouches[0]);
    }
  }, { passive: false });

  this.setupMobileControls();

  // ボタンバインド
  document.getElementById('btnStart').addEventListener('click', () => this.startPrologue());
  document.getElementById('btnStart').addEventListener('touchstart', (e) => { e.preventDefault(); this.startPrologue(); }, {passive:false});
  // iOS対応: プロローグスキップは touchend で発火（タップ確定時）。touchstart で preventDefault のみ。二重発火防止のため phase チェック。
  this.setupPrologueSkip();
  document.getElementById('btnRetry').addEventListener('click', () => this.backToTitle());
  document.getElementById('btnRetry').addEventListener('touchstart', (e) => { e.preventDefault(); this.backToTitle(); }, {passive:false});
  document.getElementById('btnRestart').addEventListener('click', () => this.backToTitle());
  document.getElementById('btnRestart').addEventListener('touchstart', (e) => { e.preventDefault(); this.backToTitle(); }, {passive:false});

  goToPhase(GAME_PHASE.TITLE);
},

setupMobileControls() {
  const handleTouch = (el, key, isAction) => {
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      AudioSys.resume();
      if(isAction) {
        if(key==='throw') this.autoAimThrow();
        if(key==='call') this.keys['shift'] = true;
        el.style.transform = "translateY(4px)";
      } else {
        this.keys[key] = true;
      }
    }, {passive:false});
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      if(isAction) {
        if(key==='call') this.keys['shift'] = false;
        el.style.transform = "translateY(0px)";
      } else {
        this.keys[key] = false;
      }
    }, {passive:false});
  };
  document.querySelectorAll('.dpad-touch').forEach(btn => handleTouch(btn, btn.dataset.key, false));
  handleTouch(document.querySelector('.btn-a'), 'throw', true);
  handleTouch(document.querySelector('.btn-b'), 'call', true);
},

// ---- iOS対応: プロローグ「タップしてはじめる」の確実な反応 ----
setupPrologueSkip() {
  const skipEl = document.getElementById('prologueSkip');
  const containerEl = document.getElementById('prologueContainer');
  let touchStartedOnSkip = false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const doEndPrologue = () => {
    if (this.phase !== GAME_PHASE.PROLOGUE) return;
    this.endPrologue();
  };

  skipEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartedOnSkip = true;
  }, { passive: false });
  skipEl.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (touchStartedOnSkip) {
      doEndPrologue();
      touchStartedOnSkip = false;
    }
  }, { passive: false });
  skipEl.addEventListener('click', (e) => {
    e.preventDefault();
    doEndPrologue();
  });

  // iOS用フォールバック: スキップ表示中はプロローグ領域のどこをタップしても進行
  if (isIOS && containerEl) {
    containerEl.addEventListener('touchstart', (e) => {
      if (this.phase !== GAME_PHASE.PROLOGUE) return;
      if (!document.getElementById('prologueSkip').classList.contains('visible')) return;
      e.preventDefault();
      doEndPrologue();
    }, { passive: false });
  }
},

// ---- プロローグ（タイトル → プロローグ）
startPrologue() {
  AudioSys.init();
  AudioSys.resume();
  AudioSys.startAmbient();
  goToPhase(GAME_PHASE.PROLOGUE);

  // プロローグSVGに流れ星を描く
  this.buildPrologueSVG();

  // 行を順番にフェードイン
  const lines = document.querySelectorAll('.prologue-line');
  lines.forEach((line, i) => {
    const delay = parseInt(line.dataset.delay) || (i * 1800);
    setTimeout(() => {
      line.classList.add('visible');
      AudioSys.play('textAppear');
      if(i === 0 || i === 3) AudioSys.play('prologue');
    }, delay);
  });

  // スキップボタン表示
  setTimeout(() => {
    document.getElementById('prologueSkip').classList.add('visible');
  }, 8000);
},

buildPrologueSVG() {
  const svg = document.getElementById('prologueSVG');
  svg.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';

  // 流れる星のアニメーション
  for(let i = 0; i < 12; i++) {
    const g = document.createElementNS(ns, 'g');
    const cx = Math.random() * 400;
    const cy = Math.random() * 300;
    const r = 2 + Math.random() * 3;
    const colors = ['#fab1a0','#ffeaa7','#74b9ff','#55efc4'];
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('fill', colors[i%4]);
    c.setAttribute('opacity', '0');

    const animOpacity = document.createElementNS(ns, 'animate');
    animOpacity.setAttribute('attributeName', 'opacity');
    animOpacity.setAttribute('values', '0;0.8;0');
    animOpacity.setAttribute('dur', (3 + Math.random()*4)+'s');
    animOpacity.setAttribute('begin', (Math.random()*5)+'s');
    animOpacity.setAttribute('repeatCount', 'indefinite');
    c.appendChild(animOpacity);

    const animCy = document.createElementNS(ns, 'animate');
    animCy.setAttribute('attributeName', 'cy');
    animCy.setAttribute('from', cy);
    animCy.setAttribute('to', cy + 30 + Math.random()*40);
    animCy.setAttribute('dur', (4 + Math.random()*3)+'s');
    animCy.setAttribute('begin', (Math.random()*3)+'s');
    animCy.setAttribute('repeatCount', 'indefinite');
    c.appendChild(animCy);

    g.appendChild(c);
    svg.appendChild(g);
  }
},

endPrologue() {
  // プロローグ終了 → ステージ1の演出へ（showStageIntro内で goToPhase される）
  this.resetPlayData();
  this.showStageIntro(0);
},

resetPlayData() {
  this.currentStage = 0;
  this.stageClearPending = false;
  this.player = { x:400, y:300, vx:0, vy:0, hp:100, maxHp:100, rank:1, atk:5, swarm:[], maxSwarm:10, animTime:0 };
  this.enemies = []; this.items = []; this.bubbles = []; this.stars = [];
  this.shake = 0; this.time = 0;
},

// ---- ステージ間演出（ステージ開始前のタイトル・メッセージ） ----
showStageIntro(stageIdx) {
  const stage = STORY.stages[stageIdx];
  this.currentStage = stageIdx;
  goToPhase(GAME_PHASE.STAGE_INTRO, { stageIndex: stageIdx });

  const stageOverlay = document.getElementById('stageOverlay');
  const title = document.getElementById('stageTitle');
  const msg = document.getElementById('stageMessage');

  title.textContent = stage.title;
  msg.textContent = stage.message;
  title.classList.remove('visible');
  msg.classList.remove('visible');
  document.getElementById('stageLabel').textContent = `${stage.rank} / ${TOTAL_STAGES}`;

  // 音（最終ステージ手前は緊張感のある音）
  const isNearEnd = stageIdx >= TOTAL_STAGES - 1;
  setTimeout(() => {
    AudioSys.play(isNearEnd ? 'tension' : 'stageStart');
    title.classList.add('visible');
  }, 300);
  setTimeout(() => msg.classList.add('visible'), 1200);

  // 自動で閉じてアクション開始
  setTimeout(() => {
    title.classList.remove('visible');
    msg.classList.remove('visible');
    setTimeout(() => {
      stageOverlay.style.display = 'none';
      goToPhase(GAME_PHASE.PLAYING, { stageIndex: stageIdx });
      this.beginStage(stageIdx);
    }, 500);
  }, 3800);
},

beginStage(stageIdx) {
  const stage = STORY.stages[stageIdx];
  this.stageClearPending = false;
  this.player.rank = stage.rank;

  this.spawnStars(8 + stageIdx * 3);
  const newEnemies = stage.enemies(stage.rank);
  this.enemies.push(...newEnemies);

  this.lastTime = Date.now();
  this.loop();
},

// ---- ステージクリア演出（次のステージ or エンディングへ）
onStageClear() {
  if (this.stageClearPending) return;
  this.stageClearPending = true;
  goToPhase(GAME_PHASE.STAGE_CLEAR);

  const stageIdx = this.currentStage;
  const stage = STORY.stages[stageIdx];

  AudioSys.play('clear');

  if (stage.clearMessage) {
    this.addBubble(400, 280, stage.clearMessage.split('\n')[0], '#fff', true);
    setTimeout(() => {
      if (stage.clearMessage && stage.clearMessage.split('\n')[1]) {
        this.addBubble(400, 280, stage.clearMessage.split('\n')[1], '#74b9ff', true);
      }
    }, 1500);
  }

  setTimeout(() => {
    if (stageIdx < STORY.stages.length - 1) {
      this.showStageIntro(stageIdx + 1);
    } else {
      goToPhase(GAME_PHASE.ENDING);
      this.showEnding();
    }
  }, 3500);
},

// ---- エンディング（オーバーレイ表示は goToPhase(ENDING) で済んでいる）
showEnding() {
  this.buildEndingSVG();
  AudioSys.play('ending');

  // SVGフェードイン
  setTimeout(() => document.getElementById('endingSVG').classList.add('visible'), 500);

  // テキスト順次表示
  document.querySelectorAll('#endingContainer .ending-line').forEach(line => {
    const delay = parseInt(line.dataset.delay) || 1000;
    setTimeout(() => {
      line.classList.add('visible');
      if(!line.querySelector('.btn-start')) AudioSys.play('textAppear');
    }, delay);
  });
},

buildEndingSVG() {
  const svg = document.getElementById('endingSVG');
  svg.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  const c = (tag, attrs) => {
    const el = document.createElementNS(ns, tag);
    for(let k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };

  // 背景の星
  for(let i=0; i<20; i++) {
    const star = c('circle', { cx: Math.random()*300, cy: Math.random()*200, r: Math.random()+0.5, fill: `rgba(255,255,255,${0.3+Math.random()*0.5})` });
    svg.appendChild(star);
  }

  // 地面（惑星の表面）
  svg.appendChild(c('ellipse', { cx:150, cy:185, rx:140, ry:25, fill:'#636e72', opacity:'0.3' }));

  // パパヘンテコ（にこにこ）
  const papa = c('g', { transform:'translate(150,120)' });
  papa.appendChild(c('path', { d:'M-40,0 Q-40,-50 0,-50 Q40,-50 40,0 Q40,40 0,40 Q-40,40 -40,0', fill:'#ff7675', stroke:'#fff', 'stroke-width':'2' }));
  papa.appendChild(c('circle', { cx:-12, cy:-10, r:5, fill:'#fff' }));
  papa.appendChild(c('circle', { cx:12, cy:-10, r:5, fill:'#fff' }));
  papa.appendChild(c('circle', { cx:-12, cy:-10, r:2, fill:'#000' }));
  papa.appendChild(c('circle', { cx:12, cy:-10, r:2, fill:'#000' }));
  // にっこり口
  papa.appendChild(c('path', { d:'M-15,8 Q0,22 15,8', fill:'none', stroke:'#fff', 'stroke-width':'3', 'stroke-linecap':'round' }));

  // パパの上にコスモたち
  const colors = ['#fab1a0','#ffeaa7','#74b9ff','#55efc4','#fd79a8'];
  for(let i=0; i<5; i++) {
    const angle = (i/5) * Math.PI*2 - Math.PI/2;
    const sx = Math.cos(angle)*35;
    const sy = Math.sin(angle)*35 - 15;
    const miniStar = c('g', { transform:`translate(${sx},${sy})` });
    const r2 = 6;
    let pts = '';
    for(let j=0; j<5; j++) {
      const th = Math.PI*2*j/5 - Math.PI/2;
      pts += `${Math.cos(th)*r2},${Math.sin(th)*r2} ${Math.cos(th+0.6)*r2*0.5},${Math.sin(th+0.6)*r2*0.5} `;
    }
    miniStar.appendChild(c('polygon', { points:pts, fill:colors[i], stroke:'#fff', 'stroke-width':'1' }));

    // ゆらゆらアニメーション
    const anim = document.createElementNS(ns, 'animateTransform');
    anim.setAttribute('attributeName','transform');
    anim.setAttribute('type','translate');
    anim.setAttribute('values', `${sx},${sy};${sx},${sy-4};${sx},${sy}`);
    anim.setAttribute('dur', (1.5+Math.random())+'s');
    anim.setAttribute('repeatCount','indefinite');
    miniStar.appendChild(anim);

    papa.appendChild(miniStar);
  }
  svg.appendChild(papa);

  // プレイヤー（左に）
  const pl = c('g', { transform:'translate(60,140)' });
  pl.appendChild(c('rect', { x:-7, y:-14, width:14, height:14, rx:3, fill:'#fff' }));
  pl.appendChild(c('line', { x1:-7, y1:-10, x2:7, y2:-10, stroke:'#e17055', 'stroke-width':2 }));
  pl.appendChild(c('line', { x1:-7, y1:-5, x2:7, y2:-5, stroke:'#e17055', 'stroke-width':2 }));
  pl.appendChild(c('circle', { cx:0, cy:-20, r:8, fill:'#ffeaa7' }));
  pl.appendChild(c('circle', { cx:-2.5, cy:-20, r:1, fill:'#000' }));
  pl.appendChild(c('circle', { cx:2.5, cy:-20, r:1, fill:'#000' }));
  pl.appendChild(c('path', { d:'M-8,-23 Q0,-32 8,-23 L8,-20 L-8,-20 Z', fill:'#d63031' }));
  // 手を上げるポーズ
  pl.appendChild(c('line', { x1:7, y1:-10, x2:14, y2:-20, stroke:'#ffeaa7', 'stroke-width':2, 'stroke-linecap':'round' }));
  svg.appendChild(pl);

  // ピザ（右に）
  const pizza = c('g', { transform:'translate(240,145)' });
  pizza.appendChild(c('path', { d:'M0,-15 L12,10 L-12,10 Z', fill:'#f1c40f', stroke:'#e67e22', 'stroke-width':'1.5' }));
  pizza.appendChild(c('circle', { cx:-2, cy:0, r:2, fill:'#e74c3c' }));
  pizza.appendChild(c('circle', { cx:4, cy:3, r:2, fill:'#e74c3c' }));
  pizza.appendChild(c('circle', { cx:1, cy:-5, r:1.5, fill:'#27ae60' }));

  const pizzaAnim = document.createElementNS(ns, 'animateTransform');
  pizzaAnim.setAttribute('attributeName','transform');
  pizzaAnim.setAttribute('type','translate');
  pizzaAnim.setAttribute('values','240,145;240,141;240,145');
  pizzaAnim.setAttribute('dur','2s');
  pizzaAnim.setAttribute('repeatCount','indefinite');
  pizza.appendChild(pizzaAnim);
  svg.appendChild(pizza);
},

// ---- ゲームオーバー ----
showGameOver() {
  goToPhase(GAME_PHASE.GAMEOVER);
},

// ---- タイトルに戻る ----
backToTitle() {
  this.world.innerHTML = '';
  this.ui.innerHTML = '';
  document.getElementById('stageOverlay').style.display = 'none';
  goToPhase(GAME_PHASE.TITLE);
},

// ---- ゲームループ（プレイ中のみ更新・描画） ----
loop() {
  if (this.phase !== GAME_PHASE.PLAYING) return;
  const now = Date.now();
  const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap
  this.lastTime = now;
  this.time += dt;
  this.update(dt);
  this.render();
  requestAnimationFrame(() => this.loop());
},

update(dt) {
  const speed = 200;
  this.player.vx = 0; this.player.vy = 0;
  let moving = false;
  if (this.keys['w']||this.keys['arrowup']) { this.player.vy=-speed; moving=true; }
  if (this.keys['s']||this.keys['arrowdown']) { this.player.vy=speed; moving=true; }
  if (this.keys['a']||this.keys['arrowleft']) { this.player.vx=-speed; moving=true; }
  if (this.keys['d']||this.keys['arrowright']) { this.player.vx=speed; moving=true; }
  if(moving) this.player.animTime += dt*12;
  this.player.x = Math.max(40, Math.min(760, this.player.x+this.player.vx*dt));
  this.player.y = Math.max(40, Math.min(560, this.player.y+this.player.vy*dt));

  // 呼び戻し
  if (this.keys['shift']) {
    this.player.swarm.forEach(u => { if(u.state!=='follow'){u.state='follow';u.target=null;} });
  }

  // 星回収
  for (let i=this.stars.length-1;i>=0;i--) {
    const s=this.stars[i];
    if(Math.hypot(this.player.x-s.x,this.player.y-s.y)<45 && this.player.swarm.length<this.player.maxSwarm) {
      this.player.swarm.push({
        x:s.x,y:s.y,z:0,state:'follow',target:null,
        angle:Math.random()*Math.PI*2,color:s.color,scale:s.scale
      });
      for(let b=0;b<6;b++){
        const ang=(b/6)*Math.PI*2;
        this.bubbles.push({x:s.x+Math.cos(ang)*12,y:s.y+Math.sin(ang)*12,text:b%2===0?'★':'♡',color:s.color,isBig:false,life:0.7,vx:Math.cos(ang)*55,vy:Math.sin(ang)*55-15});
      }
      this.stars.splice(i,1);
      AudioSys.play('hello');
      this.addBubble(s.x,s.y-30,this.phrases.hello[Math.floor(Math.random()*3)],s.color);
    }
  }

  // アイテム
  for(let i=this.items.length-1;i>=0;i--) {
    const item=this.items[i];
    if(Math.hypot(this.player.x-item.x,this.player.y-item.y)<40) {
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+30);
      AudioSys.play('heal');
      this.addBubble(this.player.x,this.player.y-40,"げんき でた！",'#fff');
      this.items.splice(i,1);
    }
  }

  // 仲間ロジック
  this.player.swarm.forEach((unit,idx) => {
    if(unit.state==='follow') {
      const total=this.player.swarm.length;
      const frac=idx/Math.max(1,total);
      const targetAngle=frac*Math.PI*2+this.time*0.7;
      const ring=Math.floor(idx/8);
      const r=32+ring*18+Math.sin(this.time*2+idx)*4;
      const tx=this.player.x+Math.cos(targetAngle)*r;
      const ty=this.player.y+Math.sin(targetAngle)*r;
      unit.x+=(tx-unit.x)*6*dt;
      unit.y+=(ty-unit.y)*6*dt;
      unit.z=Math.abs(Math.sin(this.time*4+idx))*8;
    } else if(unit.state==='thrown') {
      unit.x += unit.vx*dt; unit.y += unit.vy*dt; unit.z += unit.vz*dt;
      unit.vz -= 500*dt;
      if(Math.random()<0.5) this.trails.push({x:unit.x,y:unit.y,color:unit.color,life:0.28,maxLife:0.28,r:5+Math.random()*3});
      if(unit.z<=0){unit.z=0;unit.state='follow';}
      this.enemies.forEach(e => {
        if(Math.hypot(unit.x-e.x,unit.y-e.y)<(e.isBoss?60:35) && unit.z<40) {
          unit.state='attached'; unit.target=e; e.attached.push(unit);
          AudioSys.play('hit');
          if(Math.random()<0.3) this.addBubble(e.x+(Math.random()-0.5)*30,e.y-40,this.phrases.hit[Math.floor(Math.random()*3)],'#ffeaa7');
        }
      });
    } else if(unit.state==='attached') {
      if(unit.target&&unit.target.hp>0) {
        const t=unit.target;
        const off=this.time*10+idx;
        unit.x=t.x+Math.cos(off)*(t.isBoss?40:20);
        unit.y=t.y+Math.sin(off)*(t.isBoss?40:20);
        unit.z=10;
      } else {
        unit.state='follow'; unit.target=null;
      }
    }
  });

  // 敵ロジック
  this.enemies.forEach(e => {
    e.wobble += dt;
    const dist=Math.hypot(this.player.x-e.x,this.player.y-e.y);
    if(dist<600) {
      const spd=e.isBoss?35:55;
      const ang=Math.atan2(this.player.y-e.y,this.player.x-e.x);
      e.x+=Math.cos(ang)*spd*dt;
      e.y+=Math.sin(ang)*spd*dt;
      if(dist<(e.isBoss?60:40)) {
        e.attackCooldown-=dt;
        if(e.attackCooldown<=0) {
          this.player.hp-=e.atk; e.attackCooldown=1.5;
          this.shake=15; AudioSys.play('damage');
          this.addBubble(this.player.x,this.player.y-40,this.phrases.damage[Math.floor(Math.random()*3)],'#ff4757');
          if(this.player.hp<=0) { this.player.hp=0; this.showGameOver(); return; }
        }
      }
    }
    // くっついてる仲間からダメージ
    if(e.attached.length>0) {
      let dmg=(this.player.atk*e.attached.length)-e.def;
      const isSmash = Math.random()<0.03;
      if(isSmash) { dmg*=2; this.shake=10; this.addBubble(e.x,e.y-50,"COSMIC HIT!!",'#f1c40f',true); }
      e.hp -= Math.max(1,dmg)*dt;
      if(e.hp<=0) this.killEnemy(e);
    }
  });

  // フキダシ更新
  for(let i=this.bubbles.length-1;i>=0;i--) {
    const b=this.bubbles[i];
    b.life-=dt; b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(b.life<=0) this.bubbles.splice(i,1);
  }
  // 軌跡更新
  for(let i=this.trails.length-1;i>=0;i--) {
    this.trails[i].life-=dt;
    if(this.trails[i].life<=0) this.trails.splice(i,1);
  }
  if(this.shake>0) this.shake*=0.9;

  // クリア判定
  if(this.enemies.length===0 && !this.stageClearPending) {
    this.onStageClear();
  }

  this.updateUI();
},

updateUI() {
  document.getElementById('hpText').textContent = Math.max(0,Math.floor(this.player.hp));
  document.getElementById('rankText').textContent = this.player.rank;
  document.getElementById('swarmText').textContent = this.player.swarm.length;
},

spawnStars(count) {
  for(let i=0;i<count;i++) {
    this.stars.push({
      x:50+Math.random()*700, y:50+Math.random()*500,
      color:['#fab1a0','#ffeaa7','#74b9ff','#55efc4'][Math.floor(Math.random()*4)],
      scale:0.8+Math.random()*0.4
    });
  }
},

killEnemy(e) {
  if(Math.random()<0.4) this.items.push({x:e.x,y:e.y});
  this.player.atk+=1; this.player.maxSwarm+=1;
  e.attached.forEach(u=>{u.state='follow';u.target=null;});
  const idx=this.enemies.indexOf(e);
  if(idx>-1) this.enemies.splice(idx,1);
  this.shake=20;
  const heartSyms=e.isBoss?['♡','♡','★','〜','♡']:['♡','★','〜'];
  const heartCount=e.isBoss?6:4;
  for(let h=0;h<heartCount;h++){
    this.bubbles.push({x:e.x+(Math.random()-0.5)*60,y:e.y-10-Math.random()*30,text:heartSyms[Math.floor(Math.random()*heartSyms.length)],color:e.color,isBig:false,life:1.8,vx:(Math.random()-0.5)*45,vy:-50-Math.random()*30});
  }
  if(e.isBoss) {
    this.addBubble(e.x,e.y-20,"…ごめんね",'#fab1a0',true);
  } else {
    const msgs = ["おとなしくなった！","きもちが おちついた！","ふう、すっきり！"];
    this.addBubble(e.x,e.y,msgs[Math.floor(Math.random()*msgs.length)],'#fff',true);
  }
},

addBubble(x,y,text,color,isBig=false) {
  const mx=Math.max(100,Math.min(700,x));
  const my=Math.max(50,Math.min(550,y));
  this.bubbles.push({
    x:mx,y:my,text,color,isBig,life:2.0,
    vx:(Math.random()-0.5)*30, vy:-25-Math.random()*15
  });
},

autoAimThrow() {
  if (this.phase !== GAME_PHASE.PLAYING || this.player.swarm.length === 0) return;
  let target=null,minDist=9999;
  this.enemies.forEach(e=>{
    const d=Math.hypot(e.x-this.player.x,e.y-this.player.y);
    if(d<minDist){minDist=d;target=e;}
  });
  let tx=target?target.x:this.player.x+100;
  let ty=target?target.y:this.player.y;
  this.execThrow(tx,ty);
},

throwSwarmMouse(e) {
  const rect = this.svg.getBoundingClientRect();
  const tx = (e.clientX - rect.left) * (800 / rect.width);
  const ty = (e.clientY - rect.top) * (600 / rect.height);
  this.execThrow(tx, ty);
},

throwSwarmTouch(touch) {
  const rect = this.svg.getBoundingClientRect();
  const tx = (touch.clientX - rect.left) * (800 / rect.width);
  const ty = (touch.clientY - rect.top) * (600 / rect.height);
  this.execThrow(tx, ty);
},

execThrow(tx,ty) {
  const unit=this.player.swarm.find(u=>u.state==='follow');
  if(unit) {
    const dist=Math.hypot(tx-unit.x,ty-unit.y)||1;
    unit.vx=((tx-unit.x)/dist)*550;
    unit.vy=((ty-unit.y)/dist)*550;
    unit.vz=350;
    unit.state='thrown';
    AudioSys.play('throw');
    if(Math.random()<0.3) this.addBubble(this.player.x,this.player.y-50,this.phrases.throw[Math.floor(Math.random()*3)],'#fff');
  }
},

// ---- 【6】描画（プレイ中のみループから呼ばれる） ----
render() {
  this.world.innerHTML=''; this.ui.innerHTML='';
  const sx=(Math.random()-0.5)*this.shake;
  const sy=(Math.random()-0.5)*this.shake;
  const c=(tag,attrs)=>{
    const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(let k in attrs) el.setAttribute(k,attrs[k]);
    return el;
  };

  // 軌跡（投げたコスモのスパークル）
  this.trails.forEach(t=>{
    const ratio=t.life/t.maxLife;
    const tr=c('circle',{cx:t.x+sx,cy:t.y+sy,r:t.r*ratio,fill:t.color,opacity:ratio*0.7});
    this.world.appendChild(tr);
  });

  // アイテム（ハートの回復アイテム）
  this.items.forEach(it=>{
    const g=c('g',{transform:`translate(${it.x+sx},${it.y+sy})`});
    const bob = Math.sin(this.time*3)*3;
    g.setAttribute('transform', `translate(${it.x+sx},${it.y+sy+bob})`);
    g.appendChild(c('path',{d:'M0,-6 C-8,-14 -16,-4 0,8 C16,-4 8,-14 0,-6',fill:'#ff6b81',stroke:'#fff','stroke-width':1.5}));
    this.world.appendChild(g);
  });

  // 星（集める仲間）
  this.stars.forEach(s=>{
    const bob=Math.sin(this.time*2+s.x)*4;
    const g=c('g',{transform:`translate(${s.x+sx},${s.y+sy+bob})`});
    const r=10*s.scale;
    let pts='';
    for(let i=0;i<5;i++){
      const th=Math.PI*2*i/5-Math.PI/2;
      pts+=`${Math.cos(th)*r},${Math.sin(th)*r} ${Math.cos(th+0.6)*r*0.5},${Math.sin(th+0.6)*r*0.5} `;
    }
    g.appendChild(c('polygon',{points:pts,fill:s.color,stroke:'#fff','stroke-width':1,opacity:'0.8'}));
    // キラキラ
    const sparkle = Math.sin(this.time*5+s.y)*0.3+0.7;
    g.appendChild(c('circle',{cx:0,cy:0,r:2,fill:'#fff',opacity:sparkle}));
    this.world.appendChild(g);
  });

  // 敵
  this.enemies.forEach(e=>{
    const warp=Math.sin(this.time*8+e.wobble)*3;
    const g=c('g',{transform:`translate(${e.x+sx},${e.y+sy})`});
    const size=e.isBoss?60:30;
    g.appendChild(c('ellipse',{cx:0,cy:size/2+10,rx:size,ry:size/3,fill:'rgba(0,0,0,0.3)'}));
    g.appendChild(c('path',{d:`M-${size},0 Q-${size},-${size+warp} 0,-${size+warp} Q${size},-${size+warp} ${size},0 Q${size},${size-warp} 0,${size-warp} Q-${size},${size-warp} -${size},0`,fill:e.color,stroke:'#fff','stroke-width':3}));
    const eyey=-size/4;
    g.appendChild(c('circle',{cx:-size/3,cy:eyey,r:size/6,fill:'#fff'}));
    g.appendChild(c('circle',{cx:size/3,cy:eyey,r:size/6,fill:'#fff'}));

    // 怒り具合で目の表情を変える
    const hpRatio = e.hp / e.maxHp;
    if(hpRatio > 0.5) {
      // 怒り顔
      g.appendChild(c('circle',{cx:-size/3,cy:eyey,r:size/15,fill:'#000'}));
      g.appendChild(c('circle',{cx:size/3,cy:eyey,r:size/15,fill:'#000'}));
      // 怒り眉
      g.appendChild(c('line',{x1:-size/2,y1:eyey-size/5,x2:-size/6,y2:eyey-size/8,stroke:'#000','stroke-width':2,'stroke-linecap':'round'}));
      g.appendChild(c('line',{x1:size/2,y1:eyey-size/5,x2:size/6,y2:eyey-size/8,stroke:'#000','stroke-width':2,'stroke-linecap':'round'}));
    } else {
      // おちつき始め（目がうるうる）
      g.appendChild(c('circle',{cx:-size/3,cy:eyey+2,r:size/12,fill:'#000'}));
      g.appendChild(c('circle',{cx:size/3,cy:eyey+2,r:size/12,fill:'#000'}));
      g.appendChild(c('circle',{cx:-size/3+1,cy:eyey,r:size/25,fill:'#fff'}));
      g.appendChild(c('circle',{cx:size/3+1,cy:eyey,r:size/25,fill:'#fff'}));
    }

    // 口
    if(hpRatio > 0.5) {
      if(e.isBoss) g.appendChild(c('path',{d:`M-${size/3},8 Q0,-4 ${size/3},8`,fill:'none',stroke:'#000','stroke-width':3}));
      else g.appendChild(c('path',{d:`M-${size/4},5 L${size/4},5`,stroke:'#000','stroke-width':2}));
    } else {
      // おだやかな口
      if(e.isBoss) g.appendChild(c('path',{d:`M-${size/3},5 Q0,18 ${size/3},5`,fill:'none',stroke:'#fff','stroke-width':3}));
      else g.appendChild(c('circle',{cx:0,cy:8,r:3,fill:'#000',opacity:'0.4'}));
    }

    // HPバー（ごきげんゲージ）
    if(e.hp<e.maxHp) {
      const bw=60;
      g.appendChild(c('rect',{x:-bw/2,y:-size-22,width:bw,height:8,fill:'#444',rx:4}));
      // 怒り→おだやか（赤→緑）
      const ratio = e.hp/e.maxHp;
      const barColor = ratio>0.5 ? '#e74c3c' : '#2ed573';
      g.appendChild(c('rect',{x:-bw/2+2,y:-size-20,width:(bw-4)*ratio,height:4,fill:barColor,rx:2}));
      // ラベル
      const label = c('text',{x:0,y:-size-26,'font-size':'8','text-anchor':'middle',fill:'#dfe6e9'});
      label.textContent = ratio>0.5 ? 'ぷんぷん' : 'おちつき中…';
      g.appendChild(label);
    }

    this.world.appendChild(g);
  });

  // 仲間
  this.player.swarm.forEach(u=>{
    const jump=-u.z;
    const g=c('g',{transform:`translate(${u.x+sx},${u.y+jump+sy}) scale(${u.scale||1})`});
    const r=10;
    let points='';
    for(let i=0;i<5;i++){
      const th=Math.PI*2*i/5-Math.PI/2;
      points+=`${Math.cos(th)*r},${Math.sin(th)*r} ${Math.cos(th+0.6)*r*0.5},${Math.sin(th+0.6)*r*0.5} `;
    }
    g.appendChild(c('polygon',{points,fill:u.color,stroke:'#fff','stroke-width':1.5}));
    g.appendChild(c('circle',{cx:-3,cy:-1,r:1.5,fill:'#000'}));
    g.appendChild(c('circle',{cx:3,cy:-1,r:1.5,fill:'#000'}));
    // くっついてるときはハート
    if(u.state==='attached') {
      g.appendChild(c('path',{d:'M0,-8 C-3,-11 -6,-8 0,-4 C6,-8 3,-11 0,-8',fill:'#ff6b81','stroke-width':0,opacity:'0.7',transform:'translate(0,-14) scale(0.6)'}));
    }
    this.world.appendChild(g);
  });

  // プレイヤー
  const pg=c('g',{transform:`translate(${this.player.x+sx},${this.player.y+sy})`});
  const bob=Math.abs(Math.sin(this.player.animTime))*4;
  const tilt=this.player.vx*0.04;
  pg.appendChild(c('ellipse',{cx:0,cy:5,rx:12,ry:4,fill:'rgba(0,0,0,0.3)'}));
  const bodyG=c('g',{transform:`translate(0,${-bob}) rotate(${tilt})`});
  bodyG.appendChild(c('rect',{x:-9,y:-18,width:18,height:18,rx:4,fill:'#fff'}));
  bodyG.appendChild(c('line',{x1:-9,y1:-14,x2:9,y2:-14,stroke:'#e17055','stroke-width':3}));
  bodyG.appendChild(c('line',{x1:-9,y1:-8,x2:9,y2:-8,stroke:'#e17055','stroke-width':3}));
  bodyG.appendChild(c('circle',{cx:0,cy:-24,r:11,fill:'#ffeaa7'}));
  bodyG.appendChild(c('circle',{cx:-3.5,cy:-24,r:1.5,fill:'#000'}));
  bodyG.appendChild(c('circle',{cx:-4.5,cy:-25,r:0.5,fill:'#fff'}));
  bodyG.appendChild(c('circle',{cx:3.5,cy:-24,r:1.5,fill:'#000'}));
  bodyG.appendChild(c('circle',{cx:2.5,cy:-25,r:0.5,fill:'#fff'}));
  bodyG.appendChild(c('path',{d:'M-11,-28 Q0,-40 11,-28 L11,-24 L-11,-24 Z',fill:'#d63031'}));
  bodyG.appendChild(c('rect',{x:8,y:-28,width:6,height:4,fill:'#d63031'}));
  pg.appendChild(bodyG);
  this.world.appendChild(pg);

  // フキダシ
  this.bubbles.forEach(b=>{
    const alpha = Math.min(1, b.life / 0.5);
    const g=c('g',{transform:`translate(${b.x+sx},${b.y+sy})`,opacity:alpha});
    const fs=b.isBig?22:13;
    const pad=b.isBig?18:10;
    const w=b.text.length*fs+pad*2;
    const h=b.isBig?36:24;
    const boxTop=-h/2-4;
    if(b.isBig) {
      const path=`M${-w/2},${boxTop} L${w/2},${boxTop} L${w/2+8},${boxTop+h/2} L${w/2},${boxTop+h} L${-w/2},${boxTop+h} L${-w/2-8},${boxTop+h/2} Z`;
      g.appendChild(c('path',{d:path,fill:b.color,stroke:'#333','stroke-width':2}));
    } else {
      g.appendChild(c('rect',{x:-w/2,y:boxTop,width:w,height:h,rx:10,fill:b.color,stroke:'#555','stroke-width':1}));
      g.appendChild(c('path',{d:`M-4,${boxTop+h} L0,${boxTop+h+5} L4,${boxTop+h}`,fill:b.color}));
    }
    const t=c('text',{x:0,y:boxTop+h/2,'font-size':fs,'text-anchor':'middle','dominant-baseline':'central',fill:'#333','font-weight':'bold'});
    t.textContent=b.text;
    g.appendChild(t);
    this.ui.appendChild(g);
  });
}
};

// ============================================================
// 【7】初期化・iOS対応（ダブルタップ拡大防止）
// CSSのtouch-actionだけではiOS Safariで不十分なため、JSで追加対策
// ============================================================
(function initIOSDoubleTapPrevent() {
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 350) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

document.addEventListener('dblclick', (e) => e.preventDefault());
})();

window.addEventListener('load', () => game.init());
