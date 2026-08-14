import {NextRequest,NextResponse} from 'next/server'

type Cast={hash:string;parent?:string|null;username:string;displayName?:string;avatar?:string;image?:string;text?:string;timestamp?:string;castUrl?:string}
const ROOT='0x3db990553cbe9e8e8993504624b5c2aaf483aa73'
const BASE='https://api.neynar.com/v2/farcaster'

// Use only media explicitly attached to this cast. Nested/related embed media
// is deliberately ignored so one cast cannot inherit another cast's food photo.
function imageOf(c:any){
  const add=(v:any)=>typeof v==='string'&&/^https?:\/\//.test(v)&&!v.includes('farcaster.xyz')?v:undefined
  const embeds=Array.isArray(c?.embeds)?c.embeds:[]
  for(const e of embeds){
    const direct=[e?.url,e?.image_url,e?.image,e?.metadata?.image,e?.metadata?.image_url]
    for(const u of direct){const x=add(u);if(x)return x}
  }
  const frames=Array.isArray(c?.frames)?c.frames:[]
  for(const f of frames){const x=add(f?.image_url)||add(f?.image);if(x)return x}
  return add(c?.image_url)||add(c?.image)
}
function normalize(c:any,parentOverride?:string):Cast{const username=c?.author?.username||c?.author?.display_name||'unknown';return {hash:c.hash,parent:parentOverride??c.parent_hash??c.parent?.hash??null,username,displayName:c?.author?.display_name,avatar:c?.author?.pfp_url,image:imageOf(c),text:c?.text,timestamp:c?.timestamp,castUrl:`https://farcaster.xyz/${username}/${c.hash}`}}
async function api(path:string){const key=process.env.NEYNAR_API_KEY;if(!key)throw Error('NEYNAR_API_KEY is not configured in Vercel.');const r=await fetch(BASE+path,{headers:{accept:'application/json','x-api-key':key},next:{revalidate:60}});if(!r.ok)throw Error(`Farcaster API returned ${r.status}`);return r.json()}
async function quotesOf(hash:string){const all:any[]=[];let cursor='';for(let page=0;page<10;page++){const q=`/cast/quotes?identifier=${encodeURIComponent(hash)}&type=hash&limit=100${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`;const d=await api(q);all.push(...(d.casts||[]));cursor=d?.next?.cursor||'';if(!cursor)break}return all}
export async function GET(req:NextRequest){try{const hash=req.nextUrl.searchParams.get('hash')||ROOT;const root=(await api(`/cast?identifier=${encodeURIComponent(hash)}&type=hash`)).cast;if(!root?.hash)throw Error('Root cast was not found.');const out=new Map<string,Cast>([[root.hash,normalize(root)]]);let frontier=[root.hash];for(let depth=0;depth<12&&frontier.length;depth++){const batches=await Promise.all(frontier.map(quotesOf));const next:string[]=[];for(let i=0;i<batches.length;i++){for(const raw of batches[i]){const c=normalize(raw,frontier[i]);if(!out.has(c.hash)){out.set(c.hash,c);next.push(c.hash)}}}frontier=next}return NextResponse.json({casts:[...out.values()]},{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'}})}catch(e:any){return NextResponse.json({error:e.message||'Unknown error'},{status:500})}}