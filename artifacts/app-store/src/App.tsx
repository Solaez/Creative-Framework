import { useState, useEffect, useRef } from "react";
import { APPS, CATEGORIES, type App, type AppCategory } from "./data/apps";

// ─── Icons ────────────────────────────────────────────────────────────────────
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const icons: Record<string, string> = {
    grid: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    refresh: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    monitor: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    cpu: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
    gamepad: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="11" x2="15" y2="11" stroke-width="3" stroke-linecap="round"/><line x1="18" y1="13" x2="18" y2="13" stroke-width="3" stroke-linecap="round"/><path d="M6 6h12c2.21 0 4 1.79 4 4v4c0 2.21-1.79 4-4 4H6c-2.21 0-4-1.79-4-4v-4c0-2.21 1.79-4 4-4z"/></svg>`,
    code: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    pen: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    disc: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`,
    folder: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    wrench: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    search: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    bell: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    download: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    arrowLeft: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    user: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    wifi: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3" stroke-linecap="round"/></svg>`,
    wifiOff: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3" stroke-linecap="round"/></svg>`,
    check: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    x: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="3" stroke-linecap="round"/></svg>`,
    star: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    external: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    tag: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" stroke-width="3" stroke-linecap="round"/></svg>`,
  };
  return <span dangerouslySetInnerHTML={{ __html: icons[name] || '' }} style={{ display: 'inline-flex', alignItems: 'center' }} />;
}

// ─── Clock Component ──────────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = time.getHours().toString().padStart(2, '0');
  const m = time.getMinutes().toString().padStart(2, '0');
  const d = time.getDate().toString().padStart(2, '0');
  return (
    <div className="clock" style={{ lineHeight: 1 }}>
      {h}:{m}
      <span style={{ fontSize: '1rem', marginLeft: '8px', verticalAlign: 'top', marginTop: '6px', display: 'inline-block', opacity: 0.6 }}>{d}</span>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; text: string; type: 'success' | 'info' | 'error' }
let toastId = 0;
let _setToasts: React.Dispatch<React.SetStateAction<ToastMsg[]>> | null = null;
export function showToast(text: string, type: 'success' | 'info' | 'error' = 'success') {
  if (_setToasts) {
    const id = ++toastId;
    _setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => _setToasts!(prev => prev.filter(t => t.id !== id)), 3000);
  }
}

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  useEffect(() => { _setToasts = setToasts; return () => { _setToasts = null; }; }, []);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: t.type === 'success' ? '#2ecc71' : t.type === 'error' ? '#e74c3c' : '#3498db' }}>
            {t.type === 'success' ? <Icon name="check" size={16} /> : t.type === 'error' ? <Icon name="x" size={16} /> : <Icon name="info" size={16} />}
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ─── App Card ────────────────────────────────────────────────────────────────
function AppCard({ app, onClick }: { app: App; onClick: () => void }) {
  return (
    <div className="app-card glass-card" onClick={onClick} style={{ borderRadius: '1rem', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
      {/* Banner */}
      <div style={{ height: 160, background: `linear-gradient(135deg, ${app.color}88 0%, ${app.color}44 50%, #0d0d1a 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ fontSize: '4rem' }}>{app.icon}</span>
        {app.isNew && (
          <span style={{ position: 'absolute', top: 10, right: 10, background: 'hsl(var(--primary))', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>new</span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{app.name}</div>
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{app.category.toLowerCase()}</div>
        </div>
        <button className="btn-primary" style={{ padding: '5px 14px', fontSize: 12 }} onClick={e => { e.stopPropagation(); onClick(); }}>
          Detalles
        </button>
      </div>
    </div>
  );
}

// ─── Detail View ─────────────────────────────────────────────────────────────
function DetailView({ app, onBack }: { app: App; onBack: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  function handleDownload() {
    setDownloading(true);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          setDownloading(false);
          setProgress(0);
          showToast(`${app.name} descargado correctamente`, 'success');
          window.open(app.downloadUrl, '_blank');
        }, 500);
      }
      setProgress(Math.min(p, 100));
    }, 200);
  }

  return (
    <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      <button className="btn-icon" onClick={onBack} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>
        <Icon name="arrowLeft" size={18} /> Volver
      </button>

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        {/* Banner */}
        <div style={{ width: 220, height: 180, borderRadius: '1rem', background: `linear-gradient(135deg, ${app.color}99 0%, ${app.color}44 60%, #0d0d1a 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '5rem' }}>{app.icon}</span>
        </div>

        {/* Info panel */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 700 }}>{app.name}</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, lineHeight: 1.65, marginBottom: 16 }}>{app.description}</p>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {app.tags.map(tag => (
              <span key={tag} style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontSize: 11, padding: '2px 8px', borderRadius: '20px', border: '1px solid hsl(var(--border))' }}>#{tag}</span>
            ))}
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, fontSize: 13 }}>
            <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Versión: </span><strong>{app.version}</strong></div>
            <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Tamaño: </span><strong>{app.size}</strong></div>
            <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Categoría: </span><strong>{app.category}</strong></div>
          </div>

          {/* Download button */}
          {downloading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
              <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Descargando... {Math.round(progress)}%</div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <button className="btn-primary" onClick={handleDownload} style={{ fontSize: 14, padding: '9px 22px' }}>
              <Icon name="download" size={16} /> Download
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: 28, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '1rem', padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Instrucciones de instalación</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {app.instructions.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: 'hsl(var(--primary))', fontWeight: 600, minWidth: 20 }}>{i + 1}</span>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{step.replace(/^\d+ - /, '')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App Grid ────────────────────────────────────────────────────────────
function AppGrid({ apps, onSelect }: { apps: App[]; onSelect: (a: App) => void }) {
  if (apps.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: 'hsl(var(--muted-foreground))' }}>
        <span style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</span>
        <p style={{ margin: 0 }}>No se encontraron aplicaciones</p>
      </div>
    );
  }
  return (
    <div className="apps-grid" style={{ padding: '24px' }}>
      {apps.map(app => <AppCard key={app.id} app={app} onClick={() => onSelect(app)} />)}
    </div>
  );
}

// ─── Titlebar ────────────────────────────────────────────────────────────────
function Titlebar({ online, onToggleOnline, search, onSearch }: {
  online: boolean;
  onToggleOnline: () => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="titlebar" style={{ background: 'hsl(230 28% 9%)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', height: 44, gap: 0, flexShrink: 0, position: 'relative' }}>
      {/* Traffic lights (decorative) */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block', cursor: 'pointer' }} title="Close" />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block', cursor: 'pointer' }} title="Minimize" />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block', cursor: 'pointer' }} title="Maximize" />
      </div>

      {/* Tabs */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'stretch', height: '100%', borderRight: '1px solid hsl(var(--border))' }}>
        <button
          onClick={onToggleOnline}
          className={`tab-item ${online ? 'active' : ''}`}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          Online
          {online && <span className="notif-dot" style={{ width: 6, height: 6 }} />}
        </button>
        <button
          onClick={onToggleOnline}
          className={`tab-item ${!online ? 'active' : ''}`}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          Sin conexión
        </button>
      </div>

      {/* Search */}
      <div className="no-drag" style={{ position: 'relative', flex: '0 0 240px', margin: '0 16px' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }}>
          <Icon name="search" size={14} />
        </span>
        <input
          type="search"
          className="search-bar"
          placeholder="Buscar..."
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={{ height: 30, fontSize: 13 }}
        />
      </div>

      {/* Version notice */}
      <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
        Nueva version disponible sjjssj XD v1.0
      </div>

      {/* Clock + actions */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
        <Clock />
        <button className="btn-icon" onClick={() => showToast('No hay actualizaciones disponibles', 'info')} title="Notificaciones">
          <Icon name="download" size={18} />
          <span style={{ fontSize: 10, background: 'hsl(var(--primary))', color: 'white', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: -6, marginTop: -8 }}>0</span>
        </button>
        <button className="btn-icon" onClick={() => showToast('Sin notificaciones', 'info')} title="Notificaciones">
          <Icon name="bell" size={18} />
        </button>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
          👤
        </div>
      </div>
    </div>
  );
}

// ─── Sub‑header navigation ────────────────────────────────────────────────────
function SubHeader() {
  return (
    <div style={{ background: 'hsl(230 28% 9%)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', height: 38, padding: '0 12px', gap: 4, flexShrink: 0 }}>
      <button className="btn-icon" style={{ fontSize: 13, color: 'hsl(var(--foreground))' }} onClick={() => showToast('Volviendo...', 'info')}>
        Volver
      </button>
      <button className="btn-icon" style={{ fontSize: 13, color: 'hsl(var(--foreground))' }} onClick={() => showToast('Volviendo...', 'info')}>
        Volver
      </button>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  Todos: 'grid',
  Actualizaciones: 'refresh',
  Programas: 'monitor',
  Drivers: 'cpu',
  Juegos: 'gamepad',
  Desarrollos: 'code',
  Diseño: 'pen',
  Emuladores: 'disc',
  'Juegos Roms': 'folder',
  Proyectos: 'wrench',
};

function Sidebar({ activeCategory, onSelect, updateCount }: {
  activeCategory: string;
  onSelect: (c: string) => void;
  updateCount: number;
}) {
  return (
    <div style={{ width: 'var(--sidebar-width, 200px)', background: 'hsl(230 28% 8%)', borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', padding: '12px 8px', overflowY: 'auto', flexShrink: 0 }}>
      <div className="category-label">Apps</div>
      {['Todos', 'Actualizaciones'].map(cat => (
        <button
          key={cat}
          className={`sidebar-item ${activeCategory === cat ? 'active' : ''}`}
          onClick={() => onSelect(cat)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%', textAlign: 'left', fontSize: 13, color: 'hsl(var(--foreground))' }}
        >
          <span style={{ color: activeCategory === cat ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
            <Icon name={CATEGORY_ICONS[cat] || 'folder'} size={15} />
          </span>
          {cat}
          {cat === 'Actualizaciones' && updateCount > 0 && (
            <span style={{ marginLeft: 'auto', background: 'hsl(var(--primary))', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: '20px', padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{updateCount}</span>
          )}
        </button>
      ))}

      <div className="category-label" style={{ marginTop: 10 }}>Categorías</div>
      {['Programas', 'Drivers', 'Juegos', 'Desarrollos', 'Diseño', 'Emuladores', 'Juegos Roms', 'Proyectos'].map(cat => (
        <button
          key={cat}
          className={`sidebar-item ${activeCategory === cat ? 'active' : ''}`}
          onClick={() => onSelect(cat)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%', textAlign: 'left', fontSize: 13, color: 'hsl(var(--foreground))' }}
        >
          <span style={{ color: activeCategory === cat ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
            <Icon name={CATEGORY_ICONS[cat] || 'folder'} size={15} />
          </span>
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [online, setOnline] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);

  // Filter apps
  const filteredApps = APPS.filter(app => {
    const matchesSearch = search === '' ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase()) ||
      app.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === 'Todos' || activeCategory === 'Actualizaciones' || app.category === activeCategory;
    const matchesOnline = online ? true : false; // offline shows nothing by default (simulate no connection)
    return matchesSearch && matchesCategory && matchesOnline;
  });

  function handleCategorySelect(cat: string) {
    setActiveCategory(cat);
    setSelectedApp(null);
    setSearch('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Titlebar
        online={online}
        onToggleOnline={() => { setOnline(p => !p); setSelectedApp(null); }}
        search={search}
        onSearch={setSearch}
      />
      <SubHeader />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activeCategory={activeCategory} onSelect={handleCategorySelect} updateCount={0} />

        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {/* Background clock */}
          <div style={{ position: 'absolute', top: 8, right: 16, pointerEvents: 'none', zIndex: 0 }}>
            <Clock />
          </div>

          {!online ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', color: 'hsl(var(--muted-foreground))', gap: 12, zIndex: 1, position: 'relative' }}>
              <span style={{ fontSize: '3.5rem', opacity: 0.4 }}>📡</span>
              <p style={{ margin: 0, fontSize: 16 }}>Sin conexión a internet</p>
              <p style={{ margin: 0, fontSize: 13 }}>Conéctate para ver las aplicaciones</p>
              <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setOnline(true)}>
                <Icon name="wifi" size={15} /> Reconectar
              </button>
            </div>
          ) : selectedApp ? (
            <DetailView app={selectedApp} onBack={() => setSelectedApp(null)} />
          ) : (
            <div style={{ position: 'relative', zIndex: 1 }}>
              {activeCategory === 'Actualizaciones' ? (
                <div style={{ padding: 24 }}>
                  <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 700 }}>Actualizaciones</h2>
                  <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, margin: '0 0 20px' }}>Todas las aplicaciones están al día</p>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'hsl(var(--muted-foreground))', gap: 10 }}>
                    <span style={{ fontSize: '3rem' }}>✅</span>
                    <p style={{ margin: 0 }}>No hay actualizaciones disponibles</p>
                  </div>
                </div>
              ) : (
                <AppGrid apps={filteredApps} onSelect={setSelectedApp} />
              )}
            </div>
          )}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
