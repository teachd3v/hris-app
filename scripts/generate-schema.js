const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'supabase-backup', 'd1-migration.sql');
const outputFile = path.join(__dirname, '..', 'lib', 'db', 'schema.ts');

function generateSchema() {
  const content = fs.readFileSync(inputFile, 'utf8');
  const lines = content.split('\n');
  
  const tables = {};

  lines.forEach(line => {
    const match = line.match(/^INSERT INTO ([a-zA-Z0-9_]+) \((.*?)\) VALUES/);
    if (match) {
      const tableName = match[1];
      if (!tables[tableName]) {
        tables[tableName] = match[2].split(',').map(c => c.trim().replace(/"/g, ''));
      }
    }
  });

  let schemaCode = `import { sqliteTable, text, integer, numeric } from "drizzle-orm/sqlite-core";\n\n`;

  for (const [tableName, columns] of Object.entries(tables)) {
    schemaCode += `export const ${tableName} = sqliteTable("${tableName}", {\n`;
    
    columns.forEach(col => {
      if (col === 'id') {
        schemaCode += `  ${col}: text("id").primaryKey(),\n`;
      } else {
        if (col === 'created_at' || col === 'updated_at' || col === 'date' || col.endsWith('_date') || col === 'clock_in' || col === 'clock_out') {
          schemaCode += `  ${col}: text("${col}"),\n`;
        } else if (col === 'score' || col.startsWith('duration') || col === 'leave_total' || col === 'leave_used') {
          schemaCode += `  ${col}: numeric("${col}"),\n`;
        } else if (col === 'schema' || col === 'answers' || col === 'files') {
          schemaCode += `  ${col}: text("${col}", { mode: "json" }),\n`;
        } else if (col === 'attendance_late' || col === 'attendance_present') {
          schemaCode += `  ${col}: integer("${col}"),\n`;
        } else {
          schemaCode += `  ${col}: text("${col}"),\n`;
        }
      }
    });
    
    schemaCode += `});\n\n`;
  }

  fs.writeFileSync(outputFile, schemaCode);
  console.log('Schema generated successfully at lib/db/schema.ts');
}

generateSchema();
