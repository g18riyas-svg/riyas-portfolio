import defaults from './defaults.json';
import { z } from 'zod';
const text = (n:number) => z.string().max(n);
const link = z.string().max(1000).refine(s => !s || /^https:\/\//i.test(s), 'Use an HTTPS link');
const imageUrl = z.string().max(300).regex(/^\/(projects\/[a-z0-9-]+\.webp|media\/[a-zA-Z0-9-]+\.(png|jpg|webp))$/);
export const schema = z.object({contactRevision:z.number().int().min(0).default(0),name:text(100).min(1),role:text(120),headline:text(200),intro:text(1500),email:z.union([z.literal(''),z.string().email()]),whatsapp:text(30).regex(/^[+\d\s()-]*$/),linkedin:link,github:link,projects:z.array(z.object({id:text(80).regex(/^[a-zA-Z0-9-]+$/),title:text(150).min(1),tagline:text(200),category:text(150),summary:text(2000),problem:text(3000),solution:text(3000),note:text(1500),features:z.array(text(100)).max(20),technologies:z.array(text(80)).max(25),images:z.array(z.object({url:imageUrl,alt:text(200)})).max(30),liveUrl:link,githubUrl:link,published:z.boolean()})).max(100)}).superRefine((d,ctx)=>{if(new Set(d.projects.map(p=>p.id)).size!==d.projects.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'Project IDs must be unique'});});
export type Portfolio = z.infer<typeof schema>;
export type Project = Portfolio['projects'][number];
export const initial = defaults as Portfolio;
export async function readPortfolio(bucket?:typeof import('./storage').bucket):Promise<Portfolio>{
 if(!bucket) return initial;
 const stored=await bucket.get('portfolio/content.json');
 const data=stored ? schema.parse(await stored.json()) : initial;
 return data.contactRevision<1 ? {...data,email:'g.18.riyas@gmail.com',whatsapp:'+94706442810',contactRevision:1} : data;
}
