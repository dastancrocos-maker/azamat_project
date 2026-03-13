import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

interface Task {
  name: string;
  [key: string]: string | number;
}

interface Stage {
  name: string;
  description: string;
  tasks: Task[];
}

interface ExportData {
  projectName: string;
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactEmail: string;
  rates: Record<string, number>;
  stages: Stage[];
  withNDS: boolean;
  note: string;
  analysisText: string;
}

const blue = "FF3B82F6";

const rateOrder = [
  "backend", "frontend", "webmaster", "ui_designer", "graphic_designer",
  "pm", "pm_support", "ai_engineer", "unity", "3d_modeler", "devops", "qa",
];
const colNames = [
  "Backend", "Frontend", "Web Master", "UI/UX", "Граф. дизайн",
  "PM", "PM тех.п.", "AI", "Unity", "3D", "DevOps", "QA",
];

function ab(cell: ExcelJS.Cell) {
  const s: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFE2E8F0" } };
  cell.border = { top: s, bottom: s, left: s, right: s };
}

function abRow(row: ExcelJS.Row, cols: number) {
  for (let c = 1; c <= cols; c++) ab(row.getCell(c));
}

function getTaskHours(task: Task, role: string): number {
  return (typeof task[role] === "number" ? task[role] : 0) as number;
}

function buildSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  data: ExportData,
  opts: { showInternalCosts: boolean }
) {
  const { projectName, contactName, contactRole, contactPhone, contactEmail, rates, stages, withNDS, note, analysisText } = data;
  const { showInternalCosts } = opts;

  // Filter to only roles that have people/rates assigned
  const activeRoles = rateOrder.filter((r) => {
    if (rates[r]) return true;
    return stages.some((s) => s.tasks.some((t) => getTaskHours(t, r) > 0));
  });
  const activeColNames = activeRoles.map((r) => colNames[rateOrder.indexOf(r)]);
  const CC = activeRoles.length + 2; // col A (task) + roles + sum

  const ws = wb.addWorksheet(sheetName);
  ws.columns = [
    { width: 45 },
    ...activeRoles.map(() => ({ width: 12 })),
    { width: 16 },
  ];

  const hdrF: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  const ttlF: Partial<ExcelJS.Font> = { bold: true, size: 16, color: { argb: "FF1A1A2E" } };
  const stgF: Partial<ExcelJS.Font> = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  const dscF: Partial<ExcelJS.Font> = { italic: true, size: 10, color: { argb: "FF64748B" } };
  const tskF: Partial<ExcelJS.Font> = { size: 11, color: { argb: "FF334155" } };
  const numF: Partial<ExcelJS.Font> = { size: 11, color: { argb: "FF334155" } };
  const sumF: Partial<ExcelJS.Font> = { bold: true, size: 11, color: { argb: "FF3B82F6" } };

  const today = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const validDate = new Date();
  validDate.setDate(validDate.getDate() + 14);

  // Header
  const r1 = ws.addRow(["", "", "", "Дата:", today, "", "Контакт:", contactName || ""]);
  r1.getCell(4).font = { bold: true, size: 10, color: { argb: "FF64748B" } };
  r1.getCell(5).font = { size: 10 };
  r1.getCell(7).font = { bold: true, size: 10, color: { argb: "FF64748B" } };
  r1.getCell(8).font = { size: 10 };

  const r2 = ws.addRow(["", "", "", "Актуально до:", validDate.toLocaleDateString("ru-RU"), "", "", contactRole || ""]);
  r2.getCell(4).font = { bold: true, size: 10, color: { argb: "FF64748B" } };
  r2.getCell(5).font = { size: 10 };
  r2.getCell(8).font = { size: 10, color: { argb: "FF64748B" } };

  ws.addRow([]);

  const r4 = ws.addRow([`Смета на разработку: ${projectName || "Проект"}`]);
  r4.getCell(1).font = ttlF;
  ws.mergeCells(r4.number, 1, r4.number, Math.min(6, CC));

  const r5 = ws.addRow([]);
  if (contactPhone) { r5.getCell(CC - 1).value = contactPhone; r5.getCell(CC - 1).font = { size: 10 }; }
  if (contactEmail) { r5.getCell(CC).value = contactEmail; r5.getCell(CC).font = { size: 10, color: { argb: "FF3B82F6" } }; }

  if (analysisText) {
    ws.addRow([]);
    const ra = ws.addRow([`AI-анализ: ${analysisText}`]);
    ra.getCell(1).font = { italic: true, size: 10, color: { argb: "FF6366F1" } };
    ws.mergeCells(ra.number, 1, ra.number, CC);
  }

  ws.addRow([]);

  // Table header row 1
  const h1vals: string[] = ["Этапы разработки проекта и наименование работ"];
  for (let i = 0; i < activeRoles.length; i++) h1vals.push(i === 0 ? "Трудозатраты [в нормо часах]" : "");
  h1vals.push("Сумма");
  const h1 = ws.addRow(h1vals);
  if (activeRoles.length > 1) ws.mergeCells(h1.number, 2, h1.number, activeRoles.length + 1);
  for (let c = 1; c <= CC; c++) {
    h1.getCell(c).font = hdrF;
    h1.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: blue } };
    h1.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
    ab(h1.getCell(c));
  }
  h1.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  h1.height = 25;

  // Table header row 2 - role names
  const h2vals = ["", ...activeColNames, "Сумма"];
  const h2 = ws.addRow(h2vals);
  for (let c = 1; c <= CC; c++) {
    h2.getCell(c).font = { bold: true, size: 9, color: { argb: "FF334155" } };
    h2.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    h2.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
    ab(h2.getCell(c));
  }

  // Rates row (only on internal)
  if (showInternalCosts) {
    const h3vals: (string | number)[] = ["Ставка (₸/час)"];
    for (const r of activeRoles) h3vals.push(rates[r] || 0);
    h3vals.push("");
    const h3 = ws.addRow(h3vals);
    for (let c = 1; c <= CC; c++) {
      h3.getCell(c).font = { bold: true, size: 9, color: { argb: "FF64748B" } };
      h3.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      h3.getCell(c).alignment = { horizontal: "center" };
      if (c >= 2 && c < CC) h3.getCell(c).numFmt = "#,##0";
      ab(h3.getCell(c));
    }
    h3.getCell(1).alignment = { horizontal: "left" };
  }

  const costMult = showInternalCosts ? 1 : (withNDS ? 1.3 * 1.16 : 1.3);

  // Stages & tasks
  let stageNum = 0;
  for (const stage of stages) {
    stageNum++;
    const sr = ws.addRow([`${stageNum}. ${stage.name}`]);
    ws.mergeCells(sr.number, 1, sr.number, CC);
    sr.getCell(1).font = stgF;
    sr.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: blue } };
    sr.getCell(1).alignment = { vertical: "middle" };
    ab(sr.getCell(1));
    sr.height = 28;

    if (stage.description) {
      const dr = ws.addRow([stage.description]);
      ws.mergeCells(dr.number, 1, dr.number, CC);
      dr.getCell(1).font = dscF;
      dr.getCell(1).alignment = { wrapText: true };
      ab(dr.getCell(1));
      dr.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    }

    for (const task of stage.tasks) {
      const hours = activeRoles.map((r) => getTaskHours(task, r));
      const rawCost = hours.reduce((sum, h, i) => sum + h * (rates[activeRoles[i]] || 0), 0);

      const rowVals: (string | number)[] = [`    ${task.name}`, ...hours, Math.round(rawCost * costMult)];
      const tr = ws.addRow(rowVals);
      tr.getCell(1).font = tskF;
      tr.getCell(1).alignment = { wrapText: true };
      for (let c = 2; c <= activeRoles.length + 1; c++) {
        tr.getCell(c).alignment = { horizontal: "center" };
        tr.getCell(c).font = (tr.getCell(c).value as number) === 0
          ? { size: 10, color: { argb: "FFCBD5E1" } }
          : numF;
      }
      tr.getCell(CC).font = sumF;
      tr.getCell(CC).alignment = { horizontal: "right" };
      tr.getCell(CC).numFmt = "#,##0";
      abRow(tr, CC);
    }
  }

  // Totals
  ws.addRow([]);

  const totals = activeRoles.map(() => 0);
  for (const stage of stages) {
    for (const task of stage.tasks) {
      activeRoles.forEach((r, i) => { totals[i] += getTaskHours(task, r); });
    }
  }
  const costPerRole = totals.map((h, i) => h * (rates[activeRoles[i]] || 0));
  const baseCost = costPerRole.reduce((a, b) => a + b, 0);
  const adminCost = baseCost * 0.3;
  const subtotal = baseCost + adminCost;
  const ndsCost = withNDS ? subtotal * 0.16 : 0;
  const totalCost = Math.round(subtotal + ndsCost);

  if (showInternalCosts) {
    const tr1 = ws.addRow(["Итого (базовая стоимость):", ...costPerRole, baseCost]);
    for (let c = 1; c <= CC; c++) {
      tr1.getCell(c).font = { bold: true, size: 11 };
      tr1.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      ab(tr1.getCell(c));
      if (c >= 2) { tr1.getCell(c).alignment = { horizontal: c === CC ? "right" : "center" }; tr1.getCell(c).numFmt = "#,##0"; }
    }

    const emptyArr = activeRoles.map(() => "");

    const tr2 = ws.addRow(["Административные расходы (30%)", ...emptyArr, adminCost]);
    tr2.getCell(1).font = { bold: true, size: 11 };
    tr2.getCell(CC).font = { bold: true, size: 11 }; tr2.getCell(CC).alignment = { horizontal: "right" }; tr2.getCell(CC).numFmt = "#,##0";
    abRow(tr2, CC);

    const tr3 = ws.addRow(["Итого + админ расходы 30%:", ...emptyArr, subtotal]);
    tr3.getCell(1).font = { bold: true, size: 11 };
    tr3.getCell(CC).font = { bold: true, size: 12, color: { argb: blue } }; tr3.getCell(CC).alignment = { horizontal: "right" }; tr3.getCell(CC).numFmt = "#,##0";
    abRow(tr3, CC);

    if (withNDS) {
      const tr4 = ws.addRow(["НДС (16%)", ...emptyArr, ndsCost]);
      tr4.getCell(1).font = { bold: true, size: 11 };
      tr4.getCell(CC).font = { bold: true, size: 11 }; tr4.getCell(CC).alignment = { horizontal: "right" }; tr4.getCell(CC).numFmt = "#,##0";
      abRow(tr4, CC);
    }
  } else {
    const clientTotals = costPerRole.map((c) => Math.round(c * costMult));
    const tr1 = ws.addRow(["Итого:", ...clientTotals, totalCost]);
    for (let c = 1; c <= CC; c++) {
      tr1.getCell(c).font = { bold: true, size: 11 };
      tr1.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      ab(tr1.getCell(c));
      if (c >= 2) { tr1.getCell(c).alignment = { horizontal: c === CC ? "right" : "center" }; tr1.getCell(c).numFmt = "#,##0"; }
    }
  }

  // Grand total
  const emptyGrand = activeRoles.map(() => "");
  const gtr = ws.addRow(["ИТОГО:", ...emptyGrand, totalCost]);
  for (let c = 1; c <= CC; c++) {
    gtr.getCell(c).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    gtr.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: blue } };
    ab(gtr.getCell(c));
  }
  gtr.getCell(CC).alignment = { horizontal: "right" }; gtr.getCell(CC).numFmt = "#,##0";
  gtr.height = 30;

  // Payment schedule
  ws.addRow([]); ws.addRow([]);
  const psT = ws.addRow(["Порядок оплаты"]);
  psT.getCell(1).font = { bold: true, size: 14, color: { argb: "FF1A1A2E" } };
  ws.addRow([]);

  const psH = ws.addRow(["Номер и назначение платежа", "Сумма"]);
  for (let c = 1; c <= 2; c++) {
    psH.getCell(c).font = hdrF;
    psH.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: blue } };
    ab(psH.getCell(c));
    psH.getCell(c).alignment = { horizontal: c === 2 ? "right" : "left" };
  }

  let payTotal = 0;
  stages.forEach((stage, i) => {
    const sc = stage.tasks.reduce((sum, t) => {
      return sum + activeRoles.reduce((s, r, idx) => s + getTaskHours(t, r) * (rates[r] || 0), 0);
    }, 0);
    const cost = Math.round(sc * (withNDS ? 1.3 * 1.16 : 1.3));
    payTotal += cost;
    const pr = ws.addRow([`${i + 1}. ${stage.name} (100%)`, cost]);
    pr.getCell(1).font = tskF; pr.getCell(2).font = sumF; pr.getCell(2).numFmt = "#,##0"; pr.getCell(2).alignment = { horizontal: "right" };
    ab(pr.getCell(1)); ab(pr.getCell(2));
  });

  const ptR = ws.addRow(["Итого:", payTotal]);
  ptR.getCell(1).font = { bold: true, size: 12 };
  ptR.getCell(2).font = { bold: true, size: 12, color: { argb: blue } }; ptR.getCell(2).numFmt = "#,##0"; ptR.getCell(2).alignment = { horizontal: "right" };
  ab(ptR.getCell(1)); ab(ptR.getCell(2));

  // Notes
  ws.addRow([]); ws.addRow([]);
  if (note) {
    const nr = ws.addRow([`Примечание: ${note}`]);
    nr.getCell(1).font = { italic: true, size: 10, color: { argb: "FF92400E" } };
    ws.mergeCells(nr.number, 1, nr.number, CC);
    nr.getCell(1).alignment = { wrapText: true };
  }
  const d1 = ws.addRow(["Стоимость проекта указана исходя из информации, зафиксированной в ТЗ."]);
  d1.getCell(1).font = { size: 10, color: { argb: "FF64748B" } }; ws.mergeCells(d1.number, 1, d1.number, CC);
  const d2 = ws.addRow(["Если в процессе работы появятся новые вводные данные, стоимость может быть скорректирована."]);
  d2.getCell(1).font = { size: 10, color: { argb: "FF64748B" } }; ws.mergeCells(d2.number, 1, d2.number, CC);
  ws.addRow([]);
  const sr1 = ws.addRow(["Старт работ:", "в течение 3 рабочих дней с момента внесения предоплаты"]);
  sr1.getCell(1).font = { bold: true, size: 10 }; sr1.getCell(2).font = { size: 10 };
}

export async function POST(request: NextRequest) {
  try {
    const data: ExportData = await request.json();
    const wb = new ExcelJS.Workbook();
    wb.creator = "IT Project Estimator";

    buildSheet(wb, "Себестоимость", data, { showInternalCosts: true });
    buildSheet(wb, "Для заказчика", data, { showInternalCosts: false });

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(data.projectName || "Смета")}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error("Export error:", error);
    const msg = error instanceof Error ? error.message : "Ошибка экспорта";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
