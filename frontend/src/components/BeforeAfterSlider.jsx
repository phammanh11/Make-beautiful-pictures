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
  Download
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
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'before' | 'after'
  const [isReversed, setIsReversed] = useState(true); // true: Trái = SAU (Nét), Phải = TRƯỚC (Gốc)
  
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
  }, [isDragging, isPanning, startPan, handleMove]);

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
    if (e.target.closest('.control-bar')) return;
    
    // Middle click or Alt key for panning
    if (e.button === 1 || e.altKey || zoom > 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else {
      setIsDragging(true);
      handleMove(e.clientX);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSliderPos(50);
  };

  // Determine which image is top (left) and bottom (right)
  const leftImage = isReversed ? upscaledUrl : originalUrl;
  const rightImage = isReversed ? originalUrl : upscaledUrl;

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
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <Sparkles size={14} /> Đã AI Super-Resolution
          </button>

          {/* Swap sides button */}
          <button
            onClick={() => setIsReversed(!isReversed)}
            title="Đổi chiều vị trí Trước / Sau (Swap Sides)"
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
        </div>

        {/* Zoom & Reset Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

          {onDownload && (
            <button
              onClick={onDownload}
              className="glow-btn"
              style={{
                padding: '7px 16px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={15} /> Tải Ảnh Nét ({upscaledInfo?.format || 'PNG'})
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas / Split Slider */}
      <div 
        ref={containerRef}
        className="slider-container"
        onMouseDown={handleContainerMouseDown}
        style={{
          width: '100%',
          height: '560px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#06080e',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 20px 40px -15px rgba(0,0,0,0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
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
          {/* RIGHT / BOTTOM Layer Image */}
          <img
            src={viewMode === 'before' ? originalUrl : viewMode === 'after' ? upscaledUrl : rightImage}
            alt="Base Layer"
            style={{
              position: 'absolute',
              maxWidth: '92%',
              maxHeight: '92%',
              objectFit: 'contain'
            }}
          />

          {/* LEFT / TOP Layer Image with Clip Path (Reveals Left Side) */}
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
                  objectFit: 'contain'
                }}
              />
            </div>
          )}
        </div>

        {/* Draggable Divider Line & Handle (Active only in split mode) */}
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
              title="Kéo sang phải để mở rộng ảnh Nét (Sau) • Kéo sang trái để xem ảnh Gốc (Trước)"
            >
              <MoveHorizontal size={18} />
            </div>

            {/* Micro badges directly above the handle indicating sides */}
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
        {viewMode === 'split' ? (
          <>
            <div 
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 30,
                pointerEvents: 'none'
              }}
            >
              {leftLabel}
            </div>

            <div 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 30,
                pointerEvents: 'none'
              }}
            >
              {rightLabel}
            </div>
          </>
        ) : (
          <div 
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              zIndex: 30,
              pointerEvents: 'none'
            }}
          >
            {viewMode === 'before' ? (
              <div className="badge-tag" style={{ background: 'rgba(15, 23, 42, 0.88)', color: '#e2e8f0', padding: '6px 12px' }}>
                ĐANG XEM: ẢNH GỐC ({originalInfo?.width} × {originalInfo?.height})
              </div>
            ) : (
              <div className="badge-tag badge-cyan" style={{ background: 'rgba(10, 15, 29, 0.92)', padding: '6px 14px' }}>
                <Sparkles size={14} />
                ĐANG XEM: ĐÃ AI NÉT 4K/8K ({upscaledInfo?.width} × {upscaledInfo?.height})
              </div>
            )}
          </div>
        )}

        {/* Guide hint at the bottom */}
        <div 
          style={{
            position: 'absolute',
            bottom: '12px',
            zIndex: 30,
            pointerEvents: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.75rem',
            background: 'rgba(0,0,0,0.6)',
            padding: '5px 14px',
            borderRadius: '999px',
            backdropFilter: 'blur(4px)'
          }}
        >
          Kéo thanh trượt để so sánh độ nét • Bên {isReversed ? 'Trái: SAU (Nét)' : 'Trái: TRƯỚC (Gốc)'}
        </div>
      </div>
    </div>
  );
}
