import { useRef, useEffect, useCallback, useState } from 'react';
import { Maximize2 } from 'lucide-react';

function getEmbedInfo(url: string): { embedUrl: string; type: 'youtube' | 'vimeo' | 'drive' | 'raw' } | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`, type: 'youtube' };
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?api=1`, type: 'vimeo' };
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (driveMatch) return { embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview?rm=minimal`, type: 'drive' };
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return { embedUrl: url, type: 'raw' };
  return { embedUrl: url, type: 'raw' };
}

type Props = {
  url: string;
  onWatchComplete?: () => void;
};

// Minimum watched seconds for Google Drive (can't get actual duration cross-origin).
// We use 90s as a conservative floor; actual enforcement for mp4 uses real duration.
const DRIVE_MIN_SECONDS = 90;

export default function VideoEmbed({ url, onWatchComplete }: Props) {
  const result = getEmbedInfo(url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const watchedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fireComplete = useCallback(() => {
    if (watchedRef.current) return;
    watchedRef.current = true;
    onWatchComplete?.();
  }, [onWatchComplete]);

  // ── Raw MP4: use actual duration, fire only when truly at the end ─────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const check = () => {
      if (vid.duration > 0 && vid.currentTime >= vid.duration - 1.5) fireComplete();
    };
    vid.addEventListener('timeupdate', check);
    vid.addEventListener('ended', fireComplete);
    return () => { vid.removeEventListener('timeupdate', check); vid.removeEventListener('ended', fireComplete); };
  }, [fireComplete]);

  // ── YouTube: postMessage API, state 0 = ended ─────────────────────────────
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

  // ── Google Drive / Vimeo: invisible page-visibility-aware timer ───────────
  useEffect(() => {
    if (!result || result.type === 'youtube' || result.type === 'raw') return;
    if (!onWatchComplete) return;
    timerRef.current = setInterval(() => {
      if (document.hidden) return;
      // uses functional update so we don't need elapsed in deps
      timerRef.current && (() => {
        const now = Date.now();
        const start = (timerRef as unknown as { _start: number })._start ?? (((timerRef as unknown as { _start: number })._start = now), now);
        const secs = Math.floor((now - start) / 1000);
        if (secs >= DRIVE_MIN_SECONDS) fireComplete();
      })();
    }, 1000);
    // store start time on the ref itself
    (timerRef as unknown as { _start: number })._start = Date.now();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [result, onWatchComplete, fireComplete]);

  const handleFullscreen = () => {
    const el = iframeRef.current ?? videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
  };

  if (!result) return null;

  // ── Raw MP4 ───────────────────────────────────────────────────────────────
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

  // ── Iframe (Drive / YouTube / Vimeo) ─────────────────────────────────────
  return (
    <div className="w-full rounded-xl overflow-hidden bg-black relative group" onContextMenu={e => e.preventDefault()}>
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
      {/* Fullscreen button overlay */}
      <button
        onClick={handleFullscreen}
        className="absolute bottom-3 left-3 z-10 p-2 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        title="מסך מלא"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}
