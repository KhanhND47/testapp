import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, SwitchCamera } from 'lucide-react';

interface ImageCaptureModalProps {
  title: string;
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function ImageCaptureModal({ title, onCapture, onClose }: ImageCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Khong the truy cap camera. Vui long cap quyen truy cap camera.');
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
  }, [facingMode]);

  const switchCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fullscreen-modal bg-black">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
        <button onClick={onClose} className="w-14 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <h3 className="flex-1 text-center font-bold text-white truncate flex items-center justify-center gap-2">
          <Camera className="w-5 h-5" />
          {title}
        </h3>
        <div className="w-14" />
      </div>

      <div className="flex-1 flex flex-col p-4 pb-safe-bottom">
        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="btn-primary"
              >
                Thu lai
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 relative bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={retakePhoto}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Chup lai
              </button>
              <button
                onClick={confirmPhoto}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
              >
                <Check className="w-5 h-5" />
                Xac nhan
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {hasMultipleCameras && (
                <button
                  onClick={switchCamera}
                  className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={capturePhoto}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Camera className="w-5 h-5" />
              Chup anh
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
