import {bucket} from '../lib/storage';
import PortfolioView from '../components/PortfolioView';
import {readPortfolio} from '../lib/portfolio';
import {getAdminUser} from './admin-auth';
export const dynamic='force-dynamic';
export default async function Home(){const data=await readPortfolio(bucket);const canEdit=(await getAdminUser())?.email.toLowerCase()==='g.18.riyas@gmail.com';return <PortfolioView data={{...data,projects:data.projects.filter(p=>p.published)}} canEdit={canEdit}/>}
