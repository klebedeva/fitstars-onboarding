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
  }

  function goto(id) {
    const index = screenIndexById.get(id);
    if (index === undefined) {
      console.log(`[onboarding] no screen with data-screen="${id}" yet — build it in index.html`);
      return;
    }
    history.push(index);
    showScreen(index);
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

  window.onboardingRouter = { next, back, goto, showScreen };
})();

