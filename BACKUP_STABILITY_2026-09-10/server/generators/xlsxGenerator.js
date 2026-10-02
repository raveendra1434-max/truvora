import ExcelJS from "exceljs";

export async function generateXLSX({
  outputPath,
  reportId,
  title,
  summary,
  analysis,
  recommendations,
  sources,
}) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Trulexity Global AI";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("AI Report");

  // Create header columns
  sheet.columns = [
    { header: "Section", key: "section", width: 25 },
    { header: "Content", key: "content", width: 100 },
  ];

  // Freeze header
  sheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  // Auto filter
  sheet.autoFilter = {
    from: "A1",
    to: "B1",
  };

  // Header style
  sheet.getRow(1).font = {
    bold: true,
    size: 13,
    color: { argb: "FFFFFF" },
  };

  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1565C0" },
  };

  sheet.getRow(1).alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };

  // Report data
  sheet.addRow({
    section: "Report ID",
    content: reportId,
  });

  sheet.addRow({
    section: "Title",
    content: title,
  });

  sheet.addRow({
    section: "Summary",
    content: summary,
  });

  sheet.addRow({
    section: "Analysis",
    content: analysis,
  });

  sheet.addRow({
    section: "Recommendations",
    content: recommendations,
  });

  // Sources
  if (Array.isArray(sources) && sources.length > 0) {
    sources.forEach((url, index) => {
      const row = sheet.addRow({
        section: index === 0 ? "Sources" : "",
        content: url,
      });

      const cell = row.getCell(2);

      cell.value = {
        text: url,
        hyperlink: url,
      };

      cell.font = {
        color: { argb: "0563C1" },
        underline: true,
      };
    });
  } else {
    const row = sheet.addRow({
      section: "Sources",
      content: sources || "",
    });

    if (sources) {
      const cell = row.getCell(2);

      cell.value = {
        text: sources,
        hyperlink: sources,
      };

      cell.font = {
        color: { argb: "0563C1" },
        underline: true,
      };
    }
  }

  // Wrap text & borders
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "top",
        horizontal: "left",
        wrapText: true,
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Content column width
  sheet.getColumn(2).width = 120;

  await workbook.xlsx.writeFile(outputPath);

  return outputPath;
}