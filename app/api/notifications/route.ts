import {getAdminUser} from '../../admin-auth';
import {sameOrigin} from '../../../lib/auth';
import {store,limited} from '../../../lib/storage';
import {listInquiries} from '../../../lib/inquiry-store';
import {emailConfigured,notifyInquiry,type Delivery} from '../../../lib/inquiry-email';
export const dynamic='force-dynamic';
export async function GET(){
 if(!await getAdminUser())return Response.json({error:'Owner access required'},{status:403});
 try{const inquiries=await listInquiries();const states=await Promise.all(inquiries.map(async i=>(await store('notifications').get(i.id,{type:'json'})) as Delivery|null));return Response.json({configured:emailConfigured(),sent:states.filter(s=>s?.status==='sent').length,pending:states.filter(s=>s?.status!=='sent').length},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Unable to load email status'},{status:503})}
}
export async function POST(req:Request){
 if(!await getAdminUser()||!sameOrigin(req))return Response.json({error:'Owner access required'},{status:403});
 if(!emailConfigured())return Response.json({error:'Add GMAIL_USER and GMAIL_APP_PASSWORD in Netlify, then redeploy.'},{status:503});
 try{
 if(!await limited('email-retry',2,60*1000))return Response.json({error:'Please wait a minute before retrying again.'},{status:429});
 const inquiries=await listInquiries();let retried=0;
 for(const i of inquiries){const state=await store('notifications').get(i.id,{type:'json'}) as Delivery|null;if(state?.status==='sent')continue;if(state?.status==='sending'&&Date.now()-state.updatedAt<5*60*1000)continue;await notifyInquiry(i);retried++;if(retried>=1)break;}
 return Response.json({ok:true,retried});
 }catch{return Response.json({error:'Unable to retry notifications. Saved inquiries are still available.'},{status:503})}
}
