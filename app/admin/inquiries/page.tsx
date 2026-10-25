import EmailNotifications from '../../../components/EmailNotifications';
import {requireAdminUser} from '../../admin-auth';
import InquiryInbox from '../../../components/InquiryInbox';
import {listInquiries} from '../../../lib/inquiry-store';
import type {Inquiry} from '../../../lib/inquiries';
export const dynamic='force-dynamic';
export default async function Inquiries(){await requireAdminUser('/admin/inquiries');let items:Inquiry[]=[];let error='';try{items=await listInquiries()}catch{error='The inbox is unavailable. Check Netlify Blobs configuration and try Refresh inbox.'}return <><EmailNotifications/><InquiryInbox initial={items} loadError={error}/></>}
