/*
 * Prototipo navegable del caso mobile. Vanilla, sin dependencias.
 * Los datos de las tarjetas coinciden con content-spec.md (la tabla de
 * traducción de eventos), no son placeholders sueltos.
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var el = {
    screen: $('screen'),
    bottomNav: $('bottomNav'),
    roleTabs: null,
    roleSwitch: null
  };

  var state = {
    role: 'enfermero',
    view: 'home' // 'home' | 'detail'
  };

  // ============ DATOS — un lector, tres traducciones del mismo turno ============
  // Fuente: content-spec.md, tabla "Traducción de un mismo evento".
  var PATIENTS = [
    {
      id: 'cr', initials: 'CR', name: 'Carlos Rodríguez', room: 'Hab. 304-A',
      status: 'critical', statusLabel: 'PA 90/55',
      clinical: 'PA 90/55 · taquicardia 112 · alerta protocolo hipotensión',
      patientText: '(el enfermero todavía no compartió esta novedad)',
      familyText: 'Bajo observación, el equipo está con él'
    },
    {
      id: 'mg', initials: 'MG', name: 'María González', room: 'Hab. 304-B',
      status: 'pending', statusLabel: 'Medicación 11:00',
      clinical: 'Enoxaparina 40mg SC, vía abdominal, 11:00',
      patientText: 'Ya casi le toca el medicamento de la mañana',
      familyText: 'Tratamiento de la mañana en curso'
    },
    {
      id: 'jp', initials: 'JP', name: 'Jorge Pérez', room: 'Hab. 305-A',
      status: 'ready', statusLabel: '1 toque',
      clinical: 'Cambio postural decúbito lateral izq. — previsto 11:20',
      patientText: 'Le van a ayudar a cambiar de posición',
      familyText: '—'
    }
  ];

  var TIMELINE_PACIENTE = [
    { time: '08:00', text: 'Le ayudaron a cambiar de posición', pending: false },
    { time: '09:30', text: 'Ya le pusieron el medicamento de la mañana', pending: false },
    { time: '13:00', text: 'El enfermero vuelve a hacer la ronda', pending: true }
  ];

  var TIMELINE_FAMILIA = [
    { time: 'Hoy', text: 'Tratamiento de la mañana cumplido', pending: false },
    { time: 'Hoy', text: 'El equipo está con él, sin novedad que reportar', pending: false },
    { time: '15:00', text: 'Horario de visita disponible', pending: true }
  ];

  var NAV_BY_ROLE = {
    enfermero: [
      { key: 'turno', icon: '📋', label: 'Turno' },
      { key: 'registrar', icon: '➕', label: 'Registrar' },
      { key: 'pendientes', icon: '⏳', label: 'Pendientes' }
    ],
    paciente: [
      { key: 'estado', icon: '🩺', label: 'Mi estado' },
      { key: 'preguntas', icon: '❓', label: 'Preguntas' }
    ],
    familia: [
      { key: 'pasa', icon: '💬', label: 'Qué pasa' },
      { key: 'contacto', icon: '📞', label: 'Contacto' }
    ]
  };

  var activeNavKey = { enfermero: 'turno', paciente: 'estado', familia: 'pasa' };

  // ============ RENDER DE VISTAS ============

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderHomeEnfermero() {
    var cards = PATIENTS.map(function (p) {
      var badge = p.status === 'critical'
        ? '<span class="badge-critical">' + escapeHtml(p.statusLabel) + '</span>'
        : p.status === 'pending'
          ? '<span class="badge-pending">' + escapeHtml(p.statusLabel) + '</span>'
          : '<button type="button" class="tap-confirm" data-confirm="' + p.id + '">' +
            '<span class="confirm-label">1 toque</span><span class="confirm-check">✓ Hecho</span></button>';

      return '<button type="button" class="p-card" data-patient="' + p.id + '">' +
        '<div class="p-avatar">' + p.initials + '</div>' +
        '<div class="p-info">' +
          '<div class="p-name">' + escapeHtml(p.name) + '</div>' +
          '<div class="p-meta">' + escapeHtml(p.room) + '</div>' +
        '</div>' +
        badge +
      '</button>';
    }).join('');

    return (
      '<div class="view is-home" data-role-view="enfermero-home">' +
        '<div class="view-header">' +
          '<div>' +
            '<p class="view-subtitle">Hospital Central · Piso 3</p>' +
            '<h1 class="view-title">Mi turno</h1>' +
          '</div>' +
        '</div>' +
        '<div class="list-heading">' +
          '<span class="list-heading-label">Pacientes asignados (' + PATIENTS.length + ')</span>' +
          '<span class="badge-critical">1 crítico</span>' +
        '</div>' +
        '<div class="card-list">' + cards + '</div>' +
      '</div>'
    );
  }

  function renderDetailEnfermero(patient) {
    return (
      '<div class="view is-detail" data-role-view="enfermero-detail">' +
        '<div class="view-header">' +
          '<button type="button" class="back-btn" data-back="enfermero">←</button>' +
          '<div>' +
            '<p class="view-subtitle">' + escapeHtml(patient.room) + '</p>' +
            '<h1 class="view-title">' + escapeHtml(patient.name) + '</h1>' +
          '</div>' +
        '</div>' +
        '<div class="list-heading"><span class="list-heading-label">Valor clínico crudo</span></div>' +
        '<p>' +
          '<span class="clinical-value" data-reveal>' + escapeHtml(patient.clinical) + '</span>' +
          '<span class="reveal-hint">tocá para revelar</span>' +
        '</p>' +
        '<p class="view-subtitle" style="margin-top: 4px;">' +
          'Oculto por defecto: esta pantalla la ve también el paciente desde la cama.' +
        '</p>' +
      '</div>'
    );
  }

  function renderPaciente() {
    var items = TIMELINE_PACIENTE.map(function (t) {
      return '<div class="timeline-item' + (t.pending ? ' is-pending' : '') + '">' +
        '<div class="timeline-time">' + escapeHtml(t.time) + '</div>' +
        '<div class="timeline-text">' + escapeHtml(t.text) + '</div>' +
      '</div>';
    }).join('');

    return (
      '<div class="view is-home" data-role-view="paciente-home">' +
        '<div class="view-header">' +
          '<div>' +
            '<p class="view-subtitle">Hab. 304-B</p>' +
            '<h1 class="view-title">Mi estado</h1>' +
          '</div>' +
        '</div>' +
        '<div class="list-heading"><span class="list-heading-label">Qué pasó hoy</span></div>' +
        '<div class="timeline">' + items + '</div>' +
      '</div>'
    );
  }

  function renderFamilia() {
    var items = TIMELINE_FAMILIA.map(function (t) {
      return '<div class="timeline-item' + (t.pending ? ' is-pending' : '') + '">' +
        '<div class="timeline-time">' + escapeHtml(t.time) + '</div>' +
        '<div class="timeline-text">' + escapeHtml(t.text) + '</div>' +
      '</div>';
    }).join('');

    return (
      '<div class="view is-home" data-role-view="familia-home">' +
        '<div class="view-header">' +
          '<div>' +
            '<p class="view-subtitle">María González · Hab. 304-B</p>' +
            '<h1 class="view-title">Qué está pasando</h1>' +
          '</div>' +
        '</div>' +
        '<div class="list-heading"><span class="list-heading-label">Resumen, sin dato clínico</span></div>' +
        '<div class="timeline">' + items + '</div>' +
        '<div class="p-card" style="cursor: default;">' +
          '<div class="p-avatar">EN</div>' +
          '<div class="p-info">' +
            '<div class="p-name">Contacto de turno</div>' +
            '<div class="p-meta">Enfermera · vuelve a las 13:00</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ============ NAV INFERIOR ============

  function renderBottomNav() {
    var items = NAV_BY_ROLE[state.role];
    el.bottomNav.innerHTML = items.map(function (item) {
      var active = item.key === activeNavKey[state.role];
      return '<button type="button" class="nav-item' + (active ? ' is-active' : '') +
        '" data-nav="' + item.key + '" aria-pressed="' + active + '">' +
        '<span class="nav-icon">' + item.icon + '</span><span>' + item.label + '</span>' +
      '</button>';
    }).join('');
  }

  el.bottomNav && el.bottomNav.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-nav]');
    if (!btn) return;
    activeNavKey[state.role] = btn.getAttribute('data-nav');
    renderBottomNav();
  });

  // ============ RENDER PRINCIPAL DE PANTALLA ============

  function renderScreen() {
    var html = '';

    if (state.role === 'enfermero') {
      html += renderHomeEnfermero();
      if (state.view === 'detail' && state.detailPatient) {
        html += renderDetailEnfermero(state.detailPatient);
      }
    } else if (state.role === 'paciente') {
      html += renderPaciente();
    } else {
      html += renderFamilia();
    }

    el.screen.innerHTML = html;

    // El frame reflow antes de agregar .is-active para que la transición
    // CSS corra (si no, el navegador colapsa el estado inicial y final).
    requestAnimationFrame(function () {
      var homeView = el.screen.querySelector('.is-home');
      var detailView = el.screen.querySelector('.is-detail');
      if (homeView) homeView.classList.add('is-active');
      if (state.view === 'detail' && detailView) {
        requestAnimationFrame(function () { detailView.classList.add('is-active'); });
      }
    });

    renderBottomNav();
  }

  // ============ INTERACCIÓN DENTRO DE LA PANTALLA (delegada) ============

  el.screen.addEventListener('click', function (ev) {
    var patientCard = ev.target.closest('[data-patient]');
    var backBtn = ev.target.closest('[data-back]');
    var confirmBtn = ev.target.closest('[data-confirm]');
    var revealEl = ev.target.closest('[data-reveal]');

    if (confirmBtn) {
      // Evento previsto: confirmación en 1 toque, sin mostrar dato crudo
      // (ideas.md:25 — "cualquier cosa que tarde más de unos segundos no se
      // va a usar"). El check es feedback inmediato, no un formulario.
      confirmBtn.classList.add('is-done');
      return;
    }

    if (revealEl) {
      // Evento fuera de lo esperado / dato clínico crudo: exige un toque
      // deliberado (ideas.md:31 — la pantalla la ve el paciente desde la cama).
      revealEl.classList.toggle('is-revealed');
      return;
    }

    if (patientCard) {
      var id = patientCard.getAttribute('data-patient');
      state.detailPatient = PATIENTS.filter(function (p) { return p.id === id; })[0];
      state.view = 'detail';
      renderScreen();
      return;
    }

    if (backBtn) {
      state.view = 'home';
      state.detailPatient = null;
      renderScreen();
    }
  });

  // ============ SELECTOR DE ROL — indicador deslizante ============

  function initRoleSwitch() {
    el.roleTabs = Array.prototype.slice.call(document.querySelectorAll('.role-tab'));
    el.roleSwitch = document.querySelector('.role-switch');
    if (!el.roleSwitch || !el.roleTabs.length) return;

    var indicator = document.createElement('div');
    indicator.className = 'role-switch-indicator';
    el.roleSwitch.insertBefore(indicator, el.roleSwitch.firstChild);

    function moveIndicator(index) {
      indicator.style.transform = 'translateX(' + (index * 100) + '%)';
    }

    el.roleTabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        el.roleTabs.forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        moveIndicator(index);

        state.role = tab.getAttribute('data-role');
        state.view = 'home';
        state.detailPatient = null;
        renderScreen();
      });
    });

    moveIndicator(0);
  }

  // ============ STATUS BAR — hora real, no hardcodeada ============
  function initStatusClock() {
    var timeEl = document.querySelector('.status-time');
    if (!timeEl) return;
    function tick() {
      var now = new Date();
      var h = String(now.getHours()).padStart(2, '0');
      var m = String(now.getMinutes()).padStart(2, '0');
      timeEl.textContent = h + ':' + m;
    }
    tick();
    setInterval(tick, 15000);
  }

  // ============ TOGGLE DE TEMA — mismo key que el documento principal,
  // así el tema persiste al cruzar entre index.html y mockup/index.html ============
  function initThemeToggle() {
    var btn = $('themeToggle');
    if (!btn) return;

    function currentTheme() {
      return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function syncButton() {
      var isLight = currentTheme() === 'light';
      btn.setAttribute('aria-pressed', String(isLight));
      btn.setAttribute('aria-label', isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
    }

    btn.addEventListener('click', function () {
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* modo incógnito estricto */ }
      syncButton();
    });

    syncButton();
  }

  // ============ INIT ============
  initRoleSwitch();
  initStatusClock();
  initThemeToggle();
  renderScreen();
})();
