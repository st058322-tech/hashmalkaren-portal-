import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/api';
import { getSession, setSession } from '../lib/session';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Shield } from 'lucide-react';

const LOGO = 'https://images.fillout.com/orgid-477260/flowpublicid-default/widgetid-default/b7JNjFMkDZgeVBeECi9hEN/pasted-image-1780949591831-fwfdf279.jpg';

export default function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (getSession()) navigate('/home'); }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login({ name: name.trim(), password: password.trim() });
      if (result.success && result.employee) {
        setSession(result.employee);
        navigate('/home');
      } else {
        setError(result.error || 'שם או סיסמה שגויים');
      }
    } catch {
      setError('שגיאה בהתחברות, נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f97316' }}>
      {/* Solid orange top section */}
      <div className="flex flex-col items-center justify-center pt-12 pb-8 px-4">
        {/* Logo */}
        <div className="w-28 h-28 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-5 overflow-hidden">
          <img src={LOGO} alt="חשמל הקרן" className="w-24 h-24 object-contain" />
        </div>
        <h1 className="text-white text-2xl font-black tracking-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
          מרכז ההדרכה
        </h1>
        <p className="text-white text-base font-semibold mt-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
          ברוכים הבאים לפלטפורמת ההכשרה
        </p>
      </div>

      {/* White card */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-1">כניסה למערכת</h2>
        <p className="text-base text-gray-500 text-center mb-7">הזינו את הפרטים כדי להתחבר</p>

        {/* Admin shortcut */}
        <div className="max-w-sm mx-auto mb-5">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Shield className="w-4 h-4" />
            כניסה לאזור הניהול
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm mx-auto">
          <div>
            <Label htmlFor="name" className="text-gray-700 font-semibold text-base">שם מלא</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="הזינו שם מלא"
              className="mt-2 bg-gray-50 border-gray-200 h-13 rounded-xl text-base"
              style={{ height: '3.25rem' }}
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="pass" className="text-gray-700 font-semibold text-base">סיסמה</Label>
            <Input
              id="pass"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="הזינו סיסמה"
              className="mt-2 bg-gray-50 border-gray-200 rounded-xl text-base"
              style={{ height: '3.25rem' }}
            />
          </div>

          {error && (
            <div className="text-base text-red-600 bg-red-50 rounded-xl p-4 text-center border border-red-200 font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !name || !password}
            className="w-full font-bold text-lg rounded-xl text-white mt-2"
            style={{ height: '3.5rem', backgroundColor: '#f97316', boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : null}
            כניסה
          </Button>
        </form>
      </div>
    </div>
  );
}
