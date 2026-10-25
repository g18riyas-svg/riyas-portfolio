import {bucket} from '../../../lib/storage';
export async function GET(req:Request,{params}:{params:Promise<{key:string}>}){
 const {key}=await params;if(!/^[a-zA-Z0-9-]+\.(png|jpg|webp)$/.test(key))return new Response('Not found',{status:404});
 const f=await bucket?.get('images/'+key);if(!f)return new Response('Not found',{status:404});
 return new Response(f.body,{headers:{'Content-Type':f.httpMetadata?.contentType||'image/webp','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});
}
