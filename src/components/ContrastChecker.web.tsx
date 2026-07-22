import React, { useEffect } from 'react';

interface ContrastCheckerProps {
  uri_imagen: string;
  onLuminanceCalculated: (lum: number) => void;
}

export default function ContrastChecker({ uri_imagen, onLuminanceCalculated }: ContrastCheckerProps) {
  useEffect(() => {
    if (!uri_imagen) return;
    
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 50, 50);
          const imageData = ctx.getImageData(0, 0, 50, 50);
          const data = imageData.data;
          let r = 0, g = 0, b = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }
          const p = data.length / 4;
          const lum = ((r / p) * 0.299 + (g / p) * 0.587 + (b / p) * 0.114) / 255;
          onLuminanceCalculated(lum);
        } else {
          onLuminanceCalculated(0);
        }
      } catch (err) {
        console.warn("Error calculating luminance on web canvas:", err);
        onLuminanceCalculated(0);
      }
    };
    img.onerror = () => {
      onLuminanceCalculated(0);
    };
    img.src = uri_imagen;
  }, [uri_imagen]);

  return null;
}
