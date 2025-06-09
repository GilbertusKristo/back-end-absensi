import { RequestHandler } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import AttendanceModel from "../models/attendance.model";

/**
 * Export Attendance to Excel (.xlsx)
 */
export const exportAttendanceExcel: RequestHandler = async (_req, res) => {
  const records = await AttendanceModel.find()
    .populate("userId", "fullName username")
    .sort({ timestamp: -1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance Report");

  worksheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Full Name", key: "fullName", width: 20 },
    { header: "Username", key: "username", width: 15 },
    { header: "Type", key: "type", width: 10 },
    { header: "Date", key: "date", width: 15 },
    { header: "Time", key: "time", width: 10 },
    { header: "Latitude", key: "latitude", width: 15 },
    { header: "Longitude", key: "longitude", width: 15 }
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0078D7" }
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  records.forEach((record: any, index: number) => {
    const row = worksheet.addRow({
      no: index + 1,
      fullName: record.userId?.fullName || "Unknown",
      username: record.userId?.username || "Unknown",
      type: record.type,
      date: record.timestamp.toISOString().split("T")[0],
      time: record.timestamp.toISOString().split("T")[1].split(".")[0],
      latitude: record.location?.latitude?.toString() || "",
      longitude: record.location?.longitude?.toString() || ""
    });

    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.xlsx");
  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Export Attendance to PDF (.pdf) with styled table
 */
export const exportAttendancePDF: RequestHandler = async (_req, res) => {
  const records = await AttendanceModel.find()
    .populate("userId", "fullName username")
    .sort({ timestamp: -1 });

  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    layout: "portrait"
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.pdf");
  doc.pipe(res);

  const primaryColor = "#0066cc";
  const headerBgColor = "#004a99";
  const headerTextColor = "#ffffff";
  const altRowColor = "#f2f2f2";
  const linkColor = "#0066cc";

  const logoPath = path.join(process.cwd(), "public", "image", "elpiji.png").replace(/\\/g, "/");
  const title = "Attendance Report - PT Ngupoyo Rejeki Lestari Mulya";

  // Logo + Judul
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, 40, { width: 40 });
  }

  doc
    .fillColor(primaryColor)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(title, 90, 45);

  doc
    .fillColor("black")
    .fontSize(10)
    .font("Helvetica")
    .text(`Generated on: ${new Date().toLocaleDateString("id-ID")}`, 90, 65);

  const checkIns = records.filter(r => r.type === "check-in");
  const checkOuts = records.filter(r => r.type === "check-out");

  const columns = ["No", "Full Name", "Username", "Date", "Time", "Location"];
  const colWidths = [25, 110, 90, 70, 60, 130];

  const renderTable = (title: string, dataSet: any[], yStart: number): number => {
    // Judul Tabel
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(primaryColor)
      .text(title, 40, yStart);

    let y = yStart + 20;

    // Header
    doc.rect(40, y, 500, 20).fill(headerBgColor);
    doc.fillColor(headerTextColor).fontSize(9).font("Helvetica-Bold");

    let x = 40;
    columns.forEach((header, i) => {
      doc.text(header, x + 5, y + 6, { width: colWidths[i] });
      x += colWidths[i];
    });

    y += 20;

    // Rows
    dataSet.forEach((record, index) => {
      const isAlt = index % 2 === 1;
      doc.rect(40, y, 500, 20).fill(isAlt ? altRowColor : "#ffffff");
      doc.fillColor("black").font("Helvetica").fontSize(9);

      const user = record.userId as any;
      const fullName = user?.fullName || "-";
      const username = user?.username || "-";
      const date = new Date(record.timestamp).toLocaleDateString("id-ID");
      const time = new Date(record.timestamp).toLocaleTimeString("id-ID");
      const mapUrl = record.location?.latitude && record.location?.longitude
        ? `https://maps.google.com?q=${record.location.latitude},${record.location.longitude}`
        : "-";

      const row = [
        index + 1,
        fullName,
        username,
        date,
        time,
        mapUrl
      ];

      x = 40;
      row.forEach((value, i) => {
        if (i === 5 && value !== "-") {
          doc.fillColor(linkColor).text("View on Maps", x + 5, y + 6, {
            width: colWidths[i],
            link: value.toString(),
            underline: true
          });
          doc.fillColor("black");
        } else {
          doc.text(value.toString(), x + 5, y + 6, { width: colWidths[i] });
        }
        x += colWidths[i];
      });

      y += 20;
      if (y > 780) {
        doc.addPage();
        y = 50;
      }
    });

    return y;
  };

  let nextY = renderTable("Check-In Report", checkIns, 100);
  nextY = renderTable("Check-Out Report", checkOuts, nextY + 40);

  // Footer
  doc
    .moveTo(40, nextY + 20)
    .lineTo(550, nextY + 20)
    .strokeColor("#cccccc")
    .stroke();

  doc
    .fontSize(9)
    .fillColor("gray")
    .text("Generated by: Magang PT Ngupoyo Rejeki Lestari Mulya", 40, nextY + 30, { align: "right" });

  doc.end();
};

