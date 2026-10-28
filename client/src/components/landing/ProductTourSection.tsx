import React, { useState } from 'react';

const SCENARIOS = [
  {
    id: 'A',
    label: 'Scenario A · 50-Ton Hydraulic Press',
    sub: 'Fluid Leakage & Pressure Drop',
    machine: 'MCH-005',
    machineName: '50-Ton Hydraulic Press (Stamping Area)',
    faultType: 'FLUID_LEAKAGE',
    nodes: [
      { id:'n1', type:'MACHINE', label:'MCH-005', sub:'50-Ton Press', x:50, y:50 },
      { id:'n2', type:'COMPONENT', label:'Cylinder Seal', sub:'Primary Piston', x:200, y:20 },
      { id:'n3', type:'COMPONENT', label:'Hydraulic Valve', sub:'Pressure Relief', x:200, y:85 },
      { id:'n4', type:'INCIDENT', label:'INC-2026-0002', sub:'Valve Tightening', x:360, y:10 },
      { id:'n5', type:'INCIDENT', label:'INC-2026-0005', sub:'Seal Replace', x:360, y:55 },
      { id:'n6', type:'INCIDENT', label:'LOG-2025-089', sub:'Shift Note', x:360, y:100 },
      { id:'n7', type:'OUTCOME', label:'FAILED', sub:'Recurred in 9d', x:500, y:10 },
      { id:'n8', type:'OUTCOME', label:'VERIFIED', sub:'140+ days clear', x:500, y:55 },
      { id:'n9', type:'OUTCOME', label:'UNVERIFIED', sub:'Incomplete record', x:500, y:100 },
    ],
    edges: [['n1','n2'],['n1','n3'],['n2','n5'],['n3','n4'],['n2','n6'],['n4','n7'],['n5','n8'],['n6','n9']],
    recommendation: { option:'Replace Component', evidence:'INC-2026-0005', confidence:91, reasoning:'Seal replacement produced verified 140+ day trouble-free operation. Prior valve tightening failed within 9 days.' },
    options: [
      { label:'Inspect Further', score:35, color:'#9CA3AF', active:false },
      { label:'Repair Component', score:58, color:'#F59E0B', active:false },
      { label:'Replace Component', score:91, color:'#10B981', active:true },
      { label:'Replace Machine', score:18, color:'#EF4444', active:false },
    ],
  },
  {
    id: 'B',
    label: 'Scenario B · CNC Vertical Milling 2',
    sub: 'Y-Axis Mechanical Jam',
    machine: 'MCH-002',
    machineName: 'CNC Vertical Milling 2 (Machining Bay)',
    faultType: 'MECHANICAL_JAM',
    nodes: [
      { id:'n1', type:'MACHINE', label:'MCH-002', sub:'CNC Milling 2', x:50, y:55 },
      { id:'n2', type:'COMPONENT', label:'Y-Axis Drive', sub:'Ball Screw', x:210, y:30 },
      { id:'n3', type:'COMPONENT', label:'Linear Guide', sub:'Y-Axis Rail', x:210, y:80 },
      { id:'n4', type:'INCIDENT', label:'INC-2026-0003', sub:'Lubricated', x:370, y:15 },
      { id:'n5', type:'INCIDENT', label:'INC-2025-0041', sub:'Rail Replace', x:370, y:60 },
      { id:'n6', type:'OUTCOME', label:'PARTIAL', sub:'Recurred 21d', x:510, y:15 },
      { id:'n7', type:'OUTCOME', label:'VERIFIED', sub:'90+ d clear', x:510, y:60 },
    ],
    edges: [['n1','n2'],['n1','n3'],['n2','n4'],['n3','n5'],['n4','n6'],['n5','n7']],
    recommendation: { option:'Replace Component', evidence:'INC-2025-0041', confidence:78, reasoning:'Linear guide replacement delivered sustained operation. Lubrication provided only a short temporary patch.' },
    options: [
      { label:'Inspect Further', score:60, color:'#F59E0B', active:false },
      { label:'Repair Component', score:42, color:'#9CA3AF', active:false },
      { label:'Replace Component', score:78, color:'#10B981', active:true },
      { label:'Replace Machine', score:12, color:'#EF4444', active:false },
    ],
  },
  {
    id: 'C',
    label: 'Scenario C · High-Pressure Air Compressor 2',
    sub: 'Overheating & Conflicting Logs',
    machine: 'MCH-006',
    machineName: 'High-Pressure Air Compressor 2 (Utility Room)',
    faultType: 'OVERHEATING',
    nodes: [
      { id:'n1', type:'MACHINE', label:'MCH-006', sub:'Air Comp 2', x:50, y:55 },
      { id:'n2', type:'COMPONENT', label:'Heat Exchanger', sub:'Cooling Core', x:205, y:25 },
      { id:'n3', type:'COMPONENT', label:'Oil Separator', sub:'Air-Oil Filter', x:205, y:85 },
      { id:'n4', type:'INCIDENT', label:'LOG-2025-112', sub:'Filter Replace', x:365, y:10 },
      { id:'n5', type:'INCIDENT', label:'LOG-2025-098', sub:'Conflict Clean', x:365, y:50 },
      { id:'n6', type:'INCIDENT', label:'LOG-2025-087', sub:'Fan Speed Note', x:365, y:90 },
      { id:'n7', type:'OUTCOME', label:'CONFLICT', sub:'Logs Contradict', x:505, y:30 },
      { id:'n8', type:'OUTCOME', label:'UNVERIFIED', sub:'No Follow-up', x:505, y:90 },
    ],
    edges: [['n1','n2'],['n1','n3'],['n2','n4'],['n3','n5'],['n3','n6'],['n4','n7'],['n5','n7'],['n6','n8']],
    recommendation: { option:'Inspect Further', evidence:'LOG-2025-112 vs LOG-2025-098', confidence:45, reasoning:'Two conflicting shift logs prevent automated recommendation. Physical inspection required before purchasing parts.' },
    options: [
      { label:'Inspect Further', score:85, color:'#3B82F6', active:true },
      { label:'Repair Component', score:40, color:'#9CA3AF', active:false },
      { label:'Replace Component', score:45, color:'#F59E0B', active:false },
      { label:'Replace Machine', score:10, color:'#EF4444', active:false },
    ],
  },
];

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  MACHINE:   { bg:'rgba(37,99,235,0.2)',   border:'#3B82F6', text:'#93C5FD' },
  COMPONENT: { bg:'rgba(6,182,212,0.2)',   border:'#06B6D4', text:'#67E8F9' },
  INCIDENT:  { bg:'rgba(245,158,11,0.18)', border:'#F59E0B', text:'#FCD34D' },
  OUTCOME:   { bg:'rgba(16,185,129,0.18)', border:'#10B981', text:'#6EE7B7' },
};
const OUTCOME_COLORS: Record<string, string> = { FAILED:'#EF4444', PARTIAL:'#F59E0B', VERIFIED:'#10B981', UNVERIFIED:'#9CA3AF', CONFLICT:'#F97316' };

function MiniGraph({ nodes, edges, selectedNode, onSelectNode }: {
  nodes: typeof SCENARIOS[0]['nodes'];
  edges: string[][];
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
}) {
  const W = 560, H = 140;
  const xs = nodes.map(n=>n.x), ys = nodes.map(n=>n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const px = (v:number) => 24 + ((v - minX) / (maxX - minX || 1)) * (W - 48);
  const py = (v:number) => 18 + ((v - minY) / (maxY - minY || 1)) * (H - 36);
  const nodeMap = Object.fromEntries(nodes.map(n=>[n.id,n]));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible', minHeight:'135px' }}>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.25)" />
        </marker>
      </defs>
      {edges.map(([a,b],i) => {
        const na = nodeMap[a], nb = nodeMap[b];
        if (!na||!nb) return null;
        return <line key={i} x1={px(na.x)} y1={py(na.y)} x2={px(nb.x)} y2={py(nb.y)} stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" markerEnd="url(#arr)" />;
      })}
      {nodes.map(n => {
        const cfg = NODE_COLORS[n.type] || NODE_COLORS.COMPONENT;
        const isOutcome = n.type === 'OUTCOME';
        const outcomeColor = isOutcome ? (OUTCOME_COLORS[n.label] || '#9CA3AF') : cfg.border;
        const isSelected = selectedNode === n.id;
        return (
          <g key={n.id} style={{ cursor:'pointer' }} onClick={()=>onSelectNode(n.id)}>
            <rect
              x={px(n.x)-36} y={py(n.y)-16} width="72" height="32" rx="7"
              fill={isSelected ? (isOutcome ? `${outcomeColor}35` : cfg.bg) : 'rgba(15,23,42,0.85)'}
              stroke={isSelected ? (isOutcome ? outcomeColor : cfg.border) : 'rgba(255,255,255,0.2)'}
              strokeWidth={isSelected ? '2' : '1'}
            />
            <text x={px(n.x)} y={py(n.y)-2} textAnchor="middle" fill={isOutcome ? outcomeColor : cfg.text} fontSize="9.5" fontWeight="700" fontFamily="monospace">{n.label}</text>
            <text x={px(n.x)} y={py(n.y)+10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="monospace">{n.sub?.slice(0,14)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export const ProductTourSection: React.FC<{ onLaunchStudio: () => void }> = ({ onLaunchStudio }) => {
  const [activeScenario, setActiveScenario] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string|null>(null);
  const sc = SCENARIOS[activeScenario];
  const nodeMap = Object.fromEntries(sc.nodes.map(n=>[n.id,n]));
  const selNode = selectedNode ? nodeMap[selectedNode] : null;

  return (
    <section id="tour" style={{ background:'#090D16', padding:'0', scrollMarginTop:'112px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
      {/* Section header */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'72px 24px 52px' }}>
        <div style={{ maxWidth:'1180px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <span style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>D / Interactive Evidence Explorer</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'24px' }}>
            <div>
              <h2 style={{ fontFamily:"'Instrument Serif','DM Serif Display',Georgia,serif", fontSize:'clamp(2.2rem,4.5vw,3.6rem)', fontWeight:400, color:'#FFFFFF', margin:'0 0 14px', lineHeight:1.1 }}>
                Trace every claim<br /><em>to its source record.</em>
              </h2>
              <p style={{ fontSize:'1.05rem', color:'rgba(255,255,255,0.6)', lineHeight:1.68, maxWidth:'620px', margin:0 }}>
                These are <strong style={{ color:'#93C5FD' }}>Interactive Demonstration Scenarios</strong> grounded in Kirova AI's seed architecture (PGlite + Sarvam AI STT + 4-Way Decision Engine). Click any graph node to inspect source record details.
              </p>
            </div>
            <button type="button" onClick={onLaunchStudio}
              style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.18)', color:'#FFFFFF', padding:'13px 26px', borderRadius:'9999px', fontSize:'0.95rem', fontWeight:600, cursor:'pointer', transition:'all 0.2s', flexShrink:0 }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.14)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.08)'}>
              Open Operations Studio →
            </button>
          </div>
        </div>
      </div>

      {/* Scenario tabs */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.08)', overflowX:'auto' }}>
        <div style={{ maxWidth:'1180px', margin:'0 auto', display:'flex', padding:'0 24px' }}>
          {SCENARIOS.map((s,i) => (
            <button key={s.id} type="button" onClick={()=>{ setActiveScenario(i); setSelectedNode(null); }}
              style={{ flexShrink:0, padding:'16px 24px', border:'none', borderBottom: i===activeScenario ? '2.5px solid #60A5FA' : '2.5px solid transparent', background:'transparent', color: i===activeScenario ? '#FFFFFF' : 'rgba(255,255,255,0.45)', fontWeight: i===activeScenario ? 700 : 500, fontSize:'13.5px', cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap', gap:'8px', display:'flex', alignItems:'center' }}>
              <span style={{ fontFamily:'monospace', fontSize:'11.5px', color: i===activeScenario ? '#60A5FA' : 'rgba(255,255,255,0.3)', marginRight:'6px', fontWeight:700 }}>0{i+1}</span>
              {s.label.split('·')[1]?.trim()}
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', fontWeight:400, marginLeft:'4px' }}>· {s.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main explorer */}
      <div style={{ maxWidth:'1180px', margin:'0 auto', padding:'36px 24px 72px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'28px' }} className="tour-explorer-grid">
        {/* Left: Evidence Graph */}
        <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'16px', padding:'26px', display:'flex', flexDirection:'column', gap:'18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'11.5px', fontFamily:'monospace', color:'#60A5FA', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'4px', fontWeight:700 }}>Interactive Graph Traversal</div>
              <div style={{ fontSize:'15px', fontWeight:700, color:'#FFFFFF' }}>{sc.machineName}</div>
            </div>
            <span style={{ fontSize:'11px', fontFamily:'monospace', color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'5px', padding:'4px 10px', fontWeight:600 }}>{sc.machine}</span>
          </div>

          <MiniGraph nodes={sc.nodes} edges={sc.edges} selectedNode={selectedNode} onSelectNode={id=>setSelectedNode(prev=>prev===id?null:id)} />

          {/* Node detail */}
          {selNode && (
            <div style={{ background:'rgba(37,99,235,0.1)', border:'1px solid rgba(37,99,235,0.3)', borderRadius:'12px', padding:'16px', position:'relative' }}>
              <button type="button" onClick={()=>setSelectedNode(null)} style={{ position:'absolute', top:12, right:14, background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'15px' }}>✕</button>
              <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#60A5FA', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700 }}>{selNode.type}</div>
              <div style={{ fontSize:'15px', fontWeight:700, color:'#FFFFFF', marginBottom:'3px' }}>{selNode.label}</div>
              <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)' }}>{selNode.sub}</div>
              {selNode.type === 'OUTCOME' && (
                <div style={{ marginTop:'10px', fontSize:'12.5px', color: OUTCOME_COLORS[selNode.label] || '#9CA3AF', fontWeight:700, fontFamily:'monospace' }}>
                  Audit Status: {selNode.label} {selNode.label==='VERIFIED' ? '· Historical confidence upgraded' : selNode.label==='FAILED' ? '· Past repair failed (not recommended)' : selNode.label==='CONFLICT' ? '· Conflicting records (inspection mandatory)' : '· Unverified record'}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
            {Object.entries(NODE_COLORS).map(([type, cfg]) => (
              <div key={type} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'3px', background:cfg.bg, border:`1px solid ${cfg.border}` }} />
                <span style={{ fontSize:'11px', fontFamily:'monospace', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', fontWeight:600 }}>{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 4-Way Decision Breakdown */}
        <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'16px', padding:'26px', display:'flex', flexDirection:'column', gap:'16px' }}>
          <div>
            <div style={{ fontSize:'11.5px', fontFamily:'monospace', color:'#34D399', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'4px', fontWeight:700 }}>4-Way Decision Breakdown</div>
            <div style={{ fontSize:'15px', fontWeight:700, color:'#FFFFFF' }}>Maintenance Options · {sc.machine}</div>
          </div>

          {/* Options */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {sc.options.map(o => (
              <div key={o.label} style={{ background: o.active ? `${o.color}15` : 'rgba(255,255,255,0.02)', border:`1px solid ${o.active ? o.color+'60' : 'rgba(255,255,255,0.08)'}`, borderRadius:'11px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'14px' }}>
                <div style={{ width:'42px', height:'36px', background:`${o.color}22`, border:`1.5px solid ${o.color}50`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:o.color, flexShrink:0, fontFamily:'monospace' }}>{o.score}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13.5px', fontWeight: o.active ? 700 : 500, color: o.active ? '#FFFFFF' : 'rgba(255,255,255,0.6)', marginBottom:'4px' }}>{o.label}</div>
                  <div style={{ height:'4px', background:'rgba(255,255,255,0.08)', borderRadius:'9999px', overflow:'hidden' }}>
                    <div style={{ width:`${o.score}%`, height:'100%', background:o.color, borderRadius:'9999px', transition:'width 0.5s ease' }} />
                  </div>
                </div>
                {o.active && <span style={{ fontSize:'10px', fontFamily:'monospace', background:`${o.color}25`, color:o.color, border:`1px solid ${o.color}50`, borderRadius:'5px', padding:'3px 9px', letterSpacing:'0.06em', flexShrink:0, fontWeight:700 }}>RECOMMENDED</span>}
              </div>
            ))}
          </div>

          {/* Recommendation box */}
          <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'12px', padding:'16px' }}>
            <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#34D399', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'6px', fontWeight:700 }}>Recommendation Traceability Basis</div>
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.8)', lineHeight:1.6, marginBottom:'10px' }}>{sc.recommendation.reasoning}</div>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
              <span style={{ fontFamily:'monospace', fontSize:'11px', background:'rgba(37,99,235,0.2)', color:'#93C5FD', border:'1px solid rgba(37,99,235,0.35)', borderRadius:'5px', padding:'3px 9px', fontWeight:600 }}>Source Record: {sc.recommendation.evidence}</span>
              <span style={{ fontFamily:'monospace', fontSize:'11px', background:'rgba(16,185,129,0.18)', color:'#34D399', border:'1px solid rgba(16,185,129,0.35)', borderRadius:'5px', padding:'3px 9px', fontWeight:600 }}>Confidence: {sc.recommendation.confidence}%</span>
            </div>
          </div>

          {/* Uncertainty warning if scenario C */}
          {sc.id === 'C' && (
            <div style={{ background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:'12px', padding:'14px 16px' }}>
              <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#FB923C', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'5px', fontWeight:700 }}>⚠ Conflicting Records Detected</div>
              <div style={{ fontSize:'12.5px', color:'rgba(255,255,255,0.7)', lineHeight:1.55 }}>Two shift logs contradict each other on whether the oil separator was replaced or only cleaned. Physical diagnostic inspection is required before ordering parts.</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width:760px){.tour-explorer-grid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  );
};
