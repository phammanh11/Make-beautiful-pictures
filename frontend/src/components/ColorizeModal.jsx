import React, { useState } from 'react';
import { Palette, X, Sparkles, Download, Check, RefreshCw, Sliders } from 'lucide-react';

export default function ColorizeModal({ imageInput, onClose, onApplyToStudio }) {
  const [selectedPreset, setSelectedPreset] = useState('natural');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const presets = [
    { id: 'natural', label: 'Tự Nhiên & Hài Hòa', desc: 'Màu da và cảnh quan chân thực, không quá chói' },
    { id: 'vibrant', label: 'Sống Động & Rực Rỡ', desc: 'Độ tươi màu cao, sắc hoa lá và trang phục nổi bật' },
    { id: 'vintage', label: 'Cổ Kính Hoài Niệm', desc: 'Sắc điệu phim nhựa thập niên 70-80 thanh nhã' },
    { id: 'warm', label: 'Ấm Áp (Golden Hour)', desc: 'Tông màu vàng cam hoàng hôn êm dịu' },
    { id: 'cool', label: 'Thanh Khiết & Trầm Dịu', desc: 'Tông lam ngọc và ánh sáng trong trẻo' }
  ];

  const handleRunColorize = async () => {
    if (!imageInput || !imageInput.file) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', imageInput.file);
    formData.append('preset', selectedPreset);

    try {
      const res = await fetch('/api/colorize', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || 'Lỗi khi tô màu ảnh.');
      }
      setResultData(data);
    } catch (e) {
      console.error('Lỗi tô màu:', e);
      setErrorMsg(e.message || 'Lỗi khi tô màu ảnh.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!resultData) return;
    try {
      const res = await fetch(resultData.download_url);
      const blob = await res.blob();
      const file = new File([blob], resultData.filename, { type: blob.type });

      onApplyToStudio({
        file: file,
        previewUrl: resultData.download_url,
        width: resultData.width,
        height: resultData.height,
        name: resultData.filename,
        size: blob.size,
        sizeHuman: resultData.size_human
      });
      onClose();
    } catch (e) {
      console.error('Lỗi khi nạp ảnh vào studio:', e);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '8px', borderRadius: '10px', display: 'flex' }}>
              <Palette size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
                AI Phục Chế & Tô Màu Ảnh Cổ Điển (Photo Colorizer)
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Tái tạo sắc màu sống động cho ảnh đen trắng, ảnh scan tư liệu lịch sử & ảnh gia đình xưa
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)',
            flex: 1,
            overflow: 'hidden'
          }}
        >
          {/* Preview Canvas Area */}
          <div 
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRight: '1px solid var(--border-subtle)',
              position: 'relative'
            }}
          >
            <div 
              style={{
                width: '100%',
                maxHeight: '440px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <img 
                src={resultData ? resultData.download_url : imageInput.previewUrl} 
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '420px',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge-tag badge-cyan font-mono" style={{ fontSize: '0.7rem' }}>
                {resultData ? `ĐÃ TÔ MÀU (${resultData.preset.toUpperCase()})` : 'ẢNH GỐC ĐEN TRẮNG'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {imageInput.width} × {imageInput.height} px
              </span>
            </div>
          </div>

          {/* Controls Column */}
          <div 
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflowY: 'auto'
            }}
          >
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Phong Cách Sắc Độ (Color Style)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {presets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPreset(p.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${selectedPreset === p.id ? '#a855f7' : 'rgba(255, 255, 255, 0.08)'}`,
                      background: selectedPreset === p.id ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: selectedPreset === p.id ? '#c084fc' : '#fff' }}>
                      {p.label}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', fontSize: '0.8rem' }}>
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleRunColorize}
              disabled={isProcessing}
              className="btn-studio-primary"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.35)',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: isProcessing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: 'auto'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="spin" size={16} /> Đang Phục Chế Màu Sắc...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Bắt Đầu Tô Màu AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.4)'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {resultData ? 'Đã hoàn tất tô màu. Bạn có thể tải ngay hoặc đưa vào Studio để upscale lên 4K.' : 'Chọn phong cách màu và nhấn Bắt đầu tô màu AI'}
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>

            {resultData && (
              <>
                <a
                  href={resultData.download_url}
                  download={resultData.filename}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> Tải Ảnh Đã Tô Màu
                </a>

                <button
                  onClick={handleApply}
                  className="btn-studio-primary"
                  style={{
                    borderRadius: '10px',
                    padding: '8px 18px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} /> Đưa Vào Studio (Nâng Cấp 4K)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
