'use strict';
function csvCell(v){ if(v===null||v===undefined) return ''; const s=typeof v==='object'?JSON.stringify(v):String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function toCsv(rows, cols){ const c=cols||(rows[0]?Object.keys(rows[0]):[]); if(!c.length) return ''; return [c.join(','), ...rows.map(r=>c.map(k=>csvCell(r[k])).join(','))].join('\n'); }
function providerConfigured(env){ env=env||process.env; return Boolean((env.OPENROUTER_API_KEY&&env.OPENROUTER_API_KEY!=='your_openrouter_api_key_here'&&env.OPENROUTER_API_KEY!=='your_openrouter_key_here')||env.OPENAI_API_KEY); }
const num=v=>{ const n=Number(v); return Number.isFinite(n)?n:0; };
function formatValue(v){ if(v===false) return 'false'; if(v===0) return '0'; if(v===''||v===null||v===undefined) return '(empty)'; if(typeof v==='object') return JSON.stringify(v); return String(v); }

function catalogValueSummary(rows){ rows=rows||[]; const avg=k=>rows.length?Math.round(rows.reduce((s,r)=>s+num(r[k]),0)/rows.length*100)/100:0;
 return {feature:'catalog-value-summary',aiGenerated:false,source:'deterministic-fallback',sections:[{label:'Items reviewed',value:rows.length},{label:'Average estimate low',value:avg('estimate_low')},{label:'Average estimate high',value:avg('estimate_high')},{label:'Average reserve price',value:avg('reserve_price')},{label:'Has items',value:rows.length>0}]}; }
function statusPipeline(rows){ rows=rows||[]; const by={}; rows.forEach(r=>{by[r.status||'unknown']=(by[r.status||'unknown']||0)+1;});
 return {feature:'status-pipeline',aiGenerated:false,source:'deterministic-fallback',sections:[{label:'Items reviewed',value:rows.length},{label:'By status',value:by},{label:'Cataloged count',value:by['cataloged']||0},{label:'Sold count',value:by['sold']||0}]}; }
function categoryMix(rows){ rows=rows||[]; const by={}; rows.forEach(r=>{by[r.category||'unknown']=(by[r.category||'unknown']||0)+1;});
 return {feature:'category-mix',aiGenerated:false,source:'deterministic-fallback',sections:[{label:'Items reviewed',value:rows.length},{label:'By category',value:by},{label:'Distinct categories',value:Object.keys(by).length},{label:'Uncategorized count',value:by['unknown']||0}]}; }
module.exports={toCsv,providerConfigured,formatValue,catalogValueSummary,statusPipeline,categoryMix,FEATURES:{'catalog-value-summary':catalogValueSummary,'status-pipeline':statusPipeline,'category-mix':categoryMix}};
