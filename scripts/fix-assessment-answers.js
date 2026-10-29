import { execSync } from "child_process";

console.log("Fetching all employee_assessments from D1...");

const output = execSync(
  `npx wrangler d1 execute hris-teachapp-db --remote --json --command="SELECT id, answers FROM employee_assessments;"`,
  { encoding: "utf-8" }
);

const data = JSON.parse(output);
const rows = data[0]?.results || [];

console.log(`Found ${rows.length} assessment records.`);

let fixedCount = 0;

for (const row of rows) {
  if (!row.answers) continue;
  let raw = row.answers;
  let parsed = null;

  try {
    parsed = JSON.parse(raw);
  } catch (e1) {
    try {
      // Clean backslashes
      let cleaned = raw.replace(/\\+/g, "\\");
      parsed = JSON.parse(cleaned);
    } catch (e2) {
      console.error(`Failed to parse ID ${row.id}:`, e2.message);
    }
  }

  if (parsed) {
    const cleanJson = JSON.stringify(parsed).replace(/'/g, "''");
    try {
      execSync(
        `npx wrangler d1 execute hris-teachapp-db --remote --command="UPDATE employee_assessments SET answers = '${cleanJson}' WHERE id = '${row.id}';"`,
        { encoding: "utf-8" }
      );
      fixedCount++;
    } catch (err) {
      console.error(`Failed updating row ${row.id}:`, err.message);
    }
  }
}

console.log(`Successfully cleaned ${fixedCount} assessment records in D1!`);
