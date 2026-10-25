import {bucket} from '../../../lib/storage';
import {getAdminUser} from '../../admin-auth';
import {readPortfolio,schema} from '../../../lib/portfolio';
export const dynamic='force-dynamic';
const owner = async()=> (await getAdminUser())?.email.toLowerCase()==='g.18.riyas@gmail.com';
export async function GET(){const canEdit=await owner();const data=await readPortfolio(bucket);return Response.json({data:{...data,projects:data.projects.filter(p=>canEdit||p.published)},canEdit},{headers:{'Cache-Control':'no-store'}});}
export async function PUT(req:Request){
 if(!await owner())return Response.json({error:'Owner access required'},{status:403});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 if(!bucket)return Response.json({error:'Storage is unavailable. Try again later.'},{status:503});
 const raw=await req.text();if(raw.length>500000)return Response.json({error:'Portfolio is too large'},{status:413});
 try{const data=schema.parse(JSON.parse(raw));await bucket.put('portfolio/content.json',JSON.stringify(data),{httpMetadata:{contentType:'application/json'}});return Response.json({ok:true});}
 catch{return Response.json({error:'Check your fields. Links must use HTTPS and project names are required.'},{status:400});}
}
