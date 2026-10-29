import { execSync } from "child_process";

const output = execSync(
  `npx wrangler d1 execute hris-teachapp-db --remote --json --command="SELECT schema FROM assessment_templates WHERE id='11111111-1111-1111-1111-111111111111';"`,
  { encoding: "utf-8" }
);

const rawSchema = JSON.parse(output)[0]?.results[0]?.schema;
console.log("Length of rawSchema:", rawSchema.length);
console.log("Snippet around 6400-6500:");
console.log(rawSchema.substring(6350, 6550));
