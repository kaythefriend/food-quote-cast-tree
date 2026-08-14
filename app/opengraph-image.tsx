import {ImageResponse} from 'next/og'

export const runtime = 'edge'
export const alt = 'Food Quote Cast Tree'
export const size = {width: 1200, height: 630}
export const contentType = 'image/png'

export default function OpenGraphImage(){
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'64px 72px',background:'#08080b',color:'#fff',fontFamily:'sans-serif',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',left:-120,top:-180,width:620,height:620,borderRadius:'50%',background:'radial-gradient(circle, rgba(138,99,210,.55) 0%, rgba(138,99,210,0) 68%)'}} />
      <div style={{position:'absolute',right:-180,bottom:-240,width:700,height:700,borderRadius:'50%',background:'radial-gradient(circle, rgba(166,123,234,.28) 0%, rgba(166,123,234,0) 70%)'}} />
      <div style={{display:'flex',flexDirection:'column',gap:18,position:'relative'}}>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:5,color:'#a67bea'}}>FARCASTER / FOOD CONVERSATION</div>
        <div style={{fontSize:68,fontWeight:800,letterSpacing:-3}}>Food Quote Cast Tree</div>
        <div style={{fontSize:28,color:'#b7b1c1',maxWidth:850}}>Follow a food idea as it branches, mutates and travels across Farcaster.</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:20,position:'relative'}}>
        <div style={{width:22,height:22,borderRadius:999,background:'#8a63d2',boxShadow:'0 0 22px rgba(138,99,210,.9)'}} />
        <div style={{fontSize:22,color:'#918c9c'}}>Tree View  •  Globe View  •  Explore the conversation</div>
      </div>
    </div>,
    {width:1200,height:630}
  )
}
