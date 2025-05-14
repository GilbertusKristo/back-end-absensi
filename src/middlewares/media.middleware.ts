import multer from "multer";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const parseFormData = (req: Request, res: Response, next: NextFunction) => {
  console.log(">>> Parsing Body <<<", req.body);
  for (const key in req.body) {
    const value = req.body[key];
    if (value === "true") req.body[key] = true;
    else if (value === "false") req.body[key] = false;
    else if (!isNaN(Date.parse(value))) req.body[key] = new Date(value);
    else if (!isNaN(value)) req.body[key] = Number(value);
    else req.body[key] = String(value);  // <-- Ini yang memastikan alasan tetap string
  }
  next();
};

export default {
  single(fieldname: string) {
    return [upload.single(fieldname), parseFormData];  // ✅ Pastikan parseFormData dipanggil
  },
  multiple(fieldname: string) {
    return [upload.array(fieldname), parseFormData];
  },
};



