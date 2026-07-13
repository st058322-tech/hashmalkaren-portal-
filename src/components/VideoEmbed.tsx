import { useRef, useEffect, useCallback } from 'react';
import { Maximize2 } from 'lucide-react';

function getEmbedInfo(url: string): { embedUrl: string; type: 'youtube' | 'vimeo' | 'drive' | 'raw' } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`, type: 'youtube' };
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vi) return { embedUrl: `https://player.vimeo.com/video/${vi[1]}?api=1`, type: 'vimeo' };
  const dr = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (dr) return { embedUrl: `https://drive.google.com/file/d/${dr[1]}/preview?rm=minimal`, type: 'drive' };
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return { embedUrl: url, type: 'raw' };
  return { embedUrl: url, type: 'raw' };
}

// For Google Drive we cannot read actual duration (cross-origin).
// We require 90 visible-tab seconds as a floor; real duration enforcement is impossible without platform API.
const DRIVE_MIN_SECONDS = 90;

// Compute what fraction of the video has actually been played (not just seeked).
function playedFraction(vid: HTMLVideoElement): number {
  if (!vid.duration || vid.duration === Infinity) return 0;
  let played = 0;
  for (let i = 0; i < vid.played.length; i++) {
    played += vid.played.end(i) - vid.played.start(i);
  }
  return played / vid.duration;
}

type Props = { url: string; onWatchComplete?: () => void };

export default function VideoEmbed({ url, onWatchComplete }: Props) {
  const result    = getEmbedInfo(url);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const firedRef  = useRef(false);
  const secondsRef = useRef(0);
  const timerRef  = useRef<ReturnType<typeof setInterval>>();

  const fireComplete = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onWatchComplete?.();
  }, [onWatchComplete]);

  // ── Raw MP4: uses browser's played TimeRanges — prevents skip-to-end ────────
  // Requires ≥85% of the video actually played (not just seeked over).
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const check = () => { if (playedFraction(vid) >= 0.85) fireComplete(); };
    vid.addEventListener('timeupdate', check);
    vid.addEventListener('ended', check);
    return () => { vid.removeEventListener('timeupdate', check); vid.removeEventListener('ended', check); };
  }, [fireComplete]);

  // ── YouTube: postMessage API, state 0 = video ended ──────────────────────────
  useEffect(() => {
    if (!result || result.type !== 'youtube' || !onWatchComplete) return;
    const handler = (ev: MessageEvent) => {
      if (ev.origin !== 'https://www.youtube.com') return;
      try {
        const d = JSON.parse(typeof ev.data === 'string' ? ev.data : JSON.stringify(ev.data));
        if (d.event === 'onStateChange' && d.info === 0) fireComplete();
      } catch { /* ignore */ }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [result, onWatchComplete, fireComplete]);

  // ── Google Drive / Vimeo: invisible page-visibility-aware timer ───────────────
  // Fires silently after DRIVE_MIN_SECONDS of actual visible-tab time.
  // No UI shown — the "mark complete" button just becomes active automatically.
  useEffect(() => {
    if (!result || result.type === 'youtube' || result.type === 'raw') return;
    if (!onWatchComplete) return;
    secondsRef.current = 0;
    timerRef.current = setInterval(() => {
      if (document.hidden) return;
      secondsRef.current += 1;
      if (secondsRef.current >= DRIVE_MIN_SECONDS) {
        clearInterval(timerRef.current);
        fireComplete();
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [result, onWatchComplete, fireComplete]);

  const openFullscreen = () => {
    const el = iframeRef.current ?? videoRef.current;
    el?.requestFullscreen?.();
  };

  if (!result) return null;

  // ── Raw MP4 ───────────────────────────────────────────────────────────────────
  if (result.type === 'raw') {
    return (
      <div className="w-full rounded-xl overflow-hidden bg-black" onContextMenu={e => e.preventDefault()}>
        <video
          ref={videoRef}
          controls
          controlsList="nodownload"
          disablePictureInPicture
          className="w-full aspect-video"
          preload="metadata"
          onContextMenu={e => e.preventDefault()}
        >
          <source src={result.embedUrl} />
          הדפדפן שלך לא תומך בהצגת וידאו
        </video>
      </div>
    );
  }

  // ── Iframe (Drive / YouTube / Vimeo) ─────────────────────────────────────────
  return (
    <div
      className="w-full rounded-xl overflow-hidden bg-black relative group"
      onContextMenu={e => e.preventDefault()}
    >
      <iframe
        ref={iframeRef}
        src={result.embedUrl}
        className="w-full aspect-video"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
        title="סרטון שיעור"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
      />
      <button
        onClick={openFullscreen}
        className="absolute bottom-3 left-3 z-10 p-2 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        title="מסך מלא"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}
