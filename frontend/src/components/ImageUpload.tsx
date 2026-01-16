import { useCallback, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { loadImage } from '../lib/canvasUtils';

export function ImageUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const { setImageFile, setImageElement, setImageDimensions, reset } = useEditorStore();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      try {
        reset();
        const img = await loadImage(file);
        setImageFile(file);
        setImageElement(img);
        setImageDimensions({ width: img.width, height: img.height });
      } catch (error) {
        console.error('Failed to load image:', error);
        alert('Failed to load image');
      }
    },
    [setImageFile, setImageElement, setImageDimensions, reset]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        w-full max-w-2xl h-64
        border-2 border-dashed rounded-lg
        transition-colors cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
      >
        <svg
          className="w-12 h-12 text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-600 text-lg mb-1">
          {isDragging ? 'Drop image here' : 'Drop image here or click to upload'}
        </p>
        <p className="text-gray-400 text-sm">Supports PNG, JPG, WEBP</p>
      </label>
    </div>
  );
}
