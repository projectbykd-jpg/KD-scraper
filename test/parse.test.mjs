// Uji fungsi parse murni (fungsi diekstrak dari scrape.mjs karena file itu menjalankan job saat di-import).
// Jalankan: node --test test/
import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
const src = fs.readFileSync(new URL("../scrape.mjs", import.meta.url), "utf8");
const grab = (name) => { const i = src.indexOf("function " + name + "("); let d = 0, j = src.indexOf("{", i); const st = j; for (; j < src.length; j++) { if (src[j] === "{") d++; else if (src[j] === "}") { d--; if (!d) break; } } return src.slice(i, j + 1); };
const code = ["cleanHtmlText", "parseMoneyValue", "parseOperatorSummary"].map(grab).join("\n");
const f = new Function(code + "; return { parseMoneyValue, parseOperatorSummary };")();
const eq = (a, b, m) => test(m, () => assert.deepEqual(a, b));
eq(f.parseMoneyValue("1.250.000"), 1250000, "1.250.000 (ID ribuan)");
eq(f.parseMoneyValue("1.234.567,50"), 1234567.5, "1.234.567,50");
eq(f.parseMoneyValue("1.250,50"), 1250.5, "1.250,50");
eq(f.parseMoneyValue("1,250,000"), 1250000, "1,250,000 (koma ribuan, lama)");
eq(f.parseMoneyValue("1,250.50"), 1250.5, "1,250.50");
eq(f.parseMoneyValue("1250000"), 1250000, "polos");
eq(f.parseMoneyValue("12.5"), 12.5, "12.5 desimal tetap");
eq(f.parseMoneyValue("Rp 2.000.000"), 2000000, "Rp 2.000.000");
eq(f.parseMoneyValue("-500"), -500, "negatif");
eq(f.parseMoneyValue("abc"), null, "bukan angka");
const html1 = `<table><tr><th>No</th><th>Operator</th><th>Deposit</th><th>Withdraw</th><th>Reject</th></tr>
<tr><td>1</td><td>BLAZZ</td><td>1,000,000</td><td>200,000</td><td>0</td></tr>
<tr><td>2</td><td>KHANPAY</td><td>500,000</td><td>100,000</td><td>50,000</td></tr>
<tfoot><tr><th>Total</th><th></th><th>1,500,000</th><th>300,000</th><th>50,000</th></tr></tfoot></table>`;
const r1 = f.parseOperatorSummary(html1);
eq(r1.rows.length, 2, "2 operator"); eq(r1.total, { deposit: 1500000, withdraw: 300000, reject: 50000 }, "Total di <tfoot><th> (sel kosong tidak menggeser kolom)");
const html2 = `<table><tr><td>1</td><td>A</td><td>10</td><td>2</td><td>1</td></tr><tr><td>Total :</td><td>10</td><td>2</td><td>1</td></tr></table>`;
eq(f.parseOperatorSummary(html2).total, { deposit: 10, withdraw: 2, reject: 1 }, "'Total :' dgn 4 sel");
eq(f.parseOperatorSummary("<p>kosong</p>"), { rows: [], total: null }, "tanpa tabel");
