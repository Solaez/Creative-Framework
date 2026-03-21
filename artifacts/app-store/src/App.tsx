import { useState, useEffect, useCallback } from "react";
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
  const icons: Record<string, JSX.Element> = {
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
    star: <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    starEmpty: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    play: <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    fileOpen: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
    run: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/></svg>,
    image: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    video: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="15" height="10" rx="2"/><polygon points="22 7 16 12 22 17 22 7" fill="currentColor"/></svg>,
    tag: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" strokeLinecap="round"/></svg>,
    users: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    calendar: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    hdd: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16" strokeWidth="3" strokeLinecap="round"/><line x1="10" y1="16" x2="10.01" y2="16" strokeWidth="3" strokeLinecap="round"/></svg>,
  };
  return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icons[name] || null}</span>;
}

// ─── Toast System ─────────────────────────────────────────────────────────────
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
  const colors = { success: '#2ecc71', info: '#3b82f6', error: '#ef4444' };
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: 'hsl(230 22% 14%)', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', padding: '10px 16px', fontSize: 13, boxShadow: '0 8px 30px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', gap: 10, animation: 'slideIn .2s ease' }}>
          <span style={{ color: colors[t.type] }}><Icon name={t.type === 'success' ? 'check' : t.type === 'error' ? 'x' : 'info'} size={15} /></span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function Clock({ opacity = 0.08 }: { opacity?: number }) {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  const h = t.getHours().toString().padStart(2,'0');
  const m = t.getMinutes().toString().padStart(2,'0');
  const d = t.getDate().toString().padStart(2,'0');
  return (
    <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '.1em', color: `rgba(255,255,255,${opacity})`, lineHeight: 1, whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none' }}>
      {h}:{m} <span style={{ fontSize: '1rem', fontWeight: 600, verticalAlign: 'top', marginTop: 6, display: 'inline-block' }}>{d}</span>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, color: '#f59e0b' }}>
      {[1,2,3,4,5].map(i => <Icon key={i} name={i <= rating ? 'star' : 'starEmpty'} size={13} />)}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: 5, background: 'hsl(var(--muted))', borderRadius: 3, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${value}%`, background: 'hsl(var(--primary))', borderRadius: 3, transition: 'width .3s' }} />
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
  const sItem = (cat: string) => (
    <button key={cat} onClick={() => onSelect(cat)}
      style={{ border:'none', background: active===cat ? 'hsl(var(--primary)/.18)' : 'transparent',
        color: active===cat ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
        cursor:'pointer', display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
        width:'100%', textAlign:'left', fontSize:13, borderRadius:'0.5rem', transition:'all .15s' }}>
      <span style={{ color: active===cat ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', flexShrink: 0 }}>
        <Icon name={CAT_ICONS[cat]||'folder'} size={15} />
      </span>
      {cat}
    </button>
  );
  return (
    <div style={{ width:200, background:'hsl(230 28% 8%)', borderRight:'1px solid hsl(var(--border))', display:'flex', flexDirection:'column', padding:'12px 8px', overflowY:'auto', flexShrink:0 }}>
      <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'hsl(var(--muted-foreground))', padding:'8px 10px 4px' }}>Apps</div>
      {['Todos','Actualizaciones'].map(sItem)}
      <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'hsl(var(--muted-foreground))', padding:'12px 10px 4px' }}>Categorías</div>
      {['Programas','Drivers','Juegos','Desarrollos','Diseño','Emuladores','Juegos Roms','Proyectos'].map(sItem)}
    </div>
  );
}

// ─── Titlebar ────────────────────────────────────────────────────────────────
function Titlebar({ online, onToggle, search, onSearch }:
  { online:boolean; onToggle:()=>void; search:string; onSearch:(v:string)=>void }) {
  return (
    <div style={{ background:'hsl(230 28% 9%)', borderBottom:'1px solid hsl(var(--border))', display:'flex', alignItems:'center', height:44, flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 14px', flexShrink:0 }}>
        {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
          <span key={i} style={{ width:12, height:12, borderRadius:'50%', background:c, display:'inline-block', cursor:'pointer' }} />
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'stretch', height:'100%', borderRight:'1px solid hsl(var(--border))', flexShrink:0 }}>
        {['Online','Sin conexión'].map((tab,i) => (
          <button key={tab} onClick={onToggle}
            style={{ border:'none', background:'transparent', cursor:'pointer', padding:'0 16px', fontSize:14,
              color: (i===0)===online ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              borderBottom: (i===0)===online ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              display:'flex', alignItems:'center', gap:4 }}>
            {tab}{(i===0)&&online&&<span style={{ width:6,height:6,borderRadius:'50%',background:'hsl(var(--primary))',display:'inline-block' }}/>}
          </button>
        ))}
      </div>
      <div style={{ position:'relative', flex:'0 0 240px', margin:'0 14px' }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'hsl(var(--muted-foreground))', pointerEvents:'none' }}><Icon name="search" size={14}/></span>
        <input type="search" value={search} onChange={e=>onSearch(e.target.value)} placeholder="Buscar..."
          style={{ background:'hsl(var(--muted))', border:'1px solid hsl(var(--border))', borderRadius:'0.5rem', color:'hsl(var(--foreground))', padding:'5px 10px 5px 34px', width:'100%', outline:'none', fontSize:13, height:30 }} />
      </div>
      <div style={{ flex:1, textAlign:'center', fontSize:12, color:'hsl(var(--muted-foreground))' }}>
        Nueva version disponible sjjssj XD v1.0
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 14px' }}>
        <Clock opacity={0.5} />
        <button className="btn-icon" onClick={()=>showToast('Sin actualizaciones','info')} style={{ position:'relative' }}>
          <Icon name="download" size={18}/>
          <span style={{ position:'absolute', top:-4, right:-4, background:'hsl(var(--primary))', color:'white', borderRadius:'50%', width:14, height:14, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>0</span>
        </button>
        <button className="btn-icon" onClick={()=>showToast('Sin notificaciones','info')}><Icon name="bell" size={18}/></button>
        <div style={{ width:30, height:30, borderRadius:'50%', background:'hsl(var(--muted))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, cursor:'pointer' }}>👤</div>
      </div>
    </div>
  );
}

// ─── App Card ────────────────────────────────────────────────────────────────
function AppCard({ app, onClick }: { app: App; onClick: () => void }) {
  return (
    <div onClick={onClick} className="app-card glass-card" style={{ borderRadius:'1rem', overflow:'hidden', cursor:'pointer' }}>
      <div style={{ height:150, background:`linear-gradient(135deg,${app.color}99,${app.color}44 50%,#0d0d1a)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <span style={{ fontSize:'3.5rem' }}>{app.icon}</span>
        {app.isNew && <span style={{ position:'absolute', top:10, right:10, background:'hsl(var(--primary))', color:'white', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, textTransform:'uppercase' }}>new</span>}
      </div>
      <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontWeight:600, fontSize:14 }}>{app.name}</div>
          <div style={{ fontSize:12, color:'hsl(var(--muted-foreground))' }}>{app.category.toLowerCase()}</div>
        </div>
        <button className="btn-primary" style={{ padding:'5px 12px', fontSize:12 }} onClick={e=>{e.stopPropagation();onClick();}}>Detalles</button>
      </div>
    </div>
  );
}

// ─── App Detail View ──────────────────────────────────────────────────────────
function AppDetailView({ app, onBack }: { app: App; onBack: () => void }) {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  function handleDownload() {
    setDownloading(true);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random()*18;
      if (p >= 100) { p=100; clearInterval(iv); setTimeout(()=>{ setDownloading(false); setProgress(0); showToast(`${app.name} descargado`, 'success'); window.open(app.downloadUrl,'_blank'); },500); }
      setProgress(Math.min(p,100));
    }, 180);
  }

  return (
    <div style={{ padding:24, flex:1, overflowY:'auto' }}>
      <button className="btn-icon" onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, color:'hsl(var(--muted-foreground))', marginBottom:20, border:'none', background:'transparent', cursor:'pointer' }}>
        <Icon name="arrowLeft" size={18}/> Volver
      </button>
      <div style={{ display:'flex', gap:28, flexWrap:'wrap', marginBottom:24 }}>
        <div style={{ width:200, height:160, borderRadius:'1rem', background:`linear-gradient(135deg,${app.color}aa,${app.color}44 60%,#0d0d1a)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:'5rem' }}>{app.icon}</span>
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <h1 style={{ margin:'0 0 6px', fontSize:'1.5rem', fontWeight:700 }}>{app.name}</h1>
          <p style={{ color:'hsl(var(--muted-foreground))', fontSize:14, lineHeight:1.65, margin:'0 0 14px' }}>{app.description}</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
            {app.tags.map(t=><span key={t} style={{ background:'hsl(var(--muted))', color:'hsl(var(--muted-foreground))', fontSize:11, padding:'2px 8px', borderRadius:20, border:'1px solid hsl(var(--border))' }}>#{t}</span>)}
          </div>
          <div style={{ display:'flex', gap:20, marginBottom:18, fontSize:13 }}>
            <span><span style={{ color:'hsl(var(--muted-foreground))' }}>Versión: </span><b>{app.version}</b></span>
            <span><span style={{ color:'hsl(var(--muted-foreground))' }}>Tamaño: </span><b>{app.size}</b></span>
          </div>
          {downloading ? (
            <div style={{ maxWidth:260 }}>
              <div style={{ fontSize:13, color:'hsl(var(--muted-foreground))', marginBottom:6 }}>Descargando... {Math.round(progress)}%</div>
              <ProgressBar value={progress}/>
            </div>
          ) : (
            <button className="btn-primary" onClick={handleDownload} style={{ fontSize:14, padding:'9px 22px' }}>
              <Icon name="download" size={16}/> Descargar
            </button>
          )}
        </div>
      </div>
      <div style={{ background:'hsl(var(--card))', border:'1px solid hsl(var(--border))', borderRadius:'1rem', padding:'18px 22px' }}>
        <h3 style={{ margin:'0 0 12px', fontSize:15, fontWeight:600 }}>Instrucciones</h3>
        {app.instructions.map((step,i)=>(
          <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', fontSize:14, lineHeight:1.6, marginBottom:8 }}>
            <span style={{ color:'hsl(var(--primary))', fontWeight:700, minWidth:20 }}>{i+1}</span>
            <span style={{ color:'hsl(var(--muted-foreground))' }}>{step.replace(/^\d+ - /,'')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Console Banner Card ──────────────────────────────────────────────────────
function ConsoleBanner({ console: c, onClick }: { console: Console; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: c.gradient, borderRadius:'1rem', padding:'22px 28px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      cursor:'pointer', position:'relative', overflow:'hidden', minHeight:110,
      transition:'transform .2s, box-shadow .2s',
    }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 40px rgba(0,0,0,.35)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow='';}}>
      {/* Grid pattern overlay */}
      <div style={{ position:'absolute', inset:0, opacity:.08, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,.3) 24px,rgba(255,255,255,.3) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,.3) 24px,rgba(255,255,255,.3) 25px)', pointerEvents:'none' }}/>
      {/* Left */}
      <div style={{ zIndex:1 }}>
        <h2 style={{ margin:'0 0 8px', fontSize:'1.25rem', fontWeight:800, color:'white', textShadow:'0 2px 8px rgba(0,0,0,.3)' }}>{c.name}</h2>
        <p style={{ margin:'0 0 14px', fontSize:13, color:'rgba(255,255,255,.8)', maxWidth:340, lineHeight:1.5 }}>{c.description}</p>
        <button onClick={e=>{e.stopPropagation();onClick();}}
          style={{ background:'hsl(var(--primary))', color:'white', border:'none', borderRadius:20, padding:'7px 18px', fontSize:13, fontWeight:600, cursor:'pointer', transition:'opacity .15s' }}
          onMouseEnter={e=>(e.currentTarget.style.opacity='.85')}
          onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
          Ver roms
        </button>
      </div>
      {/* Right: logo text */}
      <div style={{ zIndex:1, textAlign:'right', flexShrink:0 }}>
        <div style={{ fontSize:c.shortName.length>6?'1.5rem':'2.5rem', fontWeight:900, color:'rgba(255,255,255,.25)', letterSpacing:'.05em', textTransform:'uppercase', lineHeight:1, textShadow:'none', fontStyle:'italic' }}>
          {c.logoText}
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:4 }}>{c.romCount} juegos</div>
      </div>
    </div>
  );
}

// ─── ROM List View ────────────────────────────────────────────────────────────
function RomListView({ console: c, onSelectRom, onBack }: { console: Console; onSelectRom: (r: Rom) => void; onBack: () => void }) {
  const [search, setSearch] = useState('');
  const filtered = c.roms.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.genre.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{ padding:24, flex:1, overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <button className="btn-icon" onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, color:'hsl(var(--muted-foreground))', border:'none', background:'transparent', cursor:'pointer' }}>
          <Icon name="arrowLeft" size={18}/> Volver
        </button>
        <h2 style={{ margin:0, fontSize:'1.3rem', fontWeight:700 }}>{c.name}</h2>
        <span style={{ fontSize:12, color:'hsl(var(--muted-foreground))', background:'hsl(var(--muted))', padding:'2px 10px', borderRadius:20, border:'1px solid hsl(var(--border))' }}>
          Emulador: {c.emulator}
        </span>
        <div style={{ marginLeft:'auto', position:'relative' }}>
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'hsl(var(--muted-foreground))', pointerEvents:'none' }}><Icon name="search" size={14}/></span>
          <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ROM..."
            style={{ background:'hsl(var(--muted))', border:'1px solid hsl(var(--border))', borderRadius:'0.5rem', color:'hsl(var(--foreground))', padding:'6px 10px 6px 32px', outline:'none', fontSize:13, width:200 }} />
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.map(rom => (
          <div key={rom.id} onClick={()=>onSelectRom(rom)}
            style={{ background:'hsl(var(--card))', border:'1px solid hsl(var(--border))', borderRadius:'0.875rem', padding:'14px 18px', display:'flex', alignItems:'center', gap:16, cursor:'pointer', transition:'border-color .15s, transform .15s' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='hsl(var(--primary)/.4)';(e.currentTarget as HTMLDivElement).style.transform='translateX(3px)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='';(e.currentTarget as HTMLDivElement).style.transform='';}}>
            {/* Thumbnail placeholder */}
            <div style={{ width:64, height:64, borderRadius:'.5rem', background:`linear-gradient(135deg,hsl(var(--muted)),hsl(var(--border)))`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'1.8rem' }}>🎮</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                <span style={{ fontWeight:600, fontSize:15 }}>{rom.title}</span>
                <span style={{ fontSize:11, background:'hsl(var(--muted))', color:'hsl(var(--muted-foreground))', padding:'1px 7px', borderRadius:20 }}>{rom.region}</span>
                <Stars rating={rom.rating}/>
              </div>
              <div style={{ display:'flex', gap:16, fontSize:12, color:'hsl(var(--muted-foreground))' }}>
                <span><Icon name="tag" size={12}/> {rom.genre}</span>
                <span><Icon name="users" size={12}/> {rom.players} jugador{rom.players!=='1'?'es':''}</span>
                <span><Icon name="calendar" size={12}/> {rom.year}</span>
                <span><Icon name="hdd" size={12}/> {rom.size}</span>
              </div>
            </div>
            <button className="btn-primary" style={{ padding:'6px 14px', fontSize:12, flexShrink:0 }} onClick={e=>{e.stopPropagation();onSelectRom(rom);}}>Ver detalles</button>
          </div>
        ))}
        {filtered.length===0&&<div style={{ textAlign:'center', color:'hsl(var(--muted-foreground))', padding:40 }}>No se encontraron ROMs</div>}
      </div>
    </div>
  );
}

// ─── ROM Detail View ──────────────────────────────────────────────────────────
function RomDetailView({ rom, console: c, onBack }: { rom: Rom; console: Console; onBack: () => void }) {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [activeTab, setActiveTab] = useState<'info'|'video'|'screenshots'>('info');
  const fileInputRef = { current: null as HTMLInputElement|null };

  function handleDownload() {
    setDownloading(true); setProgress(0);
    let p=0;
    const iv = setInterval(()=>{
      p+=Math.random()*12;
      if(p>=100){ p=100; clearInterval(iv);
        setTimeout(()=>{ setDownloading(false); setProgress(0); setDownloaded(true);
          showToast(`${rom.title} descargado correctamente`,'success');
          window.open(rom.downloadUrl,'_blank');
        },600);
      }
      setProgress(Math.min(p,100));
    }, 200);
  }

  function handleExecute() {
    if(filePath){ showToast(`Ejecutando: ${filePath}`,'success'); }
    else { showToast(`Abriendo ${rom.title} en ${c.emulator}...`,'success'); }
  }

  function handleSelectFile() {
    const inp = document.createElement('input');
    inp.type='file';
    inp.accept=c.fileExtensions.join(',');
    inp.onchange=(e:Event)=>{
      const f=(e.target as HTMLInputElement).files?.[0];
      if(f){ setFilePath(f.name); setDownloaded(true); showToast(`Archivo seleccionado: ${f.name}`,'success'); }
    };
    inp.click();
  }

  const tabs = ['info','video','screenshots'] as const;
  const tabLabels = { info:'Información', video:'Video', screenshots:'Imágenes' };

  return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
      {/* Hero banner */}
      <div style={{ background:c.gradient, padding:'24px 28px', position:'relative', overflow:'hidden', flexShrink:0 }}>
        <div style={{ position:'absolute', inset:0, opacity:.07, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,.3) 24px,rgba(255,255,255,.3) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,.3) 24px,rgba(255,255,255,.3) 25px)', pointerEvents:'none' }}/>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'white', borderRadius:'0.5rem', padding:'5px 14px', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:16, backdropFilter:'blur(6px)' }}>
          <Icon name="arrowLeft" size={15}/> Volver a {c.name}
        </button>
        <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ width:100, height:100, borderRadius:'1rem', background:'rgba(0,0,0,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', flexShrink:0, border:'2px solid rgba(255,255,255,.2)' }}>🎮</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
              <h1 style={{ margin:0, fontSize:'1.5rem', fontWeight:800, color:'white', textShadow:'0 2px 8px rgba(0,0,0,.3)' }}>{rom.title}</h1>
              <span style={{ background:'rgba(255,255,255,.2)', color:'white', fontSize:11, padding:'2px 9px', borderRadius:20, backdropFilter:'blur(6px)' }}>{rom.region}</span>
            </div>
            <div style={{ display:'flex', gap:14, fontSize:13, color:'rgba(255,255,255,.8)', marginBottom:12, flexWrap:'wrap' }}>
              <span>🎮 {rom.genre}</span>
              <span>👥 {rom.players} jugador{rom.players!=='1'?'es':''}</span>
              <span>📅 {rom.year}</span>
              <span>💾 {rom.size}</span>
              <span>🏢 {rom.developer}</span>
            </div>
            <Stars rating={rom.rating}/>
          </div>
        </div>
      </div>

      <div style={{ padding:'20px 24px', flex:1 }}>
        {/* Tab navigation */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid hsl(var(--border))', marginBottom:20 }}>
          {tabs.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)}
              style={{ border:'none', background:'transparent', cursor:'pointer', padding:'8px 18px', fontSize:13, fontWeight:500,
                color: activeTab===tab ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                borderBottom: activeTab===tab ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                marginBottom:-1 }}>
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        {activeTab==='info' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'start' }}>
            <div>
              <h3 style={{ margin:'0 0 10px', fontSize:15, fontWeight:600 }}>Descripción</h3>
              <p style={{ color:'hsl(var(--muted-foreground))', fontSize:14, lineHeight:1.7, margin:'0 0 24px' }}>{rom.description}</p>
              <h3 style={{ margin:'0 0 12px', fontSize:15, fontWeight:600 }}>Instrucciones de instalación</h3>
              <div style={{ background:'hsl(var(--card))', border:'1px solid hsl(var(--border))', borderRadius:'.875rem', padding:'16px 20px' }}>
                {rom.instructions.map((step,i)=>(
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom: i<rom.instructions.length-1?12:0 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'hsl(var(--primary)/.2)', color:'hsl(var(--primary))', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{i+1}</div>
                    <span style={{ color:'hsl(var(--muted-foreground))', fontSize:13, lineHeight:1.6 }}>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16, padding:'12px 16px', background:'hsl(var(--muted))', borderRadius:'.75rem', fontSize:13, color:'hsl(var(--muted-foreground))' }}>
                <strong style={{ color:'hsl(var(--foreground))' }}>Formatos soportados:</strong> {c.fileExtensions.join(', ')}
              </div>
            </div>
            {/* Download panel */}
            <div style={{ width:260, background:'hsl(var(--card))', border:'1px solid hsl(var(--border))', borderRadius:'1rem', padding:18, flexShrink:0 }}>
              <h4 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600 }}>Descargar & Ejecutar</h4>
              {downloading ? (
                <div>
                  <div style={{ fontSize:13, color:'hsl(var(--muted-foreground))', marginBottom:8 }}>Descargando... {Math.round(progress)}%</div>
                  <ProgressBar value={progress}/>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <button className="btn-primary" onClick={handleDownload} style={{ width:'100%', justifyContent:'center', padding:'9px 0', fontSize:13 }}>
                    <Icon name="download" size={15}/> Descargar ROM
                  </button>
                  {downloaded ? (
                    <button onClick={handleExecute} style={{ width:'100%', background:'hsl(142 70% 35%)', color:'white', border:'none', borderRadius:'.5rem', padding:'9px 0', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      <Icon name="run" size={15}/> Ejecutar con {c.emulator}
                    </button>
                  ) : (
                    <button onClick={handleSelectFile} style={{ width:'100%', background:'hsl(var(--secondary))', color:'hsl(var(--secondary-foreground))', border:'1px solid hsl(var(--border))', borderRadius:'.5rem', padding:'9px 0', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      <Icon name="fileOpen" size={15}/> Seleccionar archivo
                    </button>
                  )}
                  {filePath && (
                    <div style={{ fontSize:12, color:'hsl(var(--muted-foreground))', padding:'6px 10px', background:'hsl(var(--muted))', borderRadius:'.5rem', wordBreak:'break-all' }}>
                      📁 {filePath}
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginTop:14, borderTop:'1px solid hsl(var(--border))', paddingTop:14, display:'flex', flexDirection:'column', gap:8, fontSize:12, color:'hsl(var(--muted-foreground))' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Emulador</span><strong style={{ color:'hsl(var(--foreground))' }}>{c.emulator}</strong></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Tamaño</span><strong style={{ color:'hsl(var(--foreground))' }}>{rom.size}</strong></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Región</span><strong style={{ color:'hsl(var(--foreground))' }}>{rom.region}</strong></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Año</span><strong style={{ color:'hsl(var(--foreground))' }}>{rom.year}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Video */}
        {activeTab==='video' && (
          <div>
            <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600 }}>Gameplay — {rom.title}</h3>
            <div style={{ position:'relative', width:'100%', paddingBottom:'56.25%', borderRadius:'1rem', overflow:'hidden', background:'#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${rom.videoId}?rel=0&modestbranding=1`}
                title={rom.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
              />
            </div>
          </div>
        )}

        {/* Tab: Screenshots */}
        {activeTab==='screenshots' && (
          <div>
            <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600 }}>Capturas de pantalla — {rom.title}</h3>
            {rom.screenshots.length > 0 ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                {rom.screenshots.map((src,i)=>(
                  <img key={i} src={src} alt={`Screenshot ${i+1}`} style={{ width:'100%', borderRadius:'.75rem', border:'1px solid hsl(var(--border))', objectFit:'cover', aspectRatio:'16/9' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
                ))}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, color:'hsl(var(--muted-foreground))', gap:12, background:'hsl(var(--card))', borderRadius:'1rem', border:'1px solid hsl(var(--border))' }}>
                <Icon name="image" size={40}/>
                <p style={{ margin:0, fontSize:14 }}>Capturas no disponibles para esta ROM</p>
                <button className="btn-secondary" style={{ fontSize:13 }} onClick={()=>setActiveTab('video')}>
                  <Icon name="video" size={14}/> Ver video en su lugar
                </button>
              </div>
            )}
          </div>
        )}
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

  if(!romsData) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60%', color:'hsl(var(--muted-foreground))' }}>Cargando consolas...</div>;

  if(view.type==='rom') return <RomDetailView rom={view.rom} console={view.console} onBack={()=>setView({type:'roms',console:view.console})}/>;
  if(view.type==='roms') return <RomListView console={view.console} onSelectRom={rom=>setView({type:'rom',console:view.console,rom})} onBack={()=>setView({type:'list'})}/>;

  return (
    <div style={{ padding:24, flex:1, overflowY:'auto' }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:'0 0 4px', fontSize:'1.3rem', fontWeight:700 }}>Juegos Roms</h2>
        <p style={{ color:'hsl(var(--muted-foreground))', fontSize:14, margin:0 }}>Selecciona una consola para ver sus juegos disponibles</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {romsData.consoles.map(c=>(
          <ConsoleBanner key={c.id} console={c} onClick={()=>setView({type:'roms',console:c})}/>
        ))}
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
    const ms = search==='' || app.name.toLowerCase().includes(search.toLowerCase()) || app.description.toLowerCase().includes(search.toLowerCase()) || app.tags.some(t=>t.toLowerCase().includes(search.toLowerCase()));
    const mc = activeCategory==='Todos' || activeCategory==='Actualizaciones' || app.category===activeCategory;
    return ms && mc && online;
  });

  function selectCat(cat:string){ setActiveCategory(cat); setSelectedApp(null); setSearch(''); }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', fontFamily:'Inter,system-ui,sans-serif', background:'hsl(var(--background))', color:'hsl(var(--foreground))' }}>
      <Titlebar online={online} onToggle={()=>{setOnline(p=>!p);setSelectedApp(null);}} search={search} onSearch={setSearch}/>
      {/* Sub-nav */}
      <div style={{ background:'hsl(230 28% 9%)', borderBottom:'1px solid hsl(var(--border))', display:'flex', alignItems:'center', height:36, padding:'0 12px', gap:4, flexShrink:0 }}>
        <button className="btn-icon" style={{ fontSize:13 }} onClick={()=>showToast('Volviendo...','info')}>Volver</button>
        <button className="btn-icon" style={{ fontSize:13 }} onClick={()=>showToast('Volviendo...','info')}>Volver</button>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar active={activeCategory} onSelect={selectCat}/>

        <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>
          {/* Background clock */}
          <div style={{ position:'absolute', top:8, right:16, zIndex:0, pointerEvents:'none' }}><Clock opacity={0.06}/></div>

          {!online ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80%', gap:14, color:'hsl(var(--muted-foreground))' }}>
              <span style={{ fontSize:'3.5rem', opacity:.4 }}>📡</span>
              <p style={{ margin:0, fontSize:16 }}>Sin conexión a internet</p>
              <button className="btn-primary" onClick={()=>setOnline(true)} style={{ marginTop:4 }}><Icon name="wifi" size={15}/> Reconectar</button>
            </div>
          ) : activeCategory==='Juegos Roms' ? (
            <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}>
              <JuegosRomsSection/>
            </div>
          ) : activeCategory==='Actualizaciones' ? (
            <div style={{ padding:24, zIndex:1 }}>
              <h2 style={{ margin:'0 0 6px', fontSize:'1.3rem', fontWeight:700 }}>Actualizaciones</h2>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, color:'hsl(var(--muted-foreground))', gap:10 }}>
                <span style={{ fontSize:'3rem' }}>✅</span>
                <p style={{ margin:0 }}>Todo está al día</p>
              </div>
            </div>
          ) : selectedApp ? (
            <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', zIndex:1 }}>
              <AppDetailView app={selectedApp} onBack={()=>setSelectedApp(null)}/>
            </div>
          ) : (
            <div style={{ flex:1, overflowY:'auto', zIndex:1, padding:24 }}>
              <div className="apps-grid">
                {filteredApps.length===0 ? (
                  <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, color:'hsl(var(--muted-foreground))', gap:10 }}>
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
