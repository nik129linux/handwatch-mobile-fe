# Video prompts — mascot loops

Routing: higgsfield-prompt (MCSLA) + shared negative constraints.
Model specs come from snapshot 2026-08-07, which is over 30 days old. Check live with
`higgsfield model get kling3_0` before spending credits.

## Step 0: lock the mascot as an image first
Generate ONE still and reuse it as `start_image` **and** `end_image` in every clip.
Same first and last frame means the loop has no visible cut, and the mascot stays
identical across all 4 clips.

**Model**: Nano Banana 2 · **Aspect ratio**: 1:1

```
Flat hand-drawn illustration of a round friendly water-drop mascot, soft sky-blue
fill #64c6ff, thin charcoal outline #343433, two small dot eyes and a tiny curved
smile, centered, occupying the middle third of the frame. Solid flat background
color #fbfaf9 filling the entire frame edge to edge. Flat fills only, clean vector
look, even soft lighting, sharp focus throughout.
```

## Loops (Kling 3.0, I2V, start_image = end_image = the mascot)
**Aspect ratio**: 1:1 · **Duration**: 5s · **Mode**: std · **Camera**: Static (locked-off)

### splash.mp4
```
Starting from the provided image as the first frame. The mascot bounces gently
once, squashes softly on landing, then raises one small arm and waves twice,
returning to the exact starting pose. Camera: Static, locked-off, no movement.
Style: flat 2D hand-drawn animation, solid #fbfaf9 background throughout, smooth
fluid motion, one action per shot, consistent character appearance.
```

### onboarding-1.mp4 (patient: "here you see what comes next")
```
Starting from the provided image as the first frame. A small flat clipboard icon
with a charcoal outline slides in beside the mascot; the mascot leans toward it and
nods slowly, then the clipboard slides back out and the mascot settles to the
starting pose. Camera: Static, locked-off. Style: flat 2D hand-drawn animation,
solid #fbfaf9 background throughout, smooth fluid motion, consistent character appearance.
```

### onboarding-2.mp4 (family: "we keep you informed")
```
Starting from the provided image as the first frame. A small honey-yellow #ffbb26
flat heart floats up from behind the mascot and gently pulses twice, then fades
back behind it as the mascot blinks slowly and returns to the starting pose.
Camera: Static, locked-off. Style: flat 2D hand-drawn animation, solid #fbfaf9
background throughout, smooth fluid motion, consistent character appearance.
```

### empty.mp4 (nurse: all pending tasks confirmed)
```
Starting from the provided image as the first frame. The mascot floats up and down
slowly as if resting on water, eyes closing into two calm curved lines, then opening
again at the starting pose. Camera: Static, locked-off. Style: flat 2D hand-drawn
animation, solid #fbfaf9 background throughout, smooth fluid motion, consistent
character appearance.
```

## After downloading
```bash
for f in splash onboarding-1 onboarding-2 empty; do
  ffmpeg -y -i raw/$f.mp4 -an -vf "scale=720:-2,fps=24" -c:v libx264 -crf 28 -preset slow -movflags +faststart -pix_fmt yuv420p $f.mp4
  ffmpeg -y -i raw/$f.mp4 -an -vf "scale=720:-2,fps=24" -c:v libvpx-vp9 -crf 36 -b:v 0 $f.webm
  ffmpeg -y -i raw/$f.mp4 -frames:v 1 -q:v 3 $f.jpg
done
du -h *.mp4 *.webm   # target < 1 MB each
```
If the background comes out slightly off-cream, `mix-blend-mode: multiply` in the CSS
hides it anyway.
