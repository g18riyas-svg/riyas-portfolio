import {cookies} from 'next/headers';
import {sameOrigin} from '../../../../lib/auth';
export async function POST(req:Request){if(!sameOrigin(req))return new Response('Invalid origin',{status:403});(await cookies()).delete('riyas_admin');return Response.redirect(new URL('/',req.url),303)}
