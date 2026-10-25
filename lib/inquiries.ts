import { z } from 'zod';
export const projectTypes=['Business management system','Web application','Mobile application','Website / portfolio','Other'] as const;
export const budgets = [
  'Prefer to discuss',
  'USD 100–249',
  'USD 250–499',
  'USD 500–999',
  'USD 1,000–1,999',
  'USD 2,000–4,999',
  'USD 5,000–9,999',
  'USD 10,000+',
] as const;
export const timelines=['Flexible / exploring','Within 1 month','1–3 months','3–6 months'] as const;
export const inquirySchema=z.object({requestId:z.string().uuid(),name:z.string().trim().min(2).max(120),email:z.string().trim().email().max(254),projectType:z.enum(projectTypes),budget:z.enum(budgets),timeline:z.enum(timelines),message:z.string().trim().min(20).max(5000),website:z.string().max(200).optional().default('')});
export const updateInquirySchema=z.object({status:z.enum(['new','contacted','closed']),notes:z.string().max(5000)});
export type Inquiry={id:string;name:string;email:string;project_type:string;budget:string;timeline:string;message:string;status:'new'|'contacted'|'closed';notes:string;created_at:number;updated_at:number};
