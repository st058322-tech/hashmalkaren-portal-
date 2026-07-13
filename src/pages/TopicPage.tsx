import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTopicVideos, markComplete, type Video } from '../lib/api';
import { getSession } from '../lib/session';
import VideoEmbed from '../components/VideoEmbed';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, CheckCircle2, Star, Lock, FileText, Loader2, ClipboardCheck, XCircle, ChevronLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getAttemptsByEmployee, type QuizAttempt, type QuizAnswer } from '../lib/quizResults';

function LockedCard({ video }: { video: Video }) {
  return (
    <Card className="p-3 sm:p-4 opacity-40 border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground">{video.name}</h3>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">יש לסיים את הסרטון הקודם</p>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {video.required === 'חובה' && (
            <Badge variant="outline" className="border-muted text-muted-foreground text-[11px] h-5"><Star className="w-3 h-3 ml-1" />חובה</Badge>
          )}
          <Badge variant="secondary" className="text-muted-foreground text-[11px] h-5"><Lock className="w-3 h-3 ml-1" />נעול</Badge>
        </div>
      </div>
    </Card>
  );
}

function ActiveVideoCard({ video, topicId, onCompleted }: { video: Video; topicId: string; onCompleted: () => void }) {
  const emp = getSession();
  const done = video.status === 'הושלם';
  const [expanded, setExpanded] = useState(false);
  const [watchFinished, setWatchFinished] = useState(done);
  const [completing, setCompleting] = useState(false);
  const [markedDone, setMarkedDone] = useState(done);

  const handleWatchComplete = useCallback(() => { setWatchFinished(true); }, []);

  const handleMarkComplete = async () => {
    if (!emp) return;
    setCompleting(true);
    try {
      await markComplete({ employeeId: emp.id, videoId: video.id, topicId, progressId: video.progressId || undefined });
      setMarkedDone(true);
      toast.success('צפייה סומנה בהצלחה!');
      onCompleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('שגיאה בסימון: ' + msg);
    }
    finally { setCompleting(false); }
  };

  return (
    <Card className={`overflow-hidden transition-all ${markedDone ? 'border-emerald-600/20 bg-emerald-950/5' : expanded ? 'border-primary/30' : ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 sm:p-4 flex items-start justify-between gap-3 text-right hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${markedDone ? 'bg-emerald-600/15 text-emerald-400' : 'bg-primary/15 text-primary'}`}>
            {markedDone ? <CheckCircle2 className="w-4 h-4" /> : video.order}
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-sm text-foreground">{video.name}</h3>
            {video.description && !expanded && (
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{video.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {video.required === 'חובה' && (
            <Badge variant="outline" className="border-primary/30 text-primary text-[11px] h-5"><Star className="w-3 h-3 ml-1" />חובה</Badge>
          )}
          {markedDone ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] h-5">נצפה ✓</Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground text-[11px] h-5">טרם נצפה</Badge>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 sm:px-4 pb-4 space-y-3 border-t border-border pt-3">
          {video.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{video.description}</p>
          )}
          {video.videoUrl && (
            <VideoEmbed url={video.videoUrl} onWatchComplete={!markedDone ? handleWatchComplete : undefined} />
          )}
          {video.pdfUrl && (
            <a href={video.pdfUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">פתיחת קובץ PDF</span>
            </a>
          )}
          {!markedDone && (
            <Button
              onClick={handleMarkComplete}
              disabled={completing || !watchFinished}
              className={`w-full h-11 font-bold rounded-xl text-sm ${watchFinished ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
            >
              {completing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : !watchFinished ? (
                <><Lock className="w-4 h-4 ml-2" />יש לצפות בסרטון עד הסוף</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 ml-2" />צפיתי בסרטון</>
              )}
            </Button>
          )}
          {markedDone && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>סרטון זה הושלם</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function QuizAnswerRow({ a, i }: { a: QuizAnswer; i: number }) {
  return (
    <div className={`p-2.5 rounded-lg border text-xs ${a.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
      <div className="flex items-start gap-2 mb-1">
        {a.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />}
        <p className="font-medium">{i + 1}. {a.question}</p>
      </div>
      <div className="mr-5 space-y-0.5">
        {!a.isCorrect && <p className="text-destructive">תשובתך: {a.answers[a.selectedAnswer - 1]}</p>}
        <p className="text-emerald-500">תשובה נכונה: {a.answers[a.correctAnswer - 1]}</p>
      </div>
    </div>
  );
}

function TopicQuizResults({ empId, topicId }: { empId: string; topicId: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const attempts = getAttemptsByEmployee(empId, topicId);
  if (attempts.length === 0) return null;

  const best = Math.max(...attempts.map(a => a.score));
  const passed = attempts.some(a => a.passed);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardCheck className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold">תוצאות המבחן שלי</h2>
        <Badge variant="outline" className={`text-[10px] mr-auto ${passed ? 'border-emerald-500/30 text-emerald-500' : 'border-destructive/30 text-destructive'}`}>
          {passed ? 'עברת ✓' : 'טרם עברת'}
        </Badge>
      </div>
      <Card className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>{attempts.length} ניסיונות</span>
          <span>•</span>
          <span>ציון מקסימלי: <strong className="text-primary">{best}</strong></span>
        </div>
        {[...attempts].reverse().map((attempt, idx) => (
          <div key={attempt.id}>
            <button
              onClick={() => setOpen(open === attempt.id ? null : attempt.id)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors text-right"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${attempt.passed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                  {attempt.score}
                </div>
                <div>
                  <p className="text-xs font-medium">ניסיון {attempts.length - idx}</p>
                  <p className="text-[10px] text-muted-foreground">{attempt.date} • {attempt.correct}/{attempt.total} נכונות</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] h-5 ${attempt.passed ? 'border-emerald-500/30 text-emerald-500' : 'border-destructive/30 text-destructive'}`}>
                  {attempt.passed ? 'עבר' : 'לא עבר'}
                </Badge>
                <ChevronLeft className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open === attempt.id ? 'rotate-90' : ''}`} />
              </div>
            </button>
            {open === attempt.id && attempt.answers.length > 0 && (
              <div className="mt-1.5 space-y-1.5 pr-2">
                {attempt.answers.map((a, i) => <QuizAnswerRow key={i} a={a} i={i} />)}
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const emp = getSession();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = useCallback(() => {
    if (!emp || !id) return;
    getTopicVideos({ topicId: id, employeeId: emp.id }).then(r => { setVideos(r.videos); setLoading(false); });
  }, [emp, id]);

  useEffect(() => {
    if (!emp) { navigate('/'); return; }
    loadVideos();
    const onVisible = () => { if (!document.hidden) loadVideos(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  if (!emp) return null;

  const completed = videos.filter(v => v.status === 'הושלם').length;
  const pct = videos.length > 0 ? Math.round((completed / videos.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-3 pb-10 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')} className="mb-2 text-xs text-muted-foreground hover:text-foreground h-8 px-2 -mr-2">
          <ArrowRight className="w-3.5 h-3.5 ml-1" />חזרה לנושאים
        </Button>

        {!loading && videos.length > 0 && (
          <Card className="p-4 mb-4 border-primary/20 bg-gradient-to-bl from-primary/[0.06] to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-base font-bold">סרטוני הדרכה</h1>
              <span className="text-lg font-extrabold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2.5 mb-2 [&>div]:bg-primary" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completed} מתוך {videos.length} הושלמו</span>
              {pct === 100 && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] h-5">הושלם ✓</Badge>
              )}
            </div>
          </Card>
        )}

        {!loading && pct === 100 && (
          <Card className="p-4 mb-4 border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-emerald-600 font-semibold">סיימת את כל הסרטונים!</p>
                  <p className="text-sm font-bold">עכשיו תוכלי לגשת לשאלון</p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(`/quiz/${id}`)} className="bg-primary text-primary-foreground h-9 px-4 shrink-0 font-bold text-xs">
                לשאלון
              </Button>
            </div>
          </Card>
        )}
        {!loading && pct < 100 && videos.length > 0 && (
          <Card className="p-4 mb-4 border-border bg-secondary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">השאלון נעול</p>
                <p className="text-sm text-muted-foreground">יש לצפות בכל הסרטונים כדי לגשת לשאלון</p>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : videos.length === 0 ? (
          <Card className="p-10 text-center"><p className="text-muted-foreground text-sm">אין סרטונים בנושא זה</p></Card>
        ) : (
          <div className="space-y-2.5">
            {videos.map(v =>
              v.locked ? (
                <LockedCard key={v.id} video={v} />
              ) : (
                <ActiveVideoCard key={v.id} video={v} topicId={id!} onCompleted={loadVideos} />
              )
            )}
          </div>
        )}

        {!loading && emp && id && <TopicQuizResults empId={emp.id} topicId={id} />}
      </div>
    </div>
  );
}
