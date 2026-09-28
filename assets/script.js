/* ============================================================
   《概率论与数理统计习题精选精解》刷题版 - 公共交互脚本
   功能：夜间模式 / 解析折叠 / 懒渲染 / 进度记忆 / 快捷导航 / 侧栏定位
   依赖：KaTeX (assets/katex/)
   ============================================================ */
(function () {
  'use strict';

  var LS_THEME = 'tiku-theme';
  var LS_MARKS = 'tiku-marks';      // { "c1-1.1": true, ... }
  var LS_STATS = 'tiku-chstats';    // { "c1": {marked: n, total: t} }
  var LS_SCROLL = 'tiku-scroll';    // { "c1": 12345 }

  /** 页面类型：index 或 chapter（由 body[data-page] 指定） */
  var pageType = document.body.dataset.page;
  var chapterKey = document.body.dataset.chapter || '';

  /* ---------------- 夜间模式 ---------------- */
  function applyTheme(t) {
    document.documentElement.classList.toggle('dark', t === 'dark');
    var btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = t === 'dark' ? '☀' : '🌙';
  }
  applyTheme(localStorage.getItem(LS_THEME) || 'light');
  bind('themeBtn', function () {
    var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem(LS_THEME, next);
    applyTheme(next);
  });

  /* ---------------- 移动端侧栏 ---------------- */
  bind('menuBtn', function () {
    sidebar().classList.toggle('open');
    mask().classList.toggle('show', sidebar().classList.contains('open'));
  });
  bind('sidebarMask', function () {
    sidebar().classList.remove('open');
    mask().classList.remove('show');
  });

  function sidebar() { return document.getElementById('sidebar'); }
  function mask() { return document.getElementById('mask'); }
  function bind(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }

  /* ---------------- KaTeX 渲染 ---------------- */
  var katexReadyFlag = false;
  function katexReady(cb) {
    if (katexReadyFlag) return cb();
    var check = setInterval(function () {
      if (window.renderMathInElement) { clearInterval(check); katexReadyFlag = true; cb(); }
    }, 60);
  }
  function renderIn(el) {
    if (!el || el.dataset.katexDone) return;
    katexReady(function () {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
      el.dataset.katexDone = '1';
    });
  }

  /* ---------------- 题目集合与懒渲染 ---------------- */
  var cards = Array.prototype.slice.call(document.querySelectorAll('.q-card'));
  var lazyMode = cards.length > 50;   // 超过 50 题：视口外延迟渲染

  if (pageType === 'chapter') {
    if (!lazyMode) {
      cards.forEach(function (c) { renderIn(c); });
    } else {
      /* 主路径：IntersectionObserver；兜底：首屏预渲染 + 滚动按需渲染 */
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { renderIn(e.target); io.unobserve(e.target); }
          });
        }, { rootMargin: '400px 0px' });
        cards.forEach(function (c) { io.observe(c); });
      }
      cards.slice(0, 10).forEach(renderIn);   // 首屏立即渲染前 10 题
      window.addEventListener('scroll', throttle(function () {
        var vh = window.innerHeight;
        cards.forEach(function (c) {
          if (c.dataset.katexDone) return;
          var r = c.getBoundingClientRect();
          if (r.top < vh + 600 && r.bottom > -200) renderIn(c);
        });
      }, 250), { passive: true });
      /* 终极兜底：加载 1.5s 后分块渐进渲染全部剩余题（每批 8 题），
         确保任何环境（IO 失效/滚动受限的嵌入视图）都不会留下未渲染公式 */
      (function progressive(start) {
        setTimeout(function () {
          var rest = cards.filter(function (c) { return !c.dataset.katexDone; });
          rest.slice(0, 8).forEach(renderIn);
          if (rest.length > 8) progressive(start);
        }, start);
      })(1500);
    }
  } else {
    /* 首页无公式，直接标记完成 */
    document.querySelectorAll('[data-katex]').forEach(function (el) { el.dataset.katexDone = '1'; });
  }

  /* ---------------- 解析折叠 / 展开 ---------------- */
  document.querySelectorAll('.q-card').forEach(function (card) {
    var btn = card.querySelector('.toggle-btn');
    var wrap = card.querySelector('.sol-wrap');
    if (!btn || !wrap) return;
    btn.addEventListener('click', function () {
      var collapsed = wrap.classList.toggle('collapsed');
      btn.textContent = collapsed ? '展开解析' : '收起解析';
      if (!collapsed) renderIn(wrap);
    });
  });

  /* ---------------- 做题进度标记 ---------------- */
  function getMarks() {
    try { return JSON.parse(localStorage.getItem(LS_MARKS)) || {}; } catch (e) { return {}; }
  }
  function setMarks(m) { localStorage.setItem(LS_MARKS, JSON.stringify(m)); }

  function refreshStats() {
    if (pageType !== 'chapter') return;
    var marks = getMarks();
    var total = cards.length, marked = 0;
    cards.forEach(function (c) { if (marks[c.dataset.qid]) marked++; });
    var stats = {};
    try { stats = JSON.parse(localStorage.getItem(LS_STATS)) || {}; } catch (e) {}
    stats[chapterKey] = { marked: marked, total: total };
    localStorage.setItem(LS_STATS, JSON.stringify(stats));
    /* 侧栏题号同步打勾颜色 */
    document.querySelectorAll('.q-links a').forEach(function (a) {
      a.classList.toggle('done', !!marks[a.dataset.qid]);
    });
  }

  if (pageType === 'chapter') {
    var marks0 = getMarks();
    cards.forEach(function (card) {
      var qid = card.dataset.qid;
      var btn = card.querySelector('.mark-btn');
      if (!btn) return;
      function paint() {
        var done = !!getMarks()[qid];
        btn.classList.toggle('done', done);
        btn.textContent = done ? '✓ 已做' : '○ 未做';
        btn.title = done ? '点击取消标记' : '标记为已做';
      }
      paint();
      btn.addEventListener('click', function () {
        var m = getMarks();
        if (m[qid]) delete m[qid]; else m[qid] = true;
        setMarks(m);
        paint();
        refreshStats();
      });
    });
    refreshStats();
  }

  /* ---------------- 首页进度条 ---------------- */
  if (pageType === 'index') {
    var stats = {};
    try { stats = JSON.parse(localStorage.getItem(LS_STATS)) || {}; } catch (e) {}
    var sumMarked = 0, sumTotal = 0;
    document.querySelectorAll('.chapter-card').forEach(function (cardEl) {
      var key = cardEl.dataset.chapter;
      var total = parseInt(cardEl.dataset.total || '0', 10);
      var st = stats[key] || { marked: 0, total: total };
      sumMarked += st.marked; sumTotal += total;
      var bar = cardEl.querySelector('.ch-progress i');
      if (bar) bar.style.width = total ? (st.marked / total * 100).toFixed(1) + '%' : '0%';
    });
    var gbar = document.querySelector('#globalProgress .bar i');
    var gtxt = document.querySelector('#globalProgress .txt');
    if (gbar) gbar.style.width = sumTotal ? (sumMarked / sumTotal * 100).toFixed(1) + '%' : '0%';
    if (gtxt) gtxt.textContent = '全书进度：' + sumMarked + ' / ' + sumTotal + ' 题（' + (sumTotal ? (sumMarked / sumTotal * 100).toFixed(1) : 0) + '%）';
  }

  /* ---------------- 章节页：快捷切换 + 滚动定位 + scrollspy ---------------- */
  if (pageType === 'chapter') {
    /* 顶部/底部按钮跳到上/下题 */
    function currentIndex() {
      var i = cards.findIndex(function (c) {
        var r = c.getBoundingClientRect();
        return r.top > 90 || (r.bottom > 90 && r.top <= 90);
      });
      return i < 0 ? 0 : i;
    }
    function go(delta) {
      var i = Math.min(cards.length - 1, Math.max(0, currentIndex() + delta));
      var t = cards[i];
      if (t) location.hash = '#' + t.id;
    }
    bind('prevQ', function () { go(-1); });
    bind('nextQ', function () { go(1); });
    document.addEventListener('keydown', function (ev) {
      if (ev.target && /input|textarea|select/i.test(ev.target.tagName)) return;
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); go(-1); }
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); go(1); }
    });

    /* scrollspy：侧栏高亮当前题 */
    var links = {};
    document.querySelectorAll('.q-links a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          document.querySelectorAll('.q-links a.active').forEach(function (a) { a.classList.remove('active'); });
          var a = links[e.target.id];
          if (a) { a.classList.add('active'); a.scrollIntoView({ block: 'nearest' }); }
        }
      });
    }, { rootMargin: '-70px 0px -70% 0px' });
    cards.forEach(function (c) { spy.observe(c); });

    /* 阅读位置记忆 */
    var skey = LS_SCROLL;
    window.addEventListener('scroll', throttle(function () {
      var s = {};
      try { s = JSON.parse(localStorage.getItem(skey)) || {}; } catch (e) {}
      s[chapterKey] = window.scrollY;
      localStorage.setItem(skey, JSON.stringify(s));
    }, 500));
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(skey)) || {}; } catch (e) {}
    if (saved[chapterKey] && !location.hash) {
      setTimeout(function () { window.scrollTo(0, saved[chapterKey]); }, 50);
    }
  }

  /* ---------------- 锚点目标高亮 ---------------- */
  function flashTarget() {
    if (!location.hash) return;
    var el = document.getElementById(location.hash.slice(1));
    if (el && el.classList.contains('q-card')) {
      el.classList.add('target');
      setTimeout(function () { el.classList.remove('target'); }, 1600);
    }
  }
  window.addEventListener('hashchange', flashTarget);
  flashTarget();

  /* ---------------- 工具 ---------------- */
  function throttle(fn, ms) {
    var last = 0, timer = null;
    return function () {
      var now = Date.now(), ctx = this, args = arguments;
      if (now - last >= ms) { last = now; fn.apply(ctx, args); }
      else {
        clearTimeout(timer);
        timer = setTimeout(function () { last = Date.now(); fn.apply(ctx, args); }, ms - (now - last));
      }
    };
  }
})();
