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

// Data nyata History Operator (HUGOTOGEL 07-10-2026): baris Total memakai colspan=2 + 1 kolom ekstra di kanan.
const op = (n, name, d, w, r) => `<tr><td>${n}</td><td>${name}</td><td>${d ? `<a>${d}</a>` : ""}</td><td>${w ? `<a>${w}</a>` : ""}</td><td>${r ? `<a>${r}</a>` : ""}</td></tr>`;
const htmlReal = `<table><tr><th>No</th><th>OPERATOR</th><th>DEPOSIT</th><th>WITHDRAW</th><th>REJECT</th></tr>` +
	op(1, "VLDAAfubuneang", "", "3,859,000", "") + op(2, "VLDAAfudanny", "", "1,254,000", "") + op(3, "VLDAAfukelvin", "", "40,638,000", "") +
	op(4, "VLDAAfusteven", "", "2,053,000", "") + op(5, "vldaablazz", "155,121,800", "", "") + op(6, "vldaabuneang", "", "7,257,000", "") +
	op(7, "vldaacs1", "100,000", "", "") + op(8, "vldaadanny", "", "5,437,000", "") + op(9, "vldaakelvin", "18,850", "800,000", "250,620") +
	op(10, "vldaamozart", "", "88,942,000", "") + op(11, "vldaasteven", "860,000", "850,000", "100,607") +
	`<tr><td colspan="2">Total</td><td>156,100,650</td><td>151,090,000</td><td>351,227</td><td>5,010,650</td></tr></table>`;
const rr = f.parseOperatorSummary(htmlReal);
eq(rr.rows.length, 11, "11 operator (sel kosong tidak menggeser kolom)");
eq(rr.total, { deposit: 156100650, withdraw: 151090000, reject: 351227 }, "Total nyata (colspan + kolom ekstra) tidak bergeser");
// Bila baris Total tidak cocok dengan jumlah operator, jumlah operator yang dipakai (bukan angka kolom salah).
const htmlBad = htmlReal.replace("<td>156,100,650</td><td>151,090,000</td><td>351,227</td><td>5,010,650</td>", "<td>9</td><td>9</td><td>9</td>");
eq(rr.total, f.parseOperatorSummary(htmlBad).total, "Total janggal diganti jumlah operator");
