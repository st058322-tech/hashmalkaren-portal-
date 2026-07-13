import { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../lib/session';
import { Home, ClipboardCheck, User, LogOut, Shield, Menu, X, Bell } from 'lucide-react';

export type AppTab = 'home' | 'quizzes' | 'profile';

const TabCtx = createContext<{ tab: AppTab; setTab: (t: AppTab) => void }>({
  tab: 'home', setTab: () => {},
});
export function useAppTab() { return useContext(TabCtx); }

const LOGO = 'https://images.fillout.com/orgid-477260/flowpublicid-default/widgetid-default/b7JNjFMkDZgeVBeECi9hEN/pasted-image-1780949591831-fwfdf279.jpg';

const NAV: { label: string; icon: React.ElementType; tab: AppTab }[] = [
  { label: 'ראשי',          icon: Home,          tab: 'home'    },
  { label: 'המבחנים שלי',  icon: ClipboardCheck, tab: 'quizzes' },
  { label: 'פרופיל',        icon: User,           tab: 'profile' },
];

function SidebarContent({
  tab, setTab, emp, onLogout, onNav,
}: {
  tab: AppTab;
  setTab: (t: AppTab) => void;
  emp: ReturnType<typeof getSession>;
  onLogout: () => void;
  onNav: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full">
      {/* User card */}
      {emp && (
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md shadow-primary/30">
              {emp.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm truncate">שלום, {emp.name}</p>
              {emp.role && <p className="text-xs text-muted-foreground truncate">{emp.role}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => {
          const active = item.tab === tab;
          return (
            <button
              key={item.tab}
              onClick={() => { setTab(item.tab); navigate('/home'); onNav(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-right
                ${active
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-2 border-t border-border mt-2">
          <button
            onClick={() => { navigate('/admin'); onNav(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-right"
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>אזור ניהול</span>
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all text-right"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>יציאה מהמערכת</span>
        </button>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const emp = getSession();
  const [tab, setTab] = useState<AppTab>('home');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { clearSession(); navigate('/'); };

  return (
    <TabCtx.Provider value={{ tab, setTab }}>
      <div className="min-h-screen bg-secondary/30 flex flex-col" dir="rtl">

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 bg-white border-b border-border h-16 flex items-center px-4 gap-3 shadow-sm">
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => { setTab('home'); navigate('/home'); }}
          >
            <img src={LOGO} alt="חשמל הקרן" className="h-9 w-auto object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-extrabold text-foreground leading-none">חשמל הקרן</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">מרכז ההדרכה</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Right-side header actions */}
          <button className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground" title="התראות">
            <Bell className="w-5 h-5" />
          </button>
          <div
            className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm cursor-pointer shrink-0"
            onClick={() => setTab('profile')}
            title={emp?.name}
          >
            {emp?.name?.charAt(0) ?? 'א'}
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Mobile overlay */}
          {mobileOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
          )}

          {/* ── Sidebar ── */}
          {/* Desktop: always visible, sticky */}
          {/* Mobile: slide in from right, fixed overlay */}
          <aside className={`
            bg-white border-l border-border
            flex flex-col
            md:w-56 md:shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-y-auto md:translate-x-0 md:z-auto md:relative
            fixed top-16 right-0 h-[calc(100vh-4rem)] w-72 z-50 overflow-y-auto
            transition-transform duration-200 ease-out
            ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}>
            <SidebarContent
              tab={tab}
              setTab={setTab}
              emp={emp}
              onLogout={handleLogout}
              onNav={() => setMobileOpen(false)}
            />
          </aside>

          {/* ── Main ── */}
          <main className="flex-1 overflow-y-auto min-h-0">
            {children}
          </main>
        </div>

        {/* ── Mobile bottom quick-tab bar ── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-border flex h-16 shadow-lg">
          {NAV.map(item => {
            const active = item.tab === tab;
            return (
              <button
                key={item.tab}
                onClick={() => { setTab(item.tab); navigate('/home'); }}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
                )}
                <item.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom padding for mobile nav */}
        <div className="md:hidden h-16" />
      </div>
    </TabCtx.Provider>
  );
}
