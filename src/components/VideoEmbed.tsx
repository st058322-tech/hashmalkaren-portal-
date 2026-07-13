import { useRef, useEffect, useCallback, useState } from 'react';

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
  compact?: boolean;
};

// Minimum seconds the video must be open (tab visible) before completion fires.
// For Google Drive we cannot detect actual video end, so we use 90s as a floor.
const DRIVE_MIN_SECONDS = 90;

export default function VideoEmbed({ url, onWatchComplete, compact }: Props) {
  const result = getEmbedInfo(url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchedRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fireComplete = useCallback(() => {
    if (watchedRef.current) return;
    watchedRef.current = true;
    onWatchComplete?.();
  }, [onWatchComplete]);

  // ── Native video (mp4 etc.) — fire on ended ──────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const handleTimeUpdate = () => {
      if (vid.duration > 0 && vid.currentTime >= vid.duration - 1) fireComplete();
    };
    vid.addEventListener('timeupdate', handleTimeUpdate);
    vid.addEventListener('ended', fireComplete);
    return () => {
      vid.removeEventListener('timeupdate', handleTimeUpdate);
      vid.removeEventListener('ended', fireComplete);
    };
  }, [fireComplete]);

  // ── YouTube — detect end via postMessage ─────────────────
  useEffect(() => {
    if (!result || result.type !== 'youtube' || !onWatchComplete) return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(typeof event.data === 'string' ? event.data : JSON.stringify(event.data));
        if (data.event === 'onStateChange' && data.info === 0) fireComplete();
      } catch { /* ignore */ }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [result, onWatchComplete, fireComplete]);

  // ── Google Drive / Vimeo — page-visibility-aware timer ───
  useEffect(() => {
    if (!result || result.type === 'youtube' || result.type === 'raw') return;
    if (!onWatchComplete) return;

    const tick = () => {
      if (document.hidden) return; // only count time when tab is visible
      setElapsed(e => {
        const next = e + 1;
        if (next >= DRIVE_MIN_SECONDS) fireComplete();
        return next;
      });
    };

    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [result, onWatchComplete, fireComplete]);

  if (!result) return null;

  const aspectClass = compact ? 'aspect-video max-h-[320px]' : 'aspect-video';

  // ── Raw MP4 ───────────────────────────────────────────────
  if (result.type === 'raw') {
    return (
      <div className="w-full rounded-xl overflow-hidden bg-black" onContextMenu={e => e.preventDefault()}>
        <video
          ref={videoRef}
          controls
          controlsList="nodownload nofullscreen"
          disablePictureInPicture
          className={`w-full ${aspectClass}`}
          preload="metadata"
          onContextMenu={e => e.preventDefault()}
        >
          <source src={result.embedUrl} />
          הדפדפן שלך לא תומך בהצגת וידאו
        </video>
      </div>
    );
  }

  // ── Embedded iframe (Drive / YouTube / Vimeo) ─────────────
  const remaining = Math.max(0, DRIVE_MIN_SECONDS - elapsed);
  const showProgress = onWatchComplete && !watchedRef.current && (result.type === 'drive' || result.type === 'vimeo');

  return (
    <div className="space-y-2">
      <div className="w-full rounded-xl overflow-hidden bg-black relative" onContextMenu={e => e.preventDefault()}>
        <iframe
          src={result.embedUrl}
          className={`w-full ${aspectClass}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen={false}
          referrerPolicy="no-referrer"
          title="סרטון שיעור"
          // sandbox prevents opening new tabs/windows from within the iframe
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
        />
      </div>

      {showProgress && (
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (elapsed / DRIVE_MIN_SECONDS) * 100)}%` }}
            />
          </div>
          {remaining > 0 ? (
            <span className="text-[11px] text-muted-foreground shrink-0 w-16 text-left">
              {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')} נותר
            </span>
          ) : (
            <span className="text-[11px] text-emerald-500 shrink-0 font-medium">✓ הושלם</span>
          )}
        </div>
      )}
    </div>
  );
}
