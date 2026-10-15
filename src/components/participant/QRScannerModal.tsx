import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, AlertTriangle, Sparkles, CheckCircle2, RefreshCw, Upload, Terminal } from 'lucide-react';
import { decodeQRPayload, encodeQRPayload } from '../../lib/security';
import { HacksprintStore } from '../../lib/store';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (rawPayload: string) => void;
  currentStageIndex: number;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  currentStageIndex,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stages for simulator
  const stages = HacksprintStore.getStages();

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanFeedback(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser environment. Use the Test Simulator below.');
        setShowSimulator(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestScan();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access unavailable (normal in headless tests). Use Test Simulator below.');
      setShowSimulator(true);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const requestScan = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleCodeDetected(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(requestScan);
  };

  const handleCodeDetected = (rawData: string) => {
    setScanFeedback('QR Signature Captured! Verifying...');
    stopCamera();
    setTimeout(() => {
      onScanSuccess(rawData);
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleCodeDetected(code.data);
          } else {
            alert('No valid QR code detected in this image.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateCheckpoint = (stageIndex: number, isTampered = false) => {
    const stage = stages.find(s => s.stageIndex === stageIndex) || stages[0];
    if (!stage) return;

    const secret = isTampered ? 'TAMPERED_SECRET_9999' : stage.qrSecretToken;
    const payload = encodeQRPayload(stage.huntId, stage.id, stage.stageIndex, secret);
    handleCodeDetected(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel-glow rounded-3xl overflow-hidden border border-emerald-500/30 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Checkpoint Scanner
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Target: Stage {currentStageIndex + 1} Checkpoint
              </p>
            </div>
          </div>
          <button
            id="btn-close-scanner"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Video Area */}
        <div className="relative bg-slate-950 flex-1 min-h-[260px] flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Target Reticle & Laser */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-emerald-500/50 rounded-2xl relative scanner-reticle shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan shadow-[0_0_8px_#10b981]" />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="px-3 py-1 rounded-full bg-slate-900/90 text-emerald-400 text-[11px] font-mono border border-emerald-500/40">
                  Align Checkpoint QR Code inside the reticle
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-xs text-slate-300 font-medium mb-1">
                {cameraError || 'Camera inactive'}
              </p>
              <p className="text-[11px] text-slate-500 mb-4 font-mono">
                Running in test / simulator mode
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera Access
              </button>
            </div>
          )}

          {scanFeedback && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-4 text-center animate-fade-in z-20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <p className="text-white font-bold text-sm tracking-wide">
                {scanFeedback}
              </p>
            </div>
          )}
        </div>

        {/* Test Simulator & Quick Scan Controls (Essential for Headless Automated Testing & CI) */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <button
              id="btn-toggle-simulator"
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              {showSimulator ? 'Hide Test Simulator' : 'Show Hackathon Test Simulator'}
            </button>

            <label className="cursor-pointer text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {showSimulator && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 animate-fade-in">
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Simulated Checkpoints (Zero Hardware Needed):
              </p>
              <div className="grid grid-cols-2 gap-2">
                {stages.map((st) => (
                  <button
                    key={st.id}
                    id={`btn-simulate-stage-${st.stageIndex}`}
                    type="button"
                    onClick={() => handleSimulateCheckpoint(st.stageIndex)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-left transition-all"
                  >
                    <div className="text-[11px] font-bold text-slate-200 truncate">
                      Stage {st.stageIndex + 1}: {st.title}
                    </div>
                    <div className="text-[9px] text-emerald-400 font-mono">
                      Simulate Valid Scan
                    </div>
                  </button>
                ))}
              </div>

              {/* Anti-cheat test button */}
              <button
                id="btn-simulate-out-of-order"
                type="button"
                onClick={() => handleSimulateCheckpoint(2)} // Out of order if team on 0
                className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Test Anti-Cheat Violation (Simulate Stage 3 Skip)
              </button>

              {/* Manual input */}
              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <input
                  id="input-manual-qr"
                  type="text"
                  placeholder="Paste raw QR token / payload"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  id="btn-submit-manual-qr"
                  type="button"
                  onClick={() => manualInput.trim() && handleCodeDetected(manualInput.trim())}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold font-mono hover:bg-emerald-400 transition-colors"
                >
                  Verify
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
