import { useState, useEffect, useRef } from "react";

// ── i18n — Basque ─────────────────────────────────────────────────────────────
const eu = {
  appTitle:"Aste Nagusia 2026", appSub:"Sukaldea · Janaria",
  open:"IREKITA", paused:"GELDITUTA",
  newOrder:"+ Eskaera", stockBtn:"Stocka",
  pauseBanner:"⏸ Sukaldea geldituta — ez da eskaera berririk onartzen",
  slowLabel:"motel", noOrders:"Eskaera gabe", noReady:"Prest dagoen eskaera gabe",
  received:"Jasota", inPrep:"Prestatzen", ready:"Prest",
  startNext:"→ Hasi", markReady:"→ Prest", markDone:"→ Amaituta",
  instrTitle:"Prestaketa argibideak", closeInstr:"Itxi",
  stockTitle:"Stocka kudeatu", closeStock:"Itxi",
  soldOut:"Agortuta", available:"Erabilgarri",
  orderChanged:"🔔 Eskaera aldatua", startNextHint:"Hurrengoa",
  elapsedMin:"min",
  // overflow menu
  menuLabel:"Aukerak",
  pauseAction:"⏸  Sukaldea gelditu",
  resumeAction:"▶  Sukaldea jarraitu",
  closeServiceAction:"✕  Jardunaldia itxi",
  // confirmations
  confirmPauseTitle:"Sukaldea gelditu?",
  confirmPauseMsg:"Eskaera berriak blokeatuko dira. Uneko eskaerak jarraitzen dute. Edozein unetan berriro hasi daiteke.",
  confirmPauseBtn:"Bai, gelditu",
  confirmCloseTitle:"Jardunaldia itxi?",
  confirmCloseMsg:"Ordaintze zain, jasota eta prestatzen dauden eskaera guztiak automatikoki ezeztatuko dira. Ekintza hau ezin da desegin.",
  confirmCloseBtn:"Bai, itxi jardunaldia",
  cancelBtn:"Utzi",
};

// ── Tokens ────────────────────────────────────────────────────────────────────
const darkT = {
  bg:"#0d0f14",surface:"#151821",surfaceHi:"#1c2030",border:"#252836",borderHi:"#2e3348",
  orange:"#e8622f",orangeDim:"#7a3218",green:"#22c55e",amber:"#f59e0b",amberDim:"#78350f",
  red:"#ef4444",blue:"#3b82f6",
  textextPri:"#111827",textSec:"#6b7280",textDim:"#9ca3af",
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const INITIAL_TICKETS = [
  { id:"t1",orderNumber:41,customerName:"Josu",status:"RECEIVED",elapsedMin:0,isSlowOrder:false,hasAlert:false,
    lines:[{name:"Burgerra",qty:2,detail:"patata frijituak, tipulaik gabe"},{name:"Entsalada",qty:1,detail:"alkate-saltsa barik"},{name:"Pintxo nahasia",qty:3,detail:null}],
    notes:"Burgerra ondo eginda mesedez" },
  { id:"t2",orderNumber:38,customerName:"Miren",status:"RECEIVED",elapsedMin:2,isSlowOrder:false,hasAlert:false,
    lines:[{name:"Txorizoa ogian",qty:2,detail:null},{name:"Tortilla",qty:1,detail:"2tan banatu"}],notes:null },
  { id:"t3",orderNumber:36,customerName:"Ander",status:"IN_PREPARATION",elapsedMin:6,isSlowOrder:false,hasAlert:true,
    lines:[{name:"Pintxo nahasia",qty:4,detail:EPARATION",elapsedMin:14,isSlowOrder:true,hasAlert:false,
    lines:[{name:"Burgerra",qty:1,detail:"entsalada"},{name:"Tortilla",qty:2,detail:null},{name:"Ogia gurinarekin",qty:2,detail:null}],
    notes:"Burgerra glutenik gabeko ogian" },
  { id:"t5",orderNumber:31,customerName:"Ibai",status:"READY",elapsedMin:3,isSlowOrder:false,hasAlert:false,
    lines:[{name:"Burgerra",qty:1,detail:"patata frijituak"},{name:"Freskagarria",qty:2,detail:null}],notes:null },
  { id:"t6",orderNumber:29,customerName:null,status:"READY",elapsedMin:5,isSlowOrder:false,hasAlert:false,
    lines:[{name:"Txorizoa ogian",qty:3,detail:null}],notes:null },
];

const NEW_ORDER_POOL = [
  {name:"Leire",   lines:[{name:"Burgerra",qty:1,detail:"entsalada"},{name:"Pintxo nahasia",qty:2,detail:null}],notes:null},
  {name:"Xabi",    lines:[{name:"Tortilla",qty:3,detail:"2tan banatu"},{name:"Ogia gurinarekin",qty:1,detail:null}],notes:"Azkar mesedez"},
  {name:null,      lines:[{name:"Txorizoa ogian",qty:2,detail:null},{name:"Entsalada",qty:1,detail:"alkate-saltsa barik"}],notes:null},
  {name:"Amaia",   lines:[{name:"Burgerra",qty:2,detail:"patata frijituak"},{name:"Pintxo nahasia",qty:1,detail:null},{name:"Freskagarria",qty:2,detail:null}],notes:"Burgerrak ondo eginda"},
  {name:"Gorka",   lines:[{name:"Pintxo nahasia",qty:4,detail:null}],notes:null},
  {name:"Izaro",   lines:[{name:"Tortilla",qty:1,detail:null},{name:"Txorizoa ogian",qty:1,detail:null},{name:"Entsalada",qty:1,detail:"tomate gehigarria"}],notes:"Tortilla berotan"},
];

const INSTRUCTIONS = `## Burgerra\n\n**Prestaketa denbora:** ~6 min\n\n### Urratsak\n\n1. Hartu xerra izoztuaren bat **ezkerreko hozkailuko beheko apalategitik**\n2. Jarri planxan — bero ertaina-altua\n3. Gehitu gatza eta piperra\n4. Egosi **3 minutu alde bakoitzeko**\n5. Erre ogi-tapa planxaren alboan\n6. Muntatu: beheko ogi-tapa → letxuga → tomatea → xerra → saltsa → goiko ogi-tapa\n\n### Patata frijituetarako\n- Erabili **ontzi urdineko** aldez aurretik moztutako patatak\n- Frijitu 180°C-tan Gatza berehala gehitu\n\n> **Oharra:** Olio-tenperatura 160°C azpitik badago, itxaron 2 minutu hurrengo txandaren aurretik.`;

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useWidth() {
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:900);
  useEffect(()=>{const f=()=>setW(window.innerWidth);window.addEventListener("resize",f);return()=>window.removeEventListener("resize",f);},[]);
  return w;
}

// ── Confirmation dialog ───────────────────────────────────────────────────────
function ConfirmDialog({title,message,confirmLabel,confirmDanger=false,onConfirm,onCancel,c}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",juily:"'Nunito',sans-serif",fontSize:18,fontWeight:800,color:c.textPri,marginBottom:10}}>{title}</h2>
        <p style={{fontSize:14,color:c.textSec,lineHeight:1.6,marginBottom:24}}>{message}</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={onConfirm} style={{background:confirmDanger?c.red:c.orange,border:"none",borderRadius:10,padding:"12px 16px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",minHeight:48}}>
            {confirmLabel}
          </button>
          <button onClick={onCancel} style={{background:c.surfaceHi,border:`1px solid ${c.border}`,borderRadius:10,padding:"12px 16px",color:c.textSec,fontSize:14,cursor:"pointer",minHeight:48}}>
            {eu.cancelBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Overflow menu ─────────────────────────────────────────────────────────────
function OverflowMenu({paused,onPause,onResume,onClose,c}){
  const [open,setOpen]=useState(false);
  const [confirm,setConfirm]=useState(null); // "pause" | "close"
  const ref=useRef();

  useEffect(()=>{
    const fn=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[]);

  const handlePauseConfirm=()=>{ setConfirm(null); setOpen(false); if(paused) onResume(); else onPause(); };
 :"relative"}}>
      {/* ⋯ trigger — intentionally small and neutral */}
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{
          background:open?c.surfaceHi:"transparent",
          border:`1px solid ${open?c.border:"transparent"}`,
          borderRadius:8, padding:"7px 10px",
          color:c.textDim, fontSize:18, cursor:"pointer", minHeight:36, minWidth:36,
          display:"flex", alignItems:"center", justintent:"center",
          transition:"background 0.15s, border-color 0.15s, color 0.15s",
        }}
        onMouseOver={e=>{e.currentTarget.style.background=c.surfaceHi;e.currentTarget.style.borderColor=c.border;e.currentTarget.style.color=c.textSec;}}
        onMouseOut={e=>{if(!open){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=c.textDim;}}}
        aria-label={eu.menuLabel}
        title={eu.menuLabel}
      >⋯</button>

      {/* Dropdown */}
      {open&&(
        <div style={{
          position:"absolute",top:"calc(100% + 8px)",right:0,
          background:c.surface,border:`1px solid ${c.borderHi}`,
          boerRadius:12,padding:"6px",minWidth:220,
          boxShadow:`0 8px 32px rgba(0,0,0,0.25)`,zIndex:100,
        }}>
          {/* Pause / Resume */}
          <button
            onClick={()=>{ setOpen(false); setConfirm(paused?"resume":"pause"); }}
            style={{
              display:"flex",alignItems:"center",gap:10,width:"100%",
              background:"none",border:"none",borderRadius:8,
              padding:"10px 14px",color:paused?c.green:c.textSec,
              fontSize:14,cursor:"pointer",textAlign:"left",
              transition:"background 0.1s",
            }}
            onMouseOver={e=>e.currentTarget.style.background=c.surfaceHi}
            onMouseOut={e=>e.currentTarget.style.background="none"}
          >
            {paused?eu.resumeAction:eu.pauseAction}
          </button>

          {/* Divider */}
          <div style={{height:1,background:c.border,margin:"4px 8px"}}/>

          {/* Close service — red, visually distinct */}
          <button
            onClick={()=>{ setOpen(false); setConfirm("close"); }}
            style={{
              display:"flex",alignItems:"center",gap:10,width:"100%",
              background:"none",border:"none",borderRadius:8,
              padding:"10px 14px",color:c.red,
              fontSize:14,fontWeight:6,cursor:"pointer",textAlign:"left",
              transition:"background 0.1s",
            }}
            onMouseOver={e=>e.currentTarget.style.background=`${c.red}12`}
            onMouseOut={e=>e.currentTarget.style.background="none"}
          >
            {eu.closeServiceAction}
          </button>
        </div>
      )}

      {/* Confirmations */}
      {confirm==="pause"&&(
        <ConfirmDialog
          title={eu.confirmPauseTitle} message={eu.confirmPauseMsg}
          confirmLabel={eu.confirmPauseBtn} confirmDanger={false}
          onConfirm={handlePauseConfirm} onCancel={()=>setConfirm(null)} c={c}
        />
      )}
      {confirm==="resume"&&(
        <ConfirmDialog
          title={eu.resumeAction} message="Eskaerak onartzen hasiko da berriro."
          confirmLabel={eu.resumeAction.replace("▶  ","")} confirmDanger={false}
          onConfirm={handlePauseConfirm} onCancel={()=>setConfirm(null)} c={c}
        />
      )}
      {confirm==="close"&&(
        <ConfirmDialog
          title={eu.confirmCloseTitle} message={eu.confirmCloseMsg}
          confirmLabel={eu.confirmCloseBtn} confirmDanger={true}
          onConfirm={handleCloseConfirm} onCancel={()=>setConfirm(null)} c={c}
        />
      )}
    </div>
  );
}

// ── Instructions modal ───────────────────────────────────────────────────────âle={{color:c.orange,fontSize:18,margin:"0 0 12px",fontFamily:"'Nunito',sans-serif"}}>{line.slice(3)}</h2>;
    if(line.startsWith("### ")) return <h3 key={i} style={{color:c.textPri,fontSize:14,margin:"16px 0 6px",fontWeight:700}}>{line.slice(4)}</h3>;
    if(/^\d+\./.test(line))     return <p  key={i} style={{color:c.textPri,margin:"0 0 6px",fontSize:14,paddingLeft:8}}>{line}</p>;
    if(line.startsWith("- "))   return <p  key={i} style={{color:c.textSec,margin:"0 0 4px",fontSize:13,paddingLeft:12}}>• {line.slice(2)}</p>;
    if(line.startsWith("> "))   return <p  key={i} style={{color:c.amber,margin:"12px 0",fontSize:13,paddingLeft:12,borderLeft:`3px solid ${c.amber}`}}>{line.slice(2)}</p>;
    if(line.startsWith("**")&&line.endsWith("**")) return <p key=} style={{color:c.textSec,margin:"0 0 8px",fontSize:13}}><strong style={{color:c.textPri}}>{line.slice(2,-2)}</strong></p>;
    if(line==="") return <div key={i} style={{height:8}}/>;
    return <p key={i} style={{color:c.textSec,margin:"0 0 6px",fontSize:13}}>{line}</p>;
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200}} onClick={onClose}>
      <div style={{background:c.surface,border:`1px solid ${c.borderHi}`,borderRadius:"20px 20px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:560,maxHeight:"82vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{color:c.textSec,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase"}}>{eu.instrTitle}</span>
          <button onClick={onClose} style={{background:c.surfaceHi,border:`1px solid ${c.border}`,color:c.textSec,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13}}>{eu.closeInstr}</button>
        </div>
        {INSTRUCTIONS.split("\n").map(r)}
      </div>
    </div>
  );
}

// ── Stock modal ───────────────────────────────────────────────────────────────
function StockModal({products,onToggle,onClose,c}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",justifyContent:"x 20px 0 0",padding:"24px 24px 40px",width:"100%",maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{color:c.textSec,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase"}}>{eu.stockTitle}</span>
          <button onClick={onClose} style={{background:c.surfaceHi,border:`1px solid ${c.border}`,color:c.textSec,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13}}>{eu.closeStock}</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {products.map((p,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:c.surfaceHi,borderRadius:10,padding:"12px 16px",border:`1px solid ${p.soldOut?c.red:c.border}`}}>
              <span style={{fontSize:15,fontWeight:600,color:p.soldOut?c.red:c.textPri,textDecoration:p.soldOut?"line-through":"none"}}>{p.name}</span>
              <button onClick={()=>onToggle(i)} style={{background:p.soldOut?c.red:c.green,border:"none",borderRadius:8,padding:"7px 16px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",minHeight:36}}>
                {p.soldOut?eu.soldOut:eu.available}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({statusy,bg:c.green,t:"#000"}}[status]||{l:status,bg:c.border,t:c.textPri};
  return <span style={{background:cfg.bg,color:cfg.t,fontSize:10,fontWeight:800,letterSpacing:"0.07em",padding:"3px 9px",borderRadius:99,textTransform:"uppercase",whiteSpace:"nowrap"}}>{cfg.l}</span>;
}

// ── Ticket card ───────────────────────────────────────────────────────────────
function Tick.isSlowOrder?c.amber:c.borderHi,READY:c.green}[ticket.status]||c.border;
  const glow=isNext?"rgba(232,98,47,0.18)":{RECEIVED:"rgba(59,130,246,0.10)",IN_PREPARATION:ticket.isSlowOrder?"rgba(245,158,11,0.10)":"transparent",READY:"rgba(34,197,94,0.12)"}[ticket.status]||"transparent";
  const nextLabel={RECEIVED:eu.startNext,IN_PREPARATION:eu.markReady,READY:eu.markDone}[ticket.status];
  const nextBg={RECEIVED:c.orange,IN_PREPARATION:c.orange,READY:c.green}[ticket.status];
  const nextColor=ticket.status==="READY"?"#0a0a0a":"#fff";
  return(
    <div style={{background:c.surface,border:`2px solid ${borderColor}`,borderRadius:14,padding:"14px 14px 12px",boxShadow:`0 2px 16px ${glow}`,display:"flex",flexDirection:"column",gap:10,position:"relative",overflow:"hidden",transition:"box-shadow 0.2s, border-color 0.2s"}}>
      {isNext&&ticket.status==="RECEIVED"&&(
        <div style={{position:"absolute",top:0,left:0,right:0,background:c.orange,padding:"4px 12px",fontSize:11,fontWeight:800,color:"#fff",letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6}}>⬆ {eu.startNextHint}</div>
      )}
      {ticket.hasAlert&&!isNext&&(
        <div style={{position:"absolute",top:0,left:0,right:0,background:c.orangeDim,borderBottom:`1px solid ${c.orange}`,padding:"4px 12px",fontSize:11,fontWeight:700,color:c.orange,letterSpacing:"0.05em",textTransform:"uppercase"}}>{eu.orderChanged}</div>
      )}
      <div style={{display:"flex",justifyContent:"spa-between",alignItems:"flex-start",marginTop:(isNext&&ticket.status==="RECEIVED")||ticket.hasAlert?20:0}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'Nunito',sans-serif",fontSize:22,fontWeight:800,color:c.textPri,letterSpacing:"-0.02em"}}>#{ticket.orderNumber}</span>
          {ticket.customerName&&<span style={{fontSize:14,fontWeight:600,color:c.textSec}}>{ticket.customerName}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {ticket.isSlowOrder&&<span style={{color:c.amber,fontSize:12,fontWeight:600}}>⏱ {ticket.elapsedMin}{eu.elapsedMin}</span>}
          <StatusBadge status={ticket.status} c={c}/>
        </div>
      </div>
      <div style={{background:c.surfaceHi,borderRadius:,padding:"9px 12px",display:"flex",flexDirection:"column",gap:5}}>
        {ticket.lines.map((line,i)=>(
          <div key={i} style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:c.orange,minWidth:22}}>{line.qty}×</span>
            <span style={{fontize:14,fontWeight:600,color:c.textPri}}>{line.name}</span>
            {line.detail&&<span style={{fontSize:12,color:c.textSec}}>— {line.detail}</span>}
          </div>
        ))}
      </div>
      {ticket.notes&&(
        <div style={{background:c.amberDim,border:`1px solid ${c.amber}40`,borderRadius:8,padding:"6px 10px",fontSize:12,color:c.amber,display:"flex",gap:6,alignItems:"flex-start"}}>
          <span>📝</span><span>{ticket.notes}</span>
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onShowInstructions()} style={{background:c.surfaceHi,border:`1px solid ${c.border}`,borderRadius:8,padding:"9px 12px",color:c.textSec,fontSize:14,cursor:"pointer",minWidth:44,minHeight:44}}>📖</button>
        <button onClick={()=>onAdvance(ticket.id)} style={{flex:ground:nextBg,border:"none",borderRadius:8,padding:"10px 16px",color:nextColor,fontSize:14,fontWeight:700,cursor:"pointer",minHeight:44,letterSpacing:"0.02em"}}>{nextLabel}</button>
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────
function Column({status,label,accent,tickets,onAd,marginBottom:14,borderBottom:`2px solid ${accent}`}}>
        <span style={{fontSize:11,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:accent}}>{label}</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:c.textPri,background:c.surfaceHi,border:`1px solid ${c.border}`,borderRadius:6,padding:"1px 7px"}}>{tickets.length}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {tickets.length===0
          ?<div style={{textAlign:"center",padding:"32px 16px",color:c.textDim,fontSize:13,border:`1px dashed ${c.border}`,borderRadius:12}}>{status==="READY"?eu.noReady:eu.noOrders}</div>
          :tickets.map(t=><TicketCard key={t.id} ticket={t} onAdvance={onAdvance} onShowInstructions={onShowInstructions} isNext={t.id===nextTicketId} c={c}/>)
        }
      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({active,setActive,counts,c}){
  const tabs=[{id:"RECEIVED",label:eu.received,color:c.blue},{id:"IN_PREPARATION",label:eu.inPrep,color:c.amber},{id:"READY",label:eu.ready,color:c.green}];
  return(
    <div style={{display:"flex",background:c.surface,borderBottom:`1px solid ${c.border}`,position:"sticky",top:56,zIndex:40}}>Bottom:`3px solid ${active===tab.id?tab.color:"transparent"}`,padding:"10px 4px 8px",color:active===tab.id?tab.color:c.textDim,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"color 0.15s, border-color 0.15s"}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:800,color:active===tab.id?tab.color:c.textDim,lineHeight:1}}>{counts[tab.id]||0}</span>
          <span style={{fontSize:10}}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────&width<1024;

  const [tickets,setTickets]     = useState(INITIAL_TICKETS);
  const [paused,setPaused]       = useState(false);
  const [closed,setClosed]       = useState(false);
  const [activeTab,setActiveTab] = useState("RECEIVED");
  const [showInstr,setShowInstr] = useState(false);
  const [showStock,setShowStock] = useState(false);
  const [lightTheme,setLight]    = useState(false);
  const [orderIdx,setOrderIdx]   = useState(0);
  const [products,setProducts]   = useState([
    {name:"Burgerra",soldOut:false},{name:"Tortilla",soldOut:false},
    {name:"Entsalada",soldOut:true},{name:"Pintxo nahasia",soldOut:false},
    {name:"Txorizoa ogian",soldOut:false},{name:"Ogia gurinarekin",soldOut:false},
  ]);

  const c = lightTheme ? lightT : darkT;

  const advance = id => setTickets(prev=>prev.map(t=>{
    if(t.id!==id) return t;
    const next={RECEIVED:"IN_PREPARATION",IN_PREPARATION:"READY",READY:"COMPLETED"}[t.status];
    if(!next||next==="COMPLETED") return {...t,status:"COMPLETED"};
    return {...t,status:next,elapsedMin:0,hasAlert:false};
  }).filter(t=>t.status!=="COMPLETED"));

  const addOrder = () => {
    const tmpl=NEW_ORDER_POOL[orderIdx%NEW_ORDER_POOL.length];
    setOrderIdx(i=>i+1);
    setTickets(prev=>[...prev,{
      id:`t${Date.now()}`,
      orderNumber:Math.max(0,...prev.map(t=>t.orderNumber),40)+1,
      customerName:tmpl.name,status:"RECEIVED",
      elapsedMin:0,isSlowOrder:false,hasAlert:false,
      lines:tmpl.lines,notes:tmpl.notes,
    }]);
    if(isMobile) setActiveTab("RECEIVED");
  };

  const handleCloseService = () => {
    setTickets([]);
    setClosed(true);
  };

  const byStatus = s => tickets.filter(t=>t.status===s).sort((a,b)=>a.orderNumber-b.orderNumber);
  const counts   = {RECEIVED:byStatus("RECEIVED").length,IN_PREPARATION:byStatus("IN_PREPARATION").length,READY:byStatus("READY").length};
  const nextTicketId = byStatus("RECEIVED")[0]?.id || null;
  const soldOutCount = products.filter(p=>p.soldOut).length;
  const slowCount    = byStatus("IN_PREPARATION").filter(t=>t.isSlowOrder).length;

  const colDefs = [
    {status:"RECEIVED",label:eu.received,accent:c.blue},
    {status:"IN_PREPARATION",label:eu.inPrep,accent:c.amber},
    {status:"READY",label:eu.ready,accent:c.green},
  ];

  if(closed) return(
    <div style={{minHeight:"100vh",background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800&family=DM+Sans:wght@400;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{textAlign:"center",padding:32}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <h1 style={{fontFamily:"'Nunito',sans-serif",fontSize:24,fontWeight:800,color:c.textPri,marginBottom:8}}>Jardunaldia itxita</h1>
        <p style={{color:c.textSec,fontSize:15}}>Eskaera guztiak ezeztatuta daude.</p>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:c.bg,fontFamily:"'DM Sans',system-ui,sans-serif",color:c.textPri,transition:"background 0.2s"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700&display=swap;*{box-sizing:border-box;margin:0;padding:0;}button{font-family:inherit;}`}</style>

      {/* ── Top bar ── */}
      <div style={{background:c.surface,borderBottom:`1px solid ${c.border}`,padding:isMobile?"10px 14px":"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,gap:10}}>
        {/* Left: identity */}
        <div style={{minWidth:0}}>
          <div style={{fontFamily:"'sans-serif",fontSize:isMobile?14:17,fontWeight:800,color:c.textPri,letterSpacing:"-0.02em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{eu.appTitle}</div>
          <div style={{fontSize:11,color:c.textSec,marginTop:1,display:"flex",alignItems:"center",gap:5}}>
            <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:paused?c.amber:c.green,boxShadow:`0 0 5px ${paused?c.amber:c.green}`,flexShrink:0}}/>
            <span style={{whiteSpace:"nowrap"}}>{paused?eu.paused:eu.appSub}</span>
            {!isMobile&&slowCount>0&&<span style={{color:c.red,fontWeight:700,marginLeft:8}}>· ⚠ {slowCount} {eu.slowLabel}</span>}
          </div>
        </div>

        {/* Right: actions */}
        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          {/* Stock */}
          <button onClick={()=>setShowStock(true)} style={{position:"relative",background:c.surfaceHi,border:`1px solid ${soldOutCount>0?c.red:c.border}`,borderRadius:8,padding:"7px 12px",color:soldOutCount>0?c.red:c.textSec,fontSize:12,fontWeight:soldOutCount>0?700:400,cursor:"pointer",minHeight:36,display:"flex",alignItems:"center",gap:5}}>
            📦{!isMobile&&<span style={{marginLeft:2}}>{eu.stockBtn}</span>}
            {soldOutCount>0&&<span style={{background:c.red,color:"#fff",borderRadius:99,fontSize:10,fonht:800,padding:"1px 5px",marginLeft:2}}>{soldOutCount}</span>}
          </button>

          {/* Theme */}
          <button onClick={()=>setLight(l=>!l)} style={{background:c.surfaceHi,border:`1px solid ${c.border}`,borderRadius:8,padding:"7px 10px",color:c.textSec,fontSize:15,cursor:"pointer",minHeight:36}}>
            {lightTheme?"☀️":"🌙"}
          </button>

          {/* Add order */}
          <button onClick={addOrder} style={{backgroundnge,border:"none",borderRadius:8,padding:"7px 12px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",minHeight:36,whiteSpace:"nowrap"}}>
            {eu.newOrder}
          </button>

          {/* ⋯ overflow — pause and close live here */}
          <OverflowMenu paused={paused} onPause={()=>aused(true)} onResume={()=>setPaused(false)} onClose={handleCloseService} c={c}/>
        </div>
      </div>

      {/* Pause banner */}
      {paused&&<div style={{background:c.amberDim,borderBottom:`1px solid ${c.amber}40`,padding:"9px 16px",fontSize:12,fontWeight:700,color:c.amber,textAlign:"center",letterSpacing:"0.04em"}}>{eu.pauseBanner}</div>}

      {/* Mobile tabs */}
      {isMobile&&<TabBar active={activeTab} setActive={setActiveTab} counts={counts} c={c}/>}

      {/* ── MOBILE ── */}
      {isMobile&&(
        <div style={{padding:"16px 14px 80px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:10,borderBottom:`2px solid ${colDefs.find(d=>d.status===activeTab)?.accent}`}}>
            <span style={{fontSize:11,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:colDefs.find(d=>d.status===activeTab)?.accent}}>{colDefs.find(d=>d.status===activeTab)?.label}</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:c.textPri,background:c.surfaceHi,border:`1px solid ${c.border}`,borderRadius:6,padding:"1px 7px"}}>{counts[activeTab]}</span>
          </div>   {byStatus(activeTab).length===0
            ?<div style={{textAlign:"center",padding:"48px 16px",color:c.textDim,fontSize:14,border:`1px dashed ${c.border}`,borderRadius:14}}>{activeTab==="READY"?eu.noReady:eu.noOrders}</div>
            :byStatus(activeTab).map(t=><TicketCard key={t.id} ticket={t} onAdvance={advance} onShowInstructions={()=>setShowInstr(true)} isNext={t.id===nextTicketId&&activeTab==="RECEIVED"} c={c}/>)
          }
        </div>
      )}

      {/* ── TABLET ──   {isTablet&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,padding:"18px 18px 32px",alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {colDefs.slice(0,2).map(col=>(
              <div key={col.status}>
                <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:10,marginBottom:10,borderBottom:`2px solid ${col.accent}`}}>
                  <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:col.accent}}>{col.label}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:c.textPri,background:c.surfaceHi,border:`1px solid ${c.border}`,borderRadius:6,padding:"1px 6px"}}>{counts[col.status]}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {byStatus(col.status).length===0
                    ?<div style={{textAlign:"center",padding:"24px",color:c.textDim,fontSize:13,border:`1px dashed ${c.border}`,borderRadius:12}}>{eu.noOrders}</div>
                    :byStatus(col.status).map(t=><TicketCard key={t.id} ticket={t} onAdvance={advance} onShowInstructions={()=>setShowInstr(true)} isNext={t.id===nextTicketId} c={c}/>)
                  }
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:10,marginBottom:10,borderBottom:`2px solid ${c.green}`}}>
              <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:c.green}}>{eu.ready}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:c.textPri,background:c.surfaceHi,border:`1px solid ${c.border}`,borderRadius:6,padding:"1px 6px"}}>{counts.READY}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {byStatus("READY").length===0
                ?<div style={{textAlign:"center",padding:"24px",color:c.textDim,fontSize:13,border:`1px dashed ${c.border}`,borderRadius:12}}>{eu.noReady}</div>
                :byStatus("READY").map(t=><TicketCard key={t.id} ticket={t} onAdvance={advance} onShowInstructions={()=>setShowInstr(true)} isNext={false} c={c}/>)
              }
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP ── */}
      {!isMobile&&!isTablet&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,padding:"20px 24px 32px",alignItems:"start"}}>
  {colDefs.map(col=>(
            <Column key={col.status} {...col} tickets={byStatus(col.status)} onAdvance={advance} onShowInstructions={()=>setShowInstr(true)} nextTicketId={nextTicketId} c={c}/>
          ))}
        </div>
      )}

      {showInstr&&<InstructionsModal onClose={()=>setShowInstr(false)} c={c}/>}
      {showStock&&<StockModal products={products} onToggle={i=>setProducts(prev=>prev.map((p,j)=>j===i?{...p,soldOut:!p.soldOut}:p))} onClose={()=>setShowStock(false)} c={c}/>}
    </div>
  );
}
