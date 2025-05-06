import * as canvas from "canvas";

// Ekspor yang dibutuhkan untuk monkey patch face-api.js
const { Canvas, Image, ImageData } = canvas;
const loadImage = canvas.loadImage;

// Wajib gunakan default dan named export agar kompatibel
export { Canvas, Image, ImageData, loadImage };
export default canvas;
