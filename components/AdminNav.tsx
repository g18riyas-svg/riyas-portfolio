export default function AdminNav({ active }: { active: 'projects' | 'inquiries' }) {
  return (
    <nav className="admin-navigation" aria-label="Portfolio administration">
      <a href="/admin" aria-current={active === 'projects' ? 'page' : undefined}>
        Projects & profile
      </a>
      <a href="/admin/inquiries" aria-current={active === 'inquiries' ? 'page' : undefined}>
        Inquiries
      </a>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Sign out</button>
      </form>
    </nav>
  );
}
