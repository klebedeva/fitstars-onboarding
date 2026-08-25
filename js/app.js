/**
 * Screen router for the onboarding webview flow.
 * Screens are plain <section class="screen" data-screen="ID"> blocks in
 * index.html. Navigation works two ways:
 *  - by explicit id, via [data-goto="ID"] on any button (used for branching
 *    answers, where each choice leads to a different screen)
 *  - by DOM order, via [data-action="next"] with no data-goto (falls back
 *    to "the next <section> in the file")
 */
(function () {
  const app = document.getElementById('app');
  const screens = Array.from(app.querySelectorAll('.screen'));
  const screenIndexById = new Map(screens.map((s, i) => [s.dataset.screen, i]));

  let currentIndex = screens.findIndex((s) => s.classList.contains('is-active'));
  if (currentIndex === -1) currentIndex = 0;

  const history = [currentIndex];

  function showScreen(index) {
    screens.forEach((s, i) => s.classList.toggle('is-active', i === index));
    currentIndex = index;
    window.scrollTo(0, 0);
    document.body.classList.remove('is-nav-scrolled');
  }

  function goto(id) {
    const index = screenIndexById.get(id);
    if (index === undefined) {
      console.log(`[onboarding] no screen with data-screen="${id}" yet — build it in index.html`);
      return;
    }
    history.push(index);
    showScreen(index);
    if (id === '12') renderAnswerChips();
  }

  function next() {
    if (currentIndex < screens.length - 1) {
      const nextIndex = currentIndex + 1;
      history.push(nextIndex);
      showScreen(nextIndex);
    } else {
      console.log('[onboarding] no next screen yet — build the next one in index.html');
    }
  }

  function back() {
    if (history.length > 1) {
      history.pop();
      showScreen(history[history.length - 1]);
    }
  }

  // Back buttons
  app.addEventListener('click', (e) => {
    const backBtn = e.target.closest('[data-action="back"]');
    if (backBtn) back();
  });

  // External links — e.g. the final "Продолжить с Премиумом" buttons that
  // send the person off to the real pricing page instead of another screen.
  app.addEventListener('click', (e) => {
    const linkBtn = e.target.closest('[data-href]');
    if (linkBtn) window.open(linkBtn.dataset.href, '_blank');
  });

  // "Next" buttons — go to an explicit screen if data-goto is set,
  // otherwise fall back to DOM-order next().
  app.addEventListener('click', (e) => {
    const nextBtn = e.target.closest('[data-action="next"]');
    if (!nextBtn) return;
    if (nextBtn.dataset.goto) goto(nextBtn.dataset.goto);
    else next();
  });

  // Single-select answer groups: click selects, then auto-advances
  // to that answer's target screen (data-goto), or just next().
  app.querySelectorAll('[data-answers]').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.button-chooser');
      if (!btn) return;
      group.querySelectorAll('.button-chooser').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');

      const screen = btn.closest('.screen');
      window.onboardingAnswers = window.onboardingAnswers || {};
      window.onboardingAnswers[screen.dataset.screen] = btn.dataset.value;

      setTimeout(() => {
        if (btn.dataset.goto) goto(btn.dataset.goto);
        else next();
      }, 150);
    });
  });

  // Frost the fixed nav bar only when content has scrolled beneath it.
  // The scroller may be the document OR an inner wrapper (e.g. the native
  // bottom-sheet host), so listen in the capture phase to catch scroll from
  // any element and read whichever scroll position actually moved.
  function scrolledUnderNav(e) {
    var tops = [
      window.scrollY || 0,
      document.scrollingElement ? document.scrollingElement.scrollTop : 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0,
    ];
    if (e && e.target && e.target.nodeType === 1 && typeof e.target.scrollTop === 'number') {
      tops.push(e.target.scrollTop);
    }
    return Math.max.apply(null, tops) > 4;
  }
  function updateNavScrolled(e) {
    document.body.classList.toggle('is-nav-scrolled', scrolledUnderNav(e));
  }
  // capture:true catches scroll events from inner scrollers (scroll doesn't bubble)
  document.addEventListener('scroll', updateNavScrolled, true);
  window.addEventListener('scroll', updateNavScrolled, { passive: true });
  updateNavScrolled();

  window.onboardingRouter = { next, back, goto, showScreen };

  // "Собрали по твоим ответам" — chip row on screen 12, built from the
  // actual choices the person clicked earlier in the flow (screens
  // 01 / 03 / 08 / 10), not hardcoded. Q3 (screen 05, AI-coach help) has
  // no matching visual chip in the design, so it's intentionally skipped.
  const CHIP_MAP = {
    '01': {
      plan: { icon: '<img src="https://www.figma.com/api/mcp/asset/e93a5fbc-1b38-4689-8a8b-e9a63801bbd7.png" alt="" />', label: 'план по дням' },
      challenges: { icon: '🏆', label: 'челленджи и мотивация' },
      'short-goals': { icon: '⏱', label: 'короткие цели' },
      self: { icon: '🎯', label: 'свобода выбора' },
    },
    '03': {
      sleep: { icon: '<img src="https://www.figma.com/api/mcp/asset/b4529f46-3222-4579-9fe1-4816685ef951.png" alt="" />', label: 'хорошо засыпать' },
      relax: { icon: '🧘', label: 'расслабление' },
      stress: { icon: '🌿', label: 'без стресса' },
      'workouts-only': { icon: '💪', label: 'только тренировки' },
    },
    '08': {
      family: { icon: '<img src="https://www.figma.com/api/mcp/asset/4fecdb24-31d1-4dac-b151-ade50a181221.png" alt="" />', label: 'семья' },
      friends: { icon: '👯', label: 'друзья' },
      solo: { icon: '🧍', label: 'в одиночку' },
      unsure: { icon: '🤔', label: 'пока не знаю' },
    },
    '10': {
      recipes: { icon: '<img src="https://www.figma.com/api/mcp/asset/1e49630b-ab3f-41d7-9ad3-eafd9bede00d.png" alt="" />', label: 'здоровое питание' },
      calories: { icon: '🔢', label: 'контроль калорий' },
      nutritionist: { icon: '👩‍⚕️', label: 'поддержка по питанию' },
      'not-needed': { icon: '🍽', label: 'без диеты' },
    },
  };

  // Fallback chips shown only if the person somehow reaches screen 12
  // without having answered anything (e.g. jumped straight there while testing).
  const DEFAULT_CHIPS = [
    { icon: '<img src="https://www.figma.com/api/mcp/asset/e93a5fbc-1b38-4689-8a8b-e9a63801bbd7.png" alt="" />', label: 'план по дням' },
    { icon: '<img src="https://www.figma.com/api/mcp/asset/b4529f46-3222-4579-9fe1-4816685ef951.png" alt="" />', label: 'хорошо засыпать' },
    { icon: '<img src="https://www.figma.com/api/mcp/asset/4fecdb24-31d1-4dac-b151-ade50a181221.png" alt="" />', label: 'семья' },
    { icon: '<img src="https://www.figma.com/api/mcp/asset/1e49630b-ab3f-41d7-9ad3-eafd9bede00d.png" alt="" />', label: 'здоровое питание' },
  ];

  function renderAnswerChips() {
    const container = document.querySelector('[data-chip-row]');
    if (!container) return;

    const answers = window.onboardingAnswers || {};
    const chips = [];
    for (const screenId of Object.keys(CHIP_MAP)) {
      const value = answers[screenId];
      const chip = value && CHIP_MAP[screenId][value];
      if (chip) chips.push(chip);
    }

    const finalChips = chips.length ? chips : DEFAULT_CHIPS;
    container.innerHTML = finalChips
      .map((c) => `<span class="chip"><span class="chip-icon">${c.icon}</span>${c.label}</span>`)
      .join('');
  }
})();
