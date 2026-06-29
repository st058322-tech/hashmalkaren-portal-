import { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../lib/session';
import {
  Home, BookOpen, ClipboardCheck, Bell, User, LogOut, Menu, X, Shield,
} from 'lucide-react';

export type AppTab = 'home' | 'quizzes' | 'profile';

const TabCtx = createContext<{ tab: AppTab; setTab: (t: AppTab) => void }>({
  tab: 'home',
  setTab: () => {},
});

export function useAppTab() { return useContext(TabCtx); }

const LOGO = 'https://images.fillout.com/orgid-477260/flowpublicid-default/widgetid-default/b7JNjFMkDZgeVBeECi9hEN/pasted-image-1780949591831-fwfdf279.jpg';

const NAV: { label: string; icon: React.ElementType; tab: AppTab | null; path?: string }[] = [
  { label: 'ראשי', icon: Home, tab: 'home' },
  { label: 'ההדרכות שלי', icon: BookOpen, tab: 'home' },
  { label: 'המבחנים שלי', icon: ClipboardCheck, tab: 'quizzes' },
  { label: 'פרופיל', icon: User, tab: 'profile' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const emp = getSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState<AppTab>('home');

  const handleLogout = () => { clearSession(); navigate('/'); };

  const handleNav = (item: typeof NAV[0]) => {
    if (item.tab) setTab(item.tab);
    setMobileOpen(false);
  };

  return (
    <TabCtx.Provider value={{ tab, setTab }}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-border sticky top-0 z-50 h-16 flex items-center px-4 gap-3">
          <button
            className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer mr-auto md:mr-0" onClick={() => { setTab('home'); navigate('/home'); }}>
            <img src={LOGO} alt="חשמל הקרן" className="h-9 object-contain" />
          </div>

          <div className="flex items-center gap-1 mr-auto">
            <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground" title="ניהול">
              <Shield className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {emp?.name?.charAt(0) ?? 'א'}
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {mobileOpen && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

          {/* Sidebar */}
          <aside className={`
            fixed md:sticky top-16 right-0 h-[calc(100vh-4rem)] z-40 md:z-auto
            w-56 bg-white border-l border-border
            flex flex-col py-4 overflow-y-auto
            transition-transform duration-200
            ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}>
            {emp && (
              <div className="px-4 pb-4 border-b border-border mb-2">
                <p className="text-xs text-muted-foreground">שלום,</p>
                <p className="font-bold text-foreground">{emp.name}</p>
                {emp.role && <p className="text-xs text-muted-foreground mt-0.5">{emp.role}</p>}
              </div>
            )}

            <nav className="flex-1 px-3 space-y-1">
              {NAV.map((item) => {
                const active = item.tab === tab;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right
                      ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}
                    `}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                    <span>{item.label}</span>
                    {active && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </nav>

            <div className="px-3 pt-2 border-t border-border mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all text-right"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>יציאה</span>
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto min-h-0">
            {children}
          </main>
        </div>
      </div>
    </TabCtx.Provider>
  );
}
