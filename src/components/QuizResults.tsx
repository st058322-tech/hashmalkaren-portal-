import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw, Home, CheckCircle2, XCircle, Target, ChevronDown, ChevronUp } from 'lucide-react';
import type { QuizAnswer } from '../lib/quizResults';

function AnswerReview({ item, idx }: { item: QuizAnswer; idx: number }) {
  return (
    <div className={`p-3 rounded-xl border ${item.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${item.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'}`}>
          {item.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
        </div>
        <p className="text-sm font-medium leading-relaxed">{idx + 1}. {item.question}</p>
      </div>
      <div className="mr-8 space-y-1">
        {item.answers.filter(Boolean).map((ans, i) => {
          const num = i + 1;
          const isSelected = item.selectedAnswer === num;
          const isCorrectAns = item.correctAnswer === num;
          let cls = 'text-muted-foreground';
          if (isCorrectAns) cls = 'text-emerald-400 font-semibold';
          else if (isSelected && !item.isCorrect) cls = 'text-destructive line-through';
          return (
            <div key={num} className={`text-xs flex items-center gap-1.5 ${cls}`}>
              {isCorrectAns && <CheckCircle2 className="w-3 h-3 shrink-0" />}
              {isSelected && !isCorrectAns && <XCircle className="w-3 h-3 shrink-0" />}
              {!isCorrectAns && !isSelected && <span className="w-3 h-3 shrink-0" />}
              {ans}
            </div>
          );
        })}
        {!item.isCorrect && item.explanation && (
          <p className="text-[11px] text-muted-foreground mt-1.5 bg-secondary/50 p-2 rounded-lg">💡 {item.explanation}</p>
        )}
      </div>
    </div>
  );
}

export default function QuizResults({
  topicName, score, correct, total, passed, onGoHome, onRetry, answers,
}: {
  topicName: string;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  onGoHome: () => void;
  onRetry: () => void;
  answers?: QuizAnswer[];
}) {
  const incorrect = total - correct;
  const [showReview, setShowReview] = useState(true);

  return (
    <div className="space-y-4">
      <Card className={`p-5 text-center border-2 ${passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center ${passed ? 'bg-emerald-500/15' : 'bg-destructive/15'}`}>
          <Trophy className={`w-7 h-7 ${passed ? 'text-emerald-400' : 'text-destructive'}`} />
        </div>
        <h2 className="text-base font-bold mb-1">{topicName}</h2>
        <p className="text-3xl font-extrabold text-primary mb-1">{score}</p>
        <p className="text-xs text-muted-foreground mb-3">ציון סופי</p>
        <Progress value={score} className={`h-2.5 mb-3 ${passed ? '[&>div]:bg-emerald-500' : '[&>div]:bg-destructive'}`} />
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-destructive/15 text-destructive'}`}>
          {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {passed ? 'סטטוס: עבר ✓' : 'סטטוס: דורש שיפור'}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2.5">
        <Card className="p-2.5 text-center">
          <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-bold">{total}</p>
          <p className="text-[10px] text-muted-foreground">שאלות</p>
        </Card>
        <Card className="p-2.5 text-center">
          <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
          <p className="text-lg font-bold text-emerald-400">{correct}</p>
          <p className="text-[10px] text-muted-foreground">נכונות</p>
        </Card>
        <Card className="p-2.5 text-center">
          <XCircle className="w-4 h-4 mx-auto mb-1 text-destructive" />
          <p className="text-lg font-bold text-destructive">{incorrect}</p>
          <p className="text-[10px] text-muted-foreground">שגויות</p>
        </Card>
      </div>

      {answers && answers.length > 0 && (
        <div>
          <button onClick={() => setShowReview(!showReview)} className="flex items-center gap-2 text-sm font-bold mb-2 w-full">
            סקירת שאלות ותשובות
            {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showReview && (
            <div className="space-y-2">
              {answers.map((a, i) => <AnswerReview key={i} item={a} idx={i} />)}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        <Button onClick={onRetry} variant="outline" className="w-full h-11 font-bold text-sm">
          <RotateCcw className="w-4 h-4 ml-2" />נסה שוב
        </Button>
        <Button onClick={onGoHome} className="w-full h-11 font-bold text-sm bg-primary text-primary-foreground">
          <Home className="w-4 h-4 ml-2" />חזרה לדף הראשי
        </Button>
      </div>
    </div>
  );
}
