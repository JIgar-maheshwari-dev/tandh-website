Drop a file in here with one of these exact names, and it's used on
the homepage automatically — no code change needed.

## Video (takes priority over an image if both exist)
```
hero-video.mp4
```
or
```
hero-video.webm
```
Recommended: landscape orientation, short loop (5-15 seconds is
plenty — it's a background, not a feature video), and keep the file
size reasonable (a few MB, not tens of MB) since it has to load before
anyone sees the homepage. It plays muted and looping automatically —
browsers (especially on mobile) block autoplay entirely unless a video
is muted, so there's no audio control built in for this background.

## Image (used only if no video is present)
```
hero-image.jpg
hero-image.jpeg
hero-image.png
hero-image.webp
```
Recommended: at least 1600px wide, landscape orientation (this banner
is wide and not very tall). A photo of your father weaving works well
here — it's exactly the kind of "texture of the craft" image the brief
called for.

## Neither file present
The homepage falls back to a generated woven-pattern background, so
nothing breaks while you're still sourcing photos/video.

## To remove a custom hero and go back to the generated pattern
Just delete the file from this folder and redeploy/refresh.
