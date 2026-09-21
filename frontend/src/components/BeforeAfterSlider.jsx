import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  MoveHorizontal,
  ArrowLeftRight,
  Eye,
  Download,
  Copy,
  Check,
  SlidersHorizontal,
  Columns,
  Search,
  RotateCw
} from 'lucide-react';

export default function BeforeAfterSlider({ 
  originalUrl, 
  upscaledUrl, 
  originalInfo, 
  upscaledInfo, 
  onDownload 
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'side' | 'magnifier' | 'before' | 'after'
  const [isReversed, setIsReversed] = useState(true); // true: Trái = SAU (Nét), Phải = TRƯỚC (Gốc)
  
  // Magnifier state
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0, show: false, relX: 0.5, relY: 0.5 });
  const [magnifierZoom, setMagnifierZoom] = useState(3.0);

  // Copy status
  const [copySuccess, setCopySuccess] = useState(false);

  // Quick Adjustment Controls
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [adjustments, setAdjustments] = useState({
    brightness: 100, // 50 to 150
    contrast: 100,   // 50 to 150
    saturate: 100,   // 0 to 200
  });

  const containerRef = useRef(null);

  // Handle slider movement
  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (isDragging && e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      handleMove(e.clientX);
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }

    // Magnifier tracking
    if (viewMode === 'magnifier' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setMagnifierPos({
          x,
          y,
          show: true,
          relX: x / rect.width,
          relY: y / rect.height
        });
      } else {
        setMagnifierPos(prev => ({ ...prev, show: false }));
      }
    }
  }, [isDragging, isPanning, startPan, handleMove, viewMode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isDragging || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isPanning, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleContainerMouseDown = (e) => {
    if (e.target.closest('.control-bar') || e.target.closest('.adjustments-panel')) return;
    
    // Middle click or Alt key or when zoomed in
    if (e.button === 1 || e.altKey || zoom > 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (viewMode === 'split') {
      setIsDragging(true);
      handleMove(e.clientX);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSliderPos(50);
  };

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturate: 100
    });
  };

  // Copy upscaled image to clipboard
  const handleCopyToClipboard = async () => {
    try {
      const res = await fetch(upscaledUrl);
      const blob = await res.blob();
      
      // Convert to png blob if not already
      let finalBlob = blob;
      if (blob.type !== 'image/png' || adjustments.brightness !== 100 || adjustments.contrast !== 100 || adjustments.saturate !== 100) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = upscaledUrl;
        await new Promise(r => { img.onload = r; });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturate}%)`;
        ctx.drawImage(img, 0, 0);

        finalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': finalBlob })
      ]);

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      alert('Không thể sao chép trực tiếp ảnh. Bạn có thể dùng nút Tải về.');
    }
  };

  // Download with adjustments applied if changed
  const handleDownloadAdjusted = async () => {
    if (adjustments.brightness === 100 && adjustments.contrast === 100 && adjustments.saturate === 100) {
      if (onDownload) onDownload();
      return;
    }

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = upscaledUrl;
      await new Promise(r => { img.onload = r; });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturate}%)`;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adjusted_${upscaledInfo?.filename || 'upscaled.png'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (e) {
      if (onDownload) onDownload();
    }
  };

  // Determine which image is top (left) and bottom (right)
  const leftImage = isReversed ? upscaledUrl : originalUrl;
  const rightImage = isReversed ? originalUrl : upscaledUrl;

  const adjustedFilter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturate}%)`;

  const leftLabel = isReversed ? (
    <div 
      className="badge-tag badge-cyan"
      style={{
        background: 'rgba(10, 15, 29, 0.92)',
        backdropFilter: 'blur(8px)',
        padding: '6px 14px',
        fontSize: '0.82rem',
        boxShadow: '0 4px 16px rgba(0, 242, 254, 0.3)'
      }}
    >
      <Sparkles size={14} />
      SAU (AI NÉT): {upscaledInfo?.width} × {upscaledInfo?.height} ({upscaledInfo?.size_human})
    </div>
  ) : (
    <div 
      className="badge-tag"
      style={{
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#e2e8f0',
        padding: '6px 12px',
        fontSize: '0.8rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span>
      TRƯỚC (GỐC): {originalInfo?.width} × {originalInfo?.height} ({originalInfo?.size_human})
    </div>
  );

  const rightLabel = isReversed ? (
    <div 
      className="badge-tag"
      style={{
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#e2e8f0',
        padding: '6px 12px',
        fontSize: '0.8rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span>
      TRƯỚC (GỐC): {originalInfo?.width} × {originalInfo?.height} ({originalInfo?.size_human})
    </div>
  ) : (
    <div 
      className="badge-tag badge-cyan"
      style={{
        background: 'rgba(10, 15, 29, 0.92)',
        backdropFilter: 'blur(8px)',
        padding: '6px 14px',
        fontSize: '0.82rem',
        boxShadow: '0 4px 16px rgba(0, 242, 254, 0.3)'
      }}
    >
      <Sparkles size={14} />
      SAU (AI NÉT): {upscaledInfo?.width} × {upscaledInfo?.height} ({upscaledInfo?.size_human})
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Top Controls Toolbar */}
      <div 
        className="glass-panel control-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderRadius: '12px',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        {/* Left: View Modes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setViewMode('split')}
            style={{
              background: viewMode === 'split' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              border: `1px solid ${viewMode === 'split' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
              color: viewMode === 'split' ? '#00f2fe' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MoveHorizontal size={14} /> So sánh trượt (Split)
          </button>

          <button
            onClick={() => setViewMode('side')}
            style={{
              background: viewMode === 'side' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              border: `1px solid ${viewMode === 'side' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
              color: viewMode === 'side' ? '#00f2fe' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Columns size={14} /> Song song (Side-by-side)
          </button>

          <button
            onClick={() => setViewMode('magnifier')}
            style={{
              background: viewMode === 'magnifier' ? 'rgba(121, 40, 202, 0.25)' : 'transparent',
              border: `1px solid ${viewMode === 'magnifier' ? '#c084fc' : 'var(--border-subtle)'}`,
              color: viewMode === 'magnifier' ? '#c084fc' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={14} /> Kính lúp (Magnifier)
          </button>

          <button
            onClick={() => setViewMode('before')}
            style={{
              background: viewMode === 'before' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: `1px solid ${viewMode === 'before' ? '#fff' : 'var(--border-subtle)'}`,
              color: viewMode === 'before' ? '#fff' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Ảnh gốc
          </button>

          <button
            onClick={() => setViewMode('after')}
            style={{
              background: viewMode === 'after' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: `1px solid ${viewMode === 'after' ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
              color: viewMode === 'after' ? '#34d399' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} /> Đã AI Nét
          </button>

          {/* Swap sides button in split mode */}
          {viewMode === 'split' && (
            <button
              onClick={() => setIsReversed(!isReversed)}
              title="Đổi chiều vị trí Trước / Sau"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ArrowLeftRight size={13} />
              <span>Đổi chiều ({isReversed ? 'Trái: Sau' : 'Trái: Trước'})</span>
            </button>
          )}
        </div>

        {/* Right: Zoom, Adjustments, Copy, Download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Quick adjustments button */}
          <button
            onClick={() => setShowAdjustments(!showAdjustments)}
            title="Tinh chỉnh độ sáng, tương phản, độ rực màu"
            style={{
              background: showAdjustments ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showAdjustments ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
              color: showAdjustments ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <SlidersHorizontal size={14} />
            <span>Hậu kỳ</span>
          </button>

          {/* Zoom controller */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '2px 4px' }}>
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              title="Thu nhỏ"
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '4px 6px', cursor: 'pointer' }}
            >
              <ZoomOut size={16} />
            </button>
            <span className="font-mono" style={{ fontSize: '0.75rem', padding: '0 6px', minWidth: '44px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(4, prev + 0.25))}
              title="Phóng to"
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '4px 6px', cursor: 'pointer' }}
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            onClick={resetView}
            title="Đặt lại khung nhìn"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
          </button>

          {/* Copy to Clipboard */}
          <button
            onClick={handleCopyToClipboard}
            title="Sao chép ảnh nét vào bộ nhớ tạm để dán ngay vào Zalo/Photoshop"
            style={{
              background: copySuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${copySuccess ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.15)'}`,
              color: copySuccess ? '#34d399' : '#fff',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {copySuccess ? <Check size={14} /> : <Copy size={14} />}
            <span>{copySuccess ? 'Đã sao chép!' : 'Sao chép ảnh'}</span>
          </button>

          {/* Download button */}
          <button
            onClick={handleDownloadAdjusted}
            className="glow-btn"
            style={{
              padding: '7px 16px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={15} /> Tải Về ({upscaledInfo?.format || 'PNG'})
          </button>
        </div>
      </div>

      {/* Quick Adjustments Drawer / Toolbar (When toggled) */}
      {showAdjustments && (
        <div
          className="glass-panel adjustments-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 700 }}>
            <SlidersHorizontal size={15} />
            <span>TINH CHỈNH HẬU KỲ TRỰC TIẾP:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
            {/* Brightness */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '130px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Sáng:</span>
              <input
                type="range"
                min="50"
                max="150"
                value={adjustments.brightness}
                onChange={(e) => setAdjustments(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                style={{ flex: 1, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
              <span className="font-mono" style={{ fontSize: '0.72rem', color: '#fff', minWidth: '36px' }}>
                {adjustments.brightness}%
              </span>
            </div>

            {/* Contrast */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '130px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Tương phản:</span>
              <input
                type="range"
                min="50"
                max="150"
                value={adjustments.contrast}
                onChange={(e) => setAdjustments(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                style={{ flex: 1, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
              <span className="font-mono" style={{ fontSize: '0.72rem', color: '#fff', minWidth: '36px' }}>
                {adjustments.contrast}%
              </span>
            </div>

            {/* Saturation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '130px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Độ tươi:</span>
              <input
                type="range"
                min="0"
                max="200"
                value={adjustments.saturate}
                onChange={(e) => setAdjustments(prev => ({ ...prev, saturate: parseInt(e.target.value) }))}
                style={{ flex: 1, accentColor: '#c084fc', cursor: 'pointer' }}
              />
              <span className="font-mono" style={{ fontSize: '0.72rem', color: '#fff', minWidth: '36px' }}>
                {adjustments.saturate}%
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAdjustments}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              cursor: 'pointer'
            }}
          >
            Mặc định
          </button>
        </div>
      )}

      {/* Main Canvas Area */}
      <div 
        ref={containerRef}
        className="slider-container"
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMagnifierPos(prev => ({ ...prev, show: false }))}
        style={{
          width: '100%',
          height: '560px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#06080e',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 20px 40px -15px rgba(0,0,0,0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          cursor: viewMode === 'magnifier' ? 'crosshair' : isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default'
        }}
      >
        {/* VIEW MODE: SIDE-BY-SIDE */}
        {viewMode === 'side' ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              padding: '8px'
            }}
          >
            {/* Left Pane: Original */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                background: '#030508',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 10,
                  background: 'rgba(15, 23, 42, 0.85)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                TRƯỚC (GỐC): {originalInfo?.width} × {originalInfo?.height}
              </div>
              <img
                src={originalUrl}
                alt="Before side"
                style={{
                  maxWidth: '92%',
                  maxHeight: '92%',
                  objectFit: 'contain',
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out'
                }}
              />
            </div>

            {/* Right Pane: Upscaled */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                background: '#030508',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0, 242, 254, 0.2)'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 10,
                  background: 'rgba(10, 15, 29, 0.92)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  color: '#00f2fe',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} />
                SAU (AI NÉT): {upscaledInfo?.width} × {upscaledInfo?.height}
              </div>
              <img
                src={upscaledUrl}
                alt="After side"
                style={{
                  maxWidth: '92%',
                  maxHeight: '92%',
                  objectFit: 'contain',
                  filter: adjustedFilter,
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out'
                }}
              />
            </div>
          </div>
        ) : (
          /* STANDARD TRANSFORM CANVAS (Split, Magnifier, Before, After) */
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              pointerEvents: 'none'
            }}
          >
            {/* RIGHT / BASE Layer Image */}
            <img
              src={viewMode === 'before' || viewMode === 'magnifier' ? originalUrl : viewMode === 'after' ? upscaledUrl : rightImage}
              alt="Base Layer"
              style={{
                position: 'absolute',
                maxWidth: '92%',
                maxHeight: '92%',
                objectFit: 'contain',
                filter: (viewMode === 'after' || (!isReversed && viewMode === 'split')) ? adjustedFilter : 'none'
              }}
            />

            {/* LEFT Layer with Clip Path (SPLIT MODE) */}
            {viewMode === 'split' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                  transition: isDragging ? 'none' : 'clip-path 0.1s ease-out'
                }}
              >
                <img
                  src={leftImage}
                  alt="Top Layer"
                  style={{
                    maxWidth: '92%',
                    maxHeight: '92%',
                    objectFit: 'contain',
                    filter: isReversed ? adjustedFilter : 'none'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* MAGNIFIER LENS OVERLAY */}
        {viewMode === 'magnifier' && magnifierPos.show && (
          <div
            style={{
              position: 'absolute',
              top: `${magnifierPos.y - 100}px`,
              left: `${magnifierPos.x - 100}px`,
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '3px solid var(--accent-cyan)',
              boxShadow: '0 0 30px rgba(0, 242, 254, 0.6), inset 0 0 20px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 40,
              background: '#04060a'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${upscaledUrl})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${containerRef.current ? containerRef.current.clientWidth * magnifierZoom : 1000}px auto`,
                backgroundPosition: `${-(magnifierPos.x * magnifierZoom - 100)}px ${-(magnifierPos.y * magnifierZoom - 100)}px`,
                filter: adjustedFilter
              }}
            />
            {/* Center target crosshair */}
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '10px',
                height: '10px',
                border: '1px solid rgba(0, 242, 254, 0.8)',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%'
              }}
            />
            <div 
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.85)',
                color: 'var(--accent-cyan)',
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              AI NÉT {magnifierZoom}X
            </div>
          </div>
        )}

        {/* SPLIT DIVIDER & HANDLE */}
        {viewMode === 'split' && (
          <div 
            className="slider-divider"
            style={{ left: `${sliderPos}%` }}
          >
            <div 
              className="slider-handle"
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDragging(true);
              }}
              title="Kéo thanh trượt Before / After"
            >
              <MoveHorizontal size={18} />
            </div>

            {/* Micro badges above handle */}
            <div
              style={{
                position: 'absolute',
                top: 'calc(50% - 46px)',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                userSelect: 'none'
              }}
            >
              <span
                style={{
                  background: isReversed ? 'rgba(0, 242, 254, 0.95)' : 'rgba(15, 23, 42, 0.92)',
                  color: isReversed ? '#050811' : '#e2e8f0',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
                  border: isReversed ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.15)'
                }}
              >
                {isReversed ? '◂ SAU (AI NÉT)' : '◂ TRƯỚC (GỐC)'}
              </span>

              <span
                style={{
                  background: isReversed ? 'rgba(15, 23, 42, 0.92)' : 'rgba(0, 242, 254, 0.95)',
                  color: isReversed ? '#e2e8f0' : '#050811',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
                  border: isReversed ? '1px solid rgba(255,255,255,0.15)' : '1px solid #00f2fe'
                }}
              >
                {isReversed ? 'TRƯỚC (GỐC) ▸' : 'SAU (AI NÉT) ▸'}
              </span>
            </div>
          </div>
        )}

        {/* Floating Badges */}
        {viewMode === 'split' && (
          <>
            <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 30, pointerEvents: 'none' }}>
              {leftLabel}
            </div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 30, pointerEvents: 'none' }}>
              {rightLabel}
            </div>
          </>
        )}

        {viewMode === 'magnifier' && (
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 30, pointerEvents: 'none' }}>
            <div className="badge-tag badge-cyan" style={{ background: 'rgba(10, 15, 29, 0.92)', padding: '6px 14px' }}>
              <Search size={14} /> KÍNH LÚP SOI CHI TIẾT: Rê chuột để phóng to vùng AI nét 4K
            </div>
          </div>
        )}

        {/* Bottom Guide Hint */}
        <div 
          style={{
            position: 'absolute',
            bottom: '12px',
            zIndex: 30,
            pointerEvents: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.75rem',
            background: 'rgba(0,0,0,0.65)',
            padding: '5px 14px',
            borderRadius: '999px',
            backdropFilter: 'blur(4px)'
          }}
        >
          {viewMode === 'split' && `Kéo thanh trượt để so sánh • Bên ${isReversed ? 'Trái: SAU (AI Nét)' : 'Trái: TRƯỚC (Gốc)'}`}
          {viewMode === 'side' && 'Chế độ Song Song: 2 khung hình cuộn và phóng to đồng bộ'}
          {viewMode === 'magnifier' && 'Chế độ Kính Lúp: Di chuyển chuột trên ảnh để soi độ nét từng pixel'}
          {viewMode === 'before' && 'Đang xem: Ảnh Gốc'}
          {viewMode === 'after' && 'Đang xem: Ảnh Đã Nâng Cấp AI'}
        </div>
      </div>
    </div>
  );
}
