import React from 'react';
import { Sparkles, Cpu, Layers, CheckCircle, Zap } from 'lucide-react';

export default function ProcessProgress({ preset = '4k', model = 'realesrgan-x4plus', realPercent, stage, statusMessage }) {
  // Xác định step active dựa trên stage thực tế từ backend
  let activeStep = 0;
  if (stage === 'init') activeStep = 0;
  else if (stage === 'ai_upscale') activeStep = 1;
  else if (stage === 'resample' || stage === 'enhancement' || stage === 'face_restore') activeStep = 2;
  else if (stage === 'post_process' || stage === 'save' || stage === 'done') activeStep = 3;

  const currentPercent = typeof realPercent === 'number' ? Math.min(100, Math.max(0, realPercent)) : 15;

  const steps = [
    { 
      key: 'init',
      title: 'Tải ảnh & Khởi tạo Neural Engine', 
      sub: 'Kiểm tra tỷ lệ khung hình & shader Vulkan NCNN' 
    },
    { 
      key: 'ai_upscale',
      title: 'Siêu phân giải Vulkan GPU Intel Iris Xe', 
      sub: 'Real-ESRGAN Deep Learning suy luận từng khối Tiling pixel' 
    },
    { 
      key: 'face_restore',
      title: 'Lanczos-4 & Phục hồi khuôn mặt GFPGAN', 
      sub: `Tái tạo vi chi tiết mắt, da, tóc & nội suy chuẩn ${preset.toUpperCase()}` 
    },
    { 
      key: 'post_process',
      title: 'Làm nét vi mô & Xuất chuẩn in 300 DPI', 
      sub: 'Áp dụng Unsharp Masking, bảo tồn EXIF & nhúng siêu dữ liệu' 
    }
  ];

  return (
    <div 
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        borderRadius: '16px',
        width: '100%',
        minHeight: '430px',
        background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.06) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Animated Orb & Realtime Badge */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div 
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00f2fe 0%, #7928ca 80%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 45px rgba(0, 242, 254, 0.7)',
            animation: 'pulseDot 2s infinite ease-in-out',
            color: '#fff'
          }}
        >
          <Sparkles size={38} />
        </div>
        <div 
          style={{
            position: 'absolute',
            bottom: -6,
            right: -10,
            background: '#04060a',
            border: '1px solid var(--accent-cyan)',
            padding: '3px 8px',
            borderRadius: '999px',
            fontSize: '0.68rem',
            color: 'var(--accent-cyan)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.8)'
          }}
        >
          <Zap size={10} /> GPU REALTIME
        </div>
      </div>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
        {statusMessage || 'AI Đang Tái Tạo Chi Tiết & Làm Nét Hình Ảnh...'}
      </h3>
      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '520px', marginBottom: '24px' }}>
        Mô hình <strong>{model}</strong> • Tăng tốc phần cứng <strong>GPU Intel Iris Xe (Vulkan)</strong> & DirectML.
      </p>

      {/* Progress Bar with Real-time Percent */}
      <div style={{ width: '100%', maxWidth: '540px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {statusMessage ? statusMessage : 'Tiến trình suy luận phần cứng'}
          </span>
          <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {currentPercent.toFixed(1)}%
          </span>
        </div>
        <div 
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div 
            style={{
              height: '100%',
              width: `${currentPercent}%`,
              background: 'linear-gradient(90deg, #00f2fe, #3b82f6, #a855f7)',
              borderRadius: '999px',
              transition: 'width 0.25s ease-out',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.8)'
            }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '480px', textAlign: 'left' }}>
        {steps.map((s, idx) => {
          const isDone = idx < activeStep || currentPercent >= 100;
          const isCurrent = idx === activeStep && currentPercent < 100;
          return (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                opacity: isCurrent ? 1 : isDone ? 0.75 : 0.3,
                transition: 'all 0.3s ease',
                background: isCurrent ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                padding: isCurrent ? '8px 12px' : '4px 12px',
                borderRadius: '10px',
                border: isCurrent ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid transparent'
              }}
            >
              <div 
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isDone ? 'var(--accent-emerald)' : isCurrent ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                  color: isDone || isCurrent ? '#050811' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {isDone ? <CheckCircle size={15} /> : idx + 1}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: isCurrent ? '#fff' : 'var(--text-secondary)' }}>
                  {s.title}
                </span>
                <span style={{ fontSize: '0.74rem', color: isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {s.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
