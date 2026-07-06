import { useRef, useEffect, useCallback, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

function getEmbedInfo(url: string): { embedUrl: string; type: 'youtube' | 'vimeo' | 'drive' | 'raw' } | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`, type: 'youtube' };
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?api=1`, type: 'vimeo' };
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (driveMatch) return { embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`, type: 'drive' };
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return { embedUrl: url, type: 'raw' };
  return { embedUrl: url, type: 'raw' };
}

type Props = {
  url: string;
  onWatchComplete?: () => void;
  compact?: boolean;
};

export default function VideoEmbed({ url, onWatchComplete, compact }: Props) {
  const result = getEmbedInfo(url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchedRef = useRef(false);
  // For non-native video: track elapsed time to enable manual confirm
  const [elapsed, setElapsed] = useState(0);
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fireComplete = useCallback(() => {
    if (watchedRef.current) return;
    watchedRef.current = true;
    onWatchComplete?.();
  }, [onWatchComplete]);

  // Native video (mp4 etc.) — fire on ended
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const handleTimeUpdate = () => {
      if (vid.duration > 0 && vid.currentTime >= vid.duration - 1) fireComplete();
    };
    const handleEnded = () => fireComplete();
    vid.addEventListener('timeupdate', handleTimeUpdate);
    vid.addEventListener('ended', handleEnded);
    return () => {
      vid.removeEventListener('timeupdate', handleTimeUpdate);
      vid.removeEventListener('ended', handleEnded);
    };
  }, [fireComplete]);

  // YouTube — detect end via postMessage
  useEffect(() => {
    if (!result || result.type !== 'youtube') return;
    if (!onWatchComplete) return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(typeof event.data === 'string' ? event.data : JSON.stringify(event.data));
        // YT player state 0 = ended
        if (data.event === 'onStateChange' && data.info === 0) fireComplete();
      } catch { /* ignore parse errors */ }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [result, onWatchComplete, fireComplete]);

  // Google Drive / Vimeo — track time elapsed, allow manual confirm after enough time
  useEffect(() => {
    if (!result || result.type === 'youtube' || result.type === 'raw') return;
    if (!onWatchComplete) return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [result, onWatchComplete]);

  if (!result) return null;

  const aspectClass = compact ? 'aspect-video max-h-[320px]' : 'aspect-video';

  if (result.type === 'raw' && result.embedUrl.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
    return (
      <div className="w-full rounded-xl overflow-hidden bg-black">
        <video ref={videoRef} controls className={`w-full ${aspectClass}`} preload="metadata">
          <source src={result.embedUrl} />
          הדפדפן שלך לא תומך בהצגת וידאו
        </video>
      </div>
    );
  }

  const showManualConfirm = onWatchComplete && !watchedRef.current && !manualConfirmed &&
    (result.type === 'drive' || result.type === 'vimeo') && elapsed >= 5;

  return (
    <div className="space-y-3">
      <div className="w-full rounded-xl overflow-hidden bg-black">
        <iframe
          src={result.embedUrl}
          className={`w-full ${aspectClass}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="סרטון שיעור"
        />
      </div>
      {showManualConfirm && (
        <button
          onClick={() => { setManualConfirmed(true); fireComplete(); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          סיימתי לצפות בסרטון
        </button>
      )}
    </div>
  );
}
