import { useState, useEffect, useRef, useCallback } from "react"

// ═══ STORAGE (window.storage = cross-device via Claude.ai, fallback = localStorage) ═══
const Store = {
  async get(k) {
    try { if (window.storage) { const r = await window.storage.get(k); return r?.value ?? null } } catch {}
    try { return localStorage.getItem(k) } catch { return null }
  },
  async set(k, v) {
    try { if (window.storage) await window.storage.set(k, v) } catch {}
    try { localStorage.setItem(k, v) } catch {}
  }
}

// ═══ PROGRAM DATA ═══
const DEF_PROGRAM = {
  push: { name:'PUSH', color:'#ff453a', icon:'💪', exercises:[
    {id:'p1',name:'Bench Press',        sets_w1:'5×3-5',  sets_w2:'4×8-10', sets_w3:'4×4-5', sets_w4:'2×8',  rest_w1:210,rest_w2:150,rest_w3:180,rest_w4:90, tip:'Κατέβαση 2-3\'\'. Ώμοι πίσω & κάτω. Εβδ.2: tempo 3-1-2.'},
    {id:'p2',name:'Incline DB Press',   sets_w1:'4×5',    sets_w2:'3×10-12',sets_w3:'4×6',   sets_w4:'2×10', rest_w1:150,rest_w2:120,rest_w3:150,rest_w4:90, tip:'Γωνία 30°. Ελεγχόμενη κάθοδος. Αισθάνεσαι το στήθος.'},
    {id:'p3',name:'Cable Chest Fly',    sets_w1:'—',      sets_w2:'3×12-15',sets_w3:'3×12',  sets_w4:'2×12', rest_w1:0,  rest_w2:90, rest_w3:90, rest_w4:90, tip:'Χαμηλό βάρος, πλήρης τόξο. Squeeze στην κορυφή.'},
    {id:'p4',name:'Overhead Press',     sets_w1:'4×4-5',  sets_w2:'3×8-10', sets_w3:'4×5',   sets_w4:'2×8',  rest_w1:180,rest_w2:150,rest_w3:180,rest_w4:120,tip:'Πίεσε ίσια πάνω. Μη ξεκουράς τη μπάρα μεταξύ reps.'},
    {id:'p5',name:'Lateral Raise',      sets_w1:'3×10',   sets_w2:'3×15',   sets_w3:'3×12',  sets_w4:'2×15', rest_w1:90, rest_w2:90, rest_w3:90, rest_w4:60, tip:'Ελαφρύ βάρος πάντα. Αγκώνας ελαφρά λυγιστός.'},
    {id:'p6',name:'Tricep Pushdown',    sets_w1:'3×8',    sets_w2:'3×12-15',sets_w3:'3×10',  sets_w4:'2×12', rest_w1:90, rest_w2:90, rest_w3:90, rest_w4:60, tip:'Rope: άνοιγμα στο κάτω σημείο. Αγκώνες σταθεροί.'},
    {id:'p7',name:'Close-grip Bench',   sets_w1:'3×5-6',  sets_w2:'3×10-12',sets_w3:'3×6-8', sets_w4:'—',    rest_w1:120,rest_w2:90, rest_w3:120,rest_w4:0,  tip:'Εναλλακτικά Dips αν δεν ενοχλεί τον ώμο.'},
  ]},
  pull: { name:'PULL', color:'#30d158', icon:'🏋️', exercises:[
    {id:'pl1',name:'Deadlift',           sets_w1:'4×3-4',  sets_w2:'3×6-8',  sets_w3:'4×4-5', sets_w4:'2×5',  rest_w1:240,rest_w2:180,rest_w3:210,rest_w4:120,tip:'Ουδέτερη σπονδυλική. Πρόβλημα πλάτης; → Romanian DL.'},
    {id:'pl2',name:'Pull-up / Lat Pull', sets_w1:'4×4-5',  sets_w2:'3×8-10', sets_w3:'4×5-6', sets_w4:'2×8',  rest_w1:180,rest_w2:120,rest_w3:150,rest_w4:90, tip:'Pull-ups: πρόσθεσε βάρος (belt). Lat: τράβα προς στήθος.'},
    {id:'pl3',name:'Barbell Row',        sets_w1:'4×4-5',  sets_w2:'3×8-10', sets_w3:'4×5',   sets_w4:'2×8',  rest_w1:180,rest_w2:150,rest_w3:180,rest_w4:120,tip:'Τράβα στον αφαλό. Ωμοπλάτες μαζί στο τέλος.'},
    {id:'pl4',name:'Seated Cable Row',   sets_w1:'3×6-8',  sets_w2:'3×10-12',sets_w3:'3×8',   sets_w4:'2×12', rest_w1:120,rest_w2:90, rest_w3:120,rest_w4:60, tip:'Squeeze ωμοπλάτες. Μη γέρνεις υπερβολικά πίσω.'},
    {id:'pl5',name:'Face Pull',          sets_w1:'3×12',   sets_w2:'3×15',   sets_w3:'3×12',  sets_w4:'2×15', rest_w1:90, rest_w2:90, rest_w3:90, rest_w4:60, tip:'Υγεία ώμων — κάνε το ΠΑΝΤΑ. Αγκώνες ψηλά.'},
    {id:'pl6',name:'Barbell Curl',       sets_w1:'3×5-6',  sets_w2:'3×10-12',sets_w3:'3×6-8', sets_w4:'2×10', rest_w1:90, rest_w2:90, rest_w3:90, rest_w4:60, tip:'Αργή κατέβαση (3\'\'). Μη ταλαντεύεσαι.'},
    {id:'pl7',name:'Hammer Curl',        sets_w1:'—',      sets_w2:'3×12',   sets_w3:'2×10',  sets_w4:'—',    rest_w1:0,  rest_w2:90, rest_w3:90, rest_w4:0,  tip:'Ουδέτερη λαβή. Ελαφρύ βάρος, πλήρης εύρος.'},
  ]},
  legs: { name:'LEGS', color:'#bf5af2', icon:'🦵', exercises:[
    {id:'l1',name:'Squat',              sets_w1:'5×3-4',  sets_w2:'4×8-10', sets_w3:'4×4-5', sets_w4:'2×6',  rest_w1:240,rest_w2:180,rest_w3:210,rest_w4:120,tip:'Εβδ.2: tempo 3-1-2. Γόνατα ευθεία με δάχτυλα.'},
    {id:'l2',name:'Romanian Deadlift', sets_w1:'4×5',    sets_w2:'3×10-12',sets_w3:'4×6',   sets_w4:'2×8',  rest_w1:180,rest_w2:120,rest_w3:150,rest_w4:90, tip:'Αίσθηση stretch πίσω από γόνατα. Πλάτη ίσια.'},
    {id:'l3',name:'Leg Press',         sets_w1:'4×6-8',  sets_w2:'3×12-15',sets_w3:'4×8',   sets_w4:'2×12', rest_w1:150,rest_w2:120,rest_w3:150,rest_w4:90, tip:'Πόδια ψηλά = γλουτοί. Χαμηλά = τετρακέφαλοι.'},
    {id:'l4',name:'Leg Curl',          sets_w1:'3×8',    sets_w2:'3×12-15',sets_w3:'3×10',  sets_w4:'2×12', rest_w1:90, rest_w2:90, rest_w3:90, rest_w4:60, tip:'Αργή κατέβαση (3\'\'). Ισορροπία μυών = προστασία γονάτων.'},
    {id:'l5',name:'Bulgarian Split Sq',sets_w1:'3×5/πλ.',sets_w2:'3×10/πλ.',sets_w3:'3×6/πλ.',sets_w4:'—', rest_w1:120,rest_w2:90, rest_w3:120,rest_w4:0,  tip:'Δύσκολη αλλά εξαιρετική. Αν ενοχλεί: Walking Lunge.'},
    {id:'l6',name:'Calf Raise',        sets_w1:'4×8',    sets_w2:'4×15-20',sets_w3:'4×10',  sets_w4:'2×15', rest_w1:60, rest_w2:60, rest_w3:60, rest_w4:60, tip:'Πλήρης εύρος — μέχρι κάτω αργά. Χρειάζονται όγκο.'},
    {id:'l7',name:'Plank + Ab Wheel',  sets_w1:'3×30"',  sets_w2:'3×45"',  sets_w3:'3×45"', sets_w4:'2×30"',rest_w1:60, rest_w2:60, rest_w3:60, rest_w4:60, tip:'Core = σταθεροποιητής για όλες τις βαριές ασκήσεις.'},
  ]}
}

const WEEK_INFO = [
  {label:'Εβδ.1 — ΔΥΝΑΜΗ',     color:'#ff453a', desc:'Βαριά βάρη ~85% 1RM. +2.5kg από τον προηγούμενο κύκλο.'},
  {label:'Εβδ.2 — ΥΠΕΡΤΡΟΦΙΑ', color:'#30d158', desc:'Tempo 3-1-2. Τελ. set: 1-2 reps από αποτυχία.'},
  {label:'Εβδ.3 — ΔΥΝΑΜΗ+',    color:'#bf5af2', desc:'Βαρύτερα από Εβδ.1. Η πιο εντατική εβδομάδα.'},
  {label:'Εβδ.4 — ΑΠΟΦΟΡΤΙΣΗ', color:'#5ac8fa', desc:'2 sets @ 50-60%. Εδώ χτίζεται ο μυς.'},
]
const SESS_ORDER = ['push','pull','legs']
const FONT_SCALES = {sm:'13px', md:'15px', lg:'17px', xl:'20px'}

function getDefaultState() {
  return { cycleWeek:1, sessionIdx:0, totalWorkouts:0,
    program: JSON.parse(JSON.stringify(DEF_PROGRAM)),
    logs:[], activeWorkout:null, settings:{ fontSize:'md' } }
}

// ═══ HELPERS ═══
function setsKey(w){ return `sets_w${w}` }
function restKey(w){ return `rest_w${w}` }
function parseSetCount(s){ if(!s||s==='—') return 0; const m=s.match(/^(\d+)/); return m?+m[1]:3 }
function fmtDate(iso){ const d=new Date(iso); return d.toLocaleDateString('el-GR',{weekday:'short',day:'numeric',month:'short'}) }
function fmtDateShort(iso){ const d=new Date(iso); return `${d.getDate()}/${d.getMonth()+1}` }
function sameDay(a,b){ const da=new Date(a),db=new Date(b); return da.getFullYear()===db.getFullYear()&&da.getMonth()===db.getMonth()&&da.getDate()===db.getDate() }
function totalVolume(log){ return log.exercises.reduce((s,e)=>s+e.sets.reduce((ss,st)=>ss+(st.done?(+st.weight||0)*(+st.reps||0):0),0),0) }
function getBest(logs, exId){ for(let i=logs.length-1;i>=0;i--){ const e=logs[i].exercises.find(x=>x.id===exId); if(e){ const done=e.sets.filter(s=>s.done&&s.weight>0); if(done.length){ const b=done.reduce((a,c)=>+c.weight>+a.weight?c:a,done[0]); return `Καλύτερο: ${b.weight}kg×${b.reps}` }}} return null }

// ═══ STYLES ═══
const C = {
  bg:'#000',bg2:'#1c1c1e',bg3:'#2c2c2e',bg4:'#3a3a3c',
  txt:'#fff',txt2:'rgba(235,235,245,0.8)',txt3:'rgba(235,235,245,0.5)',
  sep:'#38383a',acc:'#0a84ff',red:'#ff453a',green:'#30d158',
  orange:'#ff9f0a',purple:'#bf5af2',teal:'#5ac8fa'
}

const css = (base, fs='md') => ({
  ...base,
  fontSize: base.fontSize ? `calc(${base.fontSize} * ${fs==='sm'?.85:fs==='lg'?1.1:fs==='xl'?1.3:1})` : undefined
})

// ═══ SUB COMPONENTS ═══
function Btn({children, color=C.acc, onClick, disabled, style={}, full=false}){
  return <button onClick={onClick} disabled={disabled} style={{
    background:disabled?C.bg3:color, color:disabled?C.txt3:'#fff',
    border:'none', borderRadius:14, padding:'14px 20px',
    fontSize:'inherit', fontWeight:700, cursor:disabled?'default':'pointer',
    width:full?'100%':undefined, opacity:1, ...style
  }}>{children}</button>
}

function Card({children, style={}}){
  return <div style={{background:C.bg2, borderRadius:16, margin:'0 14px 10px', overflow:'hidden', ...style}}>{children}</div>
}

function Row({label, right, onClick, labelStyle={}, style={}}){
  return <div onClick={onClick} style={{display:'flex',alignItems:'center',padding:'13px 16px',borderBottom:`1px solid ${C.sep}`,cursor:onClick?'pointer':undefined,...style}}>
    <div style={{flex:1,fontSize:'inherit',...labelStyle}}>{label}</div>
    {right && <div style={{color:C.txt3,fontSize:'inherit'}}>{right}</div>}
  </div>
}

function Badge({text, color}){
  return <span style={{background:color+'33',color,borderRadius:20,padding:'2px 9px',fontSize:'0.75em',fontWeight:700}}>{text}</span>
}

// ═══ TIMER ═══
function TimerOverlay({timer, onSkip, onAdd}){
  if (!timer?.active) return null
  const pct = timer.left / timer.total
  const r = 90, circ = 2*Math.PI*r
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div style={{fontSize:'0.9em',color:C.txt3,textAlign:'center',maxWidth:260}}>{timer.nextLabel}</div>
      <svg width={220} height={220} style={{transform:'rotate(-90deg)'}}>
        <circle cx={110} cy={110} r={r} fill="none" stroke={C.bg3} strokeWidth={10}/>
        <circle cx={110} cy={110} r={r} fill="none" stroke={C.acc} strokeWidth={10}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
          style={{transition:'stroke-dashoffset 1s linear'}}/>
      </svg>
      <div style={{position:'absolute',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{fontSize:'3.5em',fontWeight:200,letterSpacing:-2,color:C.txt}}>
          {Math.floor(timer.left/60)}:{String(timer.left%60).padStart(2,'0')}
        </div>
        <div style={{color:C.txt3,fontSize:'0.9em'}}>ανάπαυση</div>
      </div>
      <div style={{display:'flex',gap:14,marginTop:8}}>
        <Btn color={C.bg3} onClick={()=>onAdd(30)} style={{color:C.acc}}>+30"</Btn>
        <Btn color={C.bg3} onClick={onSkip} style={{color:C.txt}}>Παράλειψη ›</Btn>
      </div>
    </div>
  )
}

// ═══ MODAL ═══
function Modal({modal, onClose}){
  if (!modal) return null
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:300,display:'flex',alignItems:'flex-end'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.bg2,borderRadius:'20px 20px 0 0',padding:'20px 16px 36px',width:'100%'}}>
        <div style={{textAlign:'center',fontWeight:700,fontSize:'1.1em',marginBottom:8}}>{modal.title}</div>
        {modal.msg && <div style={{textAlign:'center',color:C.txt3,fontSize:'0.9em',marginBottom:16}}>{modal.msg}</div>}
        {modal.buttons.map((b,i)=>(
          <button key={i} onClick={b.action} style={{
            width:'100%',background:b.danger?'rgba(255,69,58,0.15)':b.primary?C.acc:C.bg3,
            color:b.danger?C.red:b.primary?'#fff':C.txt, border:'none', borderRadius:12,
            padding:'14px', fontSize:'inherit', fontWeight:600, cursor:'pointer', marginBottom:8, display:'block'
          }}>{b.label}</button>
        ))}
        <button onClick={onClose} style={{width:'100%',background:C.bg3,color:C.txt2,border:'none',borderRadius:12,padding:'14px',fontSize:'inherit',cursor:'pointer'}}>Άκυρο</button>
      </div>
    </div>
  )
}

// ═══ HOME SCREEN ═══
function HomeScreen({state, onStart}){
  const w = state.cycleWeek, si = state.sessionIdx
  const sessKey = SESS_ORDER[si]
  const sess = state.program[sessKey]
  const wi = WEEK_INFO[w-1]
  const exCount = sess.exercises.filter(e=>e[setsKey(w)]&&e[setsKey(w)]!=='—').length
  const recent = [...state.logs].reverse().slice(0,3)
  const cyclePos = si + (w-1)*3

  return (
    <div style={{paddingBottom:80}}>
      <div style={{padding:'52px 16px 12px'}}>
        <div style={{fontSize:'2em',fontWeight:700,letterSpacing:-0.5}}>Γεια 👋</div>
        <div style={{color:C.txt3,marginTop:4}}>{new Date().toLocaleDateString('el-GR',{weekday:'long',day:'numeric',month:'long'})}</div>
      </div>

      {/* Next workout card */}
      <div style={{margin:'0 14px 14px',background:`linear-gradient(135deg,#1a3a5c,#0d2137)`,borderRadius:20,padding:20}}>
        <div style={{fontSize:'0.75em',fontWeight:700,color:C.teal,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Επόμενη Προπόνηση</div>
        <div style={{fontSize:'1.6em',fontWeight:700,marginBottom:4}}>{sess.icon} {sess.name}</div>
        <div style={{marginBottom:12}}><Badge text={wi.label} color={wi.color}/></div>
        <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
          {[`📋 ${exCount} ασκήσεις`, `🏆 #${state.totalWorkouts+1}`, `⏱ ~65'`].map(c=>(
            <span key={c} style={{background:'rgba(255,255,255,0.12)',borderRadius:20,padding:'3px 10px',fontSize:'0.8em',fontWeight:600}}>{c}</span>
          ))}
        </div>
        <div style={{color:'rgba(255,255,255,0.5)',fontSize:'0.82em',marginBottom:12}}>{wi.desc}</div>
        {/* Progress bar */}
        <div style={{display:'flex',gap:4,marginBottom:14}}>
          {Array.from({length:12},(_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<cyclePos?C.green:i===cyclePos?C.acc:C.bg3}}/>
          ))}
        </div>
        <Btn full color={C.acc} onClick={onStart}>Ξεκίνα Τώρα</Btn>
      </div>

      {recent.length>0 && <>
        <div style={{padding:'4px 20px 8px',fontSize:'0.78em',fontWeight:700,color:C.txt3,textTransform:'uppercase',letterSpacing:0.5}}>Πρόσφατα</div>
        {recent.map(log=>{
          const vol = totalVolume(log)
          return (
            <Card key={log.id}>
              <Row label={<>
                <div style={{fontWeight:700}}>{log.sessionName} <span style={{fontWeight:400,color:C.txt3,fontSize:'0.9em'}}>— {fmtDate(log.date)}</span></div>
                <div style={{marginTop:2}}><Badge text={WEEK_INFO[log.cycleWeek-1].label} color={WEEK_INFO[log.cycleWeek-1].color}/></div>
              </>} right={<div style={{textAlign:'right'}}>
                <div style={{fontWeight:700,color:C.acc}}>{vol>0?`${(vol/1000).toFixed(1)}t`:`${log.exercises.length} ασκ.`}</div>
                <div style={{fontSize:'0.75em'}}>όγκος</div>
              </div>}/>
            </Card>
          )
        })}
      </>}
    </div>
  )
}

// ═══ ACTIVE WORKOUT ═══
function WorkoutScreen({workout, logs, onSetDone, onFinish, onClose, onWeightChange, onRepsChange}){
  const [openEx, setOpenEx] = useState(new Set([0]))
  const allDone = workout.exercises.every(ex=>ex.sets.every(s=>s.done))

  return (
    <div style={{paddingBottom:90}}>
      <div style={{background:C.bg2,padding:'52px 16px 14px',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:700,fontSize:'1.2em'}}>{workout.sessionName}</div>
            <div style={{color:C.txt3,fontSize:'0.85em',marginTop:2}}>{WEEK_INFO[workout.cycleWeek-1].label}</div>
          </div>
          <button onClick={onClose} style={{background:C.bg3,border:'none',color:C.txt,width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:'1.1em'}}>✕</button>
        </div>
      </div>

      {workout.exercises.map((ex, ei)=>{
        const isOpen = openEx.has(ei)
        const allSetsDone = ex.sets.every(s=>s.done)
        const best = getBest(logs, ex.id)
        return (
          <div key={ex.id} style={{margin:'10px 14px',background:C.bg2,borderRadius:16,overflow:'hidden',border:`1px solid ${allSetsDone?C.green+'44':C.sep}`}}>
            <div onClick={()=>setOpenEx(prev=>{const n=new Set(prev); n.has(ei)?n.delete(ei):n.add(ei); return n})}
              style={{padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
              <div>
                <div style={{fontWeight:700,fontSize:'1em'}}>{ex.name}</div>
                <div style={{color:C.txt3,fontSize:'0.82em',marginTop:2}}>{ex.prescription}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {allSetsDone && <span style={{background:C.green+'33',color:C.green,borderRadius:20,padding:'2px 8px',fontSize:'0.75em',fontWeight:700}}>✓</span>}
                <span style={{color:C.txt3,fontSize:'1.2em',transform:`rotate(${isOpen?180:0}deg)`,transition:'transform .2s',display:'block'}}>⌄</span>
              </div>
            </div>
            {isOpen && (
              <div style={{borderTop:`1px solid ${C.sep}`}}>
                {ex.tip && <div style={{padding:'8px 14px',background:'rgba(10,132,255,0.08)',color:C.teal,fontSize:'0.82em'}}>💡 {ex.tip}</div>}
                {best && <div style={{padding:'5px 14px',fontSize:'0.8em',color:C.txt3}}>📈 {best}</div>}
                {ex.sets.map((set, si)=>(
                  <div key={si} style={{display:'flex',alignItems:'center',padding:'10px 14px',gap:10,borderTop:`1px solid ${C.sep}`}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:set.done?C.green:C.bg3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.8em',fontWeight:700,color:set.done?'#fff':C.txt3,flexShrink:0}}>{si+1}</div>
                    <div style={{flex:1,display:'flex',gap:8}}>
                      {[['kg','weight'],['reps','reps']].map(([lbl,field])=>(
                        <div key={field} style={{flex:1}}>
                          <div style={{fontSize:'0.7em',color:C.txt3,textTransform:'uppercase',marginBottom:2}}>{lbl}</div>
                          <input type="number" inputMode={field==='weight'?'decimal':'numeric'}
                            value={set[field]||''}
                            placeholder="0"
                            onChange={e=>field==='weight'?onWeightChange(ei,si,e.target.value):onRepsChange(ei,si,e.target.value)}
                            style={{width:'100%',background:C.bg3,border:'none',borderRadius:8,padding:'8px',color:C.txt,fontSize:'1em',fontWeight:600,textAlign:'center'}}/>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>onSetDone(ei,si)} style={{width:38,height:38,borderRadius:'50%',border:`2px solid ${set.done?C.green:C.bg4}`,background:set.done?C.green:'transparent',color:set.done?'#fff':C.txt3,fontSize:'1.1em',cursor:'pointer',flexShrink:0}}>
                      {set.done?'✓':''}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div style={{padding:'8px 14px 0'}}>
        <Btn full color={allDone?C.green:C.bg3} style={allDone?{}:{color:C.txt3}} onClick={onFinish}>
          {allDone?'🎉 Ολοκλήρωσε Προπόνηση':'Ολοκλήρωσε (σημείωσε όλα τα sets)'}
        </Btn>
      </div>
    </div>
  )
}

// ═══ HISTORY SCREEN ═══
function HistoryScreen({logs}){
  const [tab, setTab] = useState('list')
  const [openId, setOpenId] = useState(null)
  const [calMonth, setCalMonth] = useState(new Date())
  const [calDay, setCalDay] = useState(null)

  // Calendar
  const year = calMonth.getFullYear(), month = calMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const monthNames = ['Ιαν','Φεβ','Μαρ','Απρ','Μαΐ','Ιουν','Ιουλ','Αυγ','Σεπ','Οκτ','Νοε','Δεκ']
  const dayNames = ['Κ','Δ','Τ','Τ','Π','Π','Σ']

  const workoutDays = {}
  logs.forEach(log=>{
    const d = new Date(log.date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!workoutDays[key]) workoutDays[key] = []
    workoutDays[key].push(log)
  })

  const calDayLogs = calDay ? (workoutDays[`${calDay.getFullYear()}-${calDay.getMonth()}-${calDay.getDate()}`]||[]) : []

  return (
    <div style={{paddingBottom:80}}>
      <div style={{padding:'52px 16px 12px'}}>
        <div style={{fontSize:'2em',fontWeight:700}}>Ιστορικό</div>
        <div style={{color:C.txt3,marginTop:4}}>{logs.length} προπονήσεις</div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,padding:'0 14px 14px'}}>
        {[['list','📋 Λίστα'],['cal','📅 Ημερολόγιο']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            flex:1, padding:'10px', borderRadius:10, border:'none', cursor:'pointer',
            background:tab===id?C.acc:'rgba(10,132,255,0.12)',
            color:tab===id?'#fff':C.acc, fontWeight:700, fontSize:'inherit'
          }}>{lbl}</button>
        ))}
      </div>

      {tab==='list' && (
        logs.length===0
          ? <div style={{textAlign:'center',padding:'60px 30px',color:C.txt3}}>
              <div style={{fontSize:'3em',marginBottom:12}}>📋</div>
              <div style={{fontSize:'1.1em',fontWeight:600,color:C.txt2,marginBottom:6}}>Καμία καταγραφή ακόμα</div>
              <div>Ξεκίνα την πρώτη σου προπόνηση!</div>
            </div>
          : [...logs].reverse().map(log=>{
              const vol = totalVolume(log)
              const sets = log.exercises.reduce((s,e)=>s+e.sets.filter(st=>st.done).length,0)
              return (
                <Card key={log.id}>
                  <div onClick={()=>setOpenId(openId===log.id?null:log.id)} style={{padding:'14px 16px',cursor:'pointer'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:'1em'}}>{log.sessionName} — {fmtDate(log.date)}</div>
                        <div style={{marginTop:4}}><Badge text={WEEK_INFO[log.cycleWeek-1].label} color={WEEK_INFO[log.cycleWeek-1].color}/></div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0,marginLeft:12}}>
                        <div style={{fontWeight:700,color:C.acc}}>{vol>0?`${(vol/1000).toFixed(1)}t`:''}</div>
                        <div style={{fontSize:'0.78em',color:C.txt3}}>{sets} sets</div>
                      </div>
                    </div>
                    {openId===log.id && (
                      <div style={{marginTop:10,borderTop:`1px solid ${C.sep}`,paddingTop:10}}>
                        {log.exercises.map(ex=>{
                          const done = ex.sets.filter(s=>s.done)
                          if (!done.length) return null
                          const bst = done.filter(s=>s.weight>0).reduce((a,c)=>+c.weight>+a.weight?c:a,done.find(s=>s.weight>0)||done[0])
                          return <div key={ex.id} style={{fontSize:'0.85em',color:C.txt2,padding:'2px 0'}}>
                            <b>{ex.name}</b>: {done.length} sets{bst?.weight>0?` · best ${bst.weight}kg×${bst.reps}`:''}
                          </div>
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              )
            })
      )}

      {tab==='cal' && (
        <div style={{padding:'0 14px'}}>
          {/* Month nav */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <button onClick={()=>setCalMonth(new Date(year,month-1,1))} style={{background:C.bg3,border:'none',color:C.txt,borderRadius:10,padding:'8px 14px',cursor:'pointer',fontSize:'1em'}}>‹</button>
            <div style={{fontWeight:700,fontSize:'1.1em'}}>{monthNames[month]} {year}</div>
            <button onClick={()=>setCalMonth(new Date(year,month+1,1))} style={{background:C.bg3,border:'none',color:C.txt,borderRadius:10,padding:'8px 14px',cursor:'pointer',fontSize:'1em'}}>›</button>
          </div>
          {/* Day headers */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:4}}>
            {dayNames.map((d,i)=><div key={i} style={{textAlign:'center',fontSize:'0.78em',color:C.txt3,fontWeight:600,padding:'4px 0'}}>{d}</div>)}
          </div>
          {/* Days */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
            {Array.from({length:(firstDay+6)%7},(_,i)=><div key={`e${i}`}/>)}
            {Array.from({length:daysInMonth},(_,i)=>{
              const day = new Date(year,month,i+1)
              const key = `${year}-${month}-${i+1}`
              const wlogs = workoutDays[key]||[]
              const isToday = sameDay(day, new Date())
              const isSelected = calDay && sameDay(day, calDay)
              return (
                <div key={i} onClick={()=>setCalDay(wlogs.length>0?day:null)}
                  style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:10,cursor:wlogs.length>0?'pointer':'default',
                    background:isSelected?C.acc:isToday?'rgba(10,132,255,0.15)':wlogs.length>0?'rgba(48,209,88,0.15)':'transparent',
                    border:`1px solid ${isSelected?C.acc:isToday?C.acc+'66':'transparent'}`}}>
                  <div style={{fontSize:'0.9em',fontWeight:isToday||wlogs.length>0?700:400,color:isSelected?'#fff':isToday?C.acc:C.txt}}>{i+1}</div>
                  {wlogs.length>0 && <div style={{width:5,height:5,borderRadius:'50%',background:isSelected?'#fff':C.green,marginTop:2}}/>}
                </div>
              )
            })}
          </div>
          {/* Selected day detail */}
          {calDay && calDayLogs.length>0 && (
            <div style={{marginTop:14}}>
              <div style={{fontWeight:700,marginBottom:8}}>{fmtDate(calDay.toISOString())}</div>
              {calDayLogs.map(log=>(
                <div key={log.id} style={{background:C.bg2,borderRadius:12,padding:'12px 14px',marginBottom:8}}>
                  <div style={{fontWeight:700,marginBottom:6}}>{log.sessionName} <Badge text={WEEK_INFO[log.cycleWeek-1].label} color={WEEK_INFO[log.cycleWeek-1].color}/></div>
                  {log.exercises.map(ex=>{
                    const done=ex.sets.filter(s=>s.done); if(!done.length) return null
                    return <div key={ex.id} style={{fontSize:'0.85em',color:C.txt2,padding:'2px 0'}}>{ex.name}: {done.map((s,i)=>`${s.weight||'?'}kg×${s.reps||'?'}`).join(', ')}</div>
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ PROGRAM SCREEN ═══
function ProgramScreen({program, onSave, onDelete, onAdd, onReorder}){
  const [tab, setTab] = useState('push')
  const [openIdx, setOpenIdx] = useState(null)
  const [edits, setEdits] = useState({})
  const sess = program[tab]

  const startEdit = (i) => {
    const ex = sess.exercises[i]
    setEdits({name:ex.name,sets_w1:ex.sets_w1,sets_w2:ex.sets_w2,sets_w3:ex.sets_w3,sets_w4:ex.sets_w4,
      rest_w1:ex.rest_w1,rest_w2:ex.rest_w2,rest_w3:ex.rest_w3,rest_w4:ex.rest_w4,tip:ex.tip||''})
    setOpenIdx(openIdx===i?null:i)
  }

  const inputStyle = {width:'100%',background:C.bg3,border:'none',borderRadius:10,padding:'9px 11px',color:C.txt,fontSize:'inherit'}
  const labelStyle = {fontSize:'0.75em',color:C.txt3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}

  return (
    <div style={{paddingBottom:80}}>
      <div style={{padding:'52px 14px 12px'}}>
        <div style={{fontSize:'2em',fontWeight:700}}>Πρόγραμμα</div>
        <div style={{color:C.txt3,marginTop:4}}>Επεξεργασία & Αναδιάταξη</div>
      </div>
      <div style={{display:'flex',gap:8,padding:'0 14px 14px'}}>
        {SESS_ORDER.map(t=>{
          const s=program[t]
          return <button key={t} onClick={()=>{setTab(t);setOpenIdx(null)}} style={{
            flex:1,padding:'10px',borderRadius:10,border:'none',cursor:'pointer',
            background:tab===t?s.color+'33':'rgba(255,255,255,0.07)',
            color:tab===t?s.color:C.txt3,fontWeight:700,fontSize:'inherit'
          }}>{s.icon} {s.name}</button>
        })}
      </div>

      {sess.exercises.map((ex,i)=>(
        <div key={ex.id} style={{margin:'0 14px 8px',background:C.bg2,borderRadius:14,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',padding:'11px 12px',gap:10}}>
            {/* Reorder arrows */}
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <button onClick={()=>onReorder(tab,i,i-1)} disabled={i===0} style={{background:'none',border:'none',color:i===0?C.bg4:C.txt3,cursor:i===0?'default':'pointer',fontSize:'1em',padding:'1px 4px',lineHeight:1}}>▲</button>
              <button onClick={()=>onReorder(tab,i,i+1)} disabled={i===sess.exercises.length-1} style={{background:'none',border:'none',color:i===sess.exercises.length-1?C.bg4:C.txt3,cursor:i===sess.exercises.length-1?'default':'pointer',fontSize:'1em',padding:'1px 4px',lineHeight:1}}>▼</button>
            </div>
            <div style={{flex:1,cursor:'pointer'}} onClick={()=>startEdit(i)}>
              <div style={{fontWeight:700,fontSize:'1em'}}>{ex.name}</div>
              <div style={{color:C.txt3,fontSize:'0.78em',marginTop:2}}>{ex.sets_w1} | {ex.sets_w2} | {ex.sets_w3} | {ex.sets_w4}</div>
            </div>
            <button onClick={()=>startEdit(i)} style={{background:'none',border:'none',color:C.txt3,fontSize:'1.3em',cursor:'pointer',padding:'0 4px'}}>›</button>
          </div>

          {openIdx===i && (
            <div style={{borderTop:`1px solid ${C.sep}`,padding:'14px 12px'}}>
              <div style={labelStyle}>Όνομα</div>
              <input style={{...inputStyle,marginBottom:12}} value={edits.name||''} onChange={e=>setEdits(p=>({...p,name:e.target.value}))}/>
              {[['w1','Εβδ.1 (Δύναμη)'],['w2','Εβδ.2 (Υπερτρ.)'],['w3','Εβδ.3 (Δύν.+)'],['w4','Εβδ.4 (Αποφ.)']].map(([wk,lbl])=>(
                <div key={wk} style={{display:'flex',gap:8,marginBottom:10}}>
                  <div style={{flex:2}}>
                    <div style={labelStyle}>{lbl}</div>
                    <input style={inputStyle} value={edits[`sets_${wk}`]||''} onChange={e=>setEdits(p=>({...p,[`sets_${wk}`]:e.target.value}))}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={labelStyle}>Ανάπ. (δ.)</div>
                    <input type="number" style={inputStyle} value={edits[`rest_${wk}`]||''} onChange={e=>setEdits(p=>({...p,[`rest_${wk}`]:+e.target.value||90}))}/>
                  </div>
                </div>
              ))}
              <div style={{marginBottom:12}}>
                <div style={labelStyle}>Tip / Οδηγίες</div>
                <textarea value={edits.tip||''} onChange={e=>setEdits(p=>({...p,tip:e.target.value}))}
                  style={{...inputStyle,height:70,resize:'none'}}/>
              </div>
              <div style={{display:'flex',gap:10}}>
                <Btn color={C.acc} onClick={()=>{onSave(tab,i,edits);setOpenIdx(null)}}>Αποθήκευση</Btn>
                <Btn color='rgba(255,69,58,0.15)' style={{color:C.red}} onClick={()=>onDelete(tab,i,()=>setOpenIdx(null))}>Διαγραφή</Btn>
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={()=>onAdd(tab)} style={{width:'calc(100% - 28px)',margin:'0 14px 12px',background:'rgba(10,132,255,0.1)',color:C.acc,border:`2px dashed rgba(10,132,255,0.3)`,borderRadius:12,padding:13,fontSize:'inherit',fontWeight:700,cursor:'pointer'}}>+ Νέα Άσκηση</button>
    </div>
  )
}

// ═══ SETTINGS SCREEN ═══
function SettingsScreen({state, onFontChange, onWeekChange, onSessionChange, onExport, onResetProgram, onResetAll, synced}){
  const fs = state.settings?.fontSize||'md'
  return (
    <div style={{paddingBottom:80}}>
      <div style={{padding:'52px 14px 12px'}}>
        <div style={{fontSize:'2em',fontWeight:700}}>Ρυθμίσεις</div>
        {synced && <div style={{color:C.green,fontSize:'0.82em',marginTop:4}}>☁️ Συγχρονισμένο — ορατό σε όλες τις συσκευές</div>}
      </div>

      <div style={{padding:'0 14px 6px',fontSize:'0.78em',fontWeight:700,color:C.txt3,textTransform:'uppercase',letterSpacing:.5}}>Εμφάνιση</div>
      <Card>
        <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.sep}`}}>
          <div style={{fontWeight:600,marginBottom:10}}>Μέγεθος γραμματοσειράς</div>
          <div style={{display:'flex',gap:8}}>
            {[['sm','Μικρό'],['md','Κανον.'],['lg','Μεγάλο'],['xl','Πολύ Μεγ.']].map(([s,lbl])=>(
              <button key={s} onClick={()=>onFontChange(s)} style={{
                flex:1,padding:'8px 4px',borderRadius:10,border:'none',cursor:'pointer',
                background:fs===s?C.acc:'rgba(10,132,255,0.1)',
                color:fs===s?'#fff':C.acc,fontWeight:700,fontSize:s==='sm'?'0.7em':s==='lg'?'0.85em':s==='xl'?'1em':'0.78em'
              }}>{lbl}</button>
            ))}
          </div>
        </div>
      </Card>

      <div style={{padding:'10px 14px 6px',fontSize:'0.78em',fontWeight:700,color:C.txt3,textTransform:'uppercase',letterSpacing:.5}}>Κύκλος Προπόνησης</div>
      <Card>
        <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.sep}`}}>
          <div style={{fontWeight:600,marginBottom:10}}>Εβδομάδα κύκλου ({state.cycleWeek}/4)</div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <button onClick={()=>onWeekChange(-1)} disabled={state.cycleWeek<=1} style={{background:C.bg3,border:'none',color:C.acc,width:36,height:36,borderRadius:'50%',cursor:state.cycleWeek<=1?'default':'pointer',fontSize:'1.3em'}}>−</button>
            <div style={{flex:1}}>
              <Badge text={WEEK_INFO[state.cycleWeek-1].label} color={WEEK_INFO[state.cycleWeek-1].color}/>
            </div>
            <button onClick={()=>onWeekChange(1)} disabled={state.cycleWeek>=4} style={{background:C.bg3,border:'none',color:C.acc,width:36,height:36,borderRadius:'50%',cursor:state.cycleWeek>=4?'default':'pointer',fontSize:'1.3em'}}>+</button>
          </div>
        </div>
        <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.sep}`}}>
          <div style={{fontWeight:600,marginBottom:10}}>Session</div>
          <div style={{display:'flex',gap:8}}>
            {SESS_ORDER.map((s,i)=>(
              <button key={s} onClick={()=>onSessionChange(i)} style={{
                flex:1,padding:'8px',borderRadius:10,border:'none',cursor:'pointer',
                background:i===state.sessionIdx?state.program[s].color+'44':'rgba(255,255,255,0.07)',
                color:i===state.sessionIdx?state.program[s].color:C.txt3,fontWeight:700,fontSize:'inherit'
              }}>{state.program[s].icon}{state.program[s].name}</button>
            ))}
          </div>
        </div>
        <Row label="Συνολικές προπονήσεις" right={<span style={{color:C.acc,fontWeight:700}}>{state.totalWorkouts}</span>}/>
      </Card>

      <div style={{padding:'10px 14px 6px',fontSize:'0.78em',fontWeight:700,color:C.txt3,textTransform:'uppercase',letterSpacing:.5}}>Δεδομένα</div>
      <Card>
        <Row label="📤 Εξαγωγή δεδομένων (JSON)" right="›" onClick={onExport}/>
        <Row label={<span style={{color:C.orange}}>🔄 Επαναφορά προγράμματος</span>} right="›" onClick={onResetProgram}/>
        <Row label={<span style={{color:C.red}}>⚠️ Διαγραφή όλων</span>} right="›" onClick={onResetAll} style={{borderBottom:'none'}}/>
      </Card>
      <div style={{textAlign:'center',padding:'20px',color:C.txt3,fontSize:'0.82em'}}>PPL Tracker · Intermediate · v2.0</div>
    </div>
  )
}

// ═══ MAIN APP ═══
export default function App(){
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState('home')
  const [timer, setTimer] = useState(null)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [synced, setSynced] = useState(false)
  const timerRef = useRef(null)

  // Load
  useEffect(()=>{
    Store.get('ppl-v2').then(data=>{
      if (data) {
        try { setState(JSON.parse(data)); setSynced(true) } catch { setState(getDefaultState()) }
      } else { setState(getDefaultState()) }
      setLoading(false)
    })
  },[])

  const save = useCallback((ns) => {
    setState(ns)
    Store.set('ppl-v2', JSON.stringify(ns)).then(()=>setSynced(true))
  },[])

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),2500) }

  // Timer
  const startTimer = (secs, label) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimer({active:true, total:secs, left:secs, nextLabel:label})
    timerRef.current = setInterval(()=>{
      setTimer(prev=>{
        if (!prev || prev.left<=1) { clearInterval(timerRef.current); return null }
        return {...prev, left:prev.left-1}
      })
    },1000)
  }
  const stopTimer = () => { if(timerRef.current) clearInterval(timerRef.current); setTimer(null) }
  const addTime = (s) => setTimer(p=>p?{...p,left:p.left+s,total:p.total+s}:p)

  if (loading) return <div style={{background:C.bg,height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:C.txt3,fontSize:'1.1em'}}>Φόρτωση...</div>

  const fs = state.settings?.fontSize||'md'
  const baseSize = FONT_SCALES[fs]||'15px'

  // ── Workout handlers
  const handleStartWorkout = () => {
    const w = state.cycleWeek, si = state.sessionIdx
    const sessKey = SESS_ORDER[si]
    const sess = state.program[sessKey]
    const wk = setsKey(w)
    const workout = {
      id: Date.now(), date: new Date().toISOString(),
      sessionKey, sessionName: sess.name, cycleWeek: w,
      exercises: sess.exercises
        .filter(ex=>ex[wk]&&ex[wk]!=='—')
        .map(ex=>({ id:ex.id, name:ex.name, prescription:ex[wk],
          restSecs:ex[restKey(w)]||120, tip:ex.tip,
          sets:Array.from({length:parseSetCount(ex[wk])},()=>({weight:'',reps:'',done:false})) }))
    }
    save({...state, activeWorkout:workout})
    setScreen('workout')
  }

  const handleSetDone = (ei, si) => {
    const aw = state.activeWorkout
    const newEx = aw.exercises.map((ex,i)=>{
      if(i!==ei) return ex
      const newSets = ex.sets.map((s,j)=>j===si?{...s,done:!s.done}:s)
      return {...ex, sets:newSets}
    })
    const newAW = {...aw, exercises:newEx}
    const ns = {...state, activeWorkout:newAW}
    save(ns)
    // Start timer if marking done
    if (!aw.exercises[ei].sets[si].done) {
      const ex = newEx[ei]
      const nextSet = ex.sets[si+1]
      const nextEx = newEx[ei+1]
      const label = nextSet ? `Επόμενο set: ${ex.name}` : nextEx ? `Επόμενη άσκηση: ${nextEx.name}` : 'Τελευταίο set! 🎉'
      startTimer(ex.restSecs||120, label)
    }
  }

  const handleWeightChange = (ei, si, val) => {
    const newEx = state.activeWorkout.exercises.map((ex,i)=>
      i!==ei?ex:{...ex,sets:ex.sets.map((s,j)=>j===si?{...s,weight:val}:s)})
    save({...state, activeWorkout:{...state.activeWorkout, exercises:newEx}})
  }
  const handleRepsChange = (ei, si, val) => {
    const newEx = state.activeWorkout.exercises.map((ex,i)=>
      i!==ei?ex:{...ex,sets:ex.sets.map((s,j)=>j===si?{...s,reps:val}:s)})
    save({...state, activeWorkout:{...state.activeWorkout, exercises:newEx}})
  }

  const handleFinish = () => {
    const allDone = state.activeWorkout.exercises.every(ex=>ex.sets.every(s=>s.done))
    const doSave = () => {
      const newLogs = [...state.logs, state.activeWorkout]
      let newSi = state.sessionIdx+1, newW = state.cycleWeek
      if (newSi>=SESS_ORDER.length) { newSi=0; newW=newW>=4?1:newW+1 }
      save({...state, logs:newLogs, activeWorkout:null, totalWorkouts:state.totalWorkouts+1, sessionIdx:newSi, cycleWeek:newW})
      stopTimer(); setScreen('home'); showToast('Αποθηκεύτηκε! 🎉')
    }
    if (!allDone) setModal({title:'Ολοκλήρωση;',msg:'Δεν έχουν σημειωθεί όλα τα sets.',buttons:[
      {label:'Αποθήκευση ούτως ή άλλως',primary:true,action:()=>{setModal(null);doSave()}},
    ]})
    else doSave()
  }

  const handleCloseWorkout = () => {
    setModal({title:'Κλείσιμο προπόνησης',msg:'Οι αλλαγές σου έχουν ήδη αποθηκευτεί (auto-save).',buttons:[
      {label:'Κλείσιμο',action:()=>{setModal(null);stopTimer();setScreen('home')}},
    ]})
  }

  // ── Program handlers
  const handleSaveEx = (tab, i, edits) => {
    const exs = state.program[tab].exercises.map((ex,idx)=>idx===i?{...ex,...edits}:ex)
    save({...state, program:{...state.program,[tab]:{...state.program[tab],exercises:exs}}})
    showToast('Αποθηκεύτηκε ✓')
  }
  const handleDeleteEx = (tab, i, cb) => {
    setModal({title:'Διαγραφή;',msg:`"${state.program[tab].exercises[i].name}"`,buttons:[
      {label:'Διαγραφή',danger:true,action:()=>{
        const exs=state.program[tab].exercises.filter((_,idx)=>idx!==i)
        save({...state,program:{...state.program,[tab]:{...state.program[tab],exercises:exs}}})
        setModal(null); cb?.()
      }}
    ]})
  }
  const handleAddEx = (tab) => {
    const ex={id:'ex_'+Date.now(),name:'Νέα Άσκηση',sets_w1:'3×5',sets_w2:'3×10',sets_w3:'3×6',sets_w4:'2×8',rest_w1:120,rest_w2:90,rest_w3:120,rest_w4:60,tip:''}
    const exs=[...state.program[tab].exercises,ex]
    save({...state,program:{...state.program,[tab]:{...state.program[tab],exercises:exs}}})
  }
  const handleReorder = (tab, fromIdx, toIdx) => {
    if(toIdx<0||toIdx>=state.program[tab].exercises.length) return
    const exs=[...state.program[tab].exercises]
    const [item]=exs.splice(fromIdx,1); exs.splice(toIdx,0,item)
    save({...state,program:{...state.program,[tab]:{...state.program[tab],exercises:exs}}})
  }

  // ── Settings handlers
  const handleExport = () => {
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob), a=document.createElement('a')
    a.href=url; a.download='ppl-backup.json'; a.click()
    showToast('Εξαγωγή ολοκληρώθηκε')
  }
  const handleResetProgram = () => setModal({title:'Επαναφορά;',msg:'Το πρόγραμμα επιστρέφει στις αρχικές ασκήσεις. Το ιστορικό δεν χάνεται.',buttons:[
    {label:'Επαναφορά',danger:true,action:()=>{save({...state,program:JSON.parse(JSON.stringify(DEF_PROGRAM))});setModal(null);showToast('Επαναφέρθηκε')}}
  ]})
  const handleResetAll = () => setModal({title:'⚠️ Διαγραφή ΟΛΩΝ',msg:'Θα διαγραφούν ΟΛΕΣ οι καταγραφές. Δεν αναστρέφεται.',buttons:[
    {label:'Διαγραφή όλων',danger:true,action:()=>{const ns=getDefaultState();save(ns);setModal(null);showToast('Διαγράφηκαν')}}
  ]})

  const isWorkout = screen==='workout' && state.activeWorkout

  return (
    <div style={{background:C.bg,minHeight:'100vh',fontSize:baseSize,color:C.txt,fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif',maxWidth:480,margin:'0 auto',position:'relative',overflow:'hidden'}}>

      {/* SCREENS */}
      {screen==='home' && !isWorkout && <HomeScreen state={state} onStart={handleStartWorkout}/>}
      {isWorkout && <WorkoutScreen workout={state.activeWorkout} logs={state.logs} onSetDone={handleSetDone} onFinish={handleFinish} onClose={handleCloseWorkout} onWeightChange={handleWeightChange} onRepsChange={handleRepsChange}/>}
      {screen==='history' && !isWorkout && <HistoryScreen logs={state.logs}/>}
      {screen==='program' && !isWorkout && <ProgramScreen program={state.program} onSave={handleSaveEx} onDelete={handleDeleteEx} onAdd={handleAddEx} onReorder={handleReorder}/>}
      {screen==='settings' && !isWorkout && <SettingsScreen state={state} synced={synced}
        onFontChange={s=>save({...state,settings:{...state.settings,fontSize:s}})}
        onWeekChange={d=>save({...state,cycleWeek:Math.max(1,Math.min(4,state.cycleWeek+d))})}
        onSessionChange={i=>save({...state,sessionIdx:i})}
        onExport={handleExport} onResetProgram={handleResetProgram} onResetAll={handleResetAll}/>}

      {/* BOTTOM NAV */}
      {!isWorkout && (
        <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:'rgba(28,28,30,0.95)',backdropFilter:'blur(20px)',borderTop:`1px solid ${C.sep}`,display:'flex',zIndex:100}}>
          {[['home','🏠','Σήμερα'],['workout','🏋️','Εκκίνηση'],['history','📋','Ιστορικό'],['program','📝','Πρόγραμμα'],['settings','⚙️','Ρυθμίσεις']].map(([id,icon,lbl])=>(
            <button key={id} onClick={()=>id==='workout'?handleStartWorkout():setScreen(id)}
              style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 0 12px',border:'none',background:'transparent',color:screen===id?C.acc:C.txt3,cursor:'pointer',gap:2,fontSize:'inherit'}}>
              <span style={{fontSize:'1.4em'}}>{icon}</span>
              <span style={{fontSize:'0.65em',fontWeight:600}}>{lbl}</span>
            </button>
          ))}
        </div>
      )}

      <TimerOverlay timer={timer} onSkip={stopTimer} onAdd={addTime}/>
      <Modal modal={modal} onClose={()=>setModal(null)}/>

      {/* TOAST */}
      {toast && <div style={{position:'fixed',top:60,left:'50%',transform:'translateX(-50%)',background:'rgba(48,209,88,0.9)',color:'#fff',padding:'10px 20px',borderRadius:20,fontSize:'0.9em',fontWeight:700,zIndex:500,whiteSpace:'nowrap'}}>{toast}</div>}
    </div>
  )
}
