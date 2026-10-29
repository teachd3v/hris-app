import { execSync } from "child_process";

const output = execSync(
  `npx wrangler d1 execute hris-teachapp-db --remote --json --command="SELECT schema FROM assessment_templates WHERE id='11111111-1111-1111-1111-111111111111';"`,
  { encoding: "utf-8" }
);

const rawSchema = JSON.parse(output)[0]?.results[0]?.schema;
console.log("Raw Schema string:", JSON.stringify(rawSchema));

try {
  const p1 = JSON.parse(rawSchema);
  console.log("P1 Success:", typeof p1, Array.isArray(p1));
} catch (e) {
  console.error("P1 Failed:", e.message);
}
