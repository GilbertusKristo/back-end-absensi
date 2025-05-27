import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';
import path from 'path';

const { Canvas, Image, ImageData } = canvas;

// Monkey patch canvas to face-api environment
faceapi.env.monkeyPatch({
  Canvas: Canvas as any,
  Image: Image as any,
  ImageData: ImageData as any,
});

// Path ke model
const modelPath = path.join(__dirname, '../../public/models');

/**
 * Inisialisasi model face-api.js
 */
export const initFaceApi = async () => {
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  console.log('✅ FaceAPI Models Loaded (Tiny) from:', modelPath);
};

/**
 * Opsi deteksi untuk TinyFaceDetector
 */
const tinyOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 160,       // Ukuran input kecil untuk kecepatan
  scoreThreshold: 0.5,  // Threshold default
});

/**
 * Mengambil descriptor dari buffer gambar
 */
export const getDescriptorFromBuffer = async (buffer: Buffer): Promise<Float32Array> => {
  const img = await canvas.loadImage(buffer) as any;

  const detection = await faceapi
    .detectSingleFace(img, tinyOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error('❌ Wajah tidak terdeteksi dalam gambar');
  }

  return detection.descriptor;
};

/**
 * Menghitung jarak Euclidean antar dua descriptor
 */
export const calculateDistance = (desc1: Float32Array, desc2: number[]): number => {
  const sum = desc1.reduce((acc, val, i) => acc + Math.pow(val - desc2[i], 2), 0);
  return Math.sqrt(sum);
};
