import React, { useRef } from 'react';
import { ZapIcon } from './Icons';

interface CertificateProps {
  userName: string;
  topic: string;
  completedDate: string;
  totalStages: number;
  totalTopics: number;
}

export const Certificate: React.FC<CertificateProps> = ({
  userName,
  topic,
  completedDate,
  totalStages,
  totalTopics
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    const printContent = certificateRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=1000,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>LearnLumina Certificate - ${topic}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Orbitron:wght@400;700;900&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Space Grotesk', sans-serif;
              background: #0a0f0d;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            
            .certificate {
              width: 900px;
              padding: 60px;
              background: linear-gradient(135deg, #0a0f0d 0%, #0d1512 50%, #0a0f0d 100%);
              border: 2px solid rgba(16, 185, 129, 0.3);
              position: relative;
              overflow: hidden;
            }
            
            .certificate::before {
              content: '';
              position: absolute;
              inset: 8px;
              border: 1px solid rgba(16, 185, 129, 0.15);
              pointer-events: none;
            }
            
            .corner {
              position: absolute;
              width: 60px;
              height: 60px;
              border-color: #10b981;
              border-style: solid;
            }
            
            .corner-tl { top: 20px; left: 20px; border-width: 3px 0 0 3px; }
            .corner-tr { top: 20px; right: 20px; border-width: 3px 3px 0 0; }
            .corner-bl { bottom: 20px; left: 20px; border-width: 0 0 3px 3px; }
            .corner-br { bottom: 20px; right: 20px; border-width: 0 3px 3px 0; }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            
            .logo {
              display: inline-flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 30px;
            }
            
            .logo-icon {
              width: 50px;
              height: 50px;
              background: #10b981;
              display: flex;
              align-items: center;
              justify-content: center;
              color: black;
            }
            
            .logo-text {
              font-family: 'Orbitron', sans-serif;
              font-size: 28px;
              font-weight: 700;
              color: white;
              letter-spacing: -1px;
            }
            
            .logo-sub {
              font-family: 'Space Grotesk', monospace;
              font-size: 10px;
              color: #10b981;
              letter-spacing: 4px;
              display: block;
              margin-top: -4px;
            }
            
            .title {
              font-family: 'Orbitron', sans-serif;
              font-size: 14px;
              letter-spacing: 8px;
              color: #10b981;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            
            .main-title {
              font-family: 'Orbitron', sans-serif;
              font-size: 42px;
              font-weight: 900;
              color: white;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            
            .content {
              text-align: center;
              padding: 40px 0;
            }
            
            .presented {
              font-size: 14px;
              color: #6b7280;
              letter-spacing: 3px;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            
            .name {
              font-family: 'Orbitron', sans-serif;
              font-size: 38px;
              font-weight: 700;
              color: #10b981;
              text-transform: uppercase;
              letter-spacing: 4px;
              padding: 15px 0;
              border-bottom: 2px solid rgba(16, 185, 129, 0.3);
              margin: 0 80px 30px;
            }
            
            .completion-text {
              font-size: 16px;
              color: #9ca3af;
              line-height: 1.8;
              max-width: 600px;
              margin: 0 auto 20px;
            }
            
            .topic {
              font-family: 'Orbitron', sans-serif;
              font-size: 26px;
              font-weight: 700;
              color: white;
              text-transform: uppercase;
              letter-spacing: 2px;
              padding: 20px 40px;
              background: rgba(16, 185, 129, 0.1);
              border: 1px solid rgba(16, 185, 129, 0.3);
              display: inline-block;
              margin: 20px 0;
            }
            
            .stats {
              display: flex;
              justify-content: center;
              gap: 60px;
              margin: 30px 0;
            }
            
            .stat {
              text-align: center;
            }
            
            .stat-value {
              font-family: 'Orbitron', sans-serif;
              font-size: 32px;
              font-weight: 700;
              color: #10b981;
            }
            
            .stat-label {
              font-size: 11px;
              color: #6b7280;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-top: 5px;
            }
            
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 40px;
              padding-top: 30px;
              border-top: 1px solid rgba(16, 185, 129, 0.2);
            }
            
            .date {
              text-align: left;
            }
            
            .date-label {
              font-size: 10px;
              color: #6b7280;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            
            .date-value {
              font-family: 'Space Grotesk', monospace;
              font-size: 14px;
              color: white;
            }
            
            .signature {
              text-align: right;
            }
            
            .sig-line {
              width: 200px;
              border-bottom: 1px solid rgba(16, 185, 129, 0.5);
              margin-bottom: 8px;
              margin-left: auto;
            }
            
            .sig-text {
              font-family: 'Orbitron', sans-serif;
              font-size: 12px;
              color: #10b981;
              letter-spacing: 1px;
            }
            
            .sig-title {
              font-size: 10px;
              color: #6b7280;
              letter-spacing: 1px;
            }
            
            .id {
              text-align: center;
              margin-top: 30px;
              font-family: 'Space Grotesk', monospace;
              font-size: 10px;
              color: #374151;
              letter-spacing: 2px;
            }
            
            @media print {
              body { background: white; }
              .certificate { 
                background: white !important;
                border-color: #10b981;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const certificateId = `LUM-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="mt-12 animate-fade-up">
      {/* Celebration Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-500/20 border border-emerald-500/50 rounded-full mb-4">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-emerald-400 font-bold uppercase tracking-wider">Path Completed!</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Congratulations on your achievement!</h3>
        <p className="text-gray-400">You've successfully completed this learning path. Here's your certificate:</p>
      </div>

      {/* Certificate */}
      <div className="relative max-w-4xl mx-auto">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-emerald-500/10 rounded-xl blur-2xl" />
        
        <div 
          ref={certificateRef}
          className="certificate relative bg-gradient-to-br from-focus-base via-focus-surface to-focus-base border-2 border-emerald-500/30 p-12 md:p-16"
        >
          {/* Corner decorations */}
          <div className="corner corner-tl absolute top-5 left-5 w-16 h-16 border-t-[3px] border-l-[3px] border-emerald-500" />
          <div className="corner corner-tr absolute top-5 right-5 w-16 h-16 border-t-[3px] border-r-[3px] border-emerald-500" />
          <div className="corner corner-bl absolute bottom-5 left-5 w-16 h-16 border-b-[3px] border-l-[3px] border-emerald-500" />
          <div className="corner corner-br absolute bottom-5 right-5 w-16 h-16 border-b-[3px] border-r-[3px] border-emerald-500" />

          {/* Inner border */}
          <div className="absolute inset-3 border border-emerald-500/10 pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-10">
            {/* Logo */}
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-emerald-500 flex items-center justify-center text-black">
                <ZapIcon className="w-7 h-7" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-bold tracking-tighter text-white block leading-none">LUMINA</span>
                <span className="text-[10px] tracking-[0.25em] text-emerald-500 font-mono">SYSTEMS</span>
              </div>
            </div>

            <div className="text-emerald-500 text-xs font-mono tracking-[0.4em] uppercase mb-3">
              Certificate of Completion
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wider">
              Achievement Unlocked
            </h2>
          </div>

          {/* Content */}
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm tracking-[0.2em] uppercase mb-6">
              This certifies that
            </p>
            
            <div className="text-3xl md:text-4xl font-bold text-emerald-400 uppercase tracking-[0.15em] py-4 border-b-2 border-emerald-500/30 mx-8 md:mx-20 mb-8">
              {userName}
            </div>

            <p className="text-gray-400 text-base mb-6 max-w-xl mx-auto">
              has successfully completed the learning path and demonstrated proficiency in
            </p>

            <div className="inline-block px-8 py-4 bg-emerald-500/10 border border-emerald-500/30 mb-8">
              <span className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                {topic}
              </span>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 md:gap-20 my-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500 font-mono">{totalStages}</div>
                <div className="text-[10px] text-gray-500 tracking-[0.15em] uppercase mt-1">Stages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500 font-mono">{totalTopics}</div>
                <div className="text-[10px] text-gray-500 tracking-[0.15em] uppercase mt-1">Topics</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500 font-mono">100%</div>
                <div className="text-[10px] text-gray-500 tracking-[0.15em] uppercase mt-1">Complete</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end mt-8 pt-8 border-t border-emerald-500/20">
            <div>
              <div className="text-[10px] text-gray-600 tracking-[0.15em] uppercase mb-1">Date Issued</div>
              <div className="text-sm font-mono text-white">{formatDate(completedDate)}</div>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-emerald-500/50 mb-2" />
              <div className="text-sm text-emerald-500 font-bold tracking-wider">LUMINA SYSTEMS</div>
              <div className="text-[10px] text-gray-500">Focus Learning Platform</div>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="text-center mt-8">
            <span className="text-[10px] font-mono text-gray-600 tracking-[0.2em]">
              CERTIFICATE ID: {certificateId}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wider text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Certificate
        </button>
        <button
          onClick={() => {
            // Could implement download as image in the future
            handlePrint();
          }}
          className="px-6 py-3 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-400 font-bold rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
};

