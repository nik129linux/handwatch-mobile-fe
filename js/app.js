(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var app = {
    phone: document.querySelector('.phone'),
    screen: $('screen'),
    bottomNav: $('bottomNav'),
    roleSwitch: document.querySelector('.role-switch'),
    roleTabs: Array.prototype.slice.call(document.querySelectorAll('.role-tab')),
    splashLayer: $('splashLayer'),
    registrationLayer: $('registrationLayer'),
    celebrationLayer: $('celebrationLayer')
  };

  var PATIENTS = [
    {
      id: 'cr',
      initials: 'CR',
      name: 'Carlos Rodríguez',
      room: 'Hab. 304-A',
      status: 'critical',
      statusLabel: 'PA 90/55',
      clinical: 'PA 90/55 · taquicardia 112 · alerta protocolo hipotensión',
      patientText: 'El equipo está pendiente de sus signos',
      familyText: 'Bajo observación, el equipo está con él'
    },
    {
      id: 'mg',
      initials: 'MG',
      name: 'María González',
      room: 'Hab. 304-B',
      status: 'pending',
      statusLabel: 'Medicación 11:00',
      clinical: 'Enoxaparina 40mg SC, vía abdominal, 11:00',
      patientText: 'Ya casi le toca el medicamento de la mañana',
      familyText: 'Tratamiento de la mañana en curso'
    },
    {
      id: 'jp',
      initials: 'JP',
      name: 'Jorge Pérez',
      room: 'Hab. 305-A',
      status: 'ready',
      statusLabel: '1 toque',
      clinical: 'Cambio postural decúbito lateral izq. — previsto 11:20',
      patientText: 'Le van a ayudar a cambiar de posición',
      familyText: '—'
    }
  ];

  var TASKS = [
    {
      id: 'medication',
      patientId: 'mg',
      time: '11:00',
      title: 'Medicación de la mañana',
      note: 'María González · Hab. 304-B',
      icon: 'pill'
    },
    {
      id: 'position',
      patientId: 'jp',
      time: '11:20',
      title: 'Cambio de posición',
      note: 'Jorge Pérez · Hab. 305-A',
      icon: 'move'
    },
    {
      id: 'round',
      patientId: 'cr',
      time: '13:00',
      title: 'Ronda de control',
      note: 'Carlos Rodríguez · Hab. 304-A',
      icon: 'ruler'
    }
  ];

  var TIMELINE_PACIENTE = [
    { time: '08:00', text: 'Le ayudaron a cambiar de posición', pending: false },
    { time: '09:30', text: 'Ya le pusieron el medicamento de la mañana', pending: false },
    { time: '1:00 p. m.', text: 'La enfermera vuelve a hacer la ronda', pending: true }
  ];

  var TIMELINE_FAMILIA = [
    { time: 'Hoy', text: 'Tratamiento de la mañana cumplido', pending: false },
    { time: 'Hoy', text: 'El equipo está con él, sin novedad que reportar', pending: false },
    { time: '3:00 p. m.', text: 'Horario de visita disponible', pending: true }
  ];

  var NAV_BY_ROLE = {
    enfermero: [
      { key: 'turno', label: 'Turno', icon: 'list' },
      { key: 'registrar', label: 'Registrar', icon: 'plus' },
      { key: 'pendientes', label: 'Pendientes', icon: 'clock' }
    ],
    paciente: [
      { key: 'estado', label: 'Mi estado', icon: 'heart' },
      { key: 'preguntas', label: 'Preguntas', icon: 'help' }
    ],
    familia: [
      { key: 'pasa', label: 'Qué pasa', icon: 'message' },
      { key: 'contacto', label: 'Contacto', icon: 'phone' }
    ]
  };

  var ROLE_INDEX = { enfermero: 0, paciente: 1, familia: 2 };

  var state = {
    role: 'enfermero',
    detailPatient: null,
    activeNav: {
      enfermero: 'turno',
      paciente: 'estado',
      familia: 'pasa'
    },
    confirmed: {},
    sheetOpen: false,
    sheetReturnNav: 'turno',
    faqOpen: {},
    listening: false,
    completionTimer: null,
    feedbackTimer: null
  };

  var reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener: function () {} };
  var videoObserver = null;

  var ICONS = {
    arrow: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"></path></svg>',
    chevron: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"></path></svg>',
    check: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>',
    list: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h10M8 12h10M8 18h10"></path><path d="M4 6h.01M4 12h.01M4 18h.01"></path></svg>',
    plus: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>',
    clock: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path></svg>',
    heart: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8.8c0 5.2-8 9.7-8 9.7S4 14 4 8.8A4.4 4.4 0 0 1 12 6a4.4 4.4 0 0 1 8 2.8Z"></path></svg>',
    help: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M9.7 9a2.4 2.4 0 1 1 3.7 2c-.9.6-1.4 1.1-1.4 2.2M12 16.5h.01"></path></svg>',
    message: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3l4 3 4-3h3a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"></path><path d="M7 9h10M7 12h6"></path></svg>',
    phone: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h3l1.4 4-2 1.5a14 14 0 0 0 5.1 5.1l1.5-2 4 1.4v3a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 5 6.2 2 2 0 0 1 7 4Z"></path></svg>',
    pill: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4.5a4 4 0 0 1 5.7 0l5.3 5.3a4 4 0 0 1-5.7 5.7L8.5 10a4 4 0 0 1 0-5.5Z" transform="rotate(45 12 12)"></path><path d="m9 9 6 6"></path></svg>',
    move: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M9 8l-4 4 4 4M15 8l4 4-4 4"></path></svg>',
    ruler: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 17 12-12 2 2L7 19l-2-2Z"></path><path d="m12 8 2 2M9 11l2 2M15 5l2 2"></path></svg>',
    mic: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="4" width="8" height="11" rx="4"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"></path></svg>',
    clipboard: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h8M9 4h6a1 1 0 0 1 1 1v15H8V5a1 1 0 0 1 1-1Z"></path><path d="M10 10h4M10 14h4"></path></svg>',
    eye: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z"></path><circle cx="12" cy="12" r="2"></circle></svg>',
    shield: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 19 7v5c0 4.2-2.8 7-7 8-4.2-1-7-3.8-7-8V7l7-3Z"></path><path d="m9 12 2 2 4-4"></path></svg>',
    calendar: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="6" width="14" height="13" rx="2"></rect><path d="M8 4v4M16 4v4M5 10h14"></path></svg>',
    sun: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>'
  };

  function icon(name) {
    return ICONS[name] || ICONS.check;
  }

  function mascotSvg() {
    return '<svg class="mascot-svg" viewBox="0 0 160 160" aria-hidden="true"><path d="M80 14C47 14 23 40 23 77c0 38 24 68 57 68s57-30 57-68C137 40 113 14 80 14Z" fill="#64c6ff" stroke="#343433" stroke-width="3"></path><path d="M41 93c8 13 22 20 39 20 17 0 31-7 39-20" fill="none" stroke="#343433" stroke-width="2.5" stroke-linecap="round" opacity=".7"></path><circle cx="62" cy="70" r="5" fill="#343433"></circle><circle cx="99" cy="70" r="5" fill="#343433"></circle><path d="M69 90c6 5 16 5 22 0" fill="none" stroke="#343433" stroke-width="3" stroke-linecap="round"></path><path d="M27 53c-5-10-1-20 8-24M132 51c5-10 1-20-8-24" fill="none" stroke="#343433" stroke-width="3" stroke-linecap="round"></path></svg>';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function isConfirmed(taskId) {
    return Boolean(state.confirmed[taskId]);
  }

  function remainingTasks() {
    return TASKS.filter(function (task) { return !isConfirmed(task.id); });
  }

  function taskForPatient(patientId) {
    return TASKS.find(function (task) { return task.patientId === patientId && !isConfirmed(task.id); });
  }

  function patientById(patientId) {
    return PATIENTS.find(function (patient) { return patient.id === patientId; });
  }

  function videoSlot(slot, label) {
    return '<div class="video-slot" data-video-slot="' + escapeHtml(slot) + '" role="img" aria-label="' + escapeHtml(label || 'Ilustración animada') + '">' +
      '<video class="loop" autoplay muted loop playsinline preload="metadata" poster="media/' + escapeHtml(slot) + '.jpg" aria-hidden="true">' +
      '<source src="media/' + escapeHtml(slot) + '.webm" type="video/webm">' +
      '<source src="media/' + escapeHtml(slot) + '.mp4" type="video/mp4">' +
      '</video><div class="video-fallback">' + mascotSvg() + '</div></div>';
  }

  function patientBadge(patient) {
    if (patient.status === 'critical') {
      return '<span class="badge badge-critical">' + escapeHtml(patient.statusLabel) + '</span>';
    }
    if (taskForPatient(patient.id)) {
      return '<span class="badge badge-pending">' + escapeHtml(patient.statusLabel) + '</span>';
    }
    return '<span class="badge badge-ready">Listo</span>';
  }

  function patientCard(patient) {
    var task = taskForPatient(patient.id);
    var side = patient.status === 'critical'
      ? patientBadge(patient)
      : task
        ? '<button type="button" class="quick-confirm tap-confirm" data-confirm="' + escapeHtml(task.id) + '" aria-label="Confirmar ' + escapeHtml(task.title) + ' en un toque">1 toque</button>'
        : patientBadge(patient);
    return '<article class="patient-card" data-patient-card="' + escapeHtml(patient.id) + '">' +
      '<button type="button" class="patient-card-main" data-patient="' + escapeHtml(patient.id) + '" aria-label="Abrir detalle de ' + escapeHtml(patient.name) + '">' +
      '<span class="patient-avatar">' + escapeHtml(patient.initials) + '</span>' +
      '<span class="patient-info"><span class="patient-name">' + escapeHtml(patient.name) + '</span><span class="patient-meta">' + escapeHtml(patient.room) + '</span></span>' +
      '<span class="arrow-icon">' + icon('arrow') + '</span>' +
      '</button><div class="patient-side">' + side + '</div></article>';
  }

  function renderNurseHome() {
    var pending = remainingTasks().length;
    var cards = PATIENTS.map(patientCard).join('');
    return '<div class="home-intro"><p class="eyebrow">Hospital Central · Piso 3</p><h1 class="view-title">Mi turno</h1><p class="view-copy">Buenos días, Elena. Todo lo importante, a la vista.</p></div>' +
      '<div class="shift-stats" aria-label="Resumen del turno"><div class="shift-stat"><strong>3</strong><span>Pacientes</span></div><div class="shift-stat"><strong>' + pending + '</strong><span>Pendientes</span></div><div class="shift-stat"><strong>1:00</strong><span>Próxima ronda</span></div></div>' +
      '<div class="section-heading"><h2 class="section-label">Pacientes asignados</h2><span class="badge badge-critical">1 crítico</span></div>' +
      '<div class="patient-list">' + cards + '</div>';
  }

  function taskCard(task) {
    return '<article class="task-card" data-task-card="' + escapeHtml(task.id) + '">' +
      '<span class="task-icon">' + icon(task.icon) + '</span>' +
      '<span class="task-copy"><span class="task-time">' + escapeHtml(task.time) + '</span><span class="task-title">' + escapeHtml(task.title) + '</span><span class="task-note">' + escapeHtml(task.note) + '</span></span>' +
      '<button type="button" class="task-action tap-confirm" data-confirm="' + escapeHtml(task.id) + '" aria-label="Confirmar ' + escapeHtml(task.title) + '"><svg class="confirm-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="m7 16 6 6L25 9"></path></svg><span class="confirm-label">Listo</span></button>' +
      '</article>';
  }

  function renderEmptyPending() {
    var pieces = '';
    for (var index = 1; index <= 12; index += 1) {
      pieces += '<span class="confetti-piece" style="--confetti-delay:' + (index * 35) + 'ms"></span>';
    }
    return '<div class="empty-state" data-empty-state>' +
      '<div class="confetti-layer" aria-hidden="true">' + pieces + '</div>' +
      videoSlot('empty', 'Gotita flotando tranquila') +
      '<span class="completion-mark">' + icon('check') + '</span>' +
      '<h2>Todo confirmado</h2><p>El turno está al día. Puedes respirar un momento.</p>' +
      '<button type="button" class="accent-link" data-go-home>Volver al turno ' + icon('arrow') + '</button>' +
      '</div>';
  }

  function renderPending() {
    var pending = remainingTasks();
    if (!pending.length) return renderEmptyPending();
    return '<div class="view-header"><div class="view-header-copy"><p class="view-subtitle">Turno de Elena</p><h1 class="view-title small-title">Pendientes</h1></div></div>' +
      '<div class="pending-summary"><div class="pending-summary-copy"><strong>Lo que falta</strong><span>Confirma cada evento con un toque.</span></div><span class="pending-count" data-pending-count>' + pending.length + '</span></div>' +
      '<div class="section-heading"><h2 class="section-label">En este momento</h2><span class="section-meta">Orden por hora</span></div>' +
      '<div class="task-list">' + pending.map(taskCard).join('') + '</div>';
  }

  function detailRow(label, value, expanded) {
    return '<div class="detail-list-row"><strong>' + escapeHtml(label) + '</strong><span>' + escapeHtml(value) + '</span><span class="detail-chevron' + (expanded ? ' is-expanded' : '') + '">' + icon('chevron') + '</span></div>';
  }

  function renderNurseDetail(patient) {
    var patientTasks = TASKS.filter(function (task) { return task.patientId === patient.id; });
    return '<div class="detail-view"><div class="view-header"><button type="button" class="icon-button back-button back-btn" data-back="enfermero" aria-label="Volver al turno"><span class="arrow-icon">' + icon('arrow') + '</span></button><div class="view-header-copy"><p class="view-subtitle">Detalle del turno</p><h1 class="view-title small-title">Ficha del paciente</h1></div></div>' +
      '<div class="detail-hero"><span class="patient-avatar">' + escapeHtml(patient.initials) + '</span><div class="detail-hero-copy"><h2 class="detail-name">' + escapeHtml(patient.name) + '</h2><span class="detail-room">' + escapeHtml(patient.room) + '</span><span class="badge ' + (patient.status === 'critical' ? 'badge-critical' : 'badge-neutral') + ' detail-status">' + escapeHtml(patient.status === 'critical' ? patient.statusLabel : 'En seguimiento') + '</span></div></div>' +
      '<div class="detail-section"><h2 class="detail-section-title">Registro clínico</h2><div class="clinical-panel"><button type="button" class="clinical-value" data-reveal aria-label="Mostrar el valor clínico">' + escapeHtml(patient.clinical) + '</button><button type="button" class="reveal-button" data-reveal>Mostrar dato clínico ' + icon('eye') + '</button><p class="view-copy muted-copy">Oculto por defecto porque esta pantalla también se ve desde la cama.</p></div></div>' +
      '<div class="privacy-note">' + icon('shield') + '<span>El dato sensible queda detrás de un toque deliberado. Si decides comunicarlo, hazlo con calma.</span></div>' +
      '<div class="detail-section"><h2 class="detail-section-title">Eventos del turno</h2><div class="detail-list">' + patientTasks.map(function (task) { return detailRow(task.time + ' · ' + task.title, isConfirmed(task.id) ? 'Confirmado' : 'Pendiente', false); }).join('') + '</div></div>' +
      '<p class="view-copy muted-copy">Lafamilia recibe solo un resumen del turno, sin valores clínicos.</p></div>';
  }

  function onboardingCard(slot, title, copy) {
    return '<article class="onboarding-card"><div class="onboarding-card-copy"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(copy) + '</span></div>' + videoSlot(slot, title) + '</article>';
  }

  function timeline(items) {
    return '<div class="timeline">' + items.map(function (item) {
      return '<div class="timeline-item' + (item.pending ? ' is-pending' : '') + '"><span class="timeline-time">' + escapeHtml(item.time) + '</span><p class="timeline-text">' + escapeHtml(item.text) + '</p></div>';
    }).join('') + '</div>';
  }

  function renderPatient() {
    return '<div class="patient-intro"><p class="eyebrow">Hab. 304-B</p><h1 class="view-title">Mi estado</h1><p class="view-copy">Aquí ve lo que va pasando, en palabras sencillas.</p></div>' +
      '<div class="next-card"><span class="next-card-icon">' + icon('clock') + '</span><span class="next-card-copy"><strong>Lo que sigue</strong><span>La enfermera vuelve a hacer la ronda a la 1:00 p. m.</span></span></div>' +
      '<div class="onboarding-block"><div class="onboarding-intro"><h2 class="section-label">Así funciona</h2><p>Dos ideas sencillas</p></div><div class="onboarding-grid">' + onboardingCard('onboarding-1', 'Lo que sigue', 'Vea el próximo paso del turno.') + onboardingCard('onboarding-2', 'Cómo pedir ayuda', 'Use el timbre cuando necesite algo.') + '</div></div>' +
      '<div class="section-heading"><h2 class="section-label">Qué pasó hoy</h2><span class="section-meta">En simple</span></div>' + timeline(TIMELINE_PACIENTE);
  }

  function faqItem(id, question, answer) {
    return '<article class="faq-item" data-faq-item="' + escapeHtml(id) + '"><button type="button" class="faq-question" data-faq="' + escapeHtml(id) + '" aria-expanded="false"><span>' + escapeHtml(question) + '</span><span class="detail-chevron">' + icon('chevron') + '</span></button><div class="faq-answer"><div>' + escapeHtml(answer) + '</div></div></article>';
  }

  function renderQuestions() {
    return '<div class="view-header"><div class="view-header-copy"><p class="view-subtitle">Hab. 304-B</p><h1 class="view-title small-title">Preguntas</h1></div></div>' +
      '<p class="view-copy">Si hay algo que no tiene claro, puede preguntar con tranquilidad.</p>' +
      '<div class="faq-list">' + faqItem('round', '¿Cuándo vuelve la enfermera?', 'La próxima ronda está prevista para la 1:00 p. m. Si llega un poco más tarde, el equipo le avisará.') + faqItem('help', '¿Cómo pido algo?', 'Use el timbre de la habitación. La enfermera responderá lo más pronto posible.') + faqItem('privacy', '¿Qué información veo aquí?', 'Ve un resumen del turno en palabras sencillas. Su equipo decide qué información clínica debe recibir.') + '</div>';
  }

  function renderFamily() {
    return '<div class="patient-intro"><p class="eyebrow">María González · Hab. 304-B</p><h1 class="view-title">Qué pasa</h1><p class="view-copy">Un resumen sencillo para acompañarlo con tranquilidad.</p></div>' +
      '<div class="family-summary"><strong>El equipo está con él</strong><span>El tratamiento de la mañana va avanzando con normalidad.</span></div>' +
      '<div class="section-heading"><h2 class="section-label">Hoy</h2><span class="section-meta">Sin datos clínicos</span></div>' + timeline(TIMELINE_FAMILIA) +
      '<div class="visit-card"><span class="visit-icon">' + icon('calendar') + '</span><span class="visit-copy"><strong>Horario de visita</strong><span>Hoy, de 3:00 p. m. a 5:00 p. m.</span></span><span class="detail-chevron">' + icon('chevron') + '</span></div>';
  }

  function renderContact() {
    return '<div class="view-header"><div class="view-header-copy"><p class="view-subtitle">Familia de María González</p><h1 class="view-title small-title">Contacto</h1></div></div>' +
      '<p class="view-copy">Si necesita información sobre la visita, el equipo de turno puede orientarla.</p>' +
      '<div class="contact-card"><span class="contact-icon">' + icon('phone') + '</span><span class="contact-copy"><strong>Enfermera de turno</strong><span>Elena · vuelve a la 1:00 p. m.</span></span></div>' +
      '<div class="visit-card"><span class="visit-icon">' + icon('calendar') + '</span><span class="visit-copy"><strong>Horario de visita</strong><span>Hoy, de 3:00 p. m. a 5:00 p. m.</span></span></div>' +
      '<div class="contact-actions"><button type="button" class="primary-button">Llamar al turno</button><button type="button" class="secondary-button">Ver horarios</button></div>';
  }

  function viewDefinition() {
    if (state.role === 'enfermero') {
      if (state.detailPatient) {
        return { key: 'nurse-detail', className: 'is-detail', inner: renderNurseDetail(state.detailPatient) };
      }
      if (state.activeNav[state.role] === 'pendientes') {
        return { key: 'nurse-pending', className: 'is-home', inner: renderPending() };
      }
      return { key: 'nurse-home', className: 'is-home', inner: renderNurseHome() };
    }
    if (state.role === 'paciente') {
      return state.activeNav[state.role] === 'preguntas'
        ? { key: 'patient-questions', className: 'is-home', inner: renderQuestions() }
        : { key: 'patient-home', className: 'is-home', inner: renderPatient() };
    }
    return state.activeNav[state.role] === 'contacto'
      ? { key: 'family-contact', className: 'is-home', inner: renderContact() }
      : { key: 'family-home', className: 'is-home', inner: renderFamily() };
  }

  function createView(definition, direction) {
    var view = document.createElement('section');
    view.className = 'view ' + definition.className + (direction === 'back' ? ' from-left' : ' from-right');
    view.dataset.viewKey = definition.key;
    view.setAttribute('role', 'region');
    view.innerHTML = definition.inner;
    return view;
  }

  function bindVideos(container) {
    var videos = container.querySelectorAll('.loop');
    videos.forEach(function (video) {
      if (video.dataset.bound === 'true') return;
      video.dataset.bound = 'true';
      var fallback = video.parentElement.querySelector('.video-fallback');
      var showFallback = function () {
        video.classList.add('is-hidden');
        if (fallback) fallback.classList.add('is-visible');
      };
      video.addEventListener('error', showFallback);
      video.addEventListener('loadeddata', function () {
        video.classList.remove('is-hidden');
        if (fallback) fallback.classList.remove('is-visible');
      });
      if (reducedMotion.matches) {
        video.pause();
        video.autoplay = false;
        return;
      }
      if (videoObserver) {
        videoObserver.observe(video);
      } else {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(function () {});
      }
    });
  }

  function ensureVideoObserver() {
    if (videoObserver || !('IntersectionObserver' in window)) return;
    videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (reducedMotion.matches) {
          video.pause();
          return;
        }
        if (entry.isIntersecting) {
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.12 });
  }

  function routeKey() {
    var definition = viewDefinition();
    return definition.key;
  }

  function renderRoute(direction, force) {
    if (state.role === 'enfermero' && state.activeNav[state.role] === 'registrar' && !state.sheetOpen) {
      openRegistrationSheet();
      return;
    }
    var definition = viewDefinition();
    var current = app.screen.querySelector('.view.is-active');
    if (current && current.dataset.viewKey === definition.key && !force) {
      renderBottomNav();
      return;
    }
    var next = createView(definition, direction);
    if (!current) {
      app.screen.appendChild(next);
      requestAnimationFrame(function () {
        next.classList.remove('from-left', 'from-right');
        next.classList.add('is-active');
        bindVideos(next);
      });
    } else {
      app.screen.appendChild(next);
      requestAnimationFrame(function () {
        current.classList.remove('is-active');
        current.classList.add('is-leaving', direction === 'back' ? 'to-right' : 'to-left');
        next.classList.remove('from-left', 'from-right');
        next.classList.add('is-active');
        bindVideos(next);
        window.setTimeout(function () {
          if (current.parentNode) current.remove();
        }, 320);
      });
    }
    renderBottomNav();
  }

  function renderBottomNav() {
    var items = NAV_BY_ROLE[state.role];
    app.bottomNav.innerHTML = items.map(function (item) {
      var active = item.key === state.activeNav[state.role];
      return '<button type="button" class="nav-item' + (active ? ' is-active' : '') + '" data-nav="' + escapeHtml(item.key) + '" aria-pressed="' + String(active) + '"><span class="nav-icon">' + icon(item.icon) + '</span><span>' + escapeHtml(item.label) + '</span></button>';
    }).join('');
  }

  function updateRole(role) {
    var nextIndex = ROLE_INDEX[role];
    var currentIndex = ROLE_INDEX[state.role];
    state.role = role;
    state.detailPatient = null;
    app.phone.dataset.role = role;
    app.phone.style.setProperty('--role-index', nextIndex);
    app.roleTabs.forEach(function (tab, index) {
      var active = index === nextIndex;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    if (state.sheetOpen) closeRegistrationSheet(false);
    renderBottomNav();
    renderRoute(nextIndex >= currentIndex ? 'forward' : 'back');
  }

  function openPatientDetail(patientId, sourceCard) {
    var patient = patientById(patientId);
    if (!patient) return;
    var home = app.screen.querySelector('.view[data-view-key="nurse-home"]');
    if (!home) {
      state.activeNav.enfermero = 'turno';
      renderRoute('forward', true);
      window.setTimeout(function () { openPatientDetail(patientId, null); }, 340);
      return;
    }
    state.detailPatient = patient;
    state.activeNav.enfermero = 'turno';
    home.classList.add('is-behind');
    var definition = viewDefinition();
    var detail = createView(definition, 'forward');
    app.screen.appendChild(detail);
    requestAnimationFrame(function () {
      detail.classList.remove('from-right');
      detail.classList.add('is-active');
      bindVideos(detail);
      if (sourceCard) animateSharedElement(sourceCard, detail);
    });
    renderBottomNav();
  }

  function animateSharedElement(sourceCard, destination) {
    if (!sourceCard || !destination.animate) return;
    var target = destination.querySelector('.detail-hero');
    if (!target) return;
    var first = sourceCard.getBoundingClientRect();
    var last = target.getBoundingClientRect();
    var x = first.left - last.left;
    var y = first.top - last.top;
    var scale = first.width / Math.max(last.width, 1);
    target.animate([
      { transform: 'translate3d(' + x + 'px, ' + y + 'px, 0) scale(' + scale + ', ' + scale + ')', opacity: 0.72 },
      { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 }
    ], { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' });
  }

  function closePatientDetail() {
    var detail = app.screen.querySelector('.view[data-view-key="nurse-detail"]');
    var home = app.screen.querySelector('.view[data-view-key="nurse-home"]');
    state.detailPatient = null;
    if (!detail) {
      renderBottomNav();
      renderRoute('back', true);
      return;
    }
    detail.classList.remove('is-active');
    detail.classList.add('is-leaving', 'to-left');
    if (home) {
      home.classList.remove('is-behind');
      home.classList.add('is-active');
    }
    window.setTimeout(function () { if (detail.parentNode) detail.remove(); }, 320);
    renderBottomNav();
  }

  function openRegistrationSheet() {
    if (state.sheetOpen) return;
    state.sheetOpen = true;
    state.sheetReturnNav = state.activeNav.enfermero === 'registrar' ? 'turno' : state.activeNav.enfermero;
    state.activeNav.enfermero = 'registrar';
    app.registrationLayer.innerHTML = '<div class="sheet-backdrop" data-sheet-close></div><section class="registration-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-handle" data-sheet-handle aria-label="Arrastrar para cerrar"></div><div class="sheet-header"><div class="sheet-title-wrap"><p class="view-subtitle">Registro rápido</p><h2 id="sheet-title" class="sheet-title">¿Qué acabas de hacer?</h2></div><button type="button" class="icon-button" data-sheet-close aria-label="Cerrar registro">×</button></div><p class="sheet-copy">Selecciona un evento previsto. También puedes dictarlo.</p><div class="quick-events"><button type="button" class="event-chip" data-quick-event="Medicación"><span class="event-icon">' + icon('pill') + '</span><span><strong>Medicación</strong><small>1 toque</small></span></button><button type="button" class="event-chip" data-quick-event="Cambio de posición"><span class="event-icon">' + icon('move') + '</span><span><strong>Cambio de posición</strong><small>1 toque</small></span></button><button type="button" class="event-chip" data-quick-event="Ronda"><span class="event-icon">' + icon('ruler') + '</span><span><strong>Ronda</strong><small>1 toque</small></span></button><button type="button" class="event-chip" data-quick-event="Otro evento"><span class="event-icon">' + icon('clipboard') + '</span><span><strong>Otro evento</strong><small>Abrir detalle</small></span></button></div><button type="button" class="dictate-button" data-dictate><span class="mic-bubble">' + icon('mic') + '</span><span class="dictate-copy"><strong>Dictar evento</strong><small>Mantén presionado para hablar</small></span><span class="dictate-pulse" aria-hidden="true"></span></button><p class="tray-feedback" data-tray-feedback aria-live="polite"></p></section>';
    app.registrationLayer.classList.add('is-open');
    app.registrationLayer.setAttribute('aria-hidden', 'false');
    renderBottomNav();
    bindSheetDrag();
    requestAnimationFrame(function () {
      var first = app.registrationLayer.querySelector('.event-chip');
      if (first) first.focus();
    });
  }

  function closeRegistrationSheet(restoreNav) {
    if (!state.sheetOpen) return;
    state.sheetOpen = false;
    if (restoreNav !== false) state.activeNav.enfermero = state.sheetReturnNav || 'turno';
    app.registrationLayer.classList.remove('is-open');
    app.registrationLayer.setAttribute('aria-hidden', 'true');
    renderBottomNav();
    window.setTimeout(function () {
      if (!state.sheetOpen) app.registrationLayer.innerHTML = '';
    }, 420);
  }

  function bindSheetDrag() {
    var handle = app.registrationLayer.querySelector('[data-sheet-handle]');
    var sheet = app.registrationLayer.querySelector('.registration-sheet');
    if (!handle || !sheet) return;
    var startY = 0;
    var currentY = 0;
    handle.addEventListener('pointerdown', function (event) {
      startY = event.clientY;
      currentY = 0;
      handle.setPointerCapture(event.pointerId);
      sheet.style.setProperty('--drag-y', '0px');
    });
    handle.addEventListener('pointermove', function (event) {
      currentY = Math.max(0, event.clientY - startY);
      sheet.style.setProperty('--drag-y', currentY + 'px');
    });
    handle.addEventListener('pointerup', function () {
      if (currentY > 80) closeRegistrationSheet();
      else {
        sheet.style.setProperty('--drag-y', '0px');
        currentY = 0;
      }
    });
  }

  function confirmTask(taskId, trigger) {
    if (isConfirmed(taskId)) return;
    var card = trigger.closest('.task-card, .patient-card');
    state.confirmed[taskId] = true;
    if (card) card.classList.add('is-confirming');
    navigator.vibrate?.(10);
    window.setTimeout(function () {
      if (card) card.classList.add('is-collapsing');
      window.setTimeout(function () {
        if (!remainingTasks().length) {
          state.activeNav.enfermero = 'pendientes';
          state.detailPatient = null;
          closeRegistrationSheet(false);
          renderRoute('forward', true);
          showCompletion();
        } else {
          renderRoute('forward', true);
          window.setTimeout(animatePendingCount, 40);
        }
      }, 260);
    }, 220);
  }

  function animatePendingCount() {
    var count = app.screen.querySelector('[data-pending-count]');
    if (!count) return;
    count.classList.remove('is-updating');
    void count.offsetWidth;
    count.classList.add('is-updating');
    window.setTimeout(function () { count.classList.remove('is-updating'); }, 420);
  }

  function showCompletion() {
    if (state.completionTimer) window.clearTimeout(state.completionTimer);
    var pieces = '';
    for (var index = 1; index <= 12; index += 1) pieces += '<span class="confetti-piece" style="--confetti-delay:' + (index * 30) + 'ms"></span>';
    app.celebrationLayer.innerHTML = '<div class="celebration-card"><div class="celebration-mascot">' + mascotSvg() + '</div><span class="completion-mark">' + icon('check') + '</span><h2>Turno al día</h2><p>Todo confirmado. El equipo puede seguir con tranquilidad.</p><button type="button" class="primary-button" data-close-celebration>Seguir con el turno</button><div class="confetti-layer" aria-hidden="true">' + pieces + '</div></div>';
    app.celebrationLayer.classList.add('is-visible');
    app.celebrationLayer.setAttribute('aria-hidden', 'false');
    var closeButton = app.celebrationLayer.querySelector('[data-close-celebration]');
    if (closeButton) closeButton.focus();
    state.completionTimer = window.setTimeout(hideCompletion, 3200);
  }

  function hideCompletion() {
    app.celebrationLayer.classList.remove('is-visible');
    app.celebrationLayer.setAttribute('aria-hidden', 'true');
    window.setTimeout(function () {
      if (!app.celebrationLayer.classList.contains('is-visible')) app.celebrationLayer.innerHTML = '';
    }, 340);
  }

  function showTrayFeedback(message) {
    var feedback = app.registrationLayer.querySelector('[data-tray-feedback]');
    if (!feedback) return;
    feedback.textContent = message + ' listo para registrar.';
    feedback.classList.add('is-visible');
    if (state.feedbackTimer) window.clearTimeout(state.feedbackTimer);
    state.feedbackTimer = window.setTimeout(function () { feedback.classList.remove('is-visible'); }, 1800);
  }

  function toggleListening(button) {
    state.listening = !state.listening;
    var copy = button.querySelector('.dictate-copy');
    if (state.listening) {
      copy.querySelector('strong').textContent = 'Escuchando';
      copy.querySelector('small').textContent = 'Suelta para dejar el registro';
      button.classList.add('is-listening');
    } else {
      copy.querySelector('strong').textContent = 'Dictar evento';
      copy.querySelector('small').textContent = 'Mantén presionado para hablar';
      button.classList.remove('is-listening');
      showTrayFeedback('Registro por voz');
    }
  }

  function handleScreenClick(event) {
    var confirm = event.target.closest('[data-confirm]');
    if (confirm) {
      event.preventDefault();
      event.stopPropagation();
      confirmTask(confirm.getAttribute('data-confirm'), confirm);
      return;
    }

    var patient = event.target.closest('[data-patient]');
    if (patient) {
      openPatientDetail(patient.getAttribute('data-patient'), patient.closest('.patient-card'));
      return;
    }

    var back = event.target.closest('[data-back]');
    if (back) {
      closePatientDetail();
      return;
    }

    var reveal = event.target.closest('[data-reveal]');
    if (reveal) {
      var value = app.screen.querySelector('.clinical-value');
      var revealButton = app.screen.querySelector('.reveal-button');
      if (value) value.classList.toggle('is-revealed');
      if (revealButton) revealButton.classList.toggle('is-revealed');
      return;
    }

    var faq = event.target.closest('[data-faq]');
    if (faq) {
      var id = faq.getAttribute('data-faq');
      var item = faq.closest('[data-faq-item]');
      state.faqOpen[id] = !state.faqOpen[id];
      item.classList.toggle('is-open', state.faqOpen[id]);
      faq.setAttribute('aria-expanded', String(state.faqOpen[id]));
      return;
    }

    var goHome = event.target.closest('[data-go-home]');
    if (goHome) {
      state.activeNav.enfermero = 'turno';
      closeRegistrationSheet(false);
      renderRoute('back', true);
    }
  }

  function handleNavClick(event) {
    var button = event.target.closest('[data-nav]');
    if (!button) return;
    var key = button.getAttribute('data-nav');
    if (state.role === 'enfermero' && key === 'registrar') {
      openRegistrationSheet();
      return;
    }
    var oldKey = state.activeNav[state.role];
    if (oldKey === key && !state.detailPatient) return;
    state.activeNav[state.role] = key;
    state.detailPatient = null;
    if (state.role === 'enfermero') closeRegistrationSheet(false);
    var oldIndex = NAV_BY_ROLE[state.role].findIndex(function (item) { return item.key === oldKey; });
    var newIndex = NAV_BY_ROLE[state.role].findIndex(function (item) { return item.key === key; });
    renderRoute(newIndex >= oldIndex ? 'forward' : 'back');
  }

  function handleRoleClick(event) {
    var tab = event.target.closest('.role-tab');
    if (!tab || tab.classList.contains('is-active')) return;
    updateRole(tab.getAttribute('data-role'));
  }

  function handleRegistrationClick(event) {
    var close = event.target.closest('[data-sheet-close]');
    if (close) {
      closeRegistrationSheet();
      return;
    }
    var quick = event.target.closest('[data-quick-event]');
    if (quick) {
      showTrayFeedback(quick.getAttribute('data-quick-event'));
      return;
    }
    var dictate = event.target.closest('[data-dictate]');
    if (dictate) {
      toggleListening(dictate);
    }
  }

  function initSplash() {
    var mascot = app.splashLayer.querySelector('.splash-mascot');
    mascot.innerHTML = videoSlot('splash', 'Gotita saludando');
    bindVideos(app.splashLayer);
    var finish = function () {
      if (app.splashLayer.classList.contains('is-leaving')) return;
      app.splashLayer.classList.add('is-leaving');
      window.setTimeout(function () { app.splashLayer.setAttribute('aria-hidden', 'true'); }, 320);
      renderRoute('forward', true);
    };
    app.splashLayer.querySelector('[data-splash-skip]').addEventListener('click', finish);
    app.splashLayer.addEventListener('click', function (event) {
      if (event.target.closest('[data-splash-skip]')) return;
      if (event.target.closest('.splash-content')) finish();
    });
    window.setTimeout(finish, 1200);
  }

  function initClock() {
    var time = document.querySelector('.status-time');
    if (!time) return;
    function tick() {
      var now = new Date();
      time.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }
    tick();
    window.setInterval(tick, 15000);
  }

  function initReducedMotion() {
    if (!reducedMotion.addEventListener) return;
    reducedMotion.addEventListener('change', function () {
      app.phone.classList.toggle('reduced-motion', reducedMotion.matches);
      document.querySelectorAll('.loop').forEach(function (video) {
        if (reducedMotion.matches) video.pause();
      });
    });
  }

  function init() {
    ensureVideoObserver();
    app.screen.addEventListener('click', handleScreenClick);
    app.bottomNav.addEventListener('click', handleNavClick);
    app.registrationLayer.addEventListener('click', handleRegistrationClick);
    app.roleTabs.forEach(function (tab) { tab.addEventListener('click', handleRoleClick); });
    app.celebrationLayer.addEventListener('click', function (event) {
      if (event.target.closest('[data-close-celebration]')) hideCompletion();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (state.sheetOpen) closeRegistrationSheet();
      else if (state.detailPatient) closePatientDetail();
      else if (app.celebrationLayer.classList.contains('is-visible')) hideCompletion();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) document.querySelectorAll('.loop').forEach(function (video) { video.pause(); });
    });
    initClock();
    initReducedMotion();
    initSplash();
    renderBottomNav();
    window.setTimeout(animatePendingCount, 400);
  }

  init();
}());
