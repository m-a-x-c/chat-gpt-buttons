(() => {
  let currentApplyVisibility = null;
  let currentStateObserver = null;
  let bootstrapObserver = null;
  let enabled = false;

  const cleanup = () => {
    document.getElementById('__chat-toggle-wrap')?.remove();
    document.getElementById('__chat-toggle-style')?.remove();
    if (currentStateObserver) {
      currentStateObserver.disconnect();
      currentStateObserver = null;
    }
    if (bootstrapObserver) {
      bootstrapObserver.disconnect();
      bootstrapObserver = null;
    }
    currentApplyVisibility = null;
  };

  const inject = () => {
    document.getElementById('__chat-toggle-wrap')?.remove();
    document.getElementById('__chat-toggle-style')?.remove();

    const styleEl = document.createElement('style');
    styleEl.id = '__chat-toggle-style';
    styleEl.textContent = '.__chat-pill-hidden{display:none !important;}';
    document.head.appendChild(styleEl);

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    const form = document.querySelector('form.group\\/composer')
      || document.querySelector('form');
    if (!form) return false;

    const wrap = document.createElement('div');
    wrap.id = '__chat-toggle-wrap';
    Object.assign(wrap.style, {
      display: 'flex',
      justifyContent: 'center',
      gap: '6px',
      paddingTop: '6px',
      paddingBottom: '6px',
      marginBottom: '0',
      width: '100%',
      flexWrap: 'wrap',
      background: getComputedStyle(document.body).backgroundColor || '#000000',
      position: 'relative',
      zIndex: '2'
    });

    const sampleTheme = () => {
      const f = document.querySelector('form.group\\/composer') || document.querySelector('form');
      const formCS = f ? getComputedStyle(f) : getComputedStyle(document.body);
      const bodyCS = getComputedStyle(document.body);

      const text = formCS.color || bodyCS.color;
      const m = (bodyCS.color || '').match(/\d+/g);
      const isDark = m && (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 > 128;
      const border = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';
      const onBg = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)';
      const onBorder = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)';

      return {
        OFF: { bg: 'transparent', color: text, border, hoverBg: 'rgba(127,127,127,0.12)' },
        ON:  { bg: onBg, color: text, border: onBorder, hoverBg: onBg }
      };
    };

    let THEME = sampleTheme();

    const makePill = (label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      Object.assign(b.style, {
        padding: '5px 12px',
        borderRadius: '9999px',
        border: '1px solid',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease'
      });
      const apply = (which) => {
        const theme = THEME[which];
        b._theme = theme;
        b.style.background = theme.bg;
        b.style.color = theme.color;
        b.style.borderColor = theme.border;
      };
      b.onmouseenter = () => { b.style.background = b._theme.hoverBg; };
      b.onmouseleave = () => { b.style.background = b._theme.bg; };
      b._setState = (on) => {
        b.dataset.on = on ? '1' : '0';
        apply(on ? 'ON' : 'OFF');
      };
      apply('OFF');
      return b;
    };

    const realPointer = (el, type) => {
      el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse' }));
    };
    const realClick = (el) => {
      realPointer(el, 'pointerdown');
      realPointer(el, 'pointerup');
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    };
    const esc = () => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const closeMenu = async () => { esc(); await wait(80); esc(); await wait(60); };

    const findRadio = (label) =>
      Array.from(document.querySelectorAll('[role="menuitemradio"]'))
        .find(i => i.textContent.trim() === label);
    const findMenuitem = (label) =>
      Array.from(document.querySelectorAll('[role="menuitem"], [role="menuitemradio"]'))
        .find(i => i.textContent.trim().startsWith(label));

    const isItemActive = (el) => {
      if (!el) return false;
      if (el.getAttribute('aria-checked') === 'true') return true;
      if (el.getAttribute('data-state') === 'checked') return true;
      if (el.getAttribute('data-color') === 'selected') return true; // legacy
      return false;
    };

    const pillNameMap = {
      'Thinking':       'standardThinking',
      'Extended':       'extendedThinking',
      'Search':         'webSearch',
      'Image':          'createImage',
      'Deep research':  'deepResearch',
      'Agent':          'agentMode',
      'Sources':        'addSources',
      'Canvas':         'canvas',
      'Quizzes':        'quizzes'
    };
    const readChatState = () => {
      const active = new Set();
      document.querySelectorAll('.__composer-pill').forEach(p => {
        const t = p.textContent.trim();
        if (pillNameMap[t]) active.add(pillNameMap[t]);
      });
      return active;
    };

    const openPlusMenu = async () => {
      const plus = document.querySelector('[data-testid="composer-plus-btn"]');
      if (!plus) return false;
      realClick(plus);
      for (let i = 0; i < 30; i++) {
        await wait(40);
        if (document.querySelectorAll('[role="menuitemradio"]').length) return true;
      }
      return false;
    };
    const expandMore = async (targetLabel) => {
      const more = findMenuitem('More');
      if (!more) return false;
      realPointer(more, 'pointerenter');
      realPointer(more, 'pointermove');
      for (let i = 0; i < 30; i++) {
        await wait(40);
        if (findRadio(targetLabel)) return true;
      }
      return false;
    };

    const setPlusItem = async (label, isSubmenu, desiredOn) => {
      if (!(await openPlusMenu())) return false;
      if (isSubmenu) {
        if (!(await expandMore(label))) { await closeMenu(); return false; }
      }
      const item = findRadio(label);
      if (!item) { await closeMenu(); return false; }
      const currentlyOn = isItemActive(item);
      if (currentlyOn === desiredOn) {
        await closeMenu();
        return true;
      }
      item.click();
      await wait(120);
      return true;
    };

    const findModelSwitcherBtn = () => {
      const f = document.querySelector('form.group\\/composer') || document.querySelector('form');
      if (!f) return null;
      const candidates = Array.from(f.querySelectorAll('button')).filter(b =>
        b.getAttribute('aria-haspopup') === 'menu' &&
        b.dataset.testid !== 'composer-plus-btn' &&
        b.getAttribute('aria-label') !== 'Choose image aspect ratio'
      );
      return candidates.find(b => (b.className || '').toString().includes('__composer-pill'))
          || candidates[0]
          || null;
    };

    const openModelMenu = async () => {
      const trigger = findModelSwitcherBtn();
      if (!trigger) return false;
      realClick(trigger);
      for (let i = 0; i < 30; i++) {
        await wait(40);
        if (document.querySelector('[data-testid="model-switcher-gpt-5-5-thinking"]')) return true;
      }
      return false;
    };

    const getThinkingComposerPill = () =>
      Array.from(document.querySelectorAll('.__composer-pill'))
        .find(p => ['Thinking', 'Extended'].includes(p.textContent.trim()));

    const turnThinkingOff = async () => {
      if (!(await openModelMenu())) return;
      const instant =
        document.querySelector('[data-testid="model-switcher-gpt-5-5"]') ||
        Array.from(document.querySelectorAll('[role="menuitemradio"]'))
          .find(i => i.textContent.trim().startsWith('Instant'));
      if (instant && !isItemActive(instant)) {
        realClick(instant);
      } else {
        await closeMenu();
      }
      await wait(150);
    };

    const turnThinkingOn = async () => {
      if (!(await openModelMenu())) return false;
      const t = document.querySelector('[data-testid="model-switcher-gpt-5-5-thinking"]');
      if (!t) { await closeMenu(); return false; }
      if (!isItemActive(t)) {
        realClick(t);
      } else {
        await closeMenu();
      }
      for (let i = 0; i < 40; i++) {
        await wait(50);
        if (getThinkingComposerPill()) return true;
      }
      return false;
    };

    const setEffort = async (target) => {
      if (!(await openModelMenu())) return false;

      let effortTrigger = null;
      for (let i = 0; i < 30; i++) {
        effortTrigger = document.querySelector(
          '[data-testid="model-switcher-gpt-5-5-thinking-thinking-effort"]'
        );
        if (effortTrigger) break;
        await wait(40);
      }
      if (!effortTrigger) { await closeMenu(); return false; }

      const thinkingRow = document.querySelector('[data-testid="model-switcher-gpt-5-5-thinking"]');
      if (thinkingRow) {
        realPointer(thinkingRow, 'pointerenter');
        realPointer(thinkingRow, 'pointermove');
      }

      realClick(effortTrigger);

      let opt = null;
      for (let i = 0; i < 40; i++) {
        await wait(40);
        opt = findRadio(target);
        if (opt) break;
      }
      if (!opt) { await closeMenu(); return false; }

      if (isItemActive(opt)) {
        await closeMenu();
        return true;
      }
      realClick(opt);
      await wait(150);
      return true;
    };

    const buttons = {};

    const stdBtn = makePill('Standard thinking');
    const extBtn = makePill('Extended thinking');

    const handleThinkingClick = async (target, selfBtn, otherBtn) => {
      if (selfBtn._busy || otherBtn._busy) return;
      selfBtn._busy = true;
      try {
        const state = readChatState();
        const stdOn = state.has('standardThinking');
        const extOn = state.has('extendedThinking');
        const desiredKey = target === 'Standard' ? 'standardThinking' : 'extendedThinking';
        const isSelfOn = state.has(desiredKey);
        if (isSelfOn) {
          await turnThinkingOff();
        } else {
          if (!(stdOn || extOn)) {
            if (!(await turnThinkingOn())) return;
          }
          await setEffort(target);
        }
        syncFromChat();
      } finally { selfBtn._busy = false; }
    };
    stdBtn.onclick = () => handleThinkingClick('Standard', stdBtn, extBtn);
    extBtn.onclick = () => handleThinkingClick('Extended', extBtn, stdBtn);
    buttons.standardThinking = stdBtn;
    buttons.extendedThinking = extBtn;

    const uploadBtn = makePill('Upload');
    uploadBtn.textContent = '';
    Object.assign(uploadBtn.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const uploadIcon = document.createElementNS(SVG_NS, 'svg');
    uploadIcon.setAttribute('viewBox', '0 0 20 20');
    uploadIcon.setAttribute('width', '16');
    uploadIcon.setAttribute('height', '16');
    uploadIcon.setAttribute('fill', 'currentColor');
    uploadIcon.setAttribute('aria-hidden', 'true');
    const uploadPath = document.createElementNS(SVG_NS, 'path');
    uploadPath.setAttribute(
      'd',
      'M4.335 12.5v-5a.665.665 0 0 1 1.33 0v5a4.335 4.335 0 1 0 8.67 0V5.833a2.668 2.668 0 0 0-5.337 0V12.5a1.002 1.002 0 0 0 2.004 0v-5a.665.665 0 1 1 1.33 0v5a2.332 2.332 0 0 1-4.664 0V5.833a3.999 3.999 0 0 1 7.997 0V12.5a5.665 5.665 0 1 1-11.33 0'
    );
    uploadIcon.appendChild(uploadPath);
    uploadBtn.appendChild(uploadIcon);
    uploadBtn.onclick = () => {
      const fileInput = document.getElementById('upload-files')
        || document.querySelector('input[type="file"]:not([accept])');
      if (fileInput) fileInput.click();
    };
    const originalUploadSetState = uploadBtn._setState;
    uploadBtn._setState = () => { originalUploadSetState(false); };
    buttons.upload = uploadBtn;

    const makePlusBtn = (label, key, isSubmenu) => {
      const btn = makePill(label);
      btn.onclick = async () => {
        if (btn._busy) return;
        btn._busy = true;
        try {
          const isOn = readChatState().has(key);
          await setPlusItem(label, isSubmenu, !isOn);
          syncFromChat();
        } finally { btn._busy = false; }
      };
      buttons[key] = btn;
      return btn;
    };

    const webBtn   = makePlusBtn('Web search',     'webSearch',     false);
    const imgBtn   = makePlusBtn('Create image',   'createImage',   false);
    const dresBtn  = makePlusBtn('Deep research',  'deepResearch',  false);
    const agentBtn = makePlusBtn('Agent mode',     'agentMode',     true);
    const srcBtn   = makePlusBtn('Add sources',    'addSources',    true);
    const canBtn   = makePlusBtn('Canvas',         'canvas',        true);
    const quizBtn  = makePlusBtn('Quizzes',        'quizzes',       true);

    const syncFromChat = () => {
      const state = readChatState();
      Object.entries(buttons).forEach(([key, btn]) => {
        btn._setState(state.has(key));
      });
    };

    let themeRefreshScheduled = false;
    const refreshTheme = () => {
      if (themeRefreshScheduled) return;
      themeRefreshScheduled = true;
      requestAnimationFrame(() => {
        themeRefreshScheduled = false;
        THEME = sampleTheme();
        wrap.style.background = getComputedStyle(document.body).backgroundColor || '#000000';
        Object.values(buttons).forEach(b => {
          if (b._setState) b._setState(b.dataset.on === '1');
        });
      });
    };

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener?.('change', refreshTheme);
    const htmlThemeObserver = new MutationObserver(refreshTheme);
    htmlThemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    });

    const applyVisibility = (visible) => {
      PILLS.forEach(({ key, defaultVisible }) => {
        const el = buttons[key];
        if (!el) return;
        const show = key in visible ? visible[key] : defaultVisible;
        el.classList.toggle('__chat-pill-hidden', !show);
      });
    };
    currentApplyVisibility = applyVisibility;
    chrome.storage.sync.get('visiblePills', (data) => {
      applyVisibility(data?.visiblePills || {});
    });

    [uploadBtn, stdBtn, extBtn, webBtn, imgBtn, dresBtn,
     agentBtn, srcBtn, canBtn, quizBtn].forEach(b => wrap.appendChild(b));
    form.parentNode.insertBefore(wrap, form);

    const observerTarget = form.parentNode || document.body;
    if (currentStateObserver) currentStateObserver.disconnect();
    currentStateObserver = new MutationObserver(() => { syncFromChat(); refreshTheme(); });
    currentStateObserver.observe(observerTarget, { childList: true, subtree: true, characterData: true });

    syncFromChat();

    return true;
  };

  const tryInject = () => {
    if (!enabled) return;
    const wrap = document.getElementById('__chat-toggle-wrap');
    if (wrap && document.contains(wrap)) return;
    const form = document.querySelector('form.group\\/composer')
              || document.querySelector('form');
    if (!form) return;
    inject();
  };

  const setEnabled = (value) => {
    if (enabled === value) return;
    enabled = value;
    if (enabled) {
      tryInject();
      bootstrapObserver = new MutationObserver(tryInject);
      bootstrapObserver.observe(document.documentElement, { childList: true, subtree: true });
    } else {
      cleanup();
    }
  };

  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if (changes.extensionEnabled) {
        setEnabled(changes.extensionEnabled.newValue !== false);
      }
      if (changes.visiblePills && currentApplyVisibility) {
        currentApplyVisibility(changes.visiblePills.newValue || {});
      }
    });
  }

  chrome.storage.sync.get('extensionEnabled', (data) => {
    setEnabled(data?.extensionEnabled !== false);
  });
})();