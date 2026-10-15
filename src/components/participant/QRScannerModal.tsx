import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Upload, 
  Terminal, 
  SwitchCamera,
  Loader2,
  HelpCircle
} from 'lucide-react';
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
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showSimulator, setShowSimulator] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);

  // Stages for simulator
  const stages = HacksprintStore.getStages();

  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  }, []);

  const requestScan = useCallback(() => {
    if (!isScanningRef.current) return;
    if (!videoRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(requestScan);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && code.data.trim()) {
          handleCodeDetected(code.data.trim());
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(requestScan);
  }, []);

  const startCamera = useCallback(async (desiredFacing: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraLoading(true);
    setCameraError(null);

    // Check mediaDevices support
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraLoading(false);
      setCameraError('Live camera streaming requires HTTPS or is unsupported by this browser. Use "Snap Photo with Phone Camera" below.');
      setShowSimulator(true);
      return;
    }

    try {
      let stream: MediaStream | null = null;

      // 1. First attempt: ideal target facing mode with standard HD resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: desiredFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn('Initial camera constraints failed, attempting basic fallback...', firstErr);
        // 2. Fallback attempt: simple video constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (!stream) {
        throw new Error('Unable to acquire media stream.');
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');

        // Play when metadata is loaded or immediately
        await video.play().catch(playErr => {
          console.warn('Video play() issue:', playErr);
        });

        setCameraActive(true);
        setCameraLoading(false);
        isScanningRef.current = true;
        requestScan();
      } else {
        // If ref wasn't mounted yet, give it one tick
        setTimeout(async () => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.muted = true;
            await videoRef.current.play().catch(() => {});
            setCameraActive(true);
            setCameraLoading(false);
            isScanningRef.current = true;
            requestScan();
          }
        }, 100);
      }
    } catch (err: any) {
      console.warn('Camera access failure:', err);
      setCameraLoading(false);
      setCameraActive(false);

      let message = 'Camera access unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied in your browser. Please tap "Allow" in site settings or use the Native Camera button below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device detected on this mobile.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is currently locked by another app.';
      } else if (err.name === 'OverconstrainedError') {
        message = 'Camera constraints unsupported. Try flipping camera.';
      }

      setCameraError(message);
      setShowSimulator(true);
    }
  }, [facingMode, requestScan, stopCamera]);

  // Flip between front and rear cameras
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanFeedback(null);
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleCodeDetected = (rawData: string) => {
    setScanFeedback('QR Signature Captured! Verifying Checkpoint...');
    stopCamera();
    setTimeout(() => {
      onScanSuccess(rawData);
    }, 450);
  };

  // Decode file or native camera capture
  const handleProcessImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraLoading(true);
    setScanFeedback('Processing image scan...');

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
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });
          
          setCameraLoading(false);
          if (code && code.data) {
            handleCodeDetected(code.data.trim());
          } else {
            setScanFeedback(null);
            alert('No valid HackSprint QR Code found in that photo. Please ensure good lighting and clear alignment, or use the Simulator below.');
          }
        }
      };
      img.onerror = () => {
        setCameraLoading(false);
        setScanFeedback(null);
        alert('Could not read image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be scanned again if needed
    e.target.value = '';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel-glow rounded-3xl overflow-hidden border border-emerald-500/30 flex flex-col max-h-[92vh] shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                Checkpoint Scanner
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Target: Stage {currentStageIndex + 1} Checkpoint
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {cameraActive && (
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Switch Camera (Front/Back)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
            <button
              id="btn-close-scanner"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport / Video Area: Video is ALWAYS in DOM so ref is never null */}
        <div className="relative bg-slate-950 flex-1 min-h-[280px] sm:min-h-[320px] flex items-center justify-center overflow-hidden">
          
          {/* Always mounted video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
            }`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Active Overlay: Scanner Reticle & Laser */}
          {cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-between p-4 pointer-events-none">
              <div className="text-center pt-2">
                <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono border border-emerald-500/40 shadow-lg">
                  LIVE VIDEO • Align Checkpoint QR inside reticle
                </span>
              </div>

              <div className="w-56 h-56 border-2 border-emerald-500/70 rounded-2xl relative scanner-reticle shadow-[0_0_35px_rgba(16,185,129,0.35)] flex items-center justify-center">
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan shadow-[0_0_10px_#10b981]" />
                
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-300" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-300" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-300" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-300" />
              </div>

              <div className="pb-1 pointer-events-auto">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700 flex items-center gap-1.5 transition-all shadow-md"
                >
                  <SwitchCamera className="w-3 h-3 text-emerald-400" />
                  Flip Camera ({facingMode === 'environment' ? 'Rear' : 'Front'})
                </button>
              </div>
            </div>
          )}

          {/* Inactive or Loading State */}
          {!cameraActive && (
            <div className="p-6 text-center max-w-sm mx-auto z-10 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                {cameraLoading ? (
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                ) : (
                  <Camera className="w-7 h-7" />
                )}
              </div>

              <div>
                <p className="text-xs text-slate-200 font-semibold mb-1">
                  {cameraLoading ? 'Starting camera feed...' : (cameraError || 'Camera inactive')}
                </p>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  {cameraLoading 
                    ? 'Requesting mobile permissions...' 
                    : 'Tap below to activate or snap using your phone\'s camera.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  disabled={cameraLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono inline-flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cameraLoading ? 'animate-spin' : ''}`} />
                  {cameraLoading ? 'Connecting Camera...' : 'Grant / Retry Live Camera'}
                </button>

                {/* 100% Fail-proof Native Mobile Snap Button */}
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold font-mono inline-flex items-center justify-center gap-2 border border-emerald-500/30 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Snap Photo with Phone Camera (Instant)
                </button>
              </div>
            </div>
          )}

          {/* Success Overlay */}
          {scanFeedback && (
            <div className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30 backdrop-blur-sm">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce" />
              <p className="text-white font-black text-sm tracking-wide">
                {scanFeedback}
              </p>
            </div>
          )}
        </div>

        {/* Hidden File Inputs for Native Camera Snap and Photo Upload */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleProcessImageFile}
          className="hidden"
        />
        <input
          ref={fileUploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleProcessImageFile}
          className="hidden"
        />

        {/* Test Simulator & Quick Scan Controls */}
        <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800 space-y-3">
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

            <button
              type="button"
              onClick={() => fileUploadInputRef.current?.click()}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
          </div>

          {showSimulator && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 animate-fade-in">
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Simulated Checkpoints (Zero Hardware):</span>
                <span className="text-emerald-400">Demo Ready</span>
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
