import React, { useState, useEffect } from "react";
import { APPS, type App } from "./data/apps";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Rom {
  id: string; title: string; region: string; size: string; rating: number;
  year: number; genre: string; players: string; description: string;
  developer: string; downloadUrl: string; coverUrl: string;
  screenshots: string[]; videoId: string; instructions: string[];
}
interface Console {
  id: string; name: string; shortName: string; gradient: string;
  logoText: string; description: string; emulator: string;
  fileExtensions: string[]; romCount: number; roms: Rom[];
}
interface RomsData { consoles: Console[] }

// ─── Icons ────────────────────────────────────────────────────────────────────
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const s = size;
  const icons: Record<string, React.ReactNode> = {
    grid: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    refresh: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    monitor: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    cpu: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    gamepad: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="11" r="1" fill="currentColor"/><circle cx="18" cy="13" r="1" fill="currentColor"/><path d="M6 6h12c2.21 0 4 1.79 4 4v4c0 2.21-1.79 4-4 4H6c-2.21 0-4-1.79-4-4v-4c0-2.21 1.79-4 4-4z"/></svg>,
    code: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    pen: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    disc: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
    folder: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    wrench: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    search: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    download: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    arrowLeft: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    arrowRight: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    wifi: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" strokeLinecap="round"/></svg>,
    check: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    info: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" strokeLinecap="round"/></svg>,
    star: <svg width={s} height={s} viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    starEmpty: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    play: <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    fileOpen: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
    run: <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    image: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    video: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="15" height="10" rx="2"/><polygon points="22 7 16 12 22 17 22 7" fill="currentColor"/></svg>,
    tag: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" strokeLinecap="round"/></svg>,
    users: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    calendar: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    hdd: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16" strokeWidth="3" strokeLinecap="round"/><line x1="10" y1="16" x2="10.01" y2="16" strokeWidth="3" strokeLinecap="round"/></svg>,
    windows: <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>,
    trophy: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H4l1 5a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4l1-5h-3"/><line x1="7" y1="4" x2="17" y2="4"/></svg>,
    lock: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    settings: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    user: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    share: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    heart: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  };
  return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icons[name] || null}</span>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; text: string; type: 'success' | 'info' | 'error' }
let _toastId = 0;
let _setToasts: React.Dispatch<React.SetStateAction<ToastMsg[]>> | null = null;
function showToast(text: string, type: ToastMsg['type'] = 'info') {
  if (_setToasts) {
    const id = ++_toastId;
    _setToasts(p => [...p, { id, text, type }]);
    setTimeout(() => _setToasts!(p => p.filter(t => t.id !== id)), 3200);
  }
}
function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  useEffect(() => { _setToasts = setToasts; return () => { _setToasts = null; }; }, []);
  const colors = { success: '#22c55e', info: '#3b82f6', error: '#ef4444' };
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: 'hsl(230 22% 14%)', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', padding: '10px 16px', fontSize: 13, boxShadow: '0 8px 30px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: colors[t.type] }}><Icon name={t.type === 'success' ? 'check' : t.type === 'error' ? 'x' : 'info'} size={15} /></span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function Clock({ opacity = 0.5 }: { opacity?: number }) {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  const h = t.getHours().toString().padStart(2,'0');
  const m = t.getMinutes().toString().padStart(2,'0');
  const d = t.getDate().toString().padStart(2,'0');
  return (
    <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '.06em', color: `rgba(255,255,255,${opacity})`, lineHeight: 1, whiteSpace: 'nowrap', userSelect: 'none' }}>
      {h}:{m} <span style={{ fontSize: '.7rem', opacity: .7 }}>{d}</span>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color = '#e8692a' }: { value: number; color?: string }) {
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,.12)', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 4, transition: 'width .25s ease' }} />
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string,string> = {
  Todos:'grid', Actualizaciones:'refresh', Programas:'monitor', Drivers:'cpu',
  Juegos:'gamepad', Desarrollos:'code', Diseño:'pen', Emuladores:'disc',
  'Juegos Roms':'folder', Proyectos:'wrench',
};
function Sidebar({ active, onSelect }: { active: string; onSelect: (c: string) => void }) {
  return (
    <div style={{ width: 200, background: 'hsl(230 28% 8%)', borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', padding: '12px 8px', overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'hsl(var(--muted-foreground))', padding: '8px 10px 4px' }}>Apps</div>
      {['Todos','Actualizaciones'].map(cat => (
        <button key={cat} onClick={() => onSelect(cat)}
          style={{ border: 'none', background: active===cat ? 'hsl(var(--primary)/.18)' : 'transparent', color: active===cat ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%', textAlign: 'left', fontSize: 13, borderRadius: '0.5rem', transition: 'all .15s' }}>
          <span style={{ color: active===cat ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', flexShrink: 0 }}><Icon name={CAT_ICONS[cat]||'folder'} size={15}/></span>
          {cat}
        </button>
      ))}
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'hsl(var(--muted-foreground))', padding: '12px 10px 4px' }}>Categorías</div>
      {['Programas','Drivers','Juegos','Desarrollos','Diseño','Emuladores','Juegos Roms','Proyectos'].map(cat => (
        <button key={cat} onClick={() => onSelect(cat)}
          style={{ border: 'none', background: active===cat ? 'hsl(var(--primary)/.18)' : 'transparent', color: active===cat ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%', textAlign: 'left', fontSize: 13, borderRadius: '0.5rem', transition: 'all .15s' }}>
          <span style={{ color: active===cat ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', flexShrink: 0 }}><Icon name={CAT_ICONS[cat]||'folder'} size={15}/></span>
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── Titlebar ────────────────────────────────────────────────────────────────
function Titlebar({ online, onToggle, search, onSearch }: { online:boolean; onToggle:()=>void; search:string; onSearch:(v:string)=>void }) {
  return (
    <div style={{ background: 'hsl(230 28% 9%)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', height: 44, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', flexShrink: 0 }}>
        {['#ff5f57','#febc2e','#28c840'].map((c,i) => <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'inline-block' }} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', height: '100%', borderRight: '1px solid hsl(var(--border))', flexShrink: 0 }}>
        {['Online','Sin conexión'].map((tab,i) => (
          <button key={tab} onClick={onToggle}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 16px', fontSize: 14, color: (i===0)===online ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', borderBottom: (i===0)===online ? '2px solid hsl(var(--primary))' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: 4 }}>
            {tab}{(i===0)&&online&&<span style={{ width:6,height:6,borderRadius:'50%',background:'hsl(var(--primary))',display:'inline-block' }}/>}
          </button>
        ))}
      </div>
      <div style={{ position: 'relative', flex: '0 0 240px', margin: '0 14px' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }}><Icon name="search" size={14}/></span>
        <input type="search" value={search} onChange={e=>onSearch(e.target.value)} placeholder="Buscar..."
          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))', padding: '5px 10px 5px 34px', width: '100%', outline: 'none', fontSize: 13, height: 30 }} />
      </div>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Nueva version disponible sjjssj XD v1.0</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
        <Clock />
        <button className="btn-icon" onClick={()=>showToast('Sin actualizaciones','info')} style={{ position: 'relative' }}>
          <Icon name="download" size={18}/>
          <span style={{ position:'absolute',top:-4,right:-4,background:'hsl(var(--primary))',color:'white',borderRadius:'50%',width:14,height:14,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700 }}>0</span>
        </button>
        <button className="btn-icon" onClick={()=>showToast('Sin notificaciones','info')}><Icon name="bell" size={18}/></button>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer' }}>👤</div>
      </div>
    </div>
  );
}

// ─── App Card ────────────────────────────────────────────────────────────────
function AppCard({ app, onClick }: { app: App; onClick: () => void }) {
  return (
    <div onClick={onClick} className="app-card glass-card" style={{ borderRadius: '1rem', overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ height: 150, background: `linear-gradient(135deg,${app.color}99,${app.color}44 50%,#0d0d1a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ fontSize: '3.5rem' }}>{app.icon}</span>
        {app.isNew && <span style={{ position:'absolute',top:10,right:10,background:'hsl(var(--primary))',color:'white',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,textTransform:'uppercase' }}>new</span>}
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{app.name}</div>
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{app.category.toLowerCase()}</div>
        </div>
        <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}>Detalles</button>
      </div>
    </div>
  );
}

// ─── Gaming Detail View (shared layout) ──────────────────────────────────────
interface MediaItem { type: 'cover' | 'video' | 'screen'; label: string; emoji?: string; videoId?: string; src?: string }

function GamingDetailLayout({
  onBack, backLabel,
  coverEmoji, coverColor, coverBg,
  title, genres, description,
  platform, ratingNum, reviews,
  language, releaseDate, size,
  developer, publisher,
  accentColor,
  actionLabel, actionIcon,
  onAction,
  actionPending, actionProgress,
  secondaryLabel, secondaryIcon, onSecondary,
  extraPanel,
  mediaItems,
}: {
  onBack: () => void; backLabel: string;
  coverEmoji: string; coverColor: string; coverBg: string;
  title: string; genres: string[]; description: string;
  platform: string; ratingNum: number; reviews: number;
  language: string; releaseDate: string; size: string;
  developer: string; publisher: string;
  accentColor: string;
  actionLabel: string; actionIcon: string;
  onAction: () => void;
  actionPending: boolean; actionProgress: number;
  secondaryLabel?: string; secondaryIcon?: string; onSecondary?: () => void;
  extraPanel?: React.ReactNode;
  mediaItems: MediaItem[];
}) {
  const [mediaIdx, setMediaIdx] = useState(0);
  const total = mediaItems.length;
  const active = mediaItems[mediaIdx];

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto',
      background: 'linear-gradient(160deg, #151520 0%, #0e0e18 60%, #0a0a14 100%)',
      position: 'relative',
    }}>
      {/* Subtle particle-like background dots */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.018) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', position: 'relative', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '2rem', padding: '6px 16px', color: 'rgba(255,255,255,.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}>
          <Icon name="arrowLeft" size={14}/> {backLabel}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionIconBtn icon="heart" tooltip="Favorito" />
          <ActionIconBtn icon="share" tooltip="Compartir" />
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: 0, flex: 1, position: 'relative', zIndex: 1, minHeight: 0, flexDirection: 'row', flexWrap: 'nowrap', overflow: 'hidden' }}>

        {/* ── Left Column ── */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,.06)', padding: '24px 20px 20px' }}>
          {/* Cover */}
          <div style={{
            borderRadius: '0.875rem', overflow: 'hidden',
            background: coverBg || `linear-gradient(145deg, ${coverColor}cc, ${coverColor}44 60%, #0a0a18)`,
            aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${coverColor}44`,
            boxShadow: `0 8px 40px ${coverColor}33`,
            flexShrink: 0, marginBottom: 16,
          }}>
            <span style={{ fontSize: '5.5rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.5))' }}>{coverEmoji}</span>
          </div>

          {/* Media thumbnails / carousel strip */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minHeight: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>
              {mediaIdx + 1} / {total}
            </div>
            {/* Active media preview */}
            <div style={{ borderRadius: '.625rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)', background: '#0a0a16', position: 'relative', aspectRatio: '16/9', flexShrink: 0 }}>
              {active.type === 'video' && active.videoId ? (
                <iframe src={`https://www.youtube.com/embed/${active.videoId}?rel=0&modestbranding=1`} title="preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}/>
              ) : active.type === 'screen' && active.src ? (
                <img src={active.src} alt={active.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
                  <span style={{ fontSize: '2rem' }}>{active.emoji || '🎬'}</span>
                  <span>{active.label}</span>
                </div>
              )}
              {/* Play button overlay for non-video cover types */}
              {active.type === 'cover' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.2)' }}>
                    <Icon name="play" size={16}/>
                  </div>
                </div>
              )}
            </div>
            {/* Nav arrows */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <button onClick={() => setMediaIdx(i => (i-1+total)%total)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.07)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="arrowLeft" size={13}/>
              </button>
              <div style={{ display: 'flex', gap: 5 }}>
                {mediaItems.map((_,i) => (
                  <span key={i} onClick={()=>setMediaIdx(i)} style={{ width: i===mediaIdx?18:6, height: 6, borderRadius: 3, background: i===mediaIdx ? accentColor : 'rgba(255,255,255,.2)', cursor: 'pointer', transition: 'all .2s' }}/>
                ))}
              </div>
              <button onClick={() => setMediaIdx(i => (i+1)%total)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.07)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="arrowRight" size={13}/>
              </button>
            </div>
            {/* Thumbnail strip */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
              {mediaItems.map((m,i) => (
                <div key={i} onClick={()=>setMediaIdx(i)}
                  style={{ width: 52, height: 36, borderRadius: '0.375rem', flexShrink: 0, cursor: 'pointer', border: `1px solid ${i===mediaIdx ? accentColor : 'rgba(255,255,255,.1)'}`, background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', transition: 'border-color .15s', overflow: 'hidden' }}>
                  {m.type==='video' ? <Icon name="video" size={14}/> : m.emoji ? <span>{m.emoji}</span> : <Icon name="image" size={14}/>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={{ flex: 1, padding: '28px 32px 28px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Genre tags + title */}
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {genres.map(g => (
                <span key={g} style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: accentColor, padding: '2px 10px', border: `1px solid ${accentColor}55`, borderRadius: 20, background: `${accentColor}18` }}>{g}</span>
              ))}
            </div>
            <h1 style={{ margin: '0 0 10px', fontSize: '1.9rem', fontWeight: 800, color: 'white', lineHeight: 1.15, letterSpacing: '-.01em' }}>{title}</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 520 }}>{description}</p>
          </div>

          {/* Platform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>Funciona en:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '0.5rem', padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
              <Icon name="windows" size={13}/> {platform}
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {/* Rating card */}
            <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '.875rem', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: accentColor, lineHeight: 1 }}>{ratingNum.toFixed(1)}</div>
              <div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(i=><span key={i} style={{ color: i <= Math.round(ratingNum/2) ? '#f59e0b' : 'rgba(255,255,255,.15)' }}><Icon name={i<=Math.round(ratingNum/2)?'star':'starEmpty'} size={11}/></span>)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>Reviews · {reviews.toLocaleString()}</div>
              </div>
            </div>
            {/* Language */}
            <MetaCard label="Idioma" value={language} />
            {/* Release date */}
            <MetaCard label="Fecha de lanzamiento" value={releaseDate} />
            {/* Size */}
            <MetaCard label="Tamaño" value={size} />
          </div>

          {/* Developer / Publisher */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <DevCard label="Desarrollador" value={developer} color={accentColor}/>
            <DevCard label="Editor" value={publisher} color={accentColor}/>
          </div>

          {/* Action icon row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {['user','download','trophy','lock','settings'].map(ic => (
              <button key={ic} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,.12)';(e.currentTarget as HTMLButtonElement).style.color='white';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,.06)';(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,.5)';}}>
                <Icon name={ic} size={16}/>
              </button>
            ))}
          </div>

          {/* Main action button */}
          {actionPending ? (
            <div style={{ maxWidth: 280 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>Descargando... {Math.round(actionProgress)}%</div>
              <ProgressBar value={actionProgress} color={accentColor}/>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={onAction}
                style={{ background: 'white', color: '#111', border: 'none', borderRadius: '2rem', padding: '11px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', boxShadow: '0 4px 20px rgba(255,255,255,.15)', fontFamily: 'inherit' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='#eee';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='white';}}>
                <Icon name={actionIcon} size={17}/>{actionLabel}
              </button>
              {secondaryLabel && onSecondary && (
                <button onClick={onSecondary}
                  style={{ background: 'transparent', color: 'rgba(255,255,255,.65)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '2rem', padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'all .15s', fontFamily: 'inherit' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,.4)';(e.currentTarget as HTMLButtonElement).style.color='white';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,.18)';(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,.65)';}}>
                  <Icon name={secondaryIcon||'fileOpen'} size={15}/>{secondaryLabel}
                </button>
              )}
            </div>
          )}

          {/* Extra panel (instructions, etc.) */}
          {extraPanel}
        </div>
      </div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '.875rem', padding: '12px 16px' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{value}</div>
    </div>
  );
}
function DevCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '.875rem', padding: '10px 14px', flex: '1 1 160px', minWidth: 0 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: color }}/>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  );
}
function ActionIconBtn({ icon, tooltip }: { icon: string; tooltip: string }) {
  return (
    <button title={tooltip} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,.12)';(e.currentTarget as HTMLButtonElement).style.color='white';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,.06)';(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,.5)';}}>
      <Icon name={icon} size={15}/>
    </button>
  );
}

// ─── App Detail View ──────────────────────────────────────────────────────────
function AppDetailView({ app, onBack }: { app: App; onBack: () => void }) {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  function handleDownload() {
    setDownloading(true); let p=0;
    const iv = setInterval(()=>{
      p += Math.random()*18;
      if(p>=100){ p=100; clearInterval(iv); setTimeout(()=>{ setDownloading(false); setProgress(0); showToast(`${app.name} descargado`,'success'); window.open(app.downloadUrl,'_blank'); },500); }
      setProgress(Math.min(p,100));
    },180);
  }

  const mediaItems: MediaItem[] = [
    { type: 'cover', label: 'Portada', emoji: app.icon },
    ...(app.videoId ? [{ type: 'video' as const, label: 'Trailer / Preview', videoId: app.videoId }] : []),
    ...app.screenshots.map((src,i) => ({ type: 'screen' as const, label: `Captura ${i+1}`, src })),
    { type: 'cover', label: 'Vista adicional', emoji: app.icon },
  ];

  const extraPanel = (
    <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '1rem', padding: '18px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.35)', marginBottom: 14 }}>Instrucciones de instalación</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {app.instructions.map((step,i)=>(
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${app.color}33`, border: `1px solid ${app.color}55`, color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i+1}</div>
            <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, lineHeight: 1.65 }}>{step.replace(/^\d+ - /,'')}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <GamingDetailLayout
      onBack={onBack} backLabel="Volver"
      coverEmoji={app.icon} coverColor={app.color} coverBg={`linear-gradient(145deg, ${app.color}dd, ${app.color}55 60%, #0a0a18)`}
      title={app.name} genres={[app.category, ...app.tags.slice(0,2)]}
      description={app.description}
      platform={app.platform} ratingNum={app.rating} reviews={app.reviews}
      language={app.language} releaseDate={app.releaseDate} size={app.size}
      developer={app.developer} publisher={app.publisher}
      accentColor={app.color}
      actionLabel="Descargar" actionIcon="download" onAction={handleDownload}
      actionPending={downloading} actionProgress={progress}
      mediaItems={mediaItems}
      extraPanel={extraPanel}
    />
  );
}

// ─── ROM Detail View ──────────────────────────────────────────────────────────
function RomDetailView({ rom, console: c, onBack }: { rom: Rom; console: Console; onBack: () => void }) {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [filePath, setFilePath] = useState('');

  function handleDownload() {
    setDownloading(true); let p=0;
    const iv = setInterval(()=>{
      p+=Math.random()*12;
      if(p>=100){ p=100; clearInterval(iv);
        setTimeout(()=>{ setDownloading(false); setProgress(0); setDownloaded(true);
          showToast(`${rom.title} descargado`,'success');
          window.open(rom.downloadUrl,'_blank');
        },600);
      }
      setProgress(Math.min(p,100));
    },200);
  }

  function handleSelectFile() {
    const inp = document.createElement('input');
    inp.type='file'; inp.accept=c.fileExtensions.join(',');
    inp.onchange=(e:Event)=>{
      const f=(e.target as HTMLInputElement).files?.[0];
      if(f){ setFilePath(f.name); setDownloaded(true); showToast(`Archivo: ${f.name}`,'success'); }
    };
    inp.click();
  }

  function handleExecute() {
    showToast(`Abriendo ${rom.title} en ${c.emulator}...`,'success');
  }

  const [r,g,b] = [229, 100, 60];
  const accentColor = '#e8692a';

  const mediaItems: MediaItem[] = [
    { type: 'cover', label: 'Portada', emoji: '🎮' },
    ...(rom.videoId ? [{ type: 'video' as const, label: 'Gameplay', videoId: rom.videoId }] : []),
    ...rom.screenshots.map((src,i) => ({ type: 'screen' as const, label: `Captura ${i+1}`, src })),
    { type: 'cover', label: 'Arte adicional', emoji: '🕹️' },
  ];

  const ratingOutOf10 = rom.rating * 2;
  const extraPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* File / Execute panel */}
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '1rem', padding: '16px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.35)', marginBottom: 12 }}>Seleccionar plataforma / archivo</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {downloaded ? (
            <button onClick={handleExecute} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '2rem', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
              <Icon name="run" size={14}/> Ejecutar en {c.emulator}
            </button>
          ) : (
            <button onClick={handleSelectFile} style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.8)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '2rem', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
              <Icon name="fileOpen" size={14}/> Seleccionar archivo ROM
            </button>
          )}
        </div>
        {filePath && <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,.4)', padding: '6px 10px', background: 'rgba(255,255,255,.05)', borderRadius: '.5rem' }}>📁 {filePath}</div>}
        <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,.3)' }}>Formatos: {c.fileExtensions.join(', ')}</div>
      </div>
      {/* Instructions */}
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '1rem', padding: '16px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.35)', marginBottom: 12 }}>Instrucciones</div>
        {rom.instructions.map((step,i)=>(
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${accentColor}33`, border: `1px solid ${accentColor}55`, color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i+1}</div>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, lineHeight: 1.6 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <GamingDetailLayout
      onBack={onBack} backLabel={`Volver a ${c.name}`}
      coverEmoji="🎮" coverColor="#e8692a" coverBg={`${c.gradient}, #0a0a18`}
      title={rom.title} genres={[c.name, rom.genre]}
      description={rom.description}
      platform={`${c.name} · ${c.emulator}`} ratingNum={ratingOutOf10} reviews={Math.floor(ratingOutOf10 * 340)}
      language={`${rom.region} · ${rom.players}P`} releaseDate={rom.year.toString()} size={rom.size}
      developer={rom.developer} publisher={c.name}
      accentColor={accentColor}
      actionLabel={downloaded ? 'Descargar de nuevo' : 'Descargar ROM'} actionIcon="download" onAction={handleDownload}
      actionPending={downloading} actionProgress={progress}
      secondaryLabel={downloaded ? `Ejecutar en ${c.emulator}` : undefined}
      secondaryIcon="run"
      onSecondary={downloaded ? handleExecute : undefined}
      mediaItems={mediaItems}
      extraPanel={extraPanel}
    />
  );
}

// ─── Console Banner Card ──────────────────────────────────────────────────────
function ConsoleBanner({ console: c, onClick }: { console: Console; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ background: c.gradient, borderRadius: '1rem', padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', position: 'relative', overflow: 'hidden', minHeight: 110, transition: 'transform .2s, box-shadow .2s' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 40px rgba(0,0,0,.35)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow='';}}>
      <div style={{ position:'absolute',inset:0,opacity:.08,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,.3) 24px,rgba(255,255,255,.3) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,.3) 24px,rgba(255,255,255,.3) 25px)',pointerEvents:'none' }}/>
      <div style={{ zIndex: 1 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,.3)' }}>{c.name}</h2>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,.8)', maxWidth: 340, lineHeight: 1.5 }}>{c.description}</p>
        <button onClick={e=>{e.stopPropagation();onClick();}}
          style={{ background: 'hsl(var(--primary))', color: 'white', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Ver roms</button>
      </div>
      <div style={{ zIndex: 1, textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: c.shortName.length>6?'1.5rem':'2.5rem', fontWeight: 900, color: 'rgba(255,255,255,.25)', letterSpacing: '.05em', textTransform: 'uppercase', lineHeight: 1, fontStyle: 'italic' }}>{c.logoText}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>{c.romCount} juegos</div>
      </div>
    </div>
  );
}

// ─── ROM List View ────────────────────────────────────────────────────────────
function RomListView({ console: c, onSelectRom, onBack }: { console: Console; onSelectRom: (r: Rom) => void; onBack: () => void }) {
  const [search, setSearch] = useState('');
  const filtered = c.roms.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.genre.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn-icon" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'hsl(var(--muted-foreground))', border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <Icon name="arrowLeft" size={18}/> Volver
        </button>
        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>{c.name}</h2>
        <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', padding: '2px 10px', borderRadius: 20, border: '1px solid hsl(var(--border))' }}>Emulador: {c.emulator}</span>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }}><Icon name="search" size={14}/></span>
          <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ROM..."
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))', padding: '6px 10px 6px 32px', outline: 'none', fontSize: 13, width: 200 }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(rom => (
          <div key={rom.id} onClick={()=>onSelectRom(rom)}
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '.875rem', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'border-color .15s, transform .15s' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='hsl(var(--primary)/.4)';(e.currentTarget as HTMLDivElement).style.transform='translateX(3px)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='';(e.currentTarget as HTMLDivElement).style.transform='';}}>
            <div style={{ width: 64, height: 64, borderRadius: '.5rem', background: `linear-gradient(135deg,hsl(var(--muted)),hsl(var(--border)))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.8rem' }}>🎮</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{rom.title}</span>
                <span style={{ fontSize: 11, background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', padding: '1px 7px', borderRadius: 20 }}>{rom.region}</span>
                <span style={{ color: '#f59e0b', display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(i=><Icon key={i} name={i<=rom.rating?'star':'starEmpty'} size={12}/>)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                <span>{rom.genre}</span>
                <span>{rom.players}P</span>
                <span>{rom.year}</span>
                <span>{rom.size}</span>
              </div>
            </div>
            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12, flexShrink: 0 }} onClick={e=>{e.stopPropagation();onSelectRom(rom);}}>Ver detalles</button>
          </div>
        ))}
        {filtered.length===0 && <div style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: 40 }}>No se encontraron ROMs</div>}
      </div>
    </div>
  );
}

// ─── Juegos Roms Section ──────────────────────────────────────────────────────
type RomView = { type:'list' } | { type:'roms'; console: Console } | { type:'rom'; console: Console; rom: Rom };

function JuegosRomsSection() {
  const [romsData, setRomsData] = useState<RomsData|null>(null);
  const [view, setView] = useState<RomView>({ type:'list' });

  useEffect(()=>{
    fetch('/roms.json').then(r=>r.json()).then(setRomsData).catch(()=>showToast('Error cargando ROMs','error'));
  },[]);

  if(!romsData) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60%',color:'hsl(var(--muted-foreground))' }}>Cargando consolas...</div>;

  if(view.type==='rom') return <RomDetailView rom={view.rom} console={view.console} onBack={()=>setView({type:'roms',console:view.console})}/>;
  if(view.type==='roms') return <RomListView console={view.console} onSelectRom={rom=>setView({type:'rom',console:view.console,rom})} onBack={()=>setView({type:'list'})}/>;

  return (
    <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 700 }}>Juegos Roms</h2>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, margin: 0 }}>Selecciona una consola para ver sus juegos disponibles</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {romsData.consoles.map(c=><ConsoleBanner key={c.id} console={c} onClick={()=>setView({type:'roms',console:c})}/>)}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [online, setOnline] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedApp, setSelectedApp] = useState<App|null>(null);

  const filteredApps = APPS.filter(app => {
    const ms = search==='' || app.name.toLowerCase().includes(search.toLowerCase()) || app.description.toLowerCase().includes(search.toLowerCase());
    const mc = activeCategory==='Todos' || activeCategory==='Actualizaciones' || app.category===activeCategory;
    return ms && mc && online;
  });

  function selectCat(cat:string){ setActiveCategory(cat); setSelectedApp(null); setSearch(''); }

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',fontFamily:'Inter,system-ui,sans-serif',background:'hsl(var(--background))',color:'hsl(var(--foreground))' }}>
      <Titlebar online={online} onToggle={()=>{setOnline(p=>!p);setSelectedApp(null);}} search={search} onSearch={setSearch}/>
      <div style={{ background:'hsl(230 28% 9%)',borderBottom:'1px solid hsl(var(--border))',display:'flex',alignItems:'center',height:36,padding:'0 12px',gap:4,flexShrink:0 }}>
        <button className="btn-icon" style={{ fontSize:13 }}>Volver</button>
        <button className="btn-icon" style={{ fontSize:13 }}>Avanzar</button>
      </div>

      <div style={{ display:'flex',flex:1,overflow:'hidden' }}>
        <Sidebar active={activeCategory} onSelect={selectCat}/>
        <main style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>
          {!online ? (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'80%',gap:14,color:'hsl(var(--muted-foreground))' }}>
              <span style={{ fontSize:'3.5rem',opacity:.4 }}>📡</span>
              <p style={{ margin:0,fontSize:16 }}>Sin conexión a internet</p>
              <button className="btn-primary" onClick={()=>setOnline(true)}><Icon name="wifi" size={15}/> Reconectar</button>
            </div>
          ) : activeCategory==='Juegos Roms' ? (
            <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>
              <JuegosRomsSection/>
            </div>
          ) : activeCategory==='Actualizaciones' ? (
            <div style={{ padding:24 }}>
              <h2 style={{ margin:'0 0 6px',fontSize:'1.3rem',fontWeight:700 }}>Actualizaciones</h2>
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,color:'hsl(var(--muted-foreground))',gap:10 }}>
                <span style={{ fontSize:'3rem' }}>✅</span>
                <p style={{ margin:0 }}>Todo está al día</p>
              </div>
            </div>
          ) : selectedApp ? (
            <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>
              <AppDetailView app={selectedApp} onBack={()=>setSelectedApp(null)}/>
            </div>
          ) : (
            <div style={{ flex:1,overflowY:'auto',padding:24 }}>
              <div className="apps-grid">
                {filteredApps.length===0 ? (
                  <div style={{ gridColumn:'1/-1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,color:'hsl(var(--muted-foreground))',gap:10 }}>
                    <span style={{ fontSize:'3rem' }}>🔍</span>
                    <p style={{ margin:0 }}>No se encontraron aplicaciones</p>
                  </div>
                ) : filteredApps.map(app=><AppCard key={app.id} app={app} onClick={()=>setSelectedApp(app)}/>)}
              </div>
            </div>
          )}
        </main>
      </div>
      <ToastContainer/>
    </div>
  );
}
