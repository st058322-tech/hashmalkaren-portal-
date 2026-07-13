import { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../lib/session';
import { Home, ClipboardCheck, User, LogOut, Shield, ChevronLeft } from 'lucide-react';

export type AppTab = 'home' | 'quizzes' | 'profile';

const TabCtx = createContext<{ tab: AppTab; setTab: (t: AppTab) => void }>({
  tab: 'home',
  setTab: () => {},
});

export function useAppTab() { return useContext(TabCtx); }

const LOGO = 'https://images.fillout.com/orgid-477260/flowpublicid-default/widgetid-default/b7JNjFMkDZgeVBeECi9hEN/pasted-image-1780949591831-fwfdf279.jpg';

const NAV: { label: string; icon: React.ElementType; tab: AppTab }[] = [
  { label: 'ראשי', icon: Home, tab: 'home' },
  { label: 'המבחנים שלי', icon: ClipboardCheck, tab: 'quizzes' },
  { label: 'פרופיל', icon: User, tab: 'profile' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const emp = getSession();
  const [tab, setTab] = useState<AppTab>('home');

  const handleLogout = () => { clearSession(); navigate('/'); };

  return (
    <TabCtx.Provider value={{ tab, setTab }}>
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">

        {/* ── Top Header ── */}
        <header
          className="sticky top-0 z-50 h-14 flex items-center px-4 gap-3"
          style={{
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Logo + title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => { setTab('home'); navigate('/home'); }}
          >
            <img src={LOGO} alt="חשמל הקרן" className="h-8 w-auto object-contain rounded" />
            <span className="text-white font-bold text-sm hidden sm:block">מרכז ההדרכה</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Admin + user avatar */}
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ניהול</span>
          </button>

          <div
            className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold text-sm cursor-pointer shrink-0"
            onClick={() => setTab('profile')}
            title={emp?.name}
          >
            {emp?.name?.charAt(0) ?? 'א'}
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10 transition-colors"
            title="יציאה"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Desktop Sidebar ── */}
          <aside
            className="hidden md:flex flex-col w-52 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto"
            style={{
              background: 'rgba(20,20,20,0.60)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* User info */}
            {emp && (
              <div className="px-4 py-4 border-b border-white/8">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary/70 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{emp.name}</p>
                    {emp.role && <p className="text-white/50 text-xs truncate">{emp.role}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {NAV.map((item) => {
                const active = item.tab === tab;
                return (
                  <button
                    key={item.label}
                    onClick={() => setTab(item.tab)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right
                      ${active
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-white/60 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronLeft className="w-3.5 h-3.5 opacity-60" />}
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="px-3 py-3 border-t border-white/8">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all text-right"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>יציאה מהמערכת</span>
              </button>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 overflow-y-auto min-h-0 pb-20 md:pb-0">
            {children}
          </main>
        </div>

        {/* ── Mobile bottom tab bar ── */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch h-16"
          style={{
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {NAV.map((item) => {
            const active = item.tab === tab;
            return (
              <button
                key={item.label}
                onClick={() => setTab(item.tab)}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-white/40'}`} />
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-primary' : 'text-white/40'}`}>
                  {item.label}
                </span>
                {active && <div className="absolute bottom-0 w-10 h-0.5 bg-primary rounded-t-full" />}
              </button>
            );
          })}
        </nav>
      </div>
    </TabCtx.Provider>
  );
}
