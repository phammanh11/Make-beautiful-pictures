import React, { useState } from 'react';
import { 
  Scissors, 
  Check, 
  X, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Layers, 
  Palette, 
  SunMedium 
} from 'lucide-react';

export default function BgRemoverModal({ isOpen, onClose, imageItem, onApplyToStudio }) {
  const [bgMode, setBgMode] = useState('transparent'); // 'transparent', 'white', 'color', 'blur'
  const [bgColor, setBgColor] = useState('#ffffff');
  const [blurRadius, setBlurRadius] = useState(15);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !imageItem) return null;

  const handleStartRemoveBg = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', imageItem.file);
    formData.append('bg_mode', bgMode);
    formData.append('bg_color', bgColor);
    formData.append('blur_radius', blurRadius);
    formData.append('feather_radius', 1);

    try {
      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || 'Lỗi khi tách nền ảnh.');
      }
      setResultData(data);
    } catch (e) {
      console.error('Lỗi tách nền:', e);
      setErrorMsg(e.message || 'Lỗi khi tách nền ảnh.');
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
      console.error('Lỗi nạp ảnh tách nền vào studio:', e);
    }
  };

  const modes = [
    { id: 'transparent', label: 'Trong suốt (PNG)', desc: 'Tách chủ thể trong suốt không nền' },
    { id: 'white', label: 'Nền trắng TMĐT', desc: 'Chuẩn đăng bán Shopee, Lazada, TikTok' },
    { id: 'color', label: 'Nền màu tùy chọn', desc: 'Chọn màu nền bất kỳ theo mã Hex' },
    { id: 'blur', label: 'Nền mờ nghệ thuật', desc: 'Xóa phông Bokeh giữ nét chủ thể' },
  ];

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
            <div style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', padding: '8px', borderRadius: '10px', display: 'flex' }}>
              <Scissors size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
                AI Tách Nền Thông Minh (Background Remover Studio)
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Tách chủ thể người, sản phẩm bán hàng, đồ vật chỉ với 1 cú nhấp chuột
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
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 300px', flex: 1, minHeight: 0 }}>
          {/* Visual Display */}
          <div 
            style={{
              padding: '24px',
              background: '#04060a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {resultData ? (
              <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '480px' }}>
                <img 
                  src={resultData.download_url} 
                  alt="Background removed"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '480px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    // Checkered pattern for transparent PNG
                    backgroundImage: bgMode === 'transparent' ? 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)' : 'none',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                  }}
                />
              </div>
            ) : (
              <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '480px' }}>
                <img 
                  src={imageItem.previewUrl} 
                  alt="Original"
                  style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '8px' }}
                />
              </div>
            )}

            {isProcessing && (
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <RefreshCw size={32} className="spin-icon" style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                  AI Đang phân tách chủ thể & xóa nền...
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div 
            style={{
              padding: '20px',
              borderLeft: '1px solid var(--border-subtle)',
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto'
            }}
          >
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Chế độ phông nền
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {modes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setBgMode(m.id)}
                    style={{
                      background: bgMode === m.id ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${bgMode === m.id ? '#ec4899' : 'var(--border-subtle)'}`,
                      color: bgMode === m.id ? '#f472b6' : 'var(--text-secondary)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: bgMode === m.id ? '#fff' : 'inherit' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {m.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {bgMode === 'color' && (
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Chọn màu nền (Hex):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="color" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#fff',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            )}

            {bgMode === 'blur' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Độ mờ hậu cảnh Bokeh:</span>
                  <span className="font-mono" style={{ color: '#fff' }}>{blurRadius}px</span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="35"
                  value={blurRadius}
                  onChange={(e) => setBlurRadius(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#ec4899' }}
                />
              </div>
            )}

            <button
              onClick={handleStartRemoveBg}
              disabled={isProcessing}
              className="btn-studio-primary"
              style={{
                marginTop: 'auto',
                padding: '12px',
                fontSize: '0.88rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={16} />
              {resultData ? 'Tách Lại Nền' : 'Bắt Đầu Tách Nền AI'}
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
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {resultData ? `Đã hoàn tất • Kích thước: ${resultData.width} × ${resultData.height} px` : 'Sẵn sàng tách nền'}
          </div>

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
                  <Download size={14} /> Tải Ảnh Tách Nền
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
