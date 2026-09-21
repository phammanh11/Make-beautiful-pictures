import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  HardDrive, 
  Maximize, 
  Sparkles, 
  Download, 
  ArrowRight, 
  Cpu, 
  UserCheck,
  Copy,
  Check
} from 'lucide-react';

export default function MetricsHUD({ result, onDownload }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const handleCopy = async () => {
    try {
      const res = await fetch(result.download_url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy error:', e);
    }
  };

  const { input, output, elapsed_seconds, effective_scale, model_used, preset_used, faces_restored } = result;
  const mpIncrease = input.megapixels > 0 
    ? Math.round(((output.megapixels - input.megapixels) / input.megapixels) * 100)
    : 0;

  return (
    <div 
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px 24px',
        borderRadius: '16px',
        width: '100%',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.04) 0%, rgba(18, 24, 38, 0.9) 100%)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={16} />
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
            Nâng cấp hoàn tất thành công!
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {faces_restored > 0 && (
            <span 
              className="badge-tag" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(121, 40, 202, 0.3), rgba(0, 242, 254, 0.3))',
                border: '1px solid var(--accent-cyan)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserCheck size={13} color="#00f2fe" />
              Đã phục hồi {faces_restored} khuôn mặt (GFPGAN AI)
            </span>
          )}
          <span className="badge-tag badge-emerald font-mono">
            <Clock size={12} /> {elapsed_seconds}s
          </span>
          <span className="badge-tag badge-cyan font-mono">
            <Cpu size={12} /> GPU Intel Iris Xe Active
          </span>
        </div>
      </div>

      {/* Grid stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {/* Resolution */}
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px 14px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Độ phân giải
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {input.width}×{input.height}
            </span>
            <ArrowRight size={13} color="#00f2fe" />
            <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              {output.width}×{output.height}
            </span>
          </div>
        </div>

        {/* Megapixels */}
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px 14px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Điểm ảnh (Megapixels)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {input.megapixels} MP
            </span>
            <ArrowRight size={13} color="#00f2fe" />
            <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>
              {output.megapixels} MP (+{mpIncrease}%)
            </span>
          </div>
        </div>

        {/* File Size */}
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px 14px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dung lượng file
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {input.size_human}
            </span>
            <ArrowRight size={13} color="#00f2fe" />
            <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              {output.size_human}
            </span>
          </div>
        </div>

        {/* Model & Factor */}
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px 14px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mô hình / Scale
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span className="badge-tag badge-purple" style={{ fontSize: '0.75rem' }}>
              {preset_used.toUpperCase()} ({effective_scale}x)
            </span>
          </div>
        </div>
      </div>

      {/* Download & Copy Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '6px' }}>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${copied ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.15)'}`,
            color: copied ? '#34d399' : '#fff',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Đã sao chép vào Clipboard!' : 'Sao chép ảnh (Clipboard)'}</span>
        </button>

        <a
          href={result.download_url}
          download={result.filename}
          className="glow-btn"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            fontSize: '0.88rem'
          }}
        >
          <Download size={16} /> Tải Về Máy ({output.format})
        </a>
      </div>
    </div>
  );
}
