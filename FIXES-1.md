# FIXES round 1 — verified by screenshots. Fix all, keep everything else as is.

1. **PRIVACY BUG (critical).** Nurse → open Carlos detail → switch role to "Paciente": the patient face
   still shows the nurse "Ficha del paciente" with REGISTRO CLÍNICO and the "PA 90/55" badge, only
   recolored green. Switching role must ALWAYS reset to that role's home view and clear detail state.
   Add a Playwright assertion for this exact path (no text "PA 90/55" or "Registro clínico" visible
   after switching to Paciente or Familia).
2. **Raw clinical value on the semi-public list.** Nurse home card shows "PA 90/55" as a badge, and the
   detail header too. The bed can see this screen. Replace with a non-clinical critical badge
   "Revisar" (alert red). The raw value lives ONLY behind the blur reveal.
3. **Delete the placeholder media** (`media/*.mp4|webm|jpg`, keep `media/PROMPTS.md`). The fake poster
   draws a tilted grey card over the mascot on the splash. With no files, the error fallback must show
   the inline SVG mascot cleanly — verify the splash shows ONLY the mascot, no grey shapes, and that a
   missing <source> does not log console errors that break acceptance (use `onerror` on the last
   <source> or check `networkState`, and don't set `poster` when the file is absent — use a data
   attribute and set poster only after the video loads).
4. Typo: "Lafamilia" → "La familia".
5. Family face: patient is María González (female) but copy says "con él" / "acompañarlo". Make gender
   agree ("con ella", "acompañarla") — derive from patient data, add a `pronoun` field.
6. Contrast: family accent #ffbb26 as TEXT on the pale yellow pill/labels fails contrast. Use gold
   `#d48f00` for family accent text/icons, keep #ffbb26 only for fills. Same check for patient green
   text: use a darker green (≥ 4.5:1 on #fbfaf9) for text, #00ca48 for fills/dots only.
7. Timeline time column wraps "3:00 p. m." onto two lines — widen the column or use "15:00".

Re-run your acceptance script plus the new privacy assertion. Report in ≤ 8 lines.
