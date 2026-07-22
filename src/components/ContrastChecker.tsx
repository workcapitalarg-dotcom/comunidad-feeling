import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface ContrastCheckerProps {
  uri_imagen: string;
  onLuminanceCalculated: (lum: number) => void;
}

function getContrasteHtml(imageUrl: string) {
  return `
    <html>
    <body>
    <canvas id="c" width="50" height="50"></canvas>
    <script>
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const ctx = document.getElementById('c').getContext('2d');
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let r=0, g=0, b=0;
        for(let i=0; i<data.length; i+=4) { r += data[i]; g += data[i+1]; b += data[i+2]; }
        const p = data.length/4;
        const lum = ((r/p)*0.299 + (g/p)*0.587 + (b/p)*0.114) / 255;
        window.ReactNativeWebView.postMessage(lum.toString());
      };
      img.onerror = () => window.ReactNativeWebView.postMessage("0");
      img.src = "${imageUrl}";
    </script>
    </body>
    </html>
  `;
}

export default function ContrastChecker({ uri_imagen, onLuminanceCalculated }: ContrastCheckerProps) {
  return (
    <View style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}>
      <WebView 
        source={{ html: getContrasteHtml(uri_imagen) }}
        onMessage={(event) => {
          const lum = parseFloat(event.nativeEvent.data || '0');
          onLuminanceCalculated(lum);
        }}
      />
    </View>
  );
}
