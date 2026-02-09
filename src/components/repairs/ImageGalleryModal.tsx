import { useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { RepairItemImage } from '../../lib/supabase';

interface ImageGalleryModalProps {
  images: RepairItemImage[];
  itemName: string;
  onClose: () => void;
}

export default function ImageGalleryModal({ images, itemName, onClose }: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentImage = images[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const downloadImage = () => {
    if (!currentImage) return;

    const link = document.createElement('a');
    link.href = currentImage.image_data;
    const timestamp = new Date(currentImage.captured_at).toISOString().replace(/[:.]/g, '-');
    link.download = `${itemName}_${currentImage.image_type}_${timestamp}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const getImageTypeLabel = (type: string) => {
    return type === 'start' ? 'Bat dau' : 'Hoan thanh';
  };

  if (images.length === 0) {
    return (
      <div className="fullscreen-modal bg-black">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
          <button onClick={onClose} className="w-14 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <h3 className="flex-1 text-center font-bold text-white truncate">Hinh anh</h3>
          <div className="w-14" />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">Khong co hinh anh</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-modal bg-black">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-black/50" style={{ paddingTop: 'var(--safe-top)' }}>
          <div className="text-white min-w-0 flex-1">
            <h3 className="font-bold truncate">{itemName}</h3>
            <p className="text-sm text-white/70">
              {getImageTypeLabel(currentImage.image_type)} - {formatDateTime(currentImage.captured_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={downloadImage}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Tai xuong"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative px-4">
          {images.length > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="max-w-full max-h-[calc(100vh-180px)] flex items-center justify-center">
            <img
              src={currentImage.image_data}
              alt={`${itemName} - ${currentImage.image_type}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {images.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="px-4 py-3 pb-safe-bottom bg-black/50">
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-red-500 ring-2 ring-red-500/50'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.image_data}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-white/70 text-sm mt-2">
              {currentIndex + 1} / {images.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
