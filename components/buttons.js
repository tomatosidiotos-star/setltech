/* ═══════════════════════════════════════════════════════════
   SETL TECH — Button & Nav Components
   Использование:
     initButtons()            — авто-инит всех кнопок на странице
     initBtn(el, options)     — инит конкретной кнопки

   HTML-разметка:
   ─────────────────────────────────────────────────────────
   Primary:
     <a href="#" class="btn-primary">
       <span class="btn-label">Получить консультацию</span>
       <span class="btn-icon"><svg>...</svg></span>
     </a>

   Stroke:
     <a href="#" class="btn-stroke">
       <span class="btn-label">О продуктах</span>
       <span class="btn-icon"><svg>...</svg></span>
     </a>

   Stroke Simple (без квадрата):
     <button class="btn-stroke-simple">
       <span class="btn-label">Обратный звонок</span>
     </button>
   ═══════════════════════════════════════════════════════════ */

/* ─── Text Scramble ────────────────────────────────────── */
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}=+*^?#@$%';
    this._tick = this._tick.bind(this);
  }

  run(text) {
    const len = Math.max(this.el.innerText.length, text.length);
    this.queue = Array.from({ length: len }, (_, i) => ({
      from:  this.el.innerText[i] || '',
      to:    text[i] || '',
      // растянуто на ~60 кадров (~1 сек при 60fps)
      start: Math.floor(Math.random() * 18),
      end:   Math.floor(Math.random() * 22) + 32,
      char:  ''
    }));
    cancelAnimationFrame(this._raf);
    this.frame = 0;
    this._tick();
  }

  _tick() {
    let out = '', done = 0;
    for (const q of this.queue) {
      if (this.frame >= q.end) {
        done++;
        out += q.to;
      } else if (this.frame >= q.start) {
        if (!q.char || Math.random() < 0.28)
          q.char = this.chars[Math.floor(Math.random() * this.chars.length)];
        // серый цвет символов — виден, но не кричит
        out += `<span style="color:#9a9088">${q.char}</span>`;
      } else {
        out += q.from;
      }
    }
    this.el.innerHTML = out;
    if (done < this.queue.length) {
      this.frame++;
      this._raf = requestAnimationFrame(this._tick);
    }
  }
}

/* ─── Nav Links init ───────────────────────────────────── */
function initNavLinks(selector = '.nav-link') {
  const links = document.querySelectorAll(selector);

  function setup() {
    links.forEach(link => {
      link.style.width     = '';
      link.style.textAlign = 'left';
      link.style.width     = link.offsetWidth + 'px';

      const fx   = new TextScramble(link);
      const orig = link.textContent.trim();
      link.addEventListener('mouseenter', () => fx.run(orig));
    });
  }

  document.fonts.ready.then(setup);
}

/* ═══════════════════════════════════════════════════════════
   Pixel Dissolve
   ═══════════════════════════════════════════════════════════ */

const COLS = 8, ROWS = 2;

function buildGrid(cvs, ctx) {
  const w = cvs.width, h = cvs.height;
  ctx.imageSmoothingEnabled = false;
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x  = Math.round(c * w / COLS);
      const y  = Math.round(r * h / ROWS);
      const x2 = Math.round((c + 1) * w / COLS);
      const y2 = Math.round((r + 1) * h / ROWS);
      cells.push({ x, y, w: x2 - x, h: y2 - y, d: Math.random() });
    }
  }
  return cells;
}

function ease(t) {
  return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
}

/**
 * Инициализирует pixel dissolve на кнопке.
 *
 * @param {HTMLElement} btn
 * @param {object} opts
 *   fillRGB      [r,g,b]   цвет заливки при ховере        (по умолч. чёрный)
 *   onMidpoint   fn(enter) колбэк на середине анимации
 *   onDone       fn(enter) колбэк по завершении
 *   duration     ms        длительность                    (по умолч. 420)
 */
function initBtn(btn, opts = {}) {
  const {
    fillRGB    = [28, 28, 28],
    onMidpoint = null,
    onDone     = null,
    duration   = 420,
  } = opts;

  let cvs, ctx, cells, raf;

  function build() {
    const w = btn.offsetWidth, h = btn.offsetHeight;
    if (!cvs) {
      cvs = document.createElement('canvas');
      cvs.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;';
      btn.prepend(cvs);
    }
    cvs.width = w; cvs.height = h;
    ctx = cvs.getContext('2d');
    cells = buildGrid(cvs, ctx);
  }

  function play(enter) {
    if (!cvs || cvs.width !== btn.offsetWidth) build();
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    let midFired = false;

    function step(now) {
      const p = Math.min((now - t0) / duration, 1);
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      cells.forEach(cell => {
        const lp = Math.max(0, Math.min(1, (p - cell.d * 0.45) / 0.55));
        const a  = enter ? ease(lp) : 1 - ease(lp);
        if (a > 0.01) {
          ctx.fillStyle = `rgba(${fillRGB[0]},${fillRGB[1]},${fillRGB[2]},${a})`;
          ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
        }
      });

      // Середина
      if (!midFired && (enter ? p : 1-p) > 0.5) {
        midFired = true;
        if (onMidpoint) onMidpoint(enter);
      }

      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        // Финальная чистая заливка — без щелей
        if (enter) {
          ctx.fillStyle = `rgb(${fillRGB[0]},${fillRGB[1]},${fillRGB[2]})`;
          ctx.fillRect(0, 0, cvs.width, cvs.height);
        } else {
          ctx.clearRect(0, 0, cvs.width, cvs.height);
        }
        if (onDone) onDone(enter);
      }
    }

    raf = requestAnimationFrame(step);
  }

  build();
  btn.addEventListener('mouseenter', () => play(true));
  btn.addEventListener('mouseleave', () => play(false));
  new ResizeObserver(build).observe(btn);
}

/* ─── Авто-инит по классам ─────────────────────────────── */
function initButtons() {
  // Primary: dissolve → чёрный, квадрат → красный
  document.querySelectorAll('.btn-primary').forEach(btn => {
    const icon  = btn.querySelector('.btn-icon');
    const label = btn.querySelector('.btn-label');
    initBtn(btn, {
      fillRGB: [28, 28, 28],
      onMidpoint: enter => {
        if (icon)  icon.style.background  = enter ? 'var(--red)'   : 'var(--black)';
      },
      onDone: enter => {
        if (icon)  icon.style.background  = enter ? 'var(--red)'   : 'var(--black)';
        if (label) label.style.color      = '#fff'; // белый всегда
      },
    });
  });

  // Stroke: dissolve → чёрный, квадрат → красный, текст → белый
  document.querySelectorAll('.btn-stroke').forEach(btn => {
    const icon  = btn.querySelector('.btn-icon');
    const label = btn.querySelector('.btn-label');
    initBtn(btn, {
      fillRGB: [28, 28, 28],
      onMidpoint: enter => {
        if (icon)  icon.style.background = enter ? 'var(--red)'  : 'var(--surf)';
        if (label) label.style.color     = enter ? '#fff'        : 'var(--black)';
      },
      onDone: enter => {
        if (icon)  icon.style.background = enter ? 'var(--red)'  : 'var(--surf)';
        if (label) label.style.color     = enter ? '#fff'        : 'var(--black)';
      },
    });
  });

  // Stroke Simple: dissolve → чёрный, текст → белый
  document.querySelectorAll('.btn-stroke-simple').forEach(btn => {
    const label = btn.querySelector('.btn-label');
    initBtn(btn, {
      fillRGB: [28, 28, 28],
      onMidpoint: enter => {
        if (label) label.style.color = enter ? '#fff' : 'var(--black)';
      },
      onDone: enter => {
        if (label) label.style.color = enter ? '#fff' : 'var(--black)';
      },
    });
  });
}
