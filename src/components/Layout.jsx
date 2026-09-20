import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/cash-in', label: 'Cash In', icon: InIcon },
  { to: '/cash-out', label: 'Cash Out', icon: OutIcon },
  { to: '/reports', label: 'Reports', icon: ReportIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-steel-50">
      <header className="bg-navy-700 text-white px-4 pt-4 pb-3 flex items-center gap-3 shadow-card">
        <img src="/logo.png" alt="NextGen PreFab" className="h-9 w-auto rounded bg-white/95 px-1.5 py-1" />
        <div className="leading-tight">
          <p className="font-display font-semibold text-[15px] tracking-tight">NextGen PreFab</p>
          <p className="text-navy-200 text-xs">Accounts</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-steel-200 flex justify-around items-stretch safe-bottom shadow-[0_-2px_10px_rgba(16,31,56,0.06)]">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 py-2 flex-1 text-[11px] font-medium ${isActive ? 'text-brick-600' : 'text-steel-400'}`}
          >
            {({ isActive }) => (<><Icon active={isActive} /><span>{label}</span></>)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function HomeIcon({ active }) {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#c3272f' : '#7f92a3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>);
}
function InIcon({ active }) {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#c3272f' : '#7f92a3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="m5 12 7 7 7-7" /></svg>);
}
function OutIcon({ active }) {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#c3272f' : '#7f92a3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m5 12 7-7 7 7" /></svg>);
}
function ReportIcon({ active }) {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#c3272f' : '#7f92a3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V9M10 19V5M16 19v-7M4 19h16" /></svg>);
}
function SettingsIcon({ active }) {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#c3272f' : '#7f92a3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>);
}
