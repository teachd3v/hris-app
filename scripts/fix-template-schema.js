import { execSync } from "child_process";
import fs from "fs";

console.log("Fetching raw template schema from D1...");

const output = execSync(
  `npx wrangler d1 execute hris-teachapp-db --remote --json --command="SELECT id, schema FROM assessment_templates;"`,
  { encoding: "utf-8" }
);

const rows = JSON.parse(output)[0]?.results || [];

for (const row of rows) {
  let raw = row.schema;
  let parsed = null;

  try {
    parsed = JSON.parse(raw);
    console.log(`Template ${row.id} parsed cleanly without fixes!`);
  } catch (e1) {
    console.log(`Template ${row.id} failed initial parse: ${e1.message}. Attempting cleanup...`);
    try {
      // Fix double-escaped quote patterns: \\" -> \"
      let cleaned = raw.replace(/\\\\"/g, '\\"');
      parsed = JSON.parse(cleaned);
      console.log(`Template ${row.id} fixed successfully!`);
    } catch (e2) {
      console.error(`Template ${row.id} fix failed:`, e2.message);
    }
  }

  if (parsed) {
    const cleanJson = JSON.stringify(parsed).replace(/'/g, "''");
    fs.writeFileSync("scripts/fix_template.sql", `UPDATE assessment_templates SET schema = '${cleanJson}' WHERE id = '${row.id}';`, "utf-8");
    console.log("Executing fix_template.sql...");
    execSync(`npx wrangler d1 execute hris-teachapp-db --remote --file=scripts/fix_template.sql`, { encoding: "utf-8" });
    console.log(`Template ${row.id} updated in D1 database!`);
  }
}
