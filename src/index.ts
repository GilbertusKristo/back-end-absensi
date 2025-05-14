import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';

import db from './utils/database';
import docs from './docs/route';
import Router from './routes/api';
import { initFaceApi } from './utils/face.utils';

async function startServer() {
  try {
    const dbStatus = await db();
    console.log("Database Status:", dbStatus);

    const app = express();

    app.use(cors());
    app.use(bodyParser.json());

    const PORT = 3000;

    // Endpoint untuk pengecekan server
    app.get("/", (req, res) => {
      res.status(200).json({
        message: "Server is running",
        data: null,
      });
    });

    // Serve static models
    app.use('/models', express.static(path.join(__dirname, '../public/models')));

    // Register API routes
    app.use("/api", Router);

    // Register Swagger Docs
    docs(app);

    // Start Server
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Error initializing the server:", error);
    process.exit(1);
  }
}

// ✅ Jalankan hanya setelah FaceAPI berhasil dimuat
initFaceApi()
  .then(() => {
    console.log("✅ FaceAPI Models loaded successfully.");
    startServer();
  })
  .catch((err) => {
    console.error("❌ Gagal memuat model:", err);
    process.exit(1);
  });
