// Runs only in a Docker tools container. Never print complete CLI status output.
import { readFileSync, writeFileSync } from 'node:fs';
const [statusPath, destination, project, origin] = process.argv.slice(2);
const status = JSON.parse(readFileSync(statusPath, 'utf8'));
const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
const adminKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
if (!publicKey || !adminKey) throw new Error('Local Supabase keys missing from status.');
const api = `http://supabase_kong_${project}:8000`;
writeFileSync(`${destination}/app.env`, [
  `SUPABASE_URL=${api}`, `SUPABASE_PUBLISHABLE_KEY=${publicKey}`, `APP_ORIGIN=${origin}`,
].join('\n'), { mode: 0o600 });
writeFileSync(`${destination}/test.env`, [
  `TEST_BASE_URL=${origin}`, `TEST_SUPABASE_URL=${api}`,
  `TEST_SUPABASE_PUBLIC_KEY=${publicKey}`, `TEST_SUPABASE_ADMIN_KEY=${adminKey}`,
  `TEST_MAIL_URL=http://supabase_inbucket_${project}:8025`,
].join('\n'), { mode: 0o600 });
