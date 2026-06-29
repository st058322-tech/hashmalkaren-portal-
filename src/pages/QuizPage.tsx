import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizQuestions, type Question } from '../lib/api';
import { getSession } from '../lib/session';
import { saveQuizAttempt, QuizAnswer } from '../lib/quizResults';
import QuizQuestion from '../components/QuizQuestion';
import QuizResults from '../components/QuizResults';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, ClipboardCheck } from 'lucide-react';

export default function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const emp = getSession();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctMap, setCorrectMap] = useState<Record<number, boolean>>({});
  const [selectedMap, setSelectedMap] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<QuizAnswer[]>([]);

  useEffect(() => {
    if (!emp) { navigate('/'); return; }
    if (!topicId) return;
    getQuizQuestions({ topicId }).then(r => {
      setQuestions(r.questions);
      setTopicName(r.topicName);
    }).finally(() => setLoading(false));
  }, []);

  if (!emp) return null;

  const total = questions.length;
  const pct = total > 0 ? Math.round(((currentIdx + (finished ? 1 : 0)) / total) * 100) : 0;

  const handleAnswer = (correct: boolean, selected: number) => {
    setCorrectMap(prev => ({ ...prev, [currentIdx]: correct }));
    setSelectedMap(prev => ({ ...prev, [currentIdx]: selected }));
  };

  const handleNext = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      const allAnswers: QuizAnswer[] = questions.map((q, i) => ({
        question: q.question,
        selectedAnswer: selectedMap[i] || 0,
        correctAnswer: q.correctAnswer,
        answers: [q.answer1, q.answer2, q.answer3, q.answer4],
        explanation: q.explanation || '',
        isCorrect: !!correctMap[i],
      }));
      const correctCount = allAnswers.filter(a => a.isCorrect).length;
      const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      saveQuizAttempt({
        topicId: topicId!,
        topicName,
        score,
        correct: correctCount,
        total,
        passed: score >= 70,
        date: new Date().toISOString().split('T')[0],
        employeeId: emp.id,
        employeeName: emp.name,
        answers: allAnswers,
      });
      setSavedAnswers(allAnswers);
      setFinished(true);
    }
  };

  const correctCount = Object.values(correctMap).filter(Boolean).length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-3 pb-10 max-w-xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')} className="mb-2 text-xs text-muted-foreground h-8 px-2 -mr-2">
          <ArrowRight className="w-3.5 h-3.5 ml-1" />חזרה
        </Button>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : total === 0 ? (
          <Card className="p-10 text-center">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">אין שאלות מבחן לנושא זה</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/home')}>חזרה לדף הראשי</Button>
          </Card>
        ) : finished ? (
          <QuizResults
            topicName={topicName}
            score={score}
            correct={correctCount}
            total={total}
            passed={score >= 70}
            onGoHome={() => navigate('/home')}
            onRetry={() => {
              setCurrentIdx(0);
              setCorrectMap({});
              setSelectedMap({});
              setFinished(false);
              setSavedAnswers([]);
            }}
            answers={savedAnswers}
          />
        ) : (
          <>
            <Card className="p-4 mb-4 border-primary/20 bg-gradient-to-bl from-primary/[0.06] to-transparent">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-sm font-bold">{topicName} — מבחן</h1>
                <span className="text-xs text-muted-foreground">שאלה {currentIdx + 1} מתוך {total}</span>
              </div>
              <Progress value={pct} className="h-2 [&>div]:bg-primary" />
            </Card>
            <QuizQuestion
              key={currentIdx}
              questionNumber={currentIdx + 1}
              question={questions[currentIdx]}
              onAnswer={handleAnswer}
              onNext={handleNext}
              isLast={currentIdx === total - 1}
            />
          </>
        )}
      </div>
    </div>
  );
}
