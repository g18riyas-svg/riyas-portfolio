import { bucket } from '../../lib/storage';
import { requireAdminUser } from '../../lib/auth';
import { readPortfolio } from '../../lib/portfolio';
import ProjectManager from '../../components/ProjectManager';
export const dynamic = 'force-dynamic';
export default async function Admin() {
  await requireAdminUser('/admin');
  return <ProjectManager initial={await readPortfolio(bucket)} />;
}
