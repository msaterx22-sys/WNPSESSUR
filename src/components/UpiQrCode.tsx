import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface UpiQrCodeProps {
  upiUrl: string;
  size?: number;
  className?: string;
}

export const UpiQrCode: React.FC<UpiQrCodeProps> = ({ upiUrl, size = 160, className = '' }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!upiUrl) return;
    QRCode.toDataURL(upiUrl, {
      width: size,
      margin: 1,
      color: {
        dark: '#2D312E',
        light: '#ffffff',
      },
    })
      .then(url => setDataUrl(url))
      .catch(err => console.error('Error generating QR code', err));
  }, [upiUrl, size]);

  if (!dataUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-[#F2F4F2] rounded-lg text-xs text-[#6B7280] ${className}`}
        style={{ width: size, height: size }}
      >
        Loading QR...
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <img 
        src={dataUrl} 
        alt="UPI QR Code" 
        className="rounded-lg border border-[#E2E8E2] shadow-xs" 
        style={{ width: size, height: size }}
      />
    </div>
  );
};
