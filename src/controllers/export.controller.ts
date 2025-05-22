import { RequestHandler } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import "../types/pdfkit-table-extend";
import AttendanceModel from "../models/attendance.model";
import PDFDocumentWithTables from "pdfkit-table"; // ✅ BENAR
import path from "path"
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

// ✅ WAJIB untuk versi ^0.1.99




















export const exportAttendancePDF: RequestHandler = async (_req, res) => {
  const records = await AttendanceModel.find().populate("userId", "fullName username").sort({ timestamp: -1 });

  const doc = new PDFDocument({
    margin: 30,
    size: "A4",
    layout: "landscape",
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.pdf");
  doc.pipe(res);

  // Style Colors
  const primaryColor = "#0066cc";
  const headerTextColor = "#ffffff";
  const tableHeaderBg = "#0078D7";
  const altRowColor = "#f9f9f9";
  const borderColor = "#cccccc";
  const linkColor = "#0066cc";

  // Optional Logo
  const imagePath = path.join(process.cwd(), "public", "image", "elpiji.png").replace(/\\/g, "/");

  try {
    doc
      .image(imagePath, 30, 30, { width: 40 })
      .fillColor(primaryColor)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Attendance Report - PT Ngupoyo Rejeki Lestari Mulya", 80, 40)
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Generated on: ${new Date().toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        80,
        65
      );
  } catch {
    doc
      .fillColor(primaryColor)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Attendance Report - PT Ngupoyo Rejeki Lestari Mulya", 30, 40, { align: "center" })
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Generated on: ${new Date().toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        30,
        65,
        { align: "center" }
      );
  }

  const checkInRecords = records.filter((r: any) => r.type === "check-in");
  const checkOutRecords = records.filter((r: any) => r.type === "check-out");

  doc
    .moveDown(2)
    .fontSize(10)
    .fillColor("#333333")
    .text(`Total Records: ${records.length} | Check-In: ${checkInRecords.length} | Check-Out: ${checkOutRecords.length}`, 30, 90);

  const renderTable = (title: string, dataset: any[], startY: number) => {
    doc
      .rect(30, startY, 782, 25)
      .fill(tableHeaderBg)
      .fillColor(headerTextColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(title, 40, startY + 7);

    if (dataset.length === 0) {
      doc.moveDown().fillColor("#333333").font("Helvetica").fontSize(10).text("No records found.", 40);
      return startY + 50;
    }

    const columns = [
      { header: "No", width: 30 },
      { header: "Full Name", width: 120 },
      { header: "Username", width: 100 },
      { header: "Date", width: 100 },
      { header: "Time", width: 100 },
      { header: "Location", width: 332 },
    ];

    const headerY = startY + 30;
    doc
      .rect(30, headerY, 782, 20)
      .fillAndStroke(tableHeaderBg, borderColor)
      .fillColor(headerTextColor)
      .fontSize(10)
      .font("Helvetica-Bold");

    let xPos = 30;
    columns.forEach((col) => {
      doc.text(col.header, xPos + 5, headerY + 6);
      xPos += col.width;
    });

    let rowY = headerY + 20;
    const rowHeight = 20;

    dataset.forEach((record: any, index: number) => {
      doc.rect(30, rowY, 782, rowHeight).fillAndStroke(index % 2 === 0 ? "#ffffff" : altRowColor, borderColor);

      const fullName = record.userId?.fullName || "Unknown";
      const username = record.userId?.username || "Unknown";
      const timestamp = new Date(record.timestamp);
      const date = timestamp.toLocaleDateString("id-ID");
      const time = timestamp.toLocaleTimeString("id-ID");
      const lat = record.location?.latitude;
      const lon = record.location?.longitude;
      const mapUrl = lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : "-";

      xPos = 30;
      doc.font("Helvetica").fontSize(9).fillColor("#333333");
      doc.text((index + 1).toString(), xPos + 5, rowY + 6, { width: columns[0].width });
      xPos += columns[0].width;
      doc.text(fullName, xPos + 5, rowY + 6, { width: columns[1].width });
      xPos += columns[1].width;
      doc.text(username, xPos + 5, rowY + 6, { width: columns[2].width });
      xPos += columns[2].width;
      doc.text(date, xPos + 5, rowY + 6, { width: columns[3].width });
      xPos += columns[3].width;
      doc.text(time, xPos + 5, rowY + 6, { width: columns[4].width });
      xPos += columns[4].width;

      if (mapUrl !== "-") {
        doc
          .fillColor(linkColor)
          .text("View on Maps", xPos + 5, rowY + 6, {
            width: columns[5].width,
            link: mapUrl,
            underline: true,
          })
          .fillColor("#333333");
      } else {
        doc.text("-", xPos + 5, rowY + 6, { width: columns[5].width });
      }

      rowY += rowHeight;
    });

    return rowY + 10;
  };

  const checkInEndY = renderTable("Check-In Records", checkInRecords, 120);
  renderTable("Check-Out Records", checkOutRecords, checkInEndY);

  doc
    .moveDown(2)
    .fontSize(10)
    .fillColor("gray")
    .text("Generated by: Magang PT Ngupoyo Rejeki Lestari Mulya", 30, 550, { align: "right" });

  doc.end();
};
















