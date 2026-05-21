import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const path = process.argv[2];
if (!path) throw new Error('usage: node inspect_daily_report.mjs /path/to.xlsx');

const input = await FileBlob.load(path);
const workbook = await SpreadsheetFile.importXlsx(input);
console.log('sheets:', workbook.worksheets.items.map(s => s.name));

for (const sheet of workbook.worksheets.items) {
  console.log('\n==', sheet.name, '==');
  const used = sheet.usedRange;
  if (!used) { console.log('no used range'); continue; }
  console.log('used:', used.address);
  // Render top-left 25x12-ish by reading A1:L25
  const range = sheet.range('A1:L30');
  const values = await range.values();
  // Trim trailing empty rows
  const isEmptyRow = (r)=> r.every(v => v === null || v === undefined || String(v).trim() === '');
  let last = values.length-1;
  while (last>=0 && isEmptyRow(values[last])) last--;
  const slice = values.slice(0, Math.min(last+1, 20));
  for (const row of slice) {
    console.log(row.map(v => v==null?'':String(v)).join(' | '));
  }
}
