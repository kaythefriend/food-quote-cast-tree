"use client"

import {useEffect,useMemo,useState} from 'react'

type Cast={hash:string;parent?:string|null;username:string;displayName?:string;avatar?:string;image?:string;text?:string;timestamp?:string;profileUrl?:string;castUrl?:string}
const ROOT='0x3db990553cbe9e8e8993504624b5c2aaf483aa73'

function Tree({casts,onSelect}:{casts:Cast[];onSelect:(c:Cast)=>void}){
 const width=Math.max(1000,casts.length*180), height=600
 const byParent=useMemo(()=>{const m=new Map<string,Cast[]>();casts.forEach(c=>{if(c.parent){const a=m.get(c.parent)||[];a.push(c);m.set(c.parent,a)}});return m},[casts])
 const positions=new Map<string,{x:number;y:number}>();
 const root=casts.find(c=>c.hash===ROOT)||casts[0];
 function layout(c:Cast,x:number,y:number,depth:number){positions.set(c.hash,{x,y});const kids=byParent.get(c.hash)||[];const gap=Math.max(150,220-Math.min(depth,3)*20);kids.forEach((k,i)=>layout(k,x+(i-(kids.length-1)/2)*gap,y+145,depth+1))}
 if(root)layout(root,width/2,90,0)
 const edges=casts.flatMap(c=>{if(!c.parent||!positions.has(c.parent)||!positions.has(c.hash))return [];const a=positions.get(c.parent)!,b=positions.get(c.hash)!;return [`<line class="edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`]})
 return <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><g dangerouslySetInnerHTML={{__html:edges.join('')}}/>{casts.map(c=>{const p=positions.get(c.hash);if(!p)return null;return <g className="node" key={c.hash} transform={`translate(${p.x} ${p.y})`} onClick={()=>onSelect(c)}>{c.image?<image href={c.image} x="-34" y="-34" width="68" height="68" preserveAspectRatio="xMidYMid slice" className="food"/>:<circle r="34" fill="#ded9ce"/>}{c.avatar&&<image href={c.avatar} x="18" y="18" width="22" height="22" preserveAspectRatio="xMidYMid slice" clipPath="circle(11px at 11px 11px)"/>}<text textAnchor="middle" y="54">@{c.username||'unknown'}</text></g>})}</svg>
}

export default function Home(){
 const [casts,setCasts]=useState<Cast[]>([]),[selected,setSelected]=useState<Cast|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{fetch(`/api/tree?hash=${ROOT}`).then(r=>r.json()).then(d=>{if(d.error)throw Error(d.error);setCasts(d.casts||[])}).catch(e=>setError(e.message||'Unable to load Farcaster data')).finally(()=>setLoading(false))},[])
 return <main className="page"><header className="header"><div><div className="brand">Food Quote Cast Tree</div><div className="sub">A living map of the food conversation on Farcaster</div></div><div className="sub">Root: {ROOT.slice(0,10)}…</div></header><section className="canvas">{loading?<div className="loading">Loading live Farcaster quote casts…</div>:error?<div className="empty"><div><h2>Couldn’t load the tree</h2><p>{error}</p><p>Refresh to try again.</p></div></div>:casts.length?<Tree casts={casts} onSelect={setSelected}/>:<div className="empty"><div><h2>No quote casts found</h2><p>The root cast loaded, but the live Farcaster index returned no quote descendants.</p></div></div>}{selected&&<aside className="panel"><button className="close" onClick={()=>setSelected(null)}>×</button>{selected.image&&<img src={selected.image} alt="Food posted in this cast"/>}<div className="person">{selected.avatar&&<img className="avatar" src={selected.avatar}/>}<div><strong>{selected.displayName||selected.username}</strong><span className="muted">@{selected.username}</span></div></div><p className="text">{selected.text||'No cast text available.'}</p><div className="muted">{selected.parent?'Quoted from another cast':'Root cast'}</div>{selected.castUrl&&<p><a href={selected.castUrl} target="_blank">Open cast on Farcaster ↗</a></p>}</aside>}</section></main>
}