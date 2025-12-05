import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
  onEnd: (dataUrl: string | null) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as MouseEvent).clientX;
       clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling on touch
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current && hasSignature) {
      onEnd(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onEnd(null);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#e2e8f0'; // slate-200 for dark mode visibility
      }
    }
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="border-2 border-slate-700 rounded-2xl bg-slate-800 overflow-hidden touch-none relative h-40 w-full shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 font-medium bg-slate-800/50">
                Sign Here
            </div>
        )}
      </div>
      <button 
        type="button" 
        onClick={clear} 
        className="text-xs font-semibold text-red-400 hover:text-red-300 self-end px-3 py-1 hover:bg-red-900/20 rounded-lg transition-colors"
      >
        Clear Signature
      </button>
    </div>
  );
};