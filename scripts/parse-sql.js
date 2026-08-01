const fs = require('fs');
const readline = require('readline');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'supabase-backup', 'db_cluster-31-07-2026@21-57-09.backup', 'db_cluster-31-07-2026@21-57-09.backup');
const outputFile = path.join(__dirname, '..', 'supabase-backup', 'd1-migration.sql');

async function processFile() {
  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outStream = fs.createWriteStream(outputFile);

  let state = 'NORMAL';
  let currentTable = '';
  let currentColumns = [];

  for await (const line of rl) {
    // Basic Table creation (rudimentary conversion)
    if (line.startsWith('CREATE TABLE public.')) {
      // Just a marker, in pg_dump it's usually followed by columns
      // For now, let's just focus on extracting data inserts from COPY
    }

    if (state === 'NORMAL') {
      const copyMatch = line.match(/^COPY public\.([a-zA-Z0-9_]+) \((.*?)\) FROM stdin;/);
      if (copyMatch) {
        currentTable = copyMatch[1];
        currentColumns = copyMatch[2].split(',').map(c => c.trim());
        state = 'COPY_DATA';
        outStream.write(`\n-- Data for table ${currentTable}\n`);
        continue;
      }
    } else if (state === 'COPY_DATA') {
      if (line === '\\.') {
        state = 'NORMAL';
        continue;
      }
      
      const values = line.split('\t').map(val => {
        if (val === '\\N') return 'NULL';
        // Escape single quotes for SQL
        val = val.replace(/'/g, "''");
        return `'${val}'`;
      });
      
      const insertSql = `INSERT INTO ${currentTable} (${currentColumns.join(', ')}) VALUES (${values.join(', ')});\n`;
      outStream.write(insertSql);
    }
  }

  console.log('Conversion completed! Check supabase-backup/d1-migration.sql');
}

processFile().catch(console.error);
