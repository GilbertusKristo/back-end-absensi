import { RequestHandler } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import PDFTable from "pdfkit-table";// Pastikan install @types/pdfkit-table jika ada
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

  records.forEach((record: any, index: number) => {
    worksheet.addRow({
      no: index + 1,
      fullName: record.userId?.fullName || "Unknown",
      username: record.userId?.username || "Unknown",
      type: record.type,
      date: record.timestamp.toISOString().split('T')[0],
      time: record.timestamp.toISOString().split('T')[1].split('.')[0],
      latitude: record.location?.latitude || "",
      longitude: record.location?.longitude || ""
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.xlsx");
  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Export Attendance to PDF (.pdf)
 */
export const exportAttendancePDF: RequestHandler = async (_req, res) => {
  const records = await AttendanceModel.find()
    .populate("userId", "fullName username")
    .sort({ timestamp: -1 });

  const doc = new PDFDocument({ margin: 30, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.pdf");

  doc.pipe(res);

  doc.fontSize(18).text("Attendance Report", { align: "center" }).moveDown(2);

  if (records.length === 0) {
    doc.fontSize(12).text("No attendance records available.", { align: "center" });
  } else {
    records.forEach((record: any, index: number) => {
      doc.fontSize(12)
        .text(`No: ${index + 1}`)
        .text(`Full Name: ${record.userId?.fullName || "Unknown"}`)
        .text(`Username: ${record.userId?.username || "Unknown"}`)
        .text(`Type: ${record.type}`)
        .text(`Date: ${record.timestamp.toISOString().split("T")[0]}`)
        .text(`Time: ${record.timestamp.toISOString().split("T")[1].split(".")[0]}`)
        .text(`Latitude: ${record.location?.latitude || ""}`)
        .text(`Longitude: ${record.location?.longitude || ""}`)
        .moveDown(1);
    });
  }

  doc.end();
};