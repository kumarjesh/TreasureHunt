import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Stage } from '../../types';
import { encodeQRPayload } from '../../lib/security';
import { Download, Printer, QrCode as QrIcon, Check, Copy } from 'lucide-react';

interface QRCodeGeneratorCardProps {
  stages: Stage[];
}

export const QRCodeGeneratorCard: React.FC<QRCodeGeneratorCardProps> = ({ stages }) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(stages[0]?.id || '');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const activeStage = stages.find(s => s.id === selectedStageId) || stages[0];

  useEffect(() => {
    stages.forEach(stage => {
      const canvas = canvasRefs.current[stage.id];
      if (canvas) {
        const payload = encodeQRPayload(stage.huntId, stage.id, stage.stageIndex, stage.qrSecretToken);
        QRCode.toCanvas(canvas, payload, {
          width: 260,
          margin: 2,
          color: {
            dark: '#070b14',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H'
        }, (error) => {
          if (error) console.error('QR Render error:', error);
        });
      }
    });
  }, [stages, selectedStageId]);

  const handleDownloadPNG = (stage: Stage) => {
    const canvas = canvasRefs.current[stage.id];
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `HACKSPRINT_Stage_${stage.stageIndex + 1}_QR.png`;
    link.href = dataUrl;
    link.click();
  };

  const handlePrintSheet = (stage: Stage) => {
    const canvas = canvasRefs.current[stage.id];
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HACKSPRINT Checkpoint #${stage.stageIndex + 1}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              text-align: center;
              padding: 40px;
              color: #000;
            }
            .checkpoint-box {
              border: 4px solid #000;
              padding: 30px;
              max-width: 500px;
              margin: 0 auto;
              border-radius: 12px;
            }
            h1 { font-size: 28px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 2px; }
            h2 { font-size: 20px; color: #333; margin-top: 0; }
            .qr-img { width: 300px; height: 300px; margin: 20px 0; }
            .warning { font-size: 14px; font-weight: bold; background: #eee; padding: 8px; border-radius: 4px; }
            .meta { font-size: 11px; color: #666; margin-top: 15px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="checkpoint-box">
            <h1>⚡ HACKSPRINT 2026</h1>
            <h2>CHECKPOINT #${stage.stageIndex + 1}: ${stage.title}</h2>
            <img class="qr-img" src="${dataUrl}" alt="Checkpoint QR Code" />
            <div class="warning">⚠️ OFFICIAL HACKATHON CHECKPOINT — DO NOT REMOVE</div>
            <p style="font-size: 13px; color: #444; margin-top: 15px;">
              Scan this code using the HACKSPRINT Participant App to unlock the digital puzzle.
            </p>
            <div class="meta">
              STAGE_ID: ${stage.id} • TOKEN: ${stage.qrSecretToken} • POINTS: ${stage.points}
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedToken(secret);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <QrIcon className="w-4 h-4" />
            Physical Checkpoint Asset Generation
          </div>
          <h2 className="text-xl font-black text-white">
            QR Code Generator & Print Station
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate cryptographically signed QR codes for each physical stage checkpoint.
          </p>
        </div>

        {/* Stage Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setSelectedStageId(stage.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                (activeStage?.id === stage.id)
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Stage {stage.stageIndex + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Stage Detail & Card */}
      {activeStage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: High-Contrast QR Code Card */}
          <div className="lg:col-span-5 glass-panel-glow rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center border border-cyan-500/30">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono font-bold uppercase tracking-wider mb-4">
              Checkpoint #{activeStage.stageIndex + 1}
            </span>

            {/* QR Canvas Render */}
            <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-cyan-500/10 mb-5">
              <canvas
                ref={el => { canvasRefs.current[activeStage.id] = el; }}
                className="w-56 h-56 rounded-xl"
              />
            </div>

            <h3 className="text-lg font-black text-white mb-1">
              {activeStage.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-6">
              +{activeStage.points} Points • Hunt: {activeStage.huntId}
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                id={`btn-download-qr-${activeStage.stageIndex}`}
                type="button"
                onClick={() => handleDownloadPNG(activeStage)}
                className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>

              <button
                id={`btn-print-qr-${activeStage.stageIndex}`}
                type="button"
                onClick={() => handlePrintSheet(activeStage)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                Print Sign
              </button>
            </div>
          </div>

          {/* Right: Security & Deployment Instructions */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h4 className="text-sm font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">
                Physical Deployment Location
              </h4>
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-sm text-slate-200">
                {activeStage.clue}
              </div>
            </div>

            {/* Cryptographic Token Details */}
            <div>
              <h4 className="text-sm font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">
                Anti-Cheat Nonce Token
              </h4>
              <div className="flex items-center justify-between bg-slate-950/80 rounded-2xl p-3 px-4 border border-slate-800">
                <code className="text-xs font-mono text-emerald-400">
                  {activeStage.qrSecretToken}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopySecret(activeStage.qrSecretToken)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                >
                  {copiedToken === activeStage.qrSecretToken ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[11px] font-mono">
                    {copiedToken === activeStage.qrSecretToken ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-mono">
                This secret is embedded in the physical QR payload. The client verifies that this token matches before granting a session unlock.
              </p>
            </div>

            {/* Expected Answer Info for Organizer Reference */}
            <div>
              <h4 className="text-sm font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">
                Puzzle Solution Hash (SHA-256)
              </h4>
              <div className="bg-slate-950/80 rounded-2xl p-3 px-4 border border-slate-800 space-y-1">
                <div className="text-[11px] font-mono text-slate-500">
                  Expected plain text: <span className="text-emerald-400 font-bold">{activeStage.plainAnswerHint || 'Hidden'}</span>
                </div>
                <code className="text-[10px] font-mono text-slate-400 break-all block">
                  {activeStage.correctAnswerHash}
                </code>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
