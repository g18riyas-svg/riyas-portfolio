import {bucket} from '../../lib/storage';
import {requireAdminUser} from '../admin-auth';
import {readPortfolio} from '../../lib/portfolio';
import ProjectManager from '../../components/ProjectManager';
export const dynamic='force-dynamic';
export default async function Admin(){const u=await requireAdminUser('/admin');if(u.email.toLowerCase()!=='g.18.riyas@gmail.com')return <main className="admin-shell"><h1>Owner access required</h1><a href="/">Back to portfolio</a></main>;return <ProjectManager initial={await readPortfolio(bucket)}/>}
