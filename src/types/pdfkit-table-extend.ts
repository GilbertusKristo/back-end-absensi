// src/utils/pdfkit-table-extend.ts

import PDFDocument from "pdfkit";
import table from "pdfkit-table";

// Extend prototype agar PDFDocument memiliki method .table()
(PDFDocument.prototype as any).table = table;
