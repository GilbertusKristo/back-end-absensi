// import { Request, Response } from 'express';
// import * as tf from '@tensorflow/tfjs';
// (global as any).tf = tf;

// import * as faceapi from '@vladmandic/face-api/dist/face-api.js';

// import canvas from 'canvas';
// import path from 'path';
// import fs from 'fs';
// import FaceModel from '../models/face.model';


// const { Canvas, Image, ImageData } = canvas;
// (faceapi as any).env.monkeyPatch({ Canvas, Image, ImageData });

// const modelPath = path.join(__dirname, '../../public/models');

// let modelsLoaded = false;
// export async function initModels() {
//   if (modelsLoaded) return;
//   await (faceapi as any).nets.tinyFaceDetector.loadFromDisk(modelPath);
//   await (faceapi as any).nets.faceLandmark68Net.loadFromDisk(modelPath);
//   await (faceapi as any).nets.faceRecognitionNet.loadFromDisk(modelPath);
//   modelsLoaded = true;
// }

// const detectorOptions = new (faceapi as any).TinyFaceDetectorOptions({
//   inputSize: 320,
//   scoreThreshold: 0.5,
// });

// export const registerFace = async (req: Request, res: Response) => {
//   await initModels();

//   try {
//     const userId = req.body.userId;
//     if (!req.file || !userId) return res.status(400).json({ error: 'Image or userId missing' });

//     const img = await canvas.loadImage(req.file.path);
//     const detection = await (faceapi as any)
//       .detectSingleFace(img as unknown as faceapi.TNetInput, detectorOptions)
//       .withFaceLandmarks()
//       .withFaceDescriptor();

//     if (!detection) return res.status(400).json({ error: 'Face not detected' });

//     const descriptor = Array.from(detection.descriptor);

//     const result = await FaceModel.findOneAndUpdate(
//       { userId },
//       { descriptor },
//       { upsert: true, new: true }
//     );

//     fs.unlinkSync(req.file.path);
//     res.status(201).json({ message: 'Face registered successfully', data: result });
//   } catch (err) {
//     console.error('Register error:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// export const matchFace = async (req: Request, res: Response) => {
//   await initModels();

//   try {
//     if (!req.file) return res.status(400).json({ error: 'Image missing' });

//     const img = await canvas.loadImage(req.file.path);
//     const detection = await (faceapi as any)
//       .detectSingleFace(img as unknown as faceapi.TNetInput, detectorOptions)
//       .withFaceLandmarks()
//       .withFaceDescriptor();

//     if (!detection) return res.status(400).json({ error: 'Face not detected' });

//     const inputDescriptor = detection.descriptor;
//     const faces = await FaceModel.find();

//     let bestMatch = null;
//     let minDistance = 0.5;

//     for (const face of faces) {
//       const stored = new Float32Array(face.descriptor);
//       const dist = (faceapi as any).euclideanDistance(stored, inputDescriptor);
//       if (dist < minDistance) {
//         bestMatch = face;
//         minDistance = dist;
//       }
//     }

//     fs.unlinkSync(req.file.path);

//     if (bestMatch) {
//       res.status(200).json({ message: 'Face matched', userId: bestMatch.userId });
//     } else {
//       res.status(404).json({ message: 'No matching face found' });
//     }
//   } catch (err) {
//     console.error('Match error:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
