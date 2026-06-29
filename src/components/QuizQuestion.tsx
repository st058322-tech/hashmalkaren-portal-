import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowLeft, ClipboardCheck } from 'lucide-react';

type Question = {
  id: string;
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  correctAnswer: number;
  explanation: string;
};

export default function QuizQuestion({
  questionNumber, question, onAnswer, onNext, isLast,
}: {
  questionNumber: number;
  question: Question;
  onAnswer: (correct: boolean, selected: number) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const answers = [question.answer1, question.answer2, question.answer3, question.answer4].filter(Boolean);
  const isCorrect = selected === question.correctAnswer;

  const handleCheck = () => {
    if (selected === null) return;
    setChecked(true);
    onAnswer(selected === question.correctAnswer, selected);
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
          {questionNumber}
        </div>
        <h2 className="text-base sm:text-lg font-bold leading-relaxed pt-0.5">{question.question}</h2>
      </div>

      <div className="space-y-2.5 mb-5">
        {answers.map((ans, i) => {
          const num = i + 1;
          const isThis = selected === num;
          const isCorrectAns = question.correctAnswer === num;

          let cls = 'border-border hover:border-primary/40 hover:bg-primary/5';
          if (checked) {
            if (isCorrectAns) cls = 'border-emerald-500/50 bg-emerald-500/10';
            else if (isThis && !isCorrectAns) cls = 'border-destructive/50 bg-destructive/10';
            else cls = 'border-border opacity-50';
          } else if (isThis) {
            cls = 'border-primary bg-primary/10';
          }

          return (
            <button
              key={num}
              disabled={checked}
              onClick={() => setSelected(num)}
              className={`w-full text-right p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${cls}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                checked && isCorrectAns ? 'bg-emerald-500 text-white'
                : checked && isThis && !isCorrectAns ? 'bg-destructive text-white'
                : isThis ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
              }`}>
                {checked && isCorrectAns ? <CheckCircle2 className="w-4 h-4" />
                  : checked && isThis && !isCorrectAns ? <XCircle className="w-4 h-4" />
                  : num}
              </div>
              <span className={`text-sm sm:text-base font-medium ${checked && !isCorrectAns && !isThis ? 'text-muted-foreground' : 'text-foreground'}`}>
                {ans}
              </span>
            </button>
          );
        })}
      </div>

      {checked && (
        <div className={`p-3.5 rounded-xl mb-4 ${isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
          <div className="flex items-center gap-2 mb-1">
            {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-destructive" />}
            <span className={`font-bold text-sm ${isCorrect ? 'text-emerald-400' : 'text-destructive'}`}>
              {isCorrect ? 'נכון מאוד! 🎉' : 'תשובה שגויה'}
            </span>
          </div>
          {!isCorrect && (
            <p className="text-xs text-muted-foreground mr-7">
              התשובה הנכונה: {answers[question.correctAnswer - 1]}
            </p>
          )}
          {!isCorrect && question.explanation && (
            <p className="text-xs text-muted-foreground mr-7 mt-1">💡 {question.explanation}</p>
          )}
        </div>
      )}

      {!checked ? (
        <Button onClick={handleCheck} disabled={selected === null} className="w-full h-12 font-bold text-sm bg-primary text-primary-foreground">
          <ClipboardCheck className="w-4 h-4 ml-2" />בדוק תשובה
        </Button>
      ) : (
        <Button onClick={onNext} className="w-full h-12 font-bold text-sm bg-primary text-primary-foreground">
          {isLast ? 'סיום מבחן' : 'המשך לשאלה הבאה'}
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      )}
    </Card>
  );
}
