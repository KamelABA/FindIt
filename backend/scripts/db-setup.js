// npm run db:setup  →  runs supabase/schema.sql then supabase/seed.sql on the database.
//
// Needs DATABASE_URL in backend/.env (Supabase → Connect → connection string). Never commit it.
// Both files are safe to run again: they create what is missing and upgrade older databases.
// Everything runs in ONE transaction: if any statement fails, nothing is changed.
//
//   npm run db:setup              schema + seed
//   npm run db:setup -- --check   only print the users table columns and the role values
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in backend/.env (Supabase → Connect → connection string).");
  process.exit(1);
}

const file = (name) => fileURLToPath(new URL(`../supabase/${name}`, import.meta.url));
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function check() {
  const columns = await client.query(
    `select column_name, data_type, udt_name from information_schema.columns
     where table_schema = 'public' and table_name = 'users' order by ordinal_position`
  );
  console.table(columns.rows);
  const roles = await client.query(
    `select e.enumlabel as role from pg_enum e join pg_type t on t.oid = e.enumtypid
     where t.typname = 'user_role' order by e.enumsortorder`
  );
  console.log("role values:", roles.rows.map((r) => r.role).join(", ") || "(enum not created yet)");
  const counts = await client.query(`select role::text, count(*)::int as accounts from public.users group by role order by role`).catch(() => null);
  if (counts) console.table(counts.rows);
}

try {
  await client.connect();
  if (process.argv.includes("--check")) {
    await check();
  } else {
    await client.query("begin");
    for (const name of ["schema.sql", "seed.sql"]) {
      process.stdout.write(`Running ${name}… `);
      await client.query(await readFile(file(name), "utf8"));
      console.log("ok");
    }
    await client.query("commit");
    console.log("Database is up to date.");
    await check();
  }
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error(`\nFailed, nothing was changed: ${error.message}`);
  if (error.position) console.error(`(at character ${error.position} of the file above)`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
