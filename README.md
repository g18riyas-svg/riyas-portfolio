# Risme Mohomad Riyas — Netlify portfolio

**Updating an existing deployment? Follow [UPGRADE.md](UPGRADE.md) first.**

This migration includes the four published projects, optimized screenshots, portrait images, animations, WhatsApp, email, inquiry form, password-protected project editor, image uploads, and inquiry inbox. It uses native Next.js and Netlify Blobs. No ChatGPT account is required by visitors or the admin.

## Deploy from your computer

1. Install Node.js 22.13 or newer and extract this folder.
2. Run `npm ci`.
3. Run `npx netlify-cli login` and sign in to your own Netlify account in the browser.
4. Run `npx netlify-cli init`. Create a new site; choose your free site name, such as `riyas-dev` if available. Keep `npm run build` and `.next` as the build settings. You can connect a Git repository for automatic future deployments.
5. Generate admin secrets locally. In Bash/macOS/Linux run:

   ```sh
   read -rs -p 'Choose a unique admin password (14+ characters): ' PORTFOLIO_ADMIN_PASSWORD
   export PORTFOLIO_ADMIN_PASSWORD
   npm run admin:setup
   unset PORTFOLIO_ADMIN_PASSWORD
   npx netlify-cli env:import .env.netlify
   ```

   In PowerShell, read the password without displaying it:

   ```powershell
   $secret = Read-Host 'Choose a unique admin password (14+ characters)' -AsSecureString
   $env:PORTFOLIO_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
   npm run admin:setup
   Remove-Item Env:PORTFOLIO_ADMIN_PASSWORD
   npx netlify-cli env:import .env.netlify
   ```

   Verify `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` exist in Netlify's environment settings and include the Functions runtime scope. Never commit `.env.netlify` or send passwords in chat. Delete the generated file after import.

6. Run `npx netlify-cli deploy --build --prod`.
7. Open the URL Netlify returns. Your public URL will be `https://YOUR-SITE-NAME.netlify.app`. The example site name is not reserved or verified.
8. Visit `/login`, sign in, and test the items below before sharing with clients.

A drag-and-drop upload of the source folder will not build this dynamic app. Use the CLI build above or a connected Git repository.

## Manage your portfolio

- `/admin`: edit your name, contacts, case studies, screenshots, and published/draft status.
- `/admin/inquiries`: review inquiries, search/filter, add private notes, and mark contacted or closed.
- Admin sessions expire after eight hours. Use Sign out on shared computers.
- New inquiries appear in the inbox. Gmail notifications are included; activate them with the setup below.
- Uploads accept PNG/JPEG/WebP, maximum 3 MB after browser compression.
- The inbox displays the latest 500 inquiries. Storage is kept between deployments on the same Netlify site. Deleting the Netlify site or its Blobs stores deletes this data.

## Migration boundary

The included content was fetched from the existing public portfolio (four published projects). Private old inquiries and unpublished drafts were not accessible and have NOT been migrated. Keep the original site available to review those records; export/copy them separately before retiring it. New inquiries go to the new Netlify inbox after deployment. The original site has not been changed.

## Before sending the link

- Test a real inquiry and confirm it appears under `/admin/inquiries`.
- Save a project edit, refresh, and confirm it persists.
- Upload a screenshot and verify it appears publicly after publishing.
- Test email, WhatsApp, phone layout, and all project galleries.
- Verify logged-out visitors cannot open the inbox or edit projects.
- Check the Netlify dashboard's usage limits. The Free plan has quotas; this package does not provision paid add-ons. A custom `.com` or `.lk` is purchased separately.

## Development and checks

`npm run build` builds the production app. `npm run check` checks TypeScript. `node scripts/smoke-test.mjs` runs integration checks with an ephemeral local Netlify Blobs server after a build; its data is removed afterward. For interactive development with the Netlify runtime, use `npx netlify-cli dev` after linking the site and importing secrets.

Keep a secure backup of project content and inquiries. Netlify Blobs is the live database, not a source-code backup. A future deployment to a different Netlify site starts with different storage.

## Free subdomain and ownership

Netlify assigns a `netlify.app` address; set the site name in the Netlify dashboard. Use your own account so you control the URL, files, settings, and inquiries. This archive is prepared for deployment; it is not an already-published Netlify site.

## Activate Gmail notifications

Every new inquiry is saved in Netlify Blobs first, then emailed to **g.18.riyas@gmail.com**. Reply in Gmail to reply directly to the prospective client. Notifications include their name, email, project type, budget, timeline, and message. Sending failure does not lose the inquiry or show an error to the client after it was saved.

1. Sign into `g.18.riyas@gmail.com` and enable Google 2-Step Verification.
2. Visit https://myaccount.google.com/apppasswords and create an App Password named **Riyas Portfolio**. Some account security policies can prevent App Passwords; see https://support.google.com/mail/answer/185833 .
3. In your Netlify site's environment variables add `GMAIL_USER` = `g.18.riyas@gmail.com` and `GMAIL_APP_PASSWORD` = the generated App Password. Give both variables Functions runtime access. Do not use a `NEXT_PUBLIC_` prefix. Do not send the password in chat or commit it to Git.
4. Redeploy the site so Functions receive those variables.
5. Submit a real test inquiry and check both Gmail (including Spam) and `/admin/inquiries`.

The inbox shows whether email is configured and how many of the latest 500 inquiries have pending notifications. Use **Retry pending emails** to retry one at a time if Gmail was unavailable or you configured email after receiving inquiries. A five-minute lease prevents concurrent sends; a crash after Gmail accepts an email but before its status is saved can still result in a duplicate on retry. No background schedule or guaranteed email delivery is claimed.

The email sender is your authenticated Gmail address; the client's address is set as Reply-To. Notifications only go to the owner's Gmail address. Gmail may throttle, reject or filter messages; keep the saved admin inbox as the source of truth. Changing your Google password may revoke App Passwords. This package does not include credentials and email delivery is inactive until you configure them.

Email-specific tests: `npm run test:email` checks notification formatting, failure recording, retries and duplicate suppression with a local storage server and a fake mail sender. It sends no real email.

Set SITE_URL in Netlify to your exact public HTTPS website URL (for example https://risme-riyas-portfolio.netlify.app). This allows origin validation behind the Netlify proxy without trusting caller-supplied forwarding headers. Update it if you change domains.
