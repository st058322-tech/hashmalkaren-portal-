import { LogOut, Shield, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { clearSession, getSession } from '../lib/session';

const LOGO = 'https://images.fillout.com/orgid-477260/flowpublicid-default/widgetid-default/b7JNjFMkDZgeVBeECi9hEN/pasted-image-1780949591831-fwfdf279.jpg';

export default function Header() {
  const navigate = useNavigate();
  const loc = useLocation();
  const emp = getSession();
  const isAdmin = loc.pathname === '/admin';
  const isHome = loc.pathname === '/home';

  const handleLogout = () => { clearSession(); navigate('/'); };

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(0,0,0,0.70)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
          <img src={LOGO} alt="חשמל הקרן" className="h-8 object-contain rounded" />
          <span className="text-sm font-bold text-white hidden sm:inline">מרכז ההדרכה</span>
        </div>
        <div className="flex items-center gap-1">
          {!isAdmin && emp && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/home')}
                className="text-xs h-8 px-3 text-white/80 hover:text-white hover:bg-white/10"
                style={isHome ? { background: 'rgba(255,255,255,0.15)', color: 'white' } : {}}
              >
                <Home className="w-3.5 h-3.5 ml-1" />ראשי
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-xs h-8 px-3 text-white/60 hover:text-white hover:bg-white/10"
              >
                <Shield className="w-3.5 h-3.5 ml-1" />ניהול
              </Button>
            </>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
              className="text-xs h-8 px-3 text-white/60 hover:text-white hover:bg-white/10"
            >
              <Home className="w-3.5 h-3.5 ml-1" />חזרה
            </Button>
          )}
          {emp && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white/60 hover:text-red-400 hover:bg-white/10 h-8 w-8"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
