// The accountant's review pack (docs/LAUNCH-CHECKLIST.md, stage 2): the questions of docs/ACCOUNTANT-REVIEW.md as an
// Excel file to answer in (one row per item, so the answers come back typed and tied to their item), and the documents
// the new system prints, as PDFs, made by running the scenarios that print them (tests/support/test.ts PRINT_CAPTURE).
// Everything ends up in one zip to send on.
//
//   node tools/accountant-pack.mjs [--out accountant-pack] [--skip-run]
//
// --skip-run uses the PDFs of the last run (<out>/.captured) and only builds the questions and the zip again.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const out = resolve(arg('--out') || 'accountant-pack');
const captured = join(out, '.captured');
const samplesDir = join(out, 'ตัวอย่างเอกสาร');

// Sample NN of the questions: the first PDF a scenario printed whose name matches.
const SAMPLES = [
  ['01', 'ใบกำกับภาษีเต็มรูป', 'S220', /ใบกำกับภาษี_MA-TX261000001/],
  ['02', 'ใบกำกับภาษีที่ออกแทนใบที่ยกเลิก', 'S136', /ใบกำกับภาษี_/],
  ['03', 'ใบกำกับภาษีอย่างย่อ', 'S220', /ใบกำกับภาษีอย่างย่อ_MA-SA261000001_/],
  ['04', 'ใบลดหนี้', 'S142', /ใบลดหนี้/],
  ['05', 'รายงานภาษีขาย ภาษีซื้อ และสรุปภาษี', 'S220', /รายงานภาษีขาย/],
  ['06', 'ใบเสร็จรับเงินที่ชาร์จค่าธรรมเนียมบัตร 3%', 'S153', /ใบเสร็จรับเงิน/],
  ['07', 'ใบสำคัญจ่ายค่าใช้จ่าย', 'S146', /ใบสำคัญจ่าย/],
  ['08', 'ใบสำคัญจ่ายเงินเจ้าหนี้ที่หัก ณ ที่จ่าย', 'S149', /ใบสำคัญจ่าย/],
  ['09', '50 ทวิ ที่อู่ออกให้ผู้ขาย (หจก.)', 'S150', /MA-WH261000001/],
  ['10', '50 ทวิ ที่อู่ออกให้ผู้ขาย (ร้านค่าบริการ)', 'S150', /MA-WH261000002/],
  ['11', 'ใบสำคัญจ่ายเงินเดือน', 'S174', /ใบสำคัญจ่าย_.*พนักงาน/],
  ['12', 'ใบสำคัญจ่ายนำส่งประกันสังคม', 'S165', /สำนักงานประกันสังคม/],
  ['13', 'ใบสำคัญจ่ายนำส่ง ภ.ง.ด.1', 'S174', /กรมสรรพากร/],
  ['14', 'สลิปเงินเดือน', 'S174', /สลิปเงินเดือน/],
  ['15', 'สรุป ภ.ง.ด.1', 'S174', /ภ\.ง\.ด\.1/],
  ['16', '50 ทวิ ประจำปีของพนักงาน', 'S175', /หนังสือรับรอง/],
  ['17', 'ทะเบียนทรัพย์สินและค่าเสื่อมราคา', 'S210', /ทะเบียนทรัพย์สิน/],
  ['18', 'ใบสำคัญจ่ายค่าสินทรัพย์ (ซื้อเครดิต หัก ณ ที่จ่าย)', 'S211', /ใบสำคัญจ่าย/],
  ['19', 'งบกำไรขาดทุน', 'S214', /งบกำไรขาดทุน/],
  ['20', 'งบทดลอง', 'S214', /งบทดลอง/],
  ['21', 'รายงานสุขภาพการเงิน', 'S214', /สุขภาพการเงิน/],
];

if (!process.argv.includes('--skip-run')) {
  rmSync(captured, { recursive: true, force: true });
  const scenarios = [...new Set(SAMPLES.map(s => s[2]))];
  const files = readdirSync('tests/scenarios').filter(f => scenarios.includes(f.split('-')[0])).map(f => `tests/scenarios/${f}`);
  console.log(`printing from ${files.length} scenarios on the new system …`);
  const run = spawnSync('npx', ['playwright', 'test', ...files, '--workers=3', '--reporter=line', `--output=${join(out, '.results')}`], {
    stdio: 'inherit', env: { ...process.env, TARGET: 'new', PRINT_CAPTURE: captured },
  });
  if (run.status !== 0) console.error('some scenarios failed; the pack is built from what was printed (check the samples)');
}

rmSync(samplesDir, { recursive: true, force: true });
mkdirSync(samplesDir, { recursive: true });
const printed = existsSync(captured) ? readdirSync(captured).sort() : [];
const missing = [];
for (const [no, label, scenario, name] of SAMPLES) {
  const file = printed.find(f => f.startsWith(`${scenario}-`) && name.test(f));
  if (file) copyFileSync(join(captured, file), join(samplesDir, `${no} ${label}.pdf`));
  else missing.push(`${no} ${label} (${scenario})`);
}
if (missing.length) { console.error(`not printed: ${missing.join(', ')}`); process.exitCode = 1; }

// The questions as an Excel file the accountant answers in: the sheet "คำถาม" has one row per numbered item (###) with
// yellow cells to fill in (result, comment, reference); the sheet "วิธีตรวจ" has the introduction, a count of the answers
// and the list of samples. Written as SpreadsheetML by hand (no library), in Tahoma (Thai on every Windows and Mac), with
// rows as high as their text (estimated: Excel does not size rows to their text on opening).
const doc = { title: '', intro: [[]], sections: [], samples: [] };
{
  let lines = doc.intro[0], section = null;
  for (const line of readFileSync('docs/ACCOUNTANT-REVIEW.md', 'utf8').split('\n')) {
    let m;
    if ((m = /^# (.*)$/.exec(line))) doc.title = m[1];
    else if ((m = /^## (.*)$/.exec(line))) { doc.sections.push(section = { title: m[1], items: [] }); lines = null; }
    else if ((m = /^### (\S+) (.*)$/.exec(line))) section.items.push({ no: m[1], title: m[2], lines: lines = [] });
    else if (/^\|/.test(line)) { const c = line.slice(1, -1).split('|').map(x => x.trim()); if (/^\d+$/.test(c[0])) doc.samples.push(c); }
    else if (!section && !line.trim()) doc.intro.push(lines = []);
    else if (lines) lines.push(line);
  }
}
const text = lines => lines.join('\n').trim().replace(/\n{2,}/g, '\n').replace(/^- /gm, '• ').replace(/^\s{2,}/gm, '   ');
const samplesOf = t => [...t.matchAll(/ดูตัวอย่าง ([\d, และ]+)/g)].flatMap(m => m[1].match(/\d{2}/g)).join(', ');
// the lines a text takes in a column `width` characters wide (Thai marks above and below a letter take no width; a Thai
// letter is narrower than the "0" columns are measured in: × 1.25 still leaves room, as rendered in Loma, a Tahoma look-alike)
const linesIn = (s, width) => s.replace(/\*\*/g, '').split('\n')
  .reduce((n, l) => n + Math.max(1, Math.ceil(l.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '').length / ((width - 2) * 1.25))), 0);
const height = (...cells) => Math.max(...cells.map(([s, w]) => linesIn(s, w))) * 13.5 + 4;

const X = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const font = (extra = '', size = 10) => `<font>${extra}<sz val="${size}"/><name val="Tahoma"/><family val="2"/></font>`;
const fill = rgb => `<fill><patternFill patternType="solid"><fgColor rgb="FF${rgb}"/><bgColor indexed="64"/></patternFill></fill>`;
const xf = (fontId, fillId, borderId, align) => `<xf numFmtId="0" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment ${align}/></xf>`;
const TOP = 'vertical="top" wrapText="1"', MID = 'horizontal="center" vertical="top" wrapText="1"';
// cell styles: 0 text · 1 title · 2 header · 3 section · 4 cell · 5 cell bold · 6 cell centred · 7 to fill in ·
// 8 to fill in, centred · 9 bold text
const S = { text: 0, title: 1, head: 2, section: 3, cell: 4, bold: 5, mid: 6, fill: 7, fillMid: 8, strong: 9 };
const STYLES = `${XML}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="4">${font()}${font('<b/>')}${font('<b/>', 14)}${font('<b/><color rgb="FFFFFFFF"/>')}</fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${fill('1F4E79')}${fill('DDEBF7')}${fill('FFF2CC')}</fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border>${['left', 'right', 'top', 'bottom'].map(b => `<${b} style="thin"><color rgb="FFBFBFBF"/></${b}>`).join('')}<diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">${[xf(0, 0, 0, TOP), xf(2, 0, 0, 'vertical="center"'), xf(3, 2, 1, 'horizontal="center" vertical="center" wrapText="1"'),
  xf(1, 3, 1, 'vertical="center"'), xf(0, 0, 1, TOP), xf(1, 0, 1, TOP), xf(0, 0, 1, MID), xf(0, 4, 1, TOP), xf(0, 4, 1, MID),
  xf(1, 0, 0, TOP)].join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="3">${[['006100', 'C6EFCE'], ['9C0006', 'FFC7CE'], ['9C5700', 'FFEB9C']].map(([c, b]) => `<dxf><font><color rgb="FF${c}"/></font><fill><patternFill><bgColor rgb="FF${b}"/></patternFill></fill></dxf>`).join('')}</dxfs>
</styleSheet>`;
// a cell: text (**bold** parts as rich text), a number, or { f: formula }
function cell(ref, v, s) {
  if (v == null || v === '') return `<c r="${ref}" s="${s}"/>`;
  if (typeof v === 'number') return `<c r="${ref}" s="${s}"><v>${v}</v></c>`;
  if (v.f) return `<c r="${ref}" s="${s}"><f>${X(v.f)}</f></c>`;
  const runs = v.split(/\*\*(.+?)\*\*/).map((t, i) => [t, i % 2 === 1]).filter(([t]) => t);
  const is = runs.some(([, b]) => b)
    ? runs.map(([t, b]) => `<r><rPr>${b ? '<b/>' : ''}<sz val="10"/><rFont val="Tahoma"/><family val="2"/></rPr><t xml:space="preserve">${X(t)}</t></r>`).join('')
    : `<t xml:space="preserve">${X(v)}</t>`;
  return `<c r="${ref}" s="${s}" t="inlineStr"><is>${is}</is></c>`;
}
// a sheet from rows of { cells: [[value, style], …], ht, merge: 'A:G' }; `frozen` rows stay at the top
function sheet({ widths, rows, frozen, selected, landscape, extra = '' }) {
  const merges = rows.flatMap((r, i) => (r.merge ? [r.merge.replace(/(\w):(\w)/, `$1${i + 1}:$2${i + 1}`)] : []));
  const data = rows.map((r, i) => `<row r="${i + 1}"${r.ht ? ` ht="${r.ht}"` : ''}>`
    + (r.cells || []).map(([v, s], c) => cell(`${String.fromCharCode(65 + c)}${i + 1}`, v, s)).join('') + '</row>').join('\n');
  const pane = frozen ? `<pane ySplit="${frozen}" topLeftCell="A${frozen + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${frozen + 1}" sqref="A${frozen + 1}"/>` : '';
  return `${XML}<worksheet ${NS}>
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0"${selected ? ' tabSelected="1"' : ''}>${pane}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="13.5"/><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>
<sheetData>\n${data}\n</sheetData>${merges.length ? `<mergeCells count="${merges.length}">${merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''}${extra}
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="${landscape ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/>
<headerFooter><oddFooter>&amp;Cหน้า &amp;P / &amp;N</oddFooter></headerFooter></worksheet>`;
}

// sheet 2: the questions
const RESULTS = ['ถูกต้อง', 'ต้องแก้', 'ไม่แน่ใจ'];
const QW = [6, 24, 64, 10, 12, 44, 24];
const qRows = [
  { cells: [['คำถาม: กรอกเฉพาะช่องสีเหลือง (ผลตรวจ ความเห็น อ้างอิง)', S.title]], ht: 24, merge: 'A:G' },
  { cells: ['ข้อ', 'เรื่อง', 'โปรแกรมทำอย่างไร / คำถาม', 'ดูตัวอย่าง', 'ผลตรวจ', 'ความเห็น / ควรเป็นอย่างไร', 'อ้างอิง (มาตรา ประกาศ ถ้ามี)'].map(h => [h, S.head]), ht: 30 },
];
for (const section of doc.sections.filter(s => s.items.length)) {
  qRows.push({ cells: [['', S.section], [section.title, S.section], ...Array(5).fill(['', S.section])], ht: 20, merge: 'B:G' });
  for (const it of section.items) {
    const body = text(it.lines);
    qRows.push({ cells: [[it.no, S.mid], [it.title, S.bold], [body, S.cell], [samplesOf(body), S.mid], ['', S.fillMid], ['', S.fill], ['', S.fill]],
      ht: height([it.title, QW[1] * 0.9], [body, QW[2]]) });
  }
}
const answers = `E3:E${qRows.length}`;
const questions = sheet({
  widths: QW, rows: qRows, frozen: 2, landscape: true,
  extra: `<conditionalFormatting sqref="${answers}">${RESULTS.map((r, i) => `<cfRule type="cellIs" dxfId="${i}" priority="${i + 1}" operator="equal"><formula>"${r}"</formula></cfRule>`).join('')}</conditionalFormatting>`
    + `<dataValidations count="1"><dataValidation type="list" errorStyle="warning" allowBlank="1" showErrorMessage="1" errorTitle="ผลตรวจ" error="เลือก ${RESULTS.join(' / ')}" sqref="${answers}"><formula1>"${RESULTS.join(',')}"</formula1></dataValidation></dataValidations>`,
});

// sheet 1: how to answer, the count of answers, the samples
const IW = [30, 84];
const iRows = [
  { cells: [[doc.title, S.title]], ht: 26, merge: 'A:B' },
  ...doc.intro.map(text).filter(Boolean).map(t => ({ cells: [[t, S.text]], ht: height([t, IW[0] + IW[1]]), merge: 'A:B' })),
  {},
  { cells: [['ตัวอย่างการกรอก (ไม่ใช่คำตอบจริง)', S.strong]], merge: 'A:B' },
  { cells: [['ผลตรวจ', S.cell], ['ต้องแก้', S.fill]] },
  { cells: [['ความเห็น / ควรเป็นอย่างไร', S.cell], ['ควรเพิ่ม … ในใบ หรือ ควรคิดแบบ … แทน', S.fill]] },
  { cells: [['อ้างอิง (มาตรา ประกาศ ถ้ามี)', S.cell], ['ประมวลรัษฎากร มาตรา … หรือ ประกาศอธิบดีกรมสรรพากร ฉบับที่ …', S.fill]] },
  {},
  { cells: [['ตอบแล้ว (นับจากแผ่น "คำถาม")', S.strong]], merge: 'A:B' },
];
const Qs = `'คำถาม'!`, total = iRows.length + 1;
iRows.push({ cells: [['ข้อทั้งหมด', S.cell], [{ f: `COUNTA(${Qs}A3:A${qRows.length})` }, S.cell]] });
for (const r of RESULTS) iRows.push({ cells: [[r, S.cell], [{ f: `COUNTIF(${Qs}${answers},"${r}")` }, S.cell]] });
iRows.push({ cells: [['ยังไม่ตอบ', S.cell], [{ f: `B${total}-COUNTA(${Qs}${answers})` }, S.cell]] });
iRows.push({}, { cells: [['ตัวอย่างเอกสาร (โฟลเดอร์ "ตัวอย่างเอกสาร" ไฟล์ขึ้นต้นด้วยเลข)', S.strong]], merge: 'A:B' },
  { cells: [['เลข', S.head], ['เอกสาร', S.head]] }, ...doc.samples.map(([no, label]) => ({ cells: [[no, S.mid], [label, S.cell]] })));
const intro = sheet({ widths: IW, rows: iRows, selected: true });

const parts = {
  '[Content_Types].xml': `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  '_rels/.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml': `${XML}<workbook ${NS}><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="วิธีตรวจ" sheetId="1" r:id="rId1"/><sheet name="คำถาม" sheetId="2" r:id="rId2"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="1">'คำถาม'!$2:$2</definedName></definedNames><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
  'xl/_rels/workbook.xml.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  'xl/styles.xml': STYLES,
  'xl/worksheets/sheet1.xml': intro,
  'xl/worksheets/sheet2.xml': questions,
};
const QUESTIONS = 'คำถามสำหรับผู้ทำบัญชี.xlsx';
const tmp = join(out, '.xlsx');
rmSync(tmp, { recursive: true, force: true });
for (const [name, body] of Object.entries(parts)) { mkdirSync(join(tmp, dirname(name)), { recursive: true }); writeFileSync(join(tmp, name), body); }
rmSync(join(out, QUESTIONS), { force: true });
rmSync(join(out, 'คำถามสำหรับผู้ทำบัญชี.pdf'), { force: true });
const made = spawnSync('zip', ['-X', '-D', '-q', join(out, QUESTIONS), ...Object.keys(parts)], { cwd: tmp, stdio: 'inherit' });
rmSync(tmp, { recursive: true, force: true });
if (made.status !== 0) throw new Error('zip failed (the questions)');

const zip = `${out}.zip`;
rmSync(zip, { force: true });
const z = spawnSync('zip', ['-qr', zip, QUESTIONS, 'ตัวอย่างเอกสาร'], { cwd: out, stdio: 'inherit' });
console.log(z.status === 0 ? `ready: ${zip}` : `questions and samples are in ${out} (zip failed)`);
