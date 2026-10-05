# FINDINGS — audit pass (nurse/patient, 390×844)

Audit of the prototype as built after FIXES-1/2. Before-shots: `shots/audit-before/`
(01 splash … 12 family-contact, 13–14 desktop 1440px). Both scripts passed before
any change. Ranked by impact on grade dimensions (gloved use, bed-visible privacy,
hierarchy, motion discipline, contrast, tokens).

## F1 — Glove targets under 56px (one-handed use)
What is wrong: the primary one-tap controls are smaller than a gloved finger.
`shots/audit-before/02-nurse-home.png` ("1 toque" pill) and `05-pendientes.png`
(black confirm circles). `css/app.css:682` `.quick-confirm` min-height 36px;
`1045` `.task-action` 48px; `802` `.reveal-button` 40px; `330` `.icon-button`
(back, sheet close) 40px; `1965` `.splash-skip` 44px; `1841` contact buttons
44px; `443` `.empty-state-link` 48px. Sheet drag handle (`1254`) has a 4px visual
with no extended hit area.
Change: raise all of the above to min 56px (empty-state link stays under its
FIXES-2 60px cap); add a `::after` hit-area sleeve to the sheet handle.
Status: fixed + asserted (bounding boxes ≥ 56px).

## F2 — Primary confirm has no idle affordance; dead chevrons on family cards
What is wrong: `05-pendientes.png` — the confirm control is an empty black
circle; the check only exists mid-confirm (`.confirm-mark path` starts at
`stroke-dashoffset: 32`, `css/app.css:1074`). Nothing says "tappable" before the
tap. Opposite fault on family cards: `11-family-home.png`, `12-family-contact.png`
show `detail-chevron` arrows (`js/app.js:308,314`) with no click handler — a cue
that lies.
Change: idle check renders as a 35% ghost (`dashoffset: 0`, full draw on
confirm); remove the two handler-less chevrons.
Status: fixed + asserted (idle path visible; no `.detail-chevron` in family).

## F3 — Secondary text contrast 3.9:1, below the 4.5:1 bar
What is wrong: `--muted: #7e7e7d` on canvas measures 3.90:1 (node check,
same formula as `tests/acceptance.js`). It sets every 12px secondary line:
eyebrows, `patient-meta`, `timeline-time`, `event-chip small`, splash skip —
visible in every before-shot.
Change: `--muted` → `#6b6b6a` (5.12:1 on canvas, 4.85:1 on sand/stone).
Status: fixed + asserted (ratio ≥ 4.5 in acceptance).

## F4 — Privacy toggle label lies after reveal
What is wrong: `03-nurse-detail-carlos.png` — after tapping "Mostrar dato
clínico" the value unblurs but the button still reads "Mostrar dato clínico"
(`js/app.js:269,673`). The one deliberate-tap control on the bed-visible screen
must always describe the next state, not the past one.
Change: label toggles Mostrar/Ocultar + `aria-expanded` on both reveal buttons.
Status: fixed + asserted (label + `aria-expanded` both ways).

## F5 — Times wrap mid-unit; vitals/times lack tabular figures
What is wrong: `10-patient-preguntas.png` — "para la 1:00 p. / m. Si llega…"
breaks between "p." and "m.". Same risk in the next-card, contact and visit
cards. No `font-variant-numeric` anywhere, so times/counts jitter between states.
Change: `tabular-nums` on `.timeline-time .task-time .shift-stat strong
.pending-count .status-time .clinical-value`; `nowrap` on time columns and a
`.time-nowrap` span around each "p. m." time; patient time column 52px → 62px.
Status: fixed + asserted (computed styles + no timeline overflow).

## F6 — Motion durations bypass the token file; WAAPI ignores reduced-motion
What is wrong: easings are disciplined (3 tokens, 81 cites) but ~30 raw
durations/delays live in `css/app.css` (360/300/260/220/320/380/420/500ms,
1.8s/3.6s/1200ms, stagger delays 40–160ms) and JS sets `--confetti-delay`
from raw numbers (`js/app.js:241,611`) and a raw WAAPI `duration: 420`
(`js/app.js:501`). `animateSharedElement` runs even with reduced-motion on.
Change: all UI transitions map to enter/exit/press, staggers to
`--stagger: 40ms` multiples, ambient loops to `--duration-drift: 3.6s` /
`--duration-burst: 1200ms`; JS reads `--stagger`/`--duration-enter` from the
token file; WAAPI returns early under reduced-motion.
Status: fixed + asserted (no raw durations in `app.css` outside the
reduced-motion block; zero running animations under reduced-motion).

## F7 — Raw colors outside `tokens.css`
What is wrong: three `rgba()` literals in `css/app.css:1226` (sheet veil),
`1395` (dictate sublabel), `1994` (celebration veil).
Change: `--veil-ink`, `--on-ink-soft`, `--veil-canvas` tokens; usages cite them.
Status: fixed + asserted (no hex/`rgba()` left in `app.css`).

## F8 — Type below the 12px scale floor + dead CSS
What is wrong: brief scale starts at 12, but `.nav-item` is 10px
(`css/app.css:1870`), `.status-icons` and `.quick-confirm` are 11px (`99,689`) —
all visible in before-shots. `.empty-mascot` (`1117`, grey circle) is dead since
FIXES-2 moved the empty state to video, and contradicts the no-grey-card rule if
reused.
Change: snap the three to `var(--text-caption)`; delete `.empty-mascot` and its
reduced-motion line.
Status: fixed + asserted (computed 12px nav; no `empty-mascot` in CSS).

## Considered, kept or skipped (with reason)
- Family `#d48f00` text (2.61:1) and alert-red small text: hexes mandated by
  FIXES-1 #6 / BRIEF + FIXES-1 #2; changing them would regress binding fixes.
  Known residual, flagged for a token-level pass with the professor.
- 12h ("1:00 p. m.") vs 24h ("15:00") mix: locked by FIXES-1 #7 (asserted);
  F5 removes the wrapping harm without touching either format.
- "1 crítico" / "Revisar" wording from the bed: the agreed FIXES-1 #2
  non-clinical solution — prioritization words, no diagnosis, kept.
- Role tabs stay 40px: prototype chrome for the professor (mouse), not app UI.
- Repeated privacy lines on nurse detail: deliberate emphasis, copy asserted.
- "Otro evento / Abrir detalle" and "Llamar al turno" go no further than
  feedback: UI-only tray is BRIEF-sanctioned, no new features per instructions.
- Doctor sizes, splash timing: untouched per FIXES-2.
