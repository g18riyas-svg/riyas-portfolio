import { bucket } from '../lib/storage';
import PortfolioView from '../components/PortfolioView';
import { readPortfolio } from '../lib/portfolio';
import { getAdminUser } from '../lib/auth';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const data = await readPortfolio(bucket);
  const canEdit = Boolean(await getAdminUser());
  return (
    <PortfolioView
      data={{ ...data, projects: data.projects.filter((p) => p.published) }}
      canEdit={canEdit}
    />
  );
}
