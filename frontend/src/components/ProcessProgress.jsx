import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, Layers, CheckCircle } from 'lucide-react';

export default function ProcessProgress({ preset, model }) {
  const [step, setStep] = useState(0);

  const steps = [
    { title: 'Tải ảnh vào bộ nhớ Neural Engine', sub: 'Kiểm tra tỷ lệ khung hình & định dạng' },
    { title: 'Chia khối Tiling & Khởi chạy GPU Intel Iris Xe', sub: 'Real-ESRGAN Deep Learning suy luận pixel còn thiếu' },
    { title: 'Lanczos-4 Resampling & Tái tạo vi chi tiết', sub: `Nội suy chuẩn xác về độ phân giải ${preset.toUpperCase()}` },
    { title: 'Áp dụng bộ lọc khử nhiễu & Unsharp Mask', sub: 'Hoàn thiện file đầu ra độ nét cao' }
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1200);
    const timer2 = setTimeout(() => setStep(2), 4500);
    const timer3 = setTimeout(() => setStep(3), 7500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div 
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 32px',
        borderRadius: '16px',
        width: '100%',
        minHeight: '400px',
        background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.05) 0%, rgba(18, 24, 38, 0.95) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        textAlign: 'center'
      }}
    >
      {/* Animated Orb */}
      <div 
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #00f2fe 0%, #7928ca 80%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 0 40px rgba(0, 242, 254, 0.6)',
          animation: 'pulseDot 2s infinite ease-in-out',
          color: '#fff'
        }}
      >
        <Sparkles size={36} />
      </div>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
        AI Đang Tái Tạo Chi Tiết & Làm Nét Hình Ảnh...
      </h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '28px' }}>
        Sử dụng mô hình <strong>{model}</strong> với công nghệ Tiling phân khối chống tràn RAM, tăng tốc trực tiếp trên GPU Intel Iris Xe.
      </p>

      {/* Progress Bar */}
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '32px',
          position: 'relative'
        }}
      >
        <div 
          style={{
            height: '100%',
            width: `${((step + 1) / steps.length) * 100}%`,
            background: 'linear-gradient(90deg, #00f2fe, #3b82f6, #8b5cf6)',
            borderRadius: '999px',
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 12px #00f2fe'
          }}
        />
      </div>

      {/* Step Indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '440px', textAlign: 'left' }}>
        {steps.map((s, idx) => {
          const isDone = idx < step;
          const isCurrent = idx === step;
          return (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: isCurrent ? 1 : isDone ? 0.7 : 0.35,
                transition: 'all 0.3s ease'
              }}
            >
              <div 
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: isDone ? 'var(--accent-emerald)' : isCurrent ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                  color: isDone || isCurrent ? '#050811' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {isDone ? <CheckCircle size={14} /> : idx + 1}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isCurrent ? '#fff' : 'var(--text-secondary)' }}>
                  {s.title}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
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
