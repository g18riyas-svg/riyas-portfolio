import {cookies} from 'next/headers';
import {createHmac,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {redirect} from 'next/navigation';
const COOKIE='riyas_admin';
export function configured(){return Boolean(process.env.ADMIN_PASSWORD_HASH&&process.env.SESSION_SECRET&&process.env.SESSION_SECRET.length>=32);}
export function validPassword(value:string){try{const [salt,hex]=process.env.ADMIN_PASSWORD_HASH!.split(':');const expected=Buffer.from(hex,'hex');const actual=scryptSync(value,salt,64);return expected.length===actual.length&&timingSafeEqual(actual,expected);}catch{return false;}}
function sign(s:string){return createHmac('sha256',process.env.SESSION_SECRET!).update(s).digest('base64url');}
export function sessionValue(){const data=Buffer.from(JSON.stringify({exp:Date.now()+8*60*60*1000,v:createHash('sha256').update(process.env.ADMIN_PASSWORD_HASH!).digest('hex')})).toString('base64url');return data+'.'+sign(data);}
export async function getAdminUser(){if(!configured())return null;try{const value=(await cookies()).get(COOKIE)?.value||'';const [data,sig]=value.split('.');const a=Buffer.from(sig||'');const b=Buffer.from(sign(data));if(a.length!==b.length||!timingSafeEqual(a,b))return null;const payload=JSON.parse(Buffer.from(data,'base64url').toString());if(payload.exp<Date.now()||payload.v!==createHash('sha256').update(process.env.ADMIN_PASSWORD_HASH!).digest('hex'))return null;return {email:'g.18.riyas@gmail.com'};}catch{return null;}}
export async function requireAdminUser(path:string){const u=await getAdminUser();if(!u)redirect('/login?returnTo='+encodeURIComponent(path));return u;}
export function sameOrigin(req:Request){
 const origin=req.headers.get('origin');
 if(!origin)return false;
 const siteUrl=process.env.SITE_URL||process.env.URL;
 try{return origin===new URL(siteUrl||req.url).origin;}catch{return false;}
}
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict' as const,path:'/',maxAge:8*60*60};
