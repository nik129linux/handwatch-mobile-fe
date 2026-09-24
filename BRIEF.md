# BRIEF — Nursing app, mobile prototype (Family style)

You are the frontend builder. Build a static, no-build prototype in THIS folder.
Read everything in `ref/` first: `ideas.md` (the case, "# Mobile" section),
`content-spec.md` (content + event translation table), `mockup.js` / `mockup.css` /
`mockup.html` (the previous dark prototype — reuse its DATA, render functions and
interaction logic; replace its entire visual skin).

## Deliverable files (only these; do not touch `ref/` or this BRIEF)
```
index.html        phone frame on a desktop stage + role switch + screens
css/tokens.css    design tokens (below)
css/app.css       components + motion
js/app.js         router, roles, interactions, video observer
media/            leave the placeholder posters; see "Video"
```
Vanilla HTML/CSS/JS. No frameworks, no npm, no CDN JS. Google Fonts `<link>` allowed.
Must open by double-clicking `index.html` (file://).

## Language
- Code, identifiers, comments: English.
- UI copy: Spanish, **neutral Colombian**. No voseo ("tocá", "mirá" are WRONG → "toca", "mira"). Use "usted" for patient/family faces, "tú" for the nurse face.

## Visual system — "Family" (refero style 1bcae895). Light theme only.
Colors (put in tokens.css as custom properties):
- canvas `#fbfaf9`, stone `#f2f0ed`, sand `#f6f4ef`, white `#ffffff`
- ink `#121212` (headings, primary CTA fill), charcoal `#343433` (text, strokes), body `#474645`, muted `#7e7e7d`, stone-border `#e5d5c3`
- role accents: nurse `#0086fc` (text/icons only, never a filled CTA), patient `#00ca48`, family `#ffbb26`
- sky `#64c6ff`, sun `#ffcd6c`, coral `#ff58ae` for illustration only
- alert red `#ff2b3a` ONLY for clinical-critical state (Carlos, PA 90/55)
Rules: NO gradients. NO drop shadows except `rgba(0,0,0,.04) 0 1px 6px, rgba(0,0,0,.05) 0 0 24px` on the phone frame. Cards = white, radius 10px, 1px inset border `#f2f0ed` (`box-shadow: inset 0 0 0 1px #f2f0ed`). Pills radius 9999px, CTA buttons radius 32px (ink fill, white text). Badges radius 6px. Never white-on-white: alternate canvas/stone.
Type: display = **Bricolage Grotesque 500** (Google Fonts), tight tracking (-0.02em); body = **Inter 400/500/600**, 17px/26px, letter-spacing -0.013em. Scale: 12 / 15 / 17 / 19 / 23 / 32 (app heading) / 44.
Spacing base 4px; card padding 16–20px inside the 390px phone; element gap 8–12px.
Illustration: flat hand-drawn feel, inline SVG, thin `#343433` strokes, flat fills from the accent palette. Make ONE simple mascot (a friendly round blob/"gotita" with dot eyes) as inline SVG; reuse it in empty states and completion moments.

## Screens (keep the 3 roles of ref/mockup.js)
- **Splash** (~1.2s, skippable on tap): mascot + wordmark, then goes to role home.
- **Nurse**: patient list (turno) → patient detail pushes from the right. Clinical value hidden behind blur until a deliberate tap (the bed can see this screen — ideas.md). Planned events confirm in ONE tap. Tabs: Turno / Registrar / Pendientes.
- **Registrar**: bottom sheet (tray), not a page: 3–4 big quick-event chips + a large "dictar" mic button (UI only). Glove-friendly: hit targets ≥ 56px.
- **Patient**: "Mi estado" timeline in plain words (from content-spec) + "Preguntas". Onboarding: 2 short cards explaining what they see here (video slot, see below).
- **Family**: "Qué pasa" + "Contacto"; visiting hours card; nothing clinical.
- **Empty state** for Pendientes when all confirmed: mascot floating + warm line.

## Motion (Family Values — required)
- Easing enter `cubic-bezier(0.16,1,0.3,1)` 300–400ms; exit `cubic-bezier(0.4,0,1,1)` 200–250ms; press `scale(.97)` 120ms. Never linear.
- Zero instant show/hide: every appear/disappear animates.
- Directional: forward/next tab enters from right, back/prev tab from left.
- Role switch: sliding pill indicator; accent color transitions (use `@property --accent` with `syntax:'<color>'`).
- Card entrance stagger 40ms.
- Bottom sheet slides up from the edge with a dimmed backdrop; has title + dismiss; drag handle.
- Shared-element feel: tapping a patient card → detail header grows from the card (FLIP technique with WAAPI, or View Transitions API with fallback).
- One-tap confirm: SVG check draws (`stroke-dasharray/offset`), card collapses out smoothly, pending count number animates, `navigator.vibrate?.(10)`.
- Completion: when the last pending is confirmed → theatrical moment (mascot pops + small CSS confetti) — this is the rare event.
- Micro cues: chevrons rotate/flip with direction.
- `@media (prefers-reduced-motion: reduce)`: disable all of the above, videos show poster only.
- Buttons: hover, active, `:focus-visible` states on all interactives.

## Video (mp4 loops)
Real videos will come later. Build the slot now so dropping files in `media/` just works:
```html
<video class="loop" autoplay muted loop playsinline preload="metadata"
       poster="media/splash.jpg" aria-hidden="true">
  <source src="media/splash.webm" type="video/webm">
  <source src="media/splash.mp4" type="video/mp4">
</video>
```
- Slots: `splash`, `onboarding-1`, `onboarding-2`, `empty`.
- `mix-blend-mode: multiply` on the video (videos are rendered on #fbfaf9 so the background disappears).
- If the file is missing (error event) → fall back to the inline SVG mascot, no broken UI.
- IntersectionObserver: play when visible, pause when not. Reduced motion → never play.
- NEVER put video on the nurse registration flow.

## Stage (desktop chrome, outside the phone)
Canvas `#fbfaf9`, phone 390×844 centered, radius 48px, short hint line under it in Spanish. On viewports < 500px the phone fills the screen (no frame).

## Acceptance (self-check before you stop)
1. `index.html` opens with no console errors.
2. All 3 roles navigable; detail push/back works; sheet opens/closes; confirm → empty state → confetti.
3. grep: no `linear` easing, no `gradient`, no voseo words (tocá|mirá|podés|tenés|querés).
4. Reduced-motion block exists and covers transitions, animations, video.
Report what you built in ≤ 10 lines.
