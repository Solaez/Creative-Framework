import React, { useState, useEffect, useRef, useCallback } from "react";
import type { App } from "./data/apps";
import { AdminPanel, loadCustomApps, loadCustomConsoles } from "./AdminPanel";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Rom { id:string;title:string;region:string;size:string;rating:number;year:number;genre:string;players:string;description:string;developer:string;downloadUrl:string;coverUrl:string;screenshots:string[];videoId:string;instructions:string[]; }
interface Console { id:string;name:string;shortName:string;gradient:string;logoText:string;description:string;emulator:string;fileExtensions:string[];romCount:number;roms:Rom[]; }
interface RomsData { consoles: Console[] }
interface AppsData { apps: App[] }
type Theme = 'default' | 'moody' | 'midnight' | 'forest' | 'fire';
type Language = 'es' | 'en';
interface DownloadRecord { id: string; name: string; icon: string; type: 'app'|'rom'; category: string; size: string; date: string; }
const DOWNLOAD_HISTORY_KEY = 'appstore_download_history';
function loadDownloadHistory(): DownloadRecord[] {
  try { return JSON.parse(localStorage.getItem(DOWNLOAD_HISTORY_KEY)||'[]'); } catch { return []; }
}
function saveDownloadRecord(record: DownloadRecord) {
  const history = loadDownloadHistory();
  const updated = [record, ...history.filter(r=>r.id!==record.id)].slice(0,100);
  localStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(updated));
}

// ─── Download Options ─────────────────────────────────────────────────────────
interface DownloadOption {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  size: string;
  url: string;
  badge?: string;
  required?: boolean;
}

const COMMON_DEPS: Record<string, DownloadOption[]> = {
  vcpp: [{ id:'vcpp64', label:'Visual C++ 2022 x64', sublabel:'Runtime necesario para programas Windows 64-bit', icon:'⚙️', size:'25 MB', url:'https://aka.ms/vs/17/release/vc_redist.x64.exe', badge:'Requerido' },
         { id:'vcpp86', label:'Visual C++ 2022 x86', sublabel:'Runtime 32-bit para compatibilidad', icon:'⚙️', size:'14 MB', url:'https://aka.ms/vs/17/release/vc_redist.x86.exe' }],
  dotnet: [{ id:'dotnet48', label:'.NET Framework 4.8', sublabel:'Framework de Microsoft para aplicaciones .NET', icon:'📦', size:'65 MB', url:'https://dotnet.microsoft.com/en-us/download/dotnet-framework/net48', badge:'Requerido' }],
  dotnet6: [{ id:'dotnet6', label:'.NET 6 Runtime', sublabel:'Runtime moderno de .NET 6', icon:'📦', size:'52 MB', url:'https://dotnet.microsoft.com/en-us/download/dotnet/6.0', badge:'Requerido' }],
  directx: [{ id:'dx', label:'DirectX Runtime', sublabel:'Componentes gráficos DirectX para juegos', icon:'🎮', size:'95 MB', url:'https://www.microsoft.com/download/details.aspx?id=35', badge:'Requerido' }],
  openal: [{ id:'openal', label:'OpenAL Audio', sublabel:'Librería de audio para juegos', icon:'🔊', size:'3 MB', url:'https://www.openal.org/downloads/', badge:'Opcional' }],
  xna: [{ id:'xna', label:'XNA Framework 4.0', sublabel:'Framework de Microsoft para juegos XNA', icon:'🕹️', size:'23 MB', url:'https://www.microsoft.com/download/details.aspx?id=20914', badge:'Requerido' }],
};

function getAppDownloadOptions(app: App): { main: DownloadOption[]; deps: DownloadOption[] } {
  const main: DownloadOption[] = [
    { id:`main-x64`, label:`${app.name} v${app.version} (64-bit)`, sublabel:`${app.platform} · Instalador recomendado`, icon: app.icon, size: app.size, url: app.downloadUrl, badge:'Principal' },
    { id:`main-x86`, label:`${app.name} v${app.version} (32-bit)`, sublabel:`${app.platform} · Versión legacy`, icon: app.icon, size: app.size, url: app.downloadUrl },
  ];
  let deps: DownloadOption[] = [];
  const cat = app.category;
  if (cat === 'Drivers') {
    deps = [...COMMON_DEPS.vcpp];
  } else if (cat === 'Juegos') {
    deps = [...COMMON_DEPS.directx, ...COMMON_DEPS.vcpp, ...COMMON_DEPS.openal];
  } else if (cat === 'Desarrollos') {
    deps = [...COMMON_DEPS.dotnet6, ...COMMON_DEPS.vcpp];
  } else if (cat === 'Emuladores') {
    deps = [...COMMON_DEPS.vcpp, ...COMMON_DEPS.dotnet48, ...COMMON_DEPS.openal];
  } else if (cat === 'Diseño') {
    deps = [...COMMON_DEPS.vcpp, ...COMMON_DEPS.dotnet48];
  } else {
    deps = [...COMMON_DEPS.vcpp, ...COMMON_DEPS.dotnet48];
  }
  return { main, deps };
}

function getRomDownloadOptions(rom: Rom, consoleName: string): { main: DownloadOption[]; deps: DownloadOption[] } {
  const main: DownloadOption[] = [
    { id:`rom-main`, label:`${rom.title} (${rom.region})`, sublabel:`${consoleName} · ${rom.genre} · ${rom.year} · ${rom.players} jugador(es)`, icon:'🎮', size: rom.size, url: rom.downloadUrl, badge:'ROM' },
    { id:`rom-alt`, label:`${rom.title} (Alt / Sin parches)`, sublabel:`Versión alternativa sin modificaciones`, icon:'💾', size: rom.size, url: rom.downloadUrl },
  ];
  const deps: DownloadOption[] = [...COMMON_DEPS.vcpp, ...COMMON_DEPS.openal];
  return { main, deps };
}

// ─── Download Modal ───────────────────────────────────────────────────────────
function DownloadModal({ title, icon, version, main, deps, onClose, onDownloaded }:
  { title:string; icon:string; version:string; main:DownloadOption[]; deps:DownloadOption[]; onClose:()=>void; onDownloaded:(opt:DownloadOption)=>void }) {
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string|null>(null);

  function handleDownload(opt: DownloadOption) {
    if (downloading) return;
    setDownloading(opt.id);
    let p = 0;
    const iv = setInterval(()=>{
      p += Math.random()*22;
      if (p >= 100) {
        clearInterval(iv);
        setDownloaded(prev => new Set([...prev, opt.id]));
        setDownloading(null);
        showToast(`${opt.label} descargado`, 'success');
        onDownloaded(opt);
        window.open(opt.url, '_blank');
      }
    }, 180);
  }

  const badgeColor: Record<string,string> = { Principal:'hsl(var(--primary))', Requerido:'#ef4444', Opcional:'#f59e0b', ROM:'#8b5cf6' };

  function OptionRow({ opt }: { opt: DownloadOption }) {
    const done = downloaded.has(opt.id);
    const busy = downloading === opt.id;
    return (
      <div style={{ display:'flex',alignItems:'center',gap:14,background:'rgba(255,255,255,.04)',border:`1px solid ${done?'rgba(34,197,94,.35)':'rgba(255,255,255,.08)'}`,borderRadius:'.875rem',padding:'13px 16px',transition:'border-color .2s' }}>
        <div style={{ width:44,height:44,borderRadius:'.625rem',background:'rgba(255,255,255,.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0 }}>{opt.icon}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap' }}>
            <span style={{ fontWeight:600,fontSize:14,color:'rgba(255,255,255,.9)' }}>{opt.label}</span>
            {opt.badge&&<span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:`${badgeColor[opt.badge]||'#6b7280'}22`,color:badgeColor[opt.badge]||'#9ca3af',border:`1px solid ${badgeColor[opt.badge]||'#6b7280'}44`,textTransform:'uppercase',letterSpacing:'.06em' }}>{opt.badge}</span>}
          </div>
          <div style={{ fontSize:12,color:'rgba(255,255,255,.4)',lineHeight:1.4 }}>{opt.sublabel}</div>
          {busy&&<div style={{ marginTop:6,height:3,background:'rgba(255,255,255,.1)',borderRadius:99,overflow:'hidden' }}><div style={{ height:'100%',background:'hsl(var(--primary))',borderRadius:99,width:'60%',animation:'pulse 1s infinite' }}/></div>}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
          <span style={{ fontSize:12,color:'rgba(255,255,255,.35)',fontWeight:500 }}>{opt.size}</span>
          {done ? (
            <div style={{ width:34,height:34,borderRadius:'50%',background:'rgba(34,197,94,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#22c55e' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          ) : (
            <button onClick={()=>handleDownload(opt)} disabled={!!downloading}
              style={{ width:34,height:34,borderRadius:'50%',background:downloading?'rgba(255,255,255,.06)':'hsl(var(--primary))',border:'none',cursor:downloading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'white',transition:'background .2s',opacity:downloading&&!busy?.4:1 }}>
              {busy ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".8s" repeatCount="indefinite"/></path></svg>
                : <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
            </button>
          )}
        </div>
      </div>
    );
  }

  const allOpts = [...main, ...deps];
  const allDone = allOpts.every(o => downloaded.has(o.id));

  return (
    <div style={{ position:'fixed',inset:0,zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.65)',backdropFilter:'blur(6px)' }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'hsl(230 28% 10%)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'1.25rem',width:'min(560px,95vw)',maxHeight:'82vh',display:'flex',flexDirection:'column',boxShadow:'0 30px 80px rgba(0,0,0,.7)',overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:14,padding:'18px 22px',borderBottom:'1px solid rgba(255,255,255,.08)',flexShrink:0 }}>
          <div style={{ width:48,height:48,borderRadius:'.75rem',background:'rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',flexShrink:0 }}>{icon}</div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontWeight:700,fontSize:16,color:'rgba(255,255,255,.95)',marginBottom:2 }}>Descargar {title}</div>
            <div style={{ fontSize:12,color:'rgba(255,255,255,.4)' }}>v{version} · {allOpts.length} archivos disponibles</div>
          </div>
          <button onClick={onClose} style={{ width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,.08)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.6)',flexShrink:0 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto',padding:'18px 22px',display:'flex',flexDirection:'column',gap:20,flex:1 }}>
          {/* Main files */}
          <div>
            <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',color:'rgba(255,255,255,.3)',marginBottom:10 }}>Archivos de descarga</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {main.map(opt=><OptionRow key={opt.id} opt={opt}/>)}
            </div>
          </div>
          {/* Dependencies */}
          {deps.length>0&&(
            <div>
              <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',color:'rgba(255,255,255,.3)',marginBottom:10 }}>Programas necesarios</div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:10,lineHeight:1.5,background:'rgba(255,165,0,.07)',border:'1px solid rgba(255,165,0,.15)',borderRadius:'.625rem',padding:'8px 12px' }}>
                ⚠️ Instala estos componentes si el programa no abre correctamente en tu sistema.
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {deps.map(opt=><OptionRow key={opt.id} opt={opt}/>)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <span style={{ fontSize:12,color:'rgba(255,255,255,.35)' }}>{downloaded.size}/{allOpts.length} descargado{downloaded.size!==1?'s':''}</span>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,.08)',color:'rgba(255,255,255,.7)',border:'none',borderRadius:'.625rem',padding:'8px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>
              {allDone?'Listo':'Cerrar'}
            </button>
            {!allDone&&<button onClick={()=>{ allOpts.filter(o=>!downloaded.has(o.id)&&downloading!==o.id).forEach((o,i)=>setTimeout(()=>handleDownload(o), i*400)); }}
              disabled={!!downloading}
              style={{ background:'hsl(var(--primary))',color:'white',border:'none',borderRadius:'.625rem',padding:'8px 20px',fontSize:13,fontWeight:700,cursor:downloading?'not-allowed':'pointer',fontFamily:'inherit',opacity:downloading?.6:1,display:'flex',alignItems:'center',gap:8 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Descargar todo
            </button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const s = size;
  const icons: Record<string, React.ReactNode> = {
    home:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    grid:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    refresh:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    monitor:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    cpu:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    gamepad:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="11" r="1" fill="currentColor"/><circle cx="18" cy="13" r="1" fill="currentColor"/><path d="M6 6h12c2.21 0 4 1.79 4 4v4c0 2.21-1.79 4-4 4H6c-2.21 0-4-1.79-4-4v-4c0-2.21 1.79-4 4-4z"/></svg>,
    code:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    pen:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    disc:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
    folder:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    wrench:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    search:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    download:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    arrowLeft: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    arrowRight:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    wifi:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" strokeLinecap="round"/></svg>,
    check:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    x:         <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    info:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" strokeLinecap="round"/></svg>,
    star:      <svg width={s} height={s} viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    starEmpty: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    play:      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    fileOpen:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
    run:       <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    image:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    video:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="15" height="10" rx="2"/><polygon points="22 7 16 12 22 17 22 7" fill="currentColor"/></svg>,
    windows:   <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>,
    trophy:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H4l1 5a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4l1-5h-3"/><line x1="7" y1="4" x2="17" y2="4"/></svg>,
    lock:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    settings:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    user:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    share:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    heart:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    sun:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    globe:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    palette:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
    shield:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    zap:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/></svg>,
    sparkles:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5L12 3z" fill="currentColor"/></svg>,
    flame:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="currentColor"/></svg>,
    tag:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" strokeLinecap="round"/></svg>,
    hdd:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16" strokeWidth="3" strokeLinecap="round"/><line x1="10" y1="16" x2="10.01" y2="16" strokeWidth="3" strokeLinecap="round"/></svg>,
    users:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    calendar:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  };
  return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icons[name] || null}</span>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; text: string; type: 'success'|'info'|'error' }
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
    <div style={{ position:'fixed',bottom:20,right:20,zIndex:999,display:'flex',flexDirection:'column',gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:'.75rem',padding:'10px 16px',fontSize:13,boxShadow:'0 8px 30px rgba(0,0,0,.5)',display:'flex',alignItems:'center',gap:10 }}>
          <span style={{ color: colors[t.type] }}><Icon name={t.type==='success'?'check':t.type==='error'?'x':'info'} size={15}/></span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  const h = t.getHours().toString().padStart(2,'0');
  const m = t.getMinutes().toString().padStart(2,'0');
  const d = t.getDate().toString().padStart(2,'0');
  return <div style={{ fontSize:'1.05rem',fontWeight:700,letterSpacing:'.05em',color:'rgba(255,255,255,.65)',whiteSpace:'nowrap',userSelect:'none' }}>{h}:{m} <span style={{ fontSize:'.7rem',opacity:.6 }}>{d}</span></div>;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color='#e8692a' }: { value:number; color?:string }) {
  return (
    <div style={{ height:4,background:'rgba(255,255,255,.12)',borderRadius:4,overflow:'hidden',width:'100%' }}>
      <div style={{ height:'100%',width:`${value}%`,background:color,borderRadius:4,transition:'width .25s' }}/>
    </div>
  );
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 22 + 8;
      if (p >= 100) { p = 100; clearInterval(iv); }
      setProgress(Math.min(p, 100));
    }, 80);
    const t1 = setTimeout(() => setExiting(true), 2000);
    const t2 = setTimeout(() => onDone(), 2500);
    return () => { clearInterval(iv); clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,background:'hsl(var(--background))',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:28 }}
      className={exiting ? 'splash-exit' : ''}>
      {/* Dot matrix background */}
      <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(circle, rgba(255,255,255,.025) 1px, transparent 1px)',backgroundSize:'24px 24px',pointerEvents:'none' }}/>
      {/* Glow radial */}
      <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:400,height:400,background:'radial-gradient(circle, hsl(var(--primary)/.2), transparent 70%)',pointerEvents:'none' }}/>

      {/* Logo */}
      <div className="splash-logo" style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:16,position:'relative',zIndex:1 }}>
        <div style={{ width:90,height:90,borderRadius:'1.5rem',background:'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.8rem',boxShadow:`0 0 60px hsl(var(--primary)/.4), 0 0 120px hsl(var(--primary)/.15)`,position:'relative' }}>
          <div className="pulse-ring"/>
          <div className="pulse-ring" style={{ animationDelay:'.5s' }}/>
          🚀
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'1.8rem',fontWeight:900,letterSpacing:'-.01em',background:'linear-gradient(135deg,white,hsl(var(--primary)))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>
            AppStore XD
          </div>
          <div style={{ fontSize:13,color:'hsl(var(--muted-foreground))',marginTop:4 }}>v2.0 — Cargando...</div>
        </div>
      </div>

      {/* Loading bar */}
      <div style={{ width:220,position:'relative',zIndex:1 }}>
        <ProgressBar value={progress} color='hsl(var(--primary))'/>
        <div style={{ fontSize:11,color:'hsl(var(--muted-foreground))',textAlign:'center',marginTop:8 }}>{Math.round(progress)}%</div>
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
interface SettingsProps {
  theme: Theme; onTheme: (t: Theme) => void;
  lang: Language; onLang: (l: Language) => void;
  onClose: () => void;
  onAdmin: () => void;
}
const THEMES: { id: Theme; label: string; color: string; icon: string }[] = [
  { id:'default', label:'Oscuro', color:'hsl(250 80% 65%)', icon:'moon' },
  { id:'moody',   label:'Moody',  color:'hsl(280 75% 60%)', icon:'sparkles' },
  { id:'midnight',label:'Medianoche', color:'hsl(210 90% 60%)', icon:'sun' },
  { id:'forest',  label:'Bosque', color:'hsl(145 65% 50%)', icon:'zap' },
  { id:'fire',    label:'Fuego',  color:'hsl(20 90% 55%)',  icon:'flame' },
];
function SettingsPanel({ theme, onTheme, lang, onLang, onClose, onAdmin }: SettingsProps) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(4px)',zIndex:500 }}/>
      <div className="settings-panel" style={{ position:'fixed',right:0,top:0,bottom:0,width:340,background:'hsl(var(--card))',borderLeft:'1px solid hsl(var(--border))',zIndex:501,display:'flex',flexDirection:'column',overflowY:'auto' }}>
        {/* Header */}
        <div style={{ padding:'20px 20px 14px',borderBottom:'1px solid hsl(var(--border))',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:38,height:38,borderRadius:'50%',background:'hsl(var(--muted))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem' }}>👤</div>
            <div>
              <div style={{ fontWeight:700,fontSize:15 }}>Usuario</div>
              <div style={{ fontSize:12,color:'hsl(var(--muted-foreground))' }}>usuario@local</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><Icon name="x" size={18}/></button>
        </div>

        <div style={{ padding:'20px',display:'flex',flexDirection:'column',gap:24 }}>
          {/* Theme */}
          <section>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
              <Icon name="palette" size={16}/>
              <span style={{ fontWeight:600,fontSize:14 }}>Tema de color</span>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={()=>onTheme(t.id)}
                  style={{ border:`2px solid ${theme===t.id ? t.color : 'hsl(var(--border))'}`,background:theme===t.id?`${t.color}18`:'hsl(var(--muted))',borderRadius:'.75rem',padding:'10px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:8,transition:'all .15s',color:'hsl(var(--foreground))' }}>
                  <div style={{ width:14,height:14,borderRadius:'50%',background:t.color,flexShrink:0 }}/>
                  <span style={{ fontSize:13,fontWeight:500 }}>{t.label}</span>
                  {theme===t.id&&<Icon name="check" size={13}/>}
                </button>
              ))}
            </div>
          </section>

          {/* Language */}
          <section>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
              <Icon name="globe" size={16}/>
              <span style={{ fontWeight:600,fontSize:14 }}>Idioma / Language</span>
            </div>
            <div style={{ display:'flex',gap:8 }}>
              {([['es','🇪🇸 Español'],['en','🇺🇸 English']] as [Language,string][]).map(([id,label]) => (
                <button key={id} onClick={()=>onLang(id)}
                  style={{ flex:1,border:`2px solid ${lang===id?'hsl(var(--primary))':'hsl(var(--border))'}`,background:lang===id?'hsl(var(--primary)/.15)':'hsl(var(--muted))',borderRadius:'.75rem',padding:'10px 12px',cursor:'pointer',fontSize:13,fontWeight:500,color:'hsl(var(--foreground))',transition:'all .15s' }}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* App info */}
          <section>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
              <Icon name="shield" size={16}/>
              <span style={{ fontWeight:600,fontSize:14 }}>Acerca del programa</span>
            </div>
            <div style={{ background:'hsl(var(--muted))',borderRadius:'.875rem',padding:'14px 16px',display:'flex',flexDirection:'column',gap:8,fontSize:13 }}>
              {[['Versión','2.0.0'],['Autor','sjjssj'],['Licencia','MIT Open Source'],['Motor','React 19 + Vite 6']].map(([k,v])=>(
                <div key={k} style={{ display:'flex',justifyContent:'space-between' }}>
                  <span style={{ color:'hsl(var(--muted-foreground))' }}>{k}</span>
                  <span style={{ fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Manage content */}
          <section>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
              <Icon name="folder" size={16}/>
              <span style={{ fontWeight:600,fontSize:14 }}>Administrar contenido</span>
            </div>
            <button onClick={()=>{ onClose(); onAdmin(); }}
              style={{ width:'100%',background:'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))',border:'none',borderRadius:'.875rem',padding:'13px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,color:'white',fontFamily:'inherit',transition:'opacity .15s' }}
              onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.opacity='.9'}
              onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.opacity='1'}>
              <div style={{ width:38,height:38,borderRadius:'.75rem',background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0 }}>⚙️</div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontWeight:700,fontSize:14 }}>Abrir gestor de contenido</div>
                <div style={{ fontSize:12,opacity:.75,marginTop:2 }}>Agrega programas, consolas y ROMs</div>
              </div>
              <span style={{ marginLeft:'auto',opacity:.6,fontSize:18 }}>→</span>
            </button>
          </section>

          {/* Clear cache */}
          <section>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
              <Icon name="zap" size={16}/>
              <span style={{ fontWeight:600,fontSize:14 }}>Mantenimiento</span>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              <button className="btn-secondary" style={{ width:'100%',justifyContent:'center' }} onClick={()=>showToast('Caché limpiada','success')}>
                Limpiar caché
              </button>
              <button className="btn-secondary" style={{ width:'100%',justifyContent:'center' }} onClick={()=>showToast('Actualizando...','info')}>
                Buscar actualizaciones
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// ─── Titlebar ────────────────────────────────────────────────────────────────
function Titlebar({ online, onToggle, search, onSearch, onSettings, downloadCount, onOpenDownloads }:
  { online:boolean; onToggle:()=>void; search:string; onSearch:(v:string)=>void; onSettings:()=>void; downloadCount:number; onOpenDownloads:()=>void }) {
  return (
    <div style={{ background:'hsl(230 28% 9%)',borderBottom:'1px solid hsl(var(--border))',display:'flex',alignItems:'center',height:44,flexShrink:0 }}>
      <div style={{ display:'flex',alignItems:'center',gap:6,padding:'0 14px',flexShrink:0 }}>
        {['#ff5f57','#febc2e','#28c840'].map((c,i) => <span key={i} style={{ width:12,height:12,borderRadius:'50%',background:c,display:'inline-block',cursor:'pointer' }}/>)}
      </div>
      <div style={{ display:'flex',alignItems:'stretch',height:'100%',borderRight:'1px solid hsl(var(--border))',flexShrink:0 }}>
        {['Online','Sin conexión'].map((tab,i) => (
          <button key={tab} onClick={onToggle}
            style={{ border:'none',background:'transparent',cursor:'pointer',padding:'0 16px',fontSize:14,color:(i===0)===online?'hsl(var(--foreground))':'hsl(var(--muted-foreground))',borderBottom:(i===0)===online?'2px solid hsl(var(--primary))':'2px solid transparent',display:'flex',alignItems:'center',gap:4,fontFamily:'inherit' }}>
            {tab}{(i===0)&&online&&<span style={{ width:6,height:6,borderRadius:'50%',background:'hsl(var(--primary))',display:'inline-block' }}/>}
          </button>
        ))}
      </div>
      <div style={{ position:'relative',flex:'0 0 240px',margin:'0 14px' }}>
        <span style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'hsl(var(--muted-foreground))',pointerEvents:'none' }}><Icon name="search" size={14}/></span>
        <input type="search" value={search} onChange={e=>onSearch(e.target.value)} placeholder="Buscar..."
          style={{ background:'hsl(var(--muted))',border:'1px solid hsl(var(--border))',borderRadius:'.5rem',color:'hsl(var(--foreground))',padding:'5px 10px 5px 34px',width:'100%',outline:'none',fontSize:13,height:30,fontFamily:'inherit' }}/>
      </div>
      <div style={{ flex:1,textAlign:'center',fontSize:12,color:'hsl(var(--muted-foreground))' }}>AppStore XD v2.0</div>
      <div style={{ display:'flex',alignItems:'center',gap:8,padding:'0 14px' }}>
        <Clock/>
        <button className="btn-icon" onClick={onOpenDownloads} style={{ position:'relative' }} title="Ver historial de descargas">
          <Icon name="download" size={18}/>
          {downloadCount>0&&<span style={{ position:'absolute',top:-4,right:-4,background:'hsl(var(--primary))',color:'white',borderRadius:'50%',width:16,height:16,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700 }}>{downloadCount>99?'99+':downloadCount}</span>}
        </button>
        <button className="btn-icon" onClick={()=>showToast('Sin notificaciones','info')}><Icon name="bell" size={18}/></button>
        {/* Profile button → opens settings */}
        <button onClick={onSettings}
          style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'white',fontWeight:700,transition:'box-shadow .15s' }}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.boxShadow='0 0 0 2px hsl(var(--primary)/.5)'}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.boxShadow=''}>
          👤
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string,string> = {
  Inicio:'home', Todos:'grid', Descargas:'download', Programas:'monitor', Drivers:'cpu',
  Juegos:'gamepad', Desarrollos:'code', Diseño:'pen', Emuladores:'disc', 'Juegos Roms':'folder', Proyectos:'wrench',
};
function Sidebar({ active, onSelect }: { active:string; onSelect:(c:string)=>void }) {
  return (
    <div style={{ width:200,background:'hsl(230 28% 8%)',borderRight:'1px solid hsl(var(--border))',display:'flex',flexDirection:'column',padding:'12px 8px',overflowY:'auto',flexShrink:0 }}>
      {/* Home */}
      <div style={{ marginBottom:8 }}>
        <SideItem cat="Inicio" active={active} onSelect={onSelect} accent/>
      </div>
      <div style={{ height:1,background:'hsl(var(--border))',margin:'2px 4px 10px' }}/>
      <div style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'hsl(var(--muted-foreground))',padding:'4px 10px 4px' }}>Apps</div>
      {['Todos','Descargas'].map(cat=><SideItem key={cat} cat={cat} active={active} onSelect={onSelect}/>)}
      <div style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'hsl(var(--muted-foreground))',padding:'12px 10px 4px' }}>Categorías</div>
      {['Programas','Drivers','Juegos','Desarrollos','Diseño','Emuladores','Juegos Roms','Proyectos'].map(cat=><SideItem key={cat} cat={cat} active={active} onSelect={onSelect}/>)}
    </div>
  );
}
function SideItem({ cat, active, onSelect, accent=false }: { cat:string; active:string; onSelect:(c:string)=>void; accent?:boolean }) {
  const isActive = active===cat;
  return (
    <button onClick={()=>onSelect(cat)}
      style={{ border:'none',background:isActive?(accent?'linear-gradient(90deg,hsl(var(--primary)/.25),transparent)':'hsl(var(--primary)/.18)'):'transparent',color:isActive?'hsl(var(--primary))':'hsl(var(--foreground))',cursor:'pointer',display:'flex',alignItems:'center',gap:8,padding:accent?'9px 10px':'7px 10px',width:'100%',textAlign:'left',fontSize:accent?14:13,fontWeight:accent?700:400,borderRadius:'.5rem',transition:'all .15s',fontFamily:'inherit',borderLeft:isActive&&accent?'3px solid hsl(var(--primary))':'3px solid transparent' }}>
      <span style={{ color:isActive?'hsl(var(--primary))':'hsl(var(--muted-foreground))',flexShrink:0 }}><Icon name={CAT_ICONS[cat]||'folder'} size={accent?17:15}/></span>
      {cat}
    </button>
  );
}

// ─── Hero Carousel ────────────────────────────────────────────────────────────
function HeroCarousel({ apps, onSelectApp }: { apps: App[]; onSelectApp: (a:App)=>void }) {
  const heroApps = apps.slice(0, 5);
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const go = useCallback((next: number) => {
    setIdx(next); setKey(k=>k+1);
  }, []);

  useEffect(() => {
    if (!heroApps.length) return;
    timerRef.current = setInterval(() => go((idx+1)%heroApps.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [idx, go, heroApps.length]);

  if (!heroApps.length) return null;
  const app = heroApps[idx];
  const total = heroApps.length;

  return (
    <div style={{ position:'relative',height:280,borderRadius:'1.25rem',overflow:'hidden',flexShrink:0 }}>
      {/* Background gradient + pattern */}
      <div key={key} className="hero-slide" style={{ position:'absolute',inset:0,background:`linear-gradient(135deg, ${app.color}ee 0%, ${app.color}88 40%, #0a0a1a)` }}/>
      <div style={{ position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,.03) 40px,rgba(255,255,255,.03) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,.03) 40px,rgba(255,255,255,.03) 41px)',pointerEvents:'none' }}/>
      {/* Content */}
      <div key={`c${key}`} className="hero-content" style={{ position:'relative',zIndex:1,height:'100%',display:'flex',alignItems:'flex-end',padding:'28px 32px' }}>
        <div style={{ flex:1 }}>
          {app.isNew&&<span style={{ background:'hsl(var(--primary))',color:'white',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,textTransform:'uppercase',letterSpacing:'.08em',display:'inline-block',marginBottom:10 }}>✦ Nuevo</span>}
          <h2 style={{ margin:'0 0 8px',fontSize:'2rem',fontWeight:900,color:'white',textShadow:'0 2px 12px rgba(0,0,0,.4)',lineHeight:1.1 }}>{app.name}</h2>
          <p style={{ margin:'0 0 18px',fontSize:14,color:'rgba(255,255,255,.7)',maxWidth:440,lineHeight:1.5 }}>{app.description.slice(0,100)}...</p>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>onSelectApp(app)}
              style={{ background:'white',color:'#111',border:'none',borderRadius:'2rem',padding:'10px 26px',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:7,transition:'transform .15s',fontFamily:'inherit' }}
              onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.transform='scale(1.04)'}
              onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.transform=''}>
              <Icon name="download" size={16}/> Ver detalles
            </button>
            <button onClick={()=>onSelectApp(app)}
              style={{ background:'rgba(255,255,255,.15)',color:'white',border:'1px solid rgba(255,255,255,.3)',borderRadius:'2rem',padding:'10px 22px',fontSize:14,fontWeight:600,cursor:'pointer',backdropFilter:'blur(8px)',fontFamily:'inherit' }}>
              Más info
            </button>
          </div>
        </div>
        <div style={{ fontSize:'7rem',flexShrink:0,filter:'drop-shadow(0 8px 24px rgba(0,0,0,.5))' }}>{app.icon}</div>
      </div>
      {/* Navigation arrows */}
      <button onClick={()=>go((idx-1+total)%total)}
        style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.35)',border:'1px solid rgba(255,255,255,.2)',color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',zIndex:2 }}>
        <Icon name="arrowLeft" size={16}/>
      </button>
      <button onClick={()=>go((idx+1)%total)}
        style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.35)',border:'1px solid rgba(255,255,255,.2)',color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',zIndex:2 }}>
        <Icon name="arrowRight" size={16}/>
      </button>
      {/* Dots */}
      <div style={{ position:'absolute',bottom:14,left:'50%',transform:'translateX(-50%)',display:'flex',gap:6,zIndex:2 }}>
        {heroApps.map((_,i)=>(
          <button key={i} onClick={()=>go(i)} className={`hero-dot ${i===idx?'active':''}`} style={{ width:i===idx?22:8,height:8,borderRadius:4,background:i===idx?'white':'rgba(255,255,255,.4)',border:'none',cursor:'pointer',transition:'all .2s' }}/>
        ))}
      </div>
      {/* Thumbnail strip */}
      <div style={{ position:'absolute',bottom:14,right:24,display:'flex',gap:8,zIndex:2 }}>
        {heroApps.map((a,i)=>(
          <div key={i} onClick={()=>go(i)}
            style={{ width:54,height:40,borderRadius:'.5rem',background:a.color+'cc',border:`2px solid ${i===idx?'white':'rgba(255,255,255,.2)'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',transition:'border-color .2s',flexShrink:0 }}>
            {a.icon}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal App Card ──────────────────────────────────────────────────────
function HAppCard({ app, onClick }: { app:App; onClick:()=>void }) {
  return (
    <div onClick={onClick} className="h-app-card">
      <div style={{ height:100,background:`linear-gradient(135deg,${app.color}bb,${app.color}44 60%,#0a0a1a)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.5rem' }}>
        {app.icon}
      </div>
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontWeight:600,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{app.name}</div>
        <div style={{ fontSize:11,color:'hsl(var(--muted-foreground))' }}>{app.category}</div>
        {app.isNew&&<span style={{ fontSize:10,color:'hsl(var(--primary))',fontWeight:700 }}>● Nuevo</span>}
      </div>
    </div>
  );
}

// ─── Category Tile ────────────────────────────────────────────────────────────
const CAT_DEFS = [
  { cat:'Programas',  emoji:'🖥️',  color:'#2980b9', desc:'Utilidades y software' },
  { cat:'Drivers',    emoji:'🔌',  color:'#c0392b', desc:'Controladores' },
  { cat:'Juegos',     emoji:'🕹️',  color:'#27ae60', desc:'Entretenimiento' },
  { cat:'Desarrollos',emoji:'💻',  color:'#8e44ad', desc:'Dev tools & IDEs' },
  { cat:'Diseño',     emoji:'🎨',  color:'#e67e22', desc:'Creatividad visual' },
  { cat:'Emuladores', emoji:'🎮',  color:'#2c3e50', desc:'Consolas clásicas' },
  { cat:'Juegos Roms',emoji:'📀',  color:'#e52d6a', desc:'ROMs & emulación' },
  { cat:'Proyectos',  emoji:'🔧',  color:'#16a085', desc:'Mis proyectos' },
];

// ─── Feature Cards ────────────────────────────────────────────────────────────
const FEATURES = [
  { icon:'zap',     color:'#f59e0b', title:'Descarga rápida',      desc:'Descarga apps directamente desde las fuentes oficiales con un solo clic.' },
  { icon:'shield',  color:'#22c55e', title:'Software verificado',  desc:'Todos los programas son verificados y provienen de fuentes confiables.' },
  { icon:'sparkles',color:'#8b5cf6', title:'Siempre actualizado',  desc:'Notificaciones automáticas cuando hay nuevas versiones disponibles.' },
  { icon:'gamepad', color:'#e8692a', title:'ROMs & emuladores',    desc:'Catálogo de juegos clásicos con soporte para múltiples consolas.' },
  { icon:'palette', color:'#ec4899', title:'Temas personalizables',desc:'Personaliza la apariencia con múltiples temas de color incluidos.' },
  { icon:'globe',   color:'#06b6d4', title:'Multidioma',           desc:'Interfaz disponible en español e inglés. Más idiomas próximamente.' },
];

// ─── Home Section ─────────────────────────────────────────────────────────────
function HomeSection({ apps, onSelectApp, onSelectCat }: { apps:App[]; onSelectApp:(a:App)=>void; onSelectCat:(c:string)=>void }) {
  const topApps = [...apps].sort((a,b)=>b.rating-a.rating).slice(0,8);
  const newApps = apps.filter(a=>a.isNew);
  const allHighRated = apps.filter(a=>a.rating>=9.0);

  return (
    <div style={{ flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:28 }}>
      {/* Hero */}
      <HeroCarousel apps={apps} onSelectApp={onSelectApp}/>

      {/* Categories */}
      <section>
        <div className="section-title">
          <span style={{ color:'hsl(var(--primary))' }}><Icon name="grid" size={18}/></span>
          Explorar por categoría
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10 }}>
          {CAT_DEFS.map(c=>(
            <div key={c.cat} onClick={()=>onSelectCat(c.cat)} className="cat-tile"
              style={{ background:`linear-gradient(145deg,${c.color}33,${c.color}11)` }}>
              <span style={{ fontSize:'1.8rem' }}>{c.emoji}</span>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontWeight:600,fontSize:13 }}>{c.cat}</div>
                <div style={{ fontSize:11,color:'hsl(var(--muted-foreground))',marginTop:2 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top rated */}
      <section>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
          <div className="section-title" style={{ margin:0 }}>
            <span style={{ color:'#f59e0b' }}><Icon name="star" size={18}/></span>
            Mejor valorados
          </div>
          <button className="btn-icon" style={{ fontSize:13 }} onClick={()=>onSelectCat('Todos')}>Ver todos →</button>
        </div>
        <div className="h-scroll">
          {topApps.map(a=><HAppCard key={a.id} app={a} onClick={()=>onSelectApp(a)}/>)}
        </div>
      </section>

      {/* New */}
      {newApps.length>0&&(
        <section>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
            <div className="section-title" style={{ margin:0 }}>
              <span style={{ color:'hsl(var(--primary))' }}><Icon name="sparkles" size={18}/></span>
              Novedades
            </div>
          </div>
          <div className="h-scroll">
            {newApps.map(a=><HAppCard key={a.id} app={a} onClick={()=>onSelectApp(a)}/>)}
          </div>
        </section>
      )}

      {/* Highlighted */}
      <section>
        <div className="section-title">
          <span style={{ color:'#22c55e' }}><Icon name="zap" size={18}/></span>
          Destacados — Rating 9+
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12 }}>
          {allHighRated.map(a=>(
            <div key={a.id} onClick={()=>onSelectApp(a)}
              style={{ background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:'1rem',padding:'14px 16px',display:'flex',gap:14,alignItems:'center',cursor:'pointer',transition:'border-color .15s,transform .15s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='hsl(var(--primary)/.4)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='';(e.currentTarget as HTMLDivElement).style.transform='';}}>
              <div style={{ width:52,height:52,borderRadius:'.75rem',background:`linear-gradient(135deg,${a.color}bb,${a.color}44)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',flexShrink:0 }}>{a.icon}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:600,fontSize:14 }}>{a.name}</div>
                <div style={{ fontSize:12,color:'hsl(var(--muted-foreground))',marginTop:2 }}>{a.category}</div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:4,color:'#f59e0b',fontSize:13,fontWeight:700,flexShrink:0 }}>
                <Icon name="star" size={14}/>{a.rating.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="section-title">
          <span style={{ color:'hsl(var(--accent))' }}><Icon name="sparkles" size={18}/></span>
          Funcionalidades del programa
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12 }}>
          {FEATURES.map(f=>(
            <div key={f.title} className="feature-card">
              <div style={{ width:42,height:42,borderRadius:'.875rem',background:`${f.color}22`,border:`1px solid ${f.color}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:f.color }}>
                <Icon name={f.icon} size={20}/>
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:14,marginBottom:5 }}>{f.title}</div>
                <div style={{ fontSize:13,color:'hsl(var(--muted-foreground))',lineHeight:1.55 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div style={{ borderTop:'1px solid hsl(var(--border))',paddingTop:16,textAlign:'center',fontSize:12,color:'hsl(var(--muted-foreground))' }}>
        AppStore XD v2.0 — Hecho con ❤️ · MIT License · {new Date().getFullYear()}
      </div>
    </div>
  );
}

// ─── App Card (grid) ──────────────────────────────────────────────────────────
function AppCard({ app, onClick }: { app:App; onClick:()=>void }) {
  return (
    <div onClick={onClick} className="app-card glass-card" style={{ borderRadius:'1rem',overflow:'hidden',cursor:'pointer' }}>
      <div style={{ height:150,background:`linear-gradient(135deg,${app.color}99,${app.color}44 50%,#0d0d1a)`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative' }}>
        <span style={{ fontSize:'3.5rem' }}>{app.icon}</span>
        {app.isNew&&<span style={{ position:'absolute',top:10,right:10,background:'hsl(var(--primary))',color:'white',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,textTransform:'uppercase' }}>new</span>}
      </div>
      <div style={{ padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div>
          <div style={{ fontWeight:600,fontSize:14 }}>{app.name}</div>
          <div style={{ fontSize:12,color:'hsl(var(--muted-foreground))' }}>{app.category.toLowerCase()}</div>
        </div>
        <button className="btn-primary" style={{ padding:'5px 12px',fontSize:12 }}>Detalles</button>
      </div>
    </div>
  );
}

// ─── Gaming Detail Layout ─────────────────────────────────────────────────────
interface MediaItem { type:'cover'|'video'|'screen'; label:string; emoji?:string; videoId?:string; src?:string }
function MetaCard({ label, value }: { label:string; value:string }) {
  return (
    <div style={{ background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.09)',borderRadius:'.875rem',padding:'12px 16px' }}>
      <div style={{ fontSize:11,color:'rgba(255,255,255,.35)',marginBottom:4,fontWeight:500 }}>{label}</div>
      <div style={{ fontSize:13,color:'white',fontWeight:600 }}>{value}</div>
    </div>
  );
}
function DevCard({ label, value, color }: { label:string; value:string; color:string }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.09)',borderRadius:'.875rem',padding:'10px 14px',flex:'1 1 160px',minWidth:0 }}>
      <div style={{ width:34,height:34,borderRadius:'50%',background:`${color}22`,border:`1px solid ${color}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <div style={{ width:14,height:14,borderRadius:'50%',background:color }}/>
      </div>
      <div><div style={{ fontSize:11,color:'rgba(255,255,255,.35)',marginBottom:2 }}>{label}</div><div style={{ fontSize:13,color:'white',fontWeight:600 }}>{value}</div></div>
    </div>
  );
}
function GamingDetailLayout({ onBack, backLabel, coverEmoji, coverBg, title, genres, description, platform, ratingNum, reviews, language, releaseDate, size, developer, publisher, accentColor, actionLabel, actionIcon, onAction, actionPending, actionProgress, secondaryLabel, secondaryIcon, onSecondary, extraPanel, mediaItems }:
  { onBack:()=>void; backLabel:string; coverEmoji:string; coverBg:string; title:string; genres:string[]; description:string; platform:string; ratingNum:number; reviews:number; language:string; releaseDate:string; size:string; developer:string; publisher:string; accentColor:string; actionLabel:string; actionIcon:string; onAction:()=>void; actionPending:boolean; actionProgress:number; secondaryLabel?:string; secondaryIcon?:string; onSecondary?:()=>void; extraPanel?:React.ReactNode; mediaItems:MediaItem[]; }) {
  const [mediaIdx, setMediaIdx] = useState(0);
  const total = mediaItems.length;
  const active = mediaItems[mediaIdx];
  return (
    <div style={{ flex:1,display:'flex',flexDirection:'column',overflowY:'auto',background:'linear-gradient(160deg,#151520 0%,#0e0e18 60%,#0a0a14 100%)',position:'relative' }}>
      <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(circle, rgba(255,255,255,.018) 1px, transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none',zIndex:0 }}/>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 24px',position:'relative',zIndex:1,borderBottom:'1px solid rgba(255,255,255,.06)',flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'2rem',padding:'6px 16px',color:'rgba(255,255,255,.75)',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13,fontFamily:'inherit',backdropFilter:'blur(8px)' }}>
          <Icon name="arrowLeft" size={14}/> {backLabel}
        </button>
      </div>
      <div style={{ display:'flex',flex:1,position:'relative',zIndex:1,minHeight:0,overflow:'hidden' }}>
        {/* Left */}
        <div style={{ width:280,flexShrink:0,display:'flex',flexDirection:'column',borderRight:'1px solid rgba(255,255,255,.06)',padding:'24px 20px 20px' }}>
          <div style={{ borderRadius:'.875rem',overflow:'hidden',background:coverBg,aspectRatio:'3/4',display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${accentColor}44`,boxShadow:`0 8px 40px ${accentColor}33`,flexShrink:0,marginBottom:16 }}>
            <span style={{ fontSize:'5.5rem',filter:'drop-shadow(0 4px 12px rgba(0,0,0,.5))' }}>{coverEmoji}</span>
          </div>
          <div style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'rgba(255,255,255,.3)',marginBottom:8 }}>{mediaIdx+1} / {total}</div>
          <div style={{ borderRadius:'.625rem',overflow:'hidden',border:'1px solid rgba(255,255,255,.1)',background:'#0a0a16',position:'relative',aspectRatio:'16/9',flexShrink:0 }}>
            {active.type==='video'&&active.videoId ? <iframe src={`https://www.youtube.com/embed/${active.videoId}?rel=0&modestbranding=1`} title="preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width:'100%',height:'100%',border:'none',display:'block' }}/> :
             active.type==='screen'&&active.src ? <img src={active.src} alt={active.label} style={{ width:'100%',height:'100%',objectFit:'cover' }}/> :
             <div style={{ width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,color:'rgba(255,255,255,.3)',fontSize:13 }}><span style={{ fontSize:'2rem' }}>{active.emoji||'🎬'}</span><span>{active.label}</span></div>}
          </div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10 }}>
            <button onClick={()=>setMediaIdx(i=>(i-1+total)%total)} style={{ width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,.15)',background:'rgba(255,255,255,.07)',color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="arrowLeft" size={13}/></button>
            <div style={{ display:'flex',gap:5 }}>{mediaItems.map((_,i)=><span key={i} onClick={()=>setMediaIdx(i)} style={{ width:i===mediaIdx?18:6,height:6,borderRadius:3,background:i===mediaIdx?accentColor:'rgba(255,255,255,.2)',cursor:'pointer',transition:'all .2s' }}/>)}</div>
            <button onClick={()=>setMediaIdx(i=>(i+1)%total)} style={{ width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,.15)',background:'rgba(255,255,255,.07)',color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="arrowRight" size={13}/></button>
          </div>
          <div style={{ display:'flex',gap:6,marginTop:10,overflowX:'auto',paddingBottom:2 }}>
            {mediaItems.map((m,i)=><div key={i} onClick={()=>setMediaIdx(i)} style={{ width:52,height:36,borderRadius:'.375rem',flexShrink:0,cursor:'pointer',border:`1px solid ${i===mediaIdx?accentColor:'rgba(255,255,255,.1)'}`,background:'#0a0a14',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',overflow:'hidden' }}>{m.type==='video'?<Icon name="video" size={14}/>:m.emoji?<span>{m.emoji}</span>:<Icon name="image" size={14}/>}</div>)}
          </div>
        </div>
        {/* Right */}
        <div style={{ flex:1,padding:'28px 32px 28px 28px',overflowY:'auto',display:'flex',flexDirection:'column',gap:20 }}>
          <div>
            <div style={{ display:'flex',gap:6,marginBottom:10,flexWrap:'wrap' }}>{genres.map(g=><span key={g} style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:accentColor,padding:'2px 10px',border:`1px solid ${accentColor}55`,borderRadius:20,background:`${accentColor}18` }}>{g}</span>)}</div>
            <h1 style={{ margin:'0 0 10px',fontSize:'1.9rem',fontWeight:800,color:'white',lineHeight:1.15 }}>{title}</h1>
            <p style={{ margin:0,fontSize:14,color:'rgba(255,255,255,.55)',lineHeight:1.7,fontStyle:'italic',maxWidth:520 }}>{description}</p>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ fontSize:12,color:'rgba(255,255,255,.4)',fontWeight:600 }}>Funciona en:</span>
            <div style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'.5rem',padding:'4px 12px',fontSize:12,color:'rgba(255,255,255,.8)' }}>
              <Icon name="windows" size={13}/> {platform}
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12 }}>
            <div style={{ background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.09)',borderRadius:'.875rem',padding:'14px 16px',display:'flex',alignItems:'center',gap:14 }}>
              <div style={{ fontSize:'2.1rem',fontWeight:900,color:accentColor,lineHeight:1 }}>{ratingNum.toFixed(1)}</div>
              <div>
                <div style={{ display:'flex',gap:2,marginBottom:4 }}>{[1,2,3,4,5].map(i=><span key={i} style={{ color:i<=Math.round(ratingNum/2)?'#f59e0b':'rgba(255,255,255,.15)' }}><Icon name={i<=Math.round(ratingNum/2)?'star':'starEmpty'} size={11}/></span>)}</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,.35)' }}>Reviews · {reviews.toLocaleString()}</div>
              </div>
            </div>
            <MetaCard label="Idioma" value={language}/>
            <MetaCard label="Fecha de lanzamiento" value={releaseDate}/>
            <MetaCard label="Tamaño" value={size}/>
          </div>
          <div style={{ display:'flex',gap:14,flexWrap:'wrap' }}>
            <DevCard label="Desarrollador" value={developer} color={accentColor}/>
            <DevCard label="Editor" value={publisher} color={accentColor}/>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            {['user','download','trophy','lock','settings'].map(ic=>(
              <button key={ic} style={{ width:38,height:38,borderRadius:'50%',border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.06)',color:'rgba(255,255,255,.5)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,.12)';(e.currentTarget as HTMLButtonElement).style.color='white';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,.06)';(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,.5)';}}>
                <Icon name={ic} size={16}/>
              </button>
            ))}
          </div>
          {actionPending ? (
            <div style={{ maxWidth:280 }}>
              <div style={{ fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:8 }}>Descargando... {Math.round(actionProgress)}%</div>
              <ProgressBar value={actionProgress} color={accentColor}/>
            </div>
          ) : (
            <div style={{ display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}>
              <button onClick={onAction}
                style={{ background:'white',color:'#111',border:'none',borderRadius:'2rem',padding:'11px 32px',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8,boxShadow:'0 4px 20px rgba(255,255,255,.15)',fontFamily:'inherit' }}
                onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='#eee'}
                onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='white'}>
                <Icon name={actionIcon} size={17}/>{actionLabel}
              </button>
              {secondaryLabel&&onSecondary&&(
                <button onClick={onSecondary}
                  style={{ background:'transparent',color:'rgba(255,255,255,.65)',border:'1px solid rgba(255,255,255,.18)',borderRadius:'2rem',padding:'11px 22px',fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:7,fontFamily:'inherit' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,.4)';(e.currentTarget as HTMLButtonElement).style.color='white';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,.18)';(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,.65)';}}>
                  <Icon name={secondaryIcon||'fileOpen'} size={15}/>{secondaryLabel}
                </button>
              )}
            </div>
          )}
          {extraPanel}
        </div>
      </div>
    </div>
  );
}

// ─── App Detail ───────────────────────────────────────────────────────────────
function AppDetailView({ app, onBack, onDownloadSaved }: { app:App; onBack:()=>void; onDownloadSaved?:()=>void }) {
  const [showModal, setShowModal] = useState(false);
  const { main, deps } = getAppDownloadOptions(app);

  function handleDownloaded(opt: DownloadOption) {
    saveDownloadRecord({ id:`app-${app.id}-${opt.id}-${Date.now()}`, name:`${app.name} — ${opt.label}`, icon:app.icon, type:'app', category:app.category, size:opt.size, date:new Date().toISOString() });
    onDownloadSaved?.();
  }

  const mediaItems: MediaItem[] = [{ type:'cover',label:'Portada',emoji:app.icon },...(app.videoId?[{type:'video' as const,label:'Preview',videoId:app.videoId}]:[]),...app.screenshots.map((src,i)=>({type:'screen' as const,label:`Captura ${i+1}`,src})),{ type:'cover',label:'Vista adicional',emoji:app.icon }];
  const extraPanel = (
    <div style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'1rem',padding:'18px 20px' }}>
      <div style={{ fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',color:'rgba(255,255,255,.35)',marginBottom:14 }}>Instrucciones de instalación</div>
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {app.instructions.map((step,i)=>(
          <div key={i} style={{ display:'flex',gap:12,alignItems:'flex-start' }}>
            <div style={{ width:22,height:22,borderRadius:'50%',background:`${app.color}33`,border:`1px solid ${app.color}55`,color:'white',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>{i+1}</div>
            <span style={{ color:'rgba(255,255,255,.55)',fontSize:13,lineHeight:1.65 }}>{step.replace(/^\d+ - /,'')}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <>
      {showModal && <DownloadModal title={app.name} icon={app.icon} version={app.version} main={main} deps={deps} onClose={()=>setShowModal(false)} onDownloaded={handleDownloaded}/>}
      <GamingDetailLayout onBack={onBack} backLabel="Volver" coverEmoji={app.icon} coverBg={`linear-gradient(145deg,${app.color}dd,${app.color}55 60%,#0a0a18)`} title={app.name} genres={[app.category,...app.tags.slice(0,2)]} description={app.description} platform={app.platform} ratingNum={app.rating} reviews={app.reviews} language={app.language} releaseDate={app.releaseDate} size={app.size} developer={app.developer} publisher={app.publisher} accentColor={app.color} actionLabel="Descargar" actionIcon="download" onAction={()=>setShowModal(true)} actionPending={false} actionProgress={0} mediaItems={mediaItems} extraPanel={extraPanel}/>
    </>
  );
}

// ─── ROM Detail ───────────────────────────────────────────────────────────────
function RomDetailView({ rom, console: c, onBack, onDownloadSaved }: { rom:Rom; console:Console; onBack:()=>void; onDownloadSaved?:()=>void }) {
  const [showModal, setShowModal] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [filePath, setFilePath] = useState('');
  const accentColor = '#e8692a';
  const { main, deps } = getRomDownloadOptions(rom, c.name);

  function handleDownloaded(opt: DownloadOption) {
    setDownloaded(true);
    saveDownloadRecord({ id:`rom-${rom.id}-${opt.id}-${Date.now()}`, name:`${rom.title} — ${opt.label}`, icon:'🎮', type:'rom', category:c.name, size:opt.size, date:new Date().toISOString() });
    onDownloadSaved?.();
  }

  function handleSelectFile() {
    const inp=document.createElement('input'); inp.type='file'; inp.accept=c.fileExtensions.join(',');
    inp.onchange=(e:Event)=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f){ setFilePath(f.name); setDownloaded(true); showToast(`Archivo: ${f.name}`,'success'); } }; inp.click();
  }
  function handleExecute() { showToast(`Abriendo ${rom.title} en ${c.emulator}...`,'success'); }
  const mediaItems: MediaItem[] = [{ type:'cover',label:'Portada',emoji:'🎮' },...(rom.videoId?[{type:'video' as const,label:'Gameplay',videoId:rom.videoId}]:[]),...rom.screenshots.map((src,i)=>({type:'screen' as const,label:`Captura ${i+1}`,src})),{ type:'cover',label:'Arte adicional',emoji:'🕹️' }];
  const extraPanel = (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      <div style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'1rem',padding:'16px 20px' }}>
        <div style={{ fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',color:'rgba(255,255,255,.35)',marginBottom:12 }}>Seleccionar plataforma</div>
        <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
          {downloaded ? <button onClick={handleExecute} style={{ background:'#22c55e',color:'white',border:'none',borderRadius:'2rem',padding:'9px 20px',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontFamily:'inherit' }}><Icon name="run" size={14}/> Ejecutar en {c.emulator}</button> :
            <button onClick={handleSelectFile} style={{ background:'rgba(255,255,255,.08)',color:'rgba(255,255,255,.8)',border:'1px solid rgba(255,255,255,.15)',borderRadius:'2rem',padding:'9px 20px',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontFamily:'inherit' }}><Icon name="fileOpen" size={14}/> Seleccionar archivo ROM</button>}
        </div>
        {filePath&&<div style={{ marginTop:10,fontSize:12,color:'rgba(255,255,255,.4)',padding:'6px 10px',background:'rgba(255,255,255,.05)',borderRadius:'.5rem' }}>📁 {filePath}</div>}
        <div style={{ marginTop:8,fontSize:12,color:'rgba(255,255,255,.3)' }}>Formatos: {c.fileExtensions.join(', ')}</div>
      </div>
      <div style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'1rem',padding:'16px 20px' }}>
        <div style={{ fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',color:'rgba(255,255,255,.35)',marginBottom:12 }}>Instrucciones</div>
        {rom.instructions.map((step,i)=><div key={i} style={{ display:'flex',gap:10,alignItems:'flex-start',marginBottom:9 }}><div style={{ width:20,height:20,borderRadius:'50%',background:`${accentColor}33`,border:`1px solid ${accentColor}55`,color:'white',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>{i+1}</div><span style={{ color:'rgba(255,255,255,.5)',fontSize:13,lineHeight:1.6 }}>{step}</span></div>)}
      </div>
    </div>
  );
  return (
    <>
      {showModal && <DownloadModal title={rom.title} icon="🎮" version={`${c.name} · ${rom.year}`} main={main} deps={deps} onClose={()=>setShowModal(false)} onDownloaded={handleDownloaded}/>}
      <GamingDetailLayout onBack={onBack} backLabel={`Volver a ${c.name}`} coverEmoji="🎮" coverBg={`${c.gradient}, #0a0a18`} title={rom.title} genres={[c.name,rom.genre]} description={rom.description} platform={`${c.name} · ${c.emulator}`} ratingNum={rom.rating*2} reviews={Math.floor(rom.rating*680)} language={`${rom.region} · ${rom.players}P`} releaseDate={rom.year.toString()} size={rom.size} developer={rom.developer} publisher={c.name} accentColor={accentColor} actionLabel={downloaded?'Descargar de nuevo':'Descargar ROM'} actionIcon="download" onAction={()=>setShowModal(true)} actionPending={false} actionProgress={0} secondaryLabel={downloaded?`Ejecutar en ${c.emulator}`:undefined} secondaryIcon="run" onSecondary={downloaded?handleExecute:undefined} mediaItems={mediaItems} extraPanel={extraPanel}/>
    </>
  );
}

// ─── Console Banner ───────────────────────────────────────────────────────────
function ConsoleBanner({ console: c, onClick }: { console:Console; onClick:()=>void }) {
  return (
    <div onClick={onClick} style={{ background:c.gradient,borderRadius:'1rem',padding:'22px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',position:'relative',overflow:'hidden',minHeight:110,transition:'transform .2s,box-shadow .2s' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 40px rgba(0,0,0,.35)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow='';}}>
      <div style={{ position:'absolute',inset:0,opacity:.08,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,.3) 24px,rgba(255,255,255,.3) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,.3) 24px,rgba(255,255,255,.3) 25px)',pointerEvents:'none' }}/>
      <div style={{ zIndex:1 }}>
        <h2 style={{ margin:'0 0 8px',fontSize:'1.25rem',fontWeight:800,color:'white',textShadow:'0 2px 8px rgba(0,0,0,.3)' }}>{c.name}</h2>
        <p style={{ margin:'0 0 14px',fontSize:13,color:'rgba(255,255,255,.8)',maxWidth:340,lineHeight:1.5 }}>{c.description}</p>
        <button onClick={e=>{e.stopPropagation();onClick();}} style={{ background:'hsl(var(--primary))',color:'white',border:'none',borderRadius:20,padding:'7px 18px',fontSize:13,fontWeight:600,cursor:'pointer' }}>Ver roms</button>
      </div>
      <div style={{ zIndex:1,textAlign:'right',flexShrink:0 }}>
        <div style={{ fontSize:c.shortName.length>6?'1.5rem':'2.5rem',fontWeight:900,color:'rgba(255,255,255,.25)',letterSpacing:'.05em',textTransform:'uppercase',lineHeight:1,fontStyle:'italic' }}>{c.logoText}</div>
        <div style={{ fontSize:12,color:'rgba(255,255,255,.5)',marginTop:4 }}>{c.romCount} juegos</div>
      </div>
    </div>
  );
}

// ─── ROM List ─────────────────────────────────────────────────────────────────
function RomListView({ console: c, onSelectRom, onBack }: { console:Console; onSelectRom:(r:Rom)=>void; onBack:()=>void }) {
  const [search, setSearch] = useState('');
  const filtered = c.roms.filter(r=>r.title.toLowerCase().includes(search.toLowerCase())||r.genre.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ padding:24,flex:1,overflowY:'auto' }}>
      <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:20,flexWrap:'wrap' }}>
        <button className="btn-icon" onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,fontSize:14,color:'hsl(var(--muted-foreground))',border:'none',background:'transparent',cursor:'pointer' }}><Icon name="arrowLeft" size={18}/> Volver</button>
        <h2 style={{ margin:0,fontSize:'1.3rem',fontWeight:700 }}>{c.name}</h2>
        <span style={{ fontSize:12,color:'hsl(var(--muted-foreground))',background:'hsl(var(--muted))',padding:'2px 10px',borderRadius:20,border:'1px solid hsl(var(--border))' }}>Emulador: {c.emulator}</span>
        <div style={{ marginLeft:'auto',position:'relative' }}>
          <span style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'hsl(var(--muted-foreground))',pointerEvents:'none' }}><Icon name="search" size={14}/></span>
          <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ROM..." style={{ background:'hsl(var(--muted))',border:'1px solid hsl(var(--border))',borderRadius:'.5rem',color:'hsl(var(--foreground))',padding:'6px 10px 6px 32px',outline:'none',fontSize:13,width:200,fontFamily:'inherit' }}/>
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {filtered.map(rom=>(
          <div key={rom.id} onClick={()=>onSelectRom(rom)}
            style={{ background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:'.875rem',padding:'14px 18px',display:'flex',alignItems:'center',gap:16,cursor:'pointer',transition:'border-color .15s,transform .15s' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='hsl(var(--primary)/.4)';(e.currentTarget as HTMLDivElement).style.transform='translateX(3px)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='';(e.currentTarget as HTMLDivElement).style.transform='';}}>
            <div style={{ width:64,height:64,borderRadius:'.5rem',background:'linear-gradient(135deg,hsl(var(--muted)),hsl(var(--border)))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'1.8rem' }}>🎮</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4 }}>
                <span style={{ fontWeight:600,fontSize:15 }}>{rom.title}</span>
                <span style={{ fontSize:11,background:'hsl(var(--muted))',color:'hsl(var(--muted-foreground))',padding:'1px 7px',borderRadius:20 }}>{rom.region}</span>
                <span style={{ color:'#f59e0b',display:'flex',gap:2 }}>{[1,2,3,4,5].map(i=><Icon key={i} name={i<=rom.rating?'star':'starEmpty'} size={12}/>)}</span>
              </div>
              <div style={{ display:'flex',gap:16,fontSize:12,color:'hsl(var(--muted-foreground))' }}><span>{rom.genre}</span><span>{rom.players}P</span><span>{rom.year}</span><span>{rom.size}</span></div>
            </div>
            <button className="btn-primary" style={{ padding:'6px 14px',fontSize:12,flexShrink:0 }} onClick={e=>{e.stopPropagation();onSelectRom(rom);}}>Ver detalles</button>
          </div>
        ))}
        {filtered.length===0&&<div style={{ textAlign:'center',color:'hsl(var(--muted-foreground))',padding:40 }}>No se encontraron ROMs</div>}
      </div>
    </div>
  );
}

// ─── Juegos Roms Section ──────────────────────────────────────────────────────
type RomView = { type:'list' }|{ type:'roms'; console:Console }|{ type:'rom'; console:Console; rom:Rom };
function JuegosRomsSection({ customConsoles, onDownloadSaved }: { customConsoles: Console[]; onDownloadSaved?:()=>void }) {
  const [romsData, setRomsData] = useState<RomsData|null>(null);
  const [view, setView] = useState<RomView>({ type:'list' });
  useEffect(()=>{ fetch('/roms.json').then(r=>r.json()).then(setRomsData).catch(()=>showToast('Error cargando ROMs','error')); },[]);
  if(!romsData) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60%',color:'hsl(var(--muted-foreground))' }}>Cargando consolas...</div>;
  const allConsoles = [...romsData.consoles, ...customConsoles];
  if(view.type==='rom') return <RomDetailView rom={view.rom} console={view.console} onBack={()=>setView({type:'roms',console:view.console})} onDownloadSaved={onDownloadSaved}/>;
  if(view.type==='roms') return <RomListView console={view.console} onSelectRom={rom=>setView({type:'rom',console:view.console,rom})} onBack={()=>setView({type:'list'})}/>;
  return (
    <div style={{ padding:24,flex:1,overflowY:'auto' }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:'0 0 4px',fontSize:'1.3rem',fontWeight:700 }}>Juegos Roms</h2>
        <p style={{ color:'hsl(var(--muted-foreground))',fontSize:14,margin:0 }}>Selecciona una consola para ver sus juegos disponibles</p>
        {customConsoles.length>0&&<span style={{ fontSize:12,color:'hsl(var(--primary))',marginTop:4,display:'inline-block' }}>+ {customConsoles.length} consola(s) personalizada(s)</span>}
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
        {allConsoles.map(c=><ConsoleBanner key={c.id} console={c} onClick={()=>setView({type:'roms',console:c})}/>)}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [splash, setSplash] = useState(true);
  const [baseApps, setBaseApps] = useState<App[]>([]);
  const [customApps, setCustomApps] = useState<App[]>(loadCustomApps);
  const [customConsoles, setCustomConsoles] = useState<Console[]>(loadCustomConsoles);
  const [appsLoading, setAppsLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Inicio');
  const [selectedApp, setSelectedApp] = useState<App|null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [theme, setTheme] = useState<Theme>('default');
  const [lang, setLang] = useState<Language>('es');
  const [downloadHistory, setDownloadHistory] = useState<DownloadRecord[]>(loadDownloadHistory);

  function refreshHistory() { setDownloadHistory(loadDownloadHistory()); }

  // All apps = base JSON + user-created
  const apps = [...baseApps, ...customApps];

  // Load base apps from JSON
  useEffect(() => {
    fetch('/apps.json')
      .then(r => r.json())
      .then((data: AppsData) => { setBaseApps(data.apps); setAppsLoading(false); })
      .catch(() => { showToast('Error cargando apps.json', 'error'); setAppsLoading(false); });
  }, []);

  // Apply theme class to html element
  useEffect(() => {
    const el = document.documentElement;
    el.className = theme==='default'?'':(`theme-${theme}`);
  }, [theme]);

  const filteredApps = apps.filter(app => {
    const ms = search===''||app.name.toLowerCase().includes(search.toLowerCase())||app.description.toLowerCase().includes(search.toLowerCase());
    const mc = activeCategory==='Todos'||activeCategory==='Descargas'||app.category===activeCategory;
    return ms&&mc&&online;
  });

  function selectCat(cat:string){ setActiveCategory(cat); setSelectedApp(null); setSearch(''); if(cat==='Descargas') refreshHistory(); }
  function selectApp(app:App){ setSelectedApp(app); if(activeCategory==='Inicio') setActiveCategory('Todos'); }

  return (
    <>
      {splash && <SplashScreen onDone={()=>setSplash(false)}/>}

      <div style={{ display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',fontFamily:'Inter,system-ui,sans-serif',background:'hsl(var(--background))',color:'hsl(var(--foreground))' }}>
        <Titlebar online={online} onToggle={()=>{setOnline(p=>!p);setSelectedApp(null);}} search={search} onSearch={setSearch} onSettings={()=>setShowSettings(true)} downloadCount={downloadHistory.length} onOpenDownloads={()=>{ setActiveCategory('Descargas'); setSelectedApp(null); refreshHistory(); }}/>
        {/* Sub-nav */}
        <div style={{ background:'hsl(230 28% 9%)',borderBottom:'1px solid hsl(var(--border))',display:'flex',alignItems:'center',height:36,padding:'0 12px',gap:4,flexShrink:0 }}>
          <button className="btn-icon" style={{ fontSize:13 }} onClick={()=>{setSelectedApp(null);}}>← Volver</button>
          <button className="btn-icon" style={{ fontSize:13 }}>→ Avanzar</button>
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:12,color:'hsl(var(--muted-foreground))',padding:'0 8px' }}>{selectedApp?selectedApp.name:activeCategory}</span>
        </div>

        <div style={{ display:'flex',flex:1,overflow:'hidden' }}>
          <Sidebar active={activeCategory} onSelect={selectCat}/>
          <main style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>
            {appsLoading ? (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'70%',gap:14,color:'hsl(var(--muted-foreground))' }}>
                <span style={{ fontSize:'2.5rem',opacity:.5 }}>📦</span>
                <p style={{ margin:0,fontSize:15 }}>Cargando aplicaciones...</p>
              </div>
            ) : !online ? (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'80%',gap:14,color:'hsl(var(--muted-foreground))' }}>
                <span style={{ fontSize:'3.5rem',opacity:.4 }}>📡</span>
                <p style={{ margin:0,fontSize:16 }}>Sin conexión a internet</p>
                <button className="btn-primary" onClick={()=>setOnline(true)}><Icon name="wifi" size={15}/> Reconectar</button>
              </div>
            ) : activeCategory==='Inicio' && !selectedApp ? (
              <HomeSection apps={apps} onSelectApp={selectApp} onSelectCat={selectCat}/>
            ) : activeCategory==='Juegos Roms' && !selectedApp ? (
              <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}><JuegosRomsSection customConsoles={customConsoles} onDownloadSaved={refreshHistory}/></div>
            ) : activeCategory==='Descargas' && !selectedApp ? (
              <div style={{ flex:1,overflowY:'auto',padding:24 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
                  <div>
                    <h2 style={{ margin:'0 0 4px',fontSize:'1.3rem',fontWeight:700 }}>Historial de Descargas</h2>
                    <p style={{ margin:0,fontSize:13,color:'hsl(var(--muted-foreground))' }}>{downloadHistory.length} descarga{downloadHistory.length!==1?'s':''} registrada{downloadHistory.length!==1?'s':''}</p>
                  </div>
                  {downloadHistory.length>0&&<button className="btn-primary" style={{ fontSize:12,padding:'6px 14px' }} onClick={()=>{ localStorage.removeItem(DOWNLOAD_HISTORY_KEY); refreshHistory(); showToast('Historial borrado','info'); }}>Limpiar historial</button>}
                </div>
                {downloadHistory.length===0 ? (
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:240,color:'hsl(var(--muted-foreground))',gap:12 }}>
                    <span style={{ fontSize:'3.5rem',opacity:.4 }}>📥</span>
                    <p style={{ margin:0,fontSize:15 }}>No hay descargas aún</p>
                    <p style={{ margin:0,fontSize:13,opacity:.6 }}>Las descargas que hagas aparecerán aquí</p>
                  </div>
                ) : (
                  <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                    {downloadHistory.map((rec,i)=>{
                      const dt = new Date(rec.date);
                      const dateStr = dt.toLocaleDateString('es-ES',{ day:'2-digit',month:'short',year:'numeric' });
                      const timeStr = dt.toLocaleTimeString('es-ES',{ hour:'2-digit',minute:'2-digit' });
                      return (
                        <div key={`${rec.id}-${i}`} style={{ background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:'1rem',padding:'14px 18px',display:'flex',alignItems:'center',gap:16 }}>
                          <div style={{ width:52,height:52,borderRadius:'.75rem',background:'hsl(var(--muted))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',flexShrink:0 }}>{rec.icon}</div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontWeight:600,fontSize:15,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{rec.name}</div>
                            <div style={{ display:'flex',gap:10,fontSize:12,color:'hsl(var(--muted-foreground))' }}>
                              <span style={{ background:'hsl(var(--muted))',padding:'1px 8px',borderRadius:20 }}>{rec.type==='rom'?'ROM':'App'}</span>
                              <span>{rec.category}</span>
                              <span>{rec.size}</span>
                            </div>
                          </div>
                          <div style={{ textAlign:'right',flexShrink:0,color:'hsl(var(--muted-foreground))',fontSize:12 }}>
                            <div style={{ fontWeight:500,marginBottom:2 }}>{dateStr}</div>
                            <div style={{ opacity:.7 }}>{timeStr}</div>
                          </div>
                          <div style={{ color:'#22c55e',flexShrink:0 }}><Icon name="check" size={18}/></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : selectedApp ? (
              <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}><AppDetailView app={selectedApp} onBack={()=>setSelectedApp(null)} onDownloadSaved={refreshHistory}/></div>
            ) : (
              <div style={{ flex:1,overflowY:'auto',padding:24 }}>
                <div className="apps-grid">
                  {filteredApps.length===0 ? (
                    <div style={{ gridColumn:'1/-1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,color:'hsl(var(--muted-foreground))',gap:10 }}>
                      <span style={{ fontSize:'3rem' }}>🔍</span><p style={{ margin:0 }}>No se encontraron aplicaciones</p>
                    </div>
                  ) : filteredApps.map(app=><AppCard key={app.id} app={app} onClick={()=>setSelectedApp(app)}/>)}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {showSettings && <SettingsPanel theme={theme} onTheme={t=>{setTheme(t);showToast(`Tema cambiado a ${THEMES.find(x=>x.id===t)?.label||t}`,'success');}} lang={lang} onLang={l=>{setLang(l);showToast(`Idioma: ${l==='es'?'Español':'English'}`,'success');}} onClose={()=>setShowSettings(false)}/>}
      <ToastContainer/>
    </>
  );
}
