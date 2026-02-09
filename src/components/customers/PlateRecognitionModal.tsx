import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, RotateCcw, Loader2, ScanLine, Upload } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface Props {
  onPlateRecognized: (plate: string) => void;
  onClose: () => void;
}

function preprocessImage(canvas: HTMLCanvasElement, sourceImage: HTMLImageElement | HTMLVideoElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  ctx.drawImage(sourceImage, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    const contrast = 1.8;
    const factor = (259 * (contrast * 128 + 255)) / (255 * (259 - contrast * 128));
    let val = factor * (gray - 128) + 128;

    val = val > 140 ? 255 : 0;

    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function cleanPlateText(raw: string): string {
  let text = raw.toUpperCase().replace(/[^A-Z0-9.\-]/g, '');

  text = text.replace(/^[.\-]+|[.\-]+$/g, '');

  if (text.length >= 4) {
    return text;
  }
  return '';
}

async function recognizePlateFromImage(imageDataUrl: string): Promise<string> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageDataUrl;
  });

  const processCanvas = document.createElement('canvas');
  const scale = 2;
  processCanvas.width = img.width * scale;
  processCanvas.height = img.height * scale;
  const pCtx = processCanvas.getContext('2d')!;
  pCtx.drawImage(img, 0, 0, processCanvas.width, processCanvas.height);

  preprocessImage(processCanvas, img);

  const processedDataUrl = processCanvas.toDataURL('image/png');

  const result = await Tesseract.recognize(processedDataUrl, 'eng', {
    logger: () => {},
  });

  const lines = result.data.text.split('\n').map((l: string) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const cleaned = cleanPlateText(line);
    if (cleaned.length >= 4) {
      const hasLetter = /[A-Z]/.test(cleaned);
      const hasDigit = /[0-9]/.test(cleaned);
      if (hasLetter && hasDigit) {
        return cleaned;
      }
    }
  }

  for (const line of lines) {
    const cleaned = cleanPlateText(line);
    if (cleaned.length >= 4) {
      return cleaned;
    }
  }

  return 'NOT_FOUND';
}

export default function PlateRecognitionModal({ onPlateRecognized, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [facingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraStarted(true);
    } catch {
      setError('Khong the truy cap camera. Vui long cap quyen hoac chon anh tu thu vien.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraStarted(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedImage(imageData);
      stopCamera();
    };
    reader.readAsDataURL(file);
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    setRecognizedText('');
    setShowManualEdit(false);
    setProgress(0);
    startCamera();
  }, [startCamera]);

  const handleRecognize = useCallback(async () => {
    if (!capturedImage) return;

    try {
      setRecognizing(true);
      setError(null);
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const plateText = await recognizePlateFromImage(capturedImage);

      clearInterval(progressInterval);
      setProgress(100);

      if (plateText === 'NOT_FOUND') {
        setError('Khong tim thay bien so xe. Ban co the nhap thu cong ben duoi.');
        setShowManualEdit(true);
        return;
      }

      setRecognizedText(plateText);
      setShowManualEdit(true);
    } catch (err: any) {
      setError(err.message || 'Loi nhan dien bien so xe');
      setShowManualEdit(true);
    } finally {
      setRecognizing(false);
    }
  }, [capturedImage]);

  const handleConfirm = useCallback(() => {
    const text = recognizedText.trim();
    if (text) {
      onPlateRecognized(text);
    }
  }, [recognizedText, onPlateRecognized]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-sky-50">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Nhan dien bien so xe</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video mb-4">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {cameraStarted && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-16 border-2 border-blue-400 rounded-lg bg-blue-400/10">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-400/50 animate-pulse" />
                    </div>
                  </div>
                )}
                {!cameraStarted && !error && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />

          {recognizing && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Dang xu ly hinh anh...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              {error}
            </div>
          )}

          {showManualEdit && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bien so xe {recognizedText ? '(da nhan dien - co the chinh sua)' : '(nhap thu cong)'}
              </label>
              <input
                type="text"
                value={recognizedText}
                onChange={(e) => setRecognizedText(e.target.value.toUpperCase())}
                placeholder="VD: 51F-123.45"
                className="w-full px-3 py-2.5 border-2 border-blue-300 rounded-lg text-lg font-mono font-bold text-center tracking-wider focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3">
            {!capturedImage ? (
              <>
                <button
                  onClick={capturePhoto}
                  disabled={!cameraStarted}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Chup anh
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Chon anh
                </button>
              </>
            ) : showManualEdit ? (
              <>
                <button
                  onClick={retake}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Chup lai
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!recognizedText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Xac nhan
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={retake}
                  disabled={recognizing}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Chup lai
                </button>
                <button
                  onClick={handleRecognize}
                  disabled={recognizing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {recognizing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Dang nhan dien...
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-5 h-5" />
                      Nhan dien bien so
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
