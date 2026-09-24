# FIXES round 1 — verified by screenshots. Fix all, keep everything else as is.

1. **PRIVACY BUG (critical).** Nurse → open Carlos detail → switch role to "Paciente": the patient face
   still shows the nurse "Ficha del paciente" with REGISTRO CLÍNICO and the "PA 90/55" badge, only
   recolored green. Switching role must ALWAYS reset to that role's home view and clear detail state.
   Add a Playwright assertion for this exact path (no text "PA 90/55" or "Registro clínico" visible
   after switching to Paciente or Familia).
2. **Raw clinical value on the semi-public list.** Nurse home card shows "PA 90/55" as a badge, and the
   detail header too. The bed can see this screen. Replace with a non-clinical critical badge
   "Revisar" (alert red). The raw value lives ONLY behind the blur reveal.
3. **Real videos are now in `media/`** (splash, onboarding-1, onboarding-2, empty: .mp4/.webm/.jpg;
   doctor mascot). Do NOT delete or regenerate them. Wire them: splash → splash loop, patient onboarding
   → onboarding-1 and onboarding-2, nurse Pendientes empty state → empty. Remove the inline blob mascot
   where a video exists (keep it only as the error fallback). Video element: `mix-blend-mode: multiply`,
   no frame/border/grey card behind it; the splash must show ONLY the doctor, no tilted grey shape.
   Reference stills of the character: `media/frames/doctora-white.png` (can be used as <img> fallback
   instead of the blob).
4. Typo: "Lafamilia" → "La familia".
5. Family face: patient is María González (female) but copy says "con él" / "acompañarlo". Make gender
   agree ("con ella", "acompañarla") — derive from patient data, add a `pronoun` field.
6. Contrast: family accent #ffbb26 as TEXT on the pale yellow pill/labels fails contrast. Use gold
   `#d48f00` for family accent text/icons, keep #ffbb26 only for fills. Same check for patient green
   text: use a darker green (≥ 4.5:1 on #fbfaf9) for text, #00ca48 for fills/dots only.
7. Timeline time column wraps "3:00 p. m." onto two lines — widen the column or use "15:00".

Re-run your acceptance script plus the new privacy assertion. Report in ≤ 8 lines.

Testing: read TESTING.md and use both tools. Stay inside this directory.
