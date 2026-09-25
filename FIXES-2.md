# FIXES round 2 — verified by screenshots. Fix all, keep everything else.

1. **Celebration still uses the old blue blob mascot.** After confirming the last pending, the
   "Turno al día" card shows the inline SVG blob. Replace with the doctor: `media/frames/doctora-white.png`
   (<img>, multiply) or the splash video. The blob must not appear anywhere unless a video/image fails.
2. **Empty-state button is broken.** "Volver al turno" renders one word per line inside a grey box with a
   black ▶ triangle (looks like a native media control / broken icon). Make it a normal sand pill button
   (Family secondary: bg #f6f4ef, ink text, radius 32px, single line, chevron icon that animates).
3. **Mascot videos are too small.** Patient onboarding cards show the doctor at ~40px; empty state ~70px;
   splash ~100px. Targets inside the 390px phone: splash 180px, empty state 160px, onboarding cards
   the video fills the card width (square, ~120px). Keep `mix-blend-mode: multiply`.
4. **Splash leaves too fast** (< 1.5s) so the wave never plays. Advance after one full video cycle
   (the `ended`/timeupdate of the first loop, max 5s) or on tap; with reduced motion, 1.2s.

Add Playwright assertions: no `.mascot-blob` (or whatever the blob class is) visible in celebration;
empty-state button height < 60px; video boxes meet the sizes above (±10px).
Testing: TESTING.md. Stay inside this directory. Report in ≤ 8 lines.
