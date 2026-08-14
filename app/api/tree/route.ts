import {NextRequest,NextResponse} from 'next/server'

type Cast={hash:string;parent?:string|null;username:string;displayName?:string;avatar?:string;image?:string;text?:string;timestamp?:string;profileUrl?:string;castUrl?:string}
const ROOT='0x3db990553cbe9e8e8993504624b5c2aaf483aa73'
const BASE='https://api.neynar.com/v2'
function imageOf(c:any){const es=c.embeds||[];for(const e of es){const u=e?.url||e?.metadata?.image||e?.metadata?.content_type?.startsWith?.('image')&&e.url;if(typeof u==='string'&&/^https?:\/\//.test(u)&&!u.includes('farcaster.xyz'))return u}const u=c.frames?.[0]?.image;return typeof u==='string'?u:undefined}
function normalize(c:any):Cast{return {hash:c.hash,parent:c.parent_hash||c.parent?.hash||null,username:c.author?.username||c.author?.display_name||'unknown',displayName:c.author?.display_name,avatar:c.author?.pfp_url,image:imageOf(c),text:c.text,timestamp:c.timestamp,profileUrl:c.author?.profile?.bio?.url,castUrl:c.hash?`https://farcaster.xyz/${c.author?.username||'~/'}\/0x${c.hash.replace(/^0x/,'')}`:undefined}}
async function api(path:string){const key=process.env.NEYNAR_API_KEY;if(!key)throw Error('NEYNAR_API_KEY is not configured in Vercel. Add a Neynar API key to this project.');const r=await fetch(BASE+path,{headers:{accept:'application/json','x-api-key':key},cache:'no-store'});if(!r.ok)throw Error(`Farcaster API returned ${r.status}`);return r.json()}
export async function GET(req:NextRequest){try{const hash=req.nextUrl.searchParams.get('hash')||ROOT;const root=(await api(`/cast?identifier=${encodeURIComponent(hash)}&type=hash`)).cast;const out=new Map<string,Cast>([[root.hash,normalize(root)]])
 let frontier=[root.hash]
 for(let depth=0;depth<8&&frontier.length;depth++){const next:string[]=[];for(const parent of frontier){const d=await api(`/casts?parent_hash=${encodeURIComponent(parent)}&limit=100`);for(const raw of d.casts||[]){const c=normalize(raw);if(!out.has(c.hash)){out.set(c.hash,c);next.push(c.hash)}}}frontier=next}
 return NextResponse.json({casts:[...out.values()]})}catch(e:any){return NextResponse.json({error:e.message||'Unknown error'},{status:500})}}
