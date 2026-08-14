"use client"

import {useEffect,useMemo,useRef,useState} from 'react'
import {usePathname} from 'next/navigation'

type Cast={hash:string;parent?:string|null;username:string;displayName?:string;avatar?:string;image?:string;text?:string;timestamp?:string;castUrl?:string}
type Pos={x:number;y:number;depth:number}
const DEFAULT_ROOT='0x3db990553cbe9e8e8993504624b5c2aaf483aa73'

function shortHash(h:string){return `${h.slice(0,6)}…${h.slice(-4)}`}
function timeAgo(s?:string){if(!s)return '';const n=Date.now()-new Date(s).getTime();const m=Math.max(1,Math.round(n/60000));if(m<60)return `${m}m ago`;const h=Math.round(m/60);if(h<24)return `${h}h ago`;return `${Math.round(h/24)}d ago`}

function Canvas({casts,onSelect}:{casts:Cast[];onSelect:(c:Cast)=>void}){
 const ref=useRef<HTMLDivElement>(null);const [zoom,setZoom]=useState(1);const [pan,setPan]=useState({x:0,y:0});const drag=useRef({x:0,y:0,px:0,py:0,active:false})
 const root=casts[0]
 const children=useMemo(()=>{const m=new Map<string,Cast[]>();for(const c of casts){if(c.parent){const a=m.get(c.parent)||[];a.push(c);m.set(c.parent,a)}}return m},[casts])
 const positions=useMemo(()=>{const out=new Map<string,Pos>();let cursor=0;function walk(c:Cast,depth:number){const kids=children.get(c.hash)||[];kids.forEach(k=>walk(k,depth+1));const own=kids.length?kids.reduce((sum,k)=>sum+(out.get(k.hash)?.x||0),0)/kids.length:cursor++*190;out.set(c.hash,{x:own,y:depth*190,depth})}if(root)walk(root,0);const max=Math.max(...[...out.values()].map(p=>p.x),900);for(const p of out.values())p.x+=Math.max(40,(max-900)/2);return out},[casts,children,root])
 const w=Math.max(1100,...[...positions.values()].map(p=>p.x+220)),h=Math.max(650,...[...positions.values()].map(p=>p.y+230))
 const onWheel=(e:React.WheelEvent)=>{e.preventDefault();setZoom(z=>Math.min(2.2,Math.max(.35,z*(e.deltaY<0?1.1:.9))))}
 const down=(e:React.PointerEvent)=>{drag.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y,active:true};e.currentTarget.setPointerCapture(e.pointerId)}
 const move=(e:React.PointerEvent)=>{if(!drag.current.active)return;setPan({x:drag.current.px+e.clientX-drag.current.x,y:drag.current.py+e.clientY-drag.current.y})}
 const up=()=>{drag.current.active=false}
 return <div ref={ref} className="treeViewport" onWheel={onWheel} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
   <div className="treeStage" style={{width:w,height:h,transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
    <svg className="connections" width={w} height={h} aria-hidden="true">{casts.map(c=>{if(!c.parent)return null;const a=positions.get(c.parent),b=positions.get(c.hash);if(!a||!b)return null;const x1=a.x+86,y1=a.y+108,x2=b.x+86,y2=b.y+12,mid=(y1+y2)/2;return <path key={c.hash} d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`} />})}</svg>
    {casts.map(c=>{const p=positions.get(c.hash);if(!p)return null;const rootNode=!c.parent;return <button key={c.hash} className={`castCard ${rootNode?'rootCard':''}`} style={{left:p.x,top:p.y}} onClick={()=>onSelect(c)} aria-label={`Open cast by @${c.username}`}>
      <div className="cardTop"><span className="depthBadge">{rootNode?'ORIGIN':`LEVEL ${p.depth}`}</span>{c.timestamp&&<span>{timeAgo(c.timestamp)}</span>}</div>
      <div className="foodFrame">{c.image?<img src={c.image} alt="" loading={p.depth<2?'eager':'lazy'} onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="noFood"><span>🍽️</span><small>No food image</small></div>}<div className="avatarWrap">{c.avatar?<img src={c.avatar} alt="" loading="lazy"/>:<span>?</span>}</div></div>
      <div className="cardBody"><strong>@{c.username}</strong><span className="displayName">{c.displayName||'Farcaster creator'}</span>{c.text&&<p>{c.text}</p>}<div className="cardFooter"><span>{shortHash(c.hash)}</span><span>↗</span></div></div>
    </button>})}
   </div>
 </div>
}

export default function Home(){
 const pathname=usePathname();const routeHash=pathname?.split('/').filter(Boolean)[0];const rootHash=routeHash||DEFAULT_ROOT
 const [casts,setCasts]=useState<Cast[]>([]),[selected,setSelected]=useState<Cast|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{let cancelled=false;setLoading(true);setError('');setSelected(null);fetch(`/api/tree?hash=${encodeURIComponent(rootHash)}`).then(async r=>{const d=await r.json();if(!r.ok||d.error)throw Error(d.error||`Request failed (${r.status})`);return d}).then(d=>{if(!cancelled)setCasts(d.casts||[])}).catch(e=>{if(!cancelled)setError(e.message||'Unable to load Farcaster data')}).finally(()=>{if(!cancelled)setLoading(false)});return()=>{cancelled=true}},[rootHash])
 const levels=casts.length?Math.max(...casts.map(c=>{let n=0,p=c.parent;const seen=new Set<string>();while(p&& !seen.has(p)){seen.add(p);const q=casts.find(x=>x.hash===p);if(!q)break;n++;p=q.parent}return n})):0
 return <main className="appShell"><header className="topbar"><div className="brandBlock"><div className="eyebrow">FARCASTER / FOOD CONVERSATION</div><h1>Food Quote Cast Tree</h1><p>Follow a food idea as it branches, mutates and travels across Farcaster.</p></div><div className="stats"><div><b>{casts.length||'—'}</b><span>casts</span></div><div><b>{levels||'—'}</b><span>levels</span></div></div></header>
 <section className="workspace"><div className="toolbar"><button onClick={()=>window.location.reload()}>↻ Refresh</button><button onClick={()=>window.open(`https://farcaster.xyz/${rootHash}`,'_blank')}>Open origin ↗</button></div>
 {loading?<div className="state"><div className="spinner"/><h2>Growing the tree…</h2><p>Fetching live quote-casts and their food media.</p></div>:error?<div className="state errorState"><div className="stateIcon">!</div><h2>Couldn’t grow the tree</h2><p>{error}</p><button onClick={()=>window.location.reload()}>Try again</button></div>:casts.length?<Canvas casts={casts} onSelect={setSelected}/>:<div className="state"><div className="stateIcon">🍴</div><h2>No quote-casts yet</h2><p>The origin loaded, but no quote descendants were returned.</p></div>}
 <div className="legend"><span><i className="dot origin"/> origin</span><span><i className="dot branch"/> quote-cast</span><span>drag to explore · scroll to zoom</span></div>
 {selected&&<aside className="detail"><button className="close" onClick={()=>setSelected(null)}>×</button><div className="detailLabel">CAST DETAIL</div>{selected.image?<img className="heroFood" src={selected.image} alt="Food from this cast"/>:<div className="heroFood noHero">🍽️<span>Food image unavailable</span></div>}<div className="profile"><div className="profilePic">{selected.avatar?<img src={selected.avatar} alt=""/>:'?'}</div><div><b>@{selected.username}</b><span>{selected.displayName}</span></div></div><p className="detailText">{selected.text||'No text was included with this cast.'}</p><div className="meta"><span>{selected.parent?'Quotes another cast':'Origin cast'}</span><code>{shortHash(selected.hash)}</code></div><a className="openCast" href={selected.castUrl||`https://farcaster.xyz/${selected.username}/${selected.hash}`} target="_blank">View on Farcaster <span>↗</span></a></aside>}
 </section></main>
}