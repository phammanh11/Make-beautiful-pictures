import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Crop, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Check, 
  X, 
  RotateCcw as ResetIcon, 
  Sliders, 
  Sparkles,
  Maximize2
} from 'lucide-react';

export default function ImageEditorModal({ isOpen, onClose, imageItem, onApply }) {
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('free'); // 'free', '1:1', '4:5', '16:9', '9:16', '3:2'
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 }); // In percentages (0-100)
  const [brightness, setBrightness] = useState(100); // 50-150
  const [contrast, setContrast] = useState(100);   // 50-150
  const [saturation, setSaturation] = useState(100); // 0-200

  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState(null); // 'move' | 'nw' | 'ne' | 'se' | 'sw'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setAspectRatio('free');
      setCrop({ x: 0, y: 0, width: 100, height: 100 });
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
    }
  }, [isOpen, imageItem]);

  const handleApplyCropRatio = (ratio) => {
    setAspectRatio(ratio);
    if (!imageItem) return;

    if (ratio === 'free') {
      setCrop({ x: 0, y: 0, width: 100, height: 100 });
      return;
    }

    const [rw, rh] = ratio.split(':').map(Number);
    const targetAspect = rw / rh;
    
    // Tỉ lệ hiện tại của ảnh gốc (tính cả rotation)
    const isRotated = rotation === 90 || rotation === 270;
    const imgW = isRotated ? imageItem.height : imageItem.width;
    const imgH = isRotated ? imageItem.width : imageItem.height;
    const currentAspect = imgW / imgH;

    let newW = 100;
    let newH = 100;

    if (currentAspect > targetAspect) {
      // Ảnh rộng hơn tỉ lệ mục tiêu -> giảm width
      newW = (targetAspect / currentAspect) * 100;
      newH = 100;
    } else {
      // Ảnh cao hơn tỉ lệ mục tiêu -> giảm height
      newW = 100;
      newH = (currentAspect / targetAspect) * 100;
    }

    const newX = (100 - newW) / 2;
    const newY = (100 - newH) / 2;
    setCrop({ x: Math.max(0, newX), y: Math.max(0, newY), width: newW, height: newH });
  };

  const handleMouseDown = (e, handle) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop({ ...crop });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    setCrop(() => {
      let { x, y, width, height } = initialCrop;

      if (dragHandle === 'move') {
        let newX = x + dx;
        let newY = y + dy;
        newX = Math.max(0, Math.min(100 - width, newX));
        newY = Math.max(0, Math.min(100 - height, newY));
        return { x: newX, y: newY, width, height };
      }

      if (dragHandle === 'se') {
        let newW = Math.max(15, Math.min(100 - x, width + dx));
        let newH = Math.max(15, Math.min(100 - y, height + dy));
        return { x, y, width: newW, height: newH };
      }

      if (dragHandle === 'sw') {
        let newW = Math.max(15, width - dx);
        let newX = Math.max(0, x + (width - newW));
        let newH = Math.max(15, Math.min(100 - y, height + dy));
        return { x: newX, y, width: newW, height: newH };
      }

      if (dragHandle === 'ne') {
        let newW = Math.max(15, Math.min(100 - x, width + dx));
        let newH = Math.max(15, height - dy);
        let newY = Math.max(0, y + (height - newH));
        return { x, y: newY, width: newW, height: newH };
      }

      if (dragHandle === 'nw') {
        let newW = Math.max(15, width - dx);
        let newX = Math.max(0, x + (width - newW));
        let newH = Math.max(15, height - dy);
        let newY = Math.max(0, y + (height - newH));
        return { x: newX, y, width: newW, height: newH };
      }

      return initialCrop;
    });
  }, [isDragging, dragHandle, dragStart, initialCrop]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleApplyChanges = () => {
    if (!imageItem) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Tạo canvas trung gian để xoay/lật/chỉnh màu
      const isRotated = rotation === 90 || rotation === 270;
      const transW = isRotated ? img.height : img.width;
      const transH = isRotated ? img.width : img.height;

      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = transW;
      fullCanvas.height = transH;
      const ctx = fullCanvas.getContext('2d');

      // Tinh chỉnh màu sơ bộ
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

      // Biến đổi hệ quy chiếu
      ctx.translate(transW / 2, transH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      // 2. Cắt cúp crop từ fullCanvas
      const cropPixelX = Math.round((crop.x / 100) * transW);
      const cropPixelY = Math.round((crop.y / 100) * transH);
      const cropPixelW = Math.round((crop.width / 100) * transW);
      const cropPixelH = Math.round((crop.height / 100) * transH);

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropPixelW;
      croppedCanvas.height = cropPixelH;
      const cropCtx = croppedCanvas.getContext('2d');

      cropCtx.drawImage(
        fullCanvas,
        cropPixelX, cropPixelY, cropPixelW, cropPixelH,
        0, 0, cropPixelW, cropPixelH
      );

      // 3. Xuất file kết quả
      croppedCanvas.toBlob((blob) => {
        if (!blob) return;
        const newFileName = `edited_${imageItem.name.replace(/\.[^/.]+$/, "")}.png`;
        const newFile = new File([blob], newFileName, { type: 'image/png' });
        const newPreviewUrl = URL.createObjectURL(blob);

        onApply({
          file: newFile,
          previewUrl: newPreviewUrl,
          width: cropPixelW,
          height: cropPixelH,
          name: newFileName,
          size: blob.size,
          sizeHuman: (blob.size / 1024).toFixed(1) + ' KB'
        });
        onClose();
      }, 'image/png', 1.0);
    };

    img.src = imageItem.previewUrl;
  };

  if (!isOpen || !imageItem) return null;

  const ratios = [
    { id: 'free', label: 'Tự do' },
    { id: '1:1', label: '1:1 (Vuông)' },
    { id: '4:5', label: '4:5 (Chân dung)' },
    { id: '16:9', label: '16:9 (Màn hình)' },
    { id: '9:16', label: '9:16 (Story/Reel)' },
    { id: '3:2', label: '3:2 (Nhiếp ảnh)' },
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
          maxWidth: '1100px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Modal Header */}
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
            <div style={{ 
              background: 'rgba(6, 182, 212, 0.15)', 
              color: 'var(--accent-cyan)', 
              padding: '8px', 
              borderRadius: '10px',
              display: 'flex'
            }}>
              <Crop size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
                Bộ Công Cụ Cắt Cúp & Chuẩn Bị Ảnh (Pre-processing Studio)
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Cắt tỉ lệ, xoay lật và chỉnh sáng tối trước khi đưa qua mô hình AI Super-Resolution
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Editor Canvas & Tools */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', flex: 1, minHeight: 0 }}>
          {/* Main Visual Stage */}
          <div 
            style={{
              padding: '24px',
              background: '#04060a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              userSelect: 'none'
            }}
          >
            <div 
              ref={containerRef}
              style={{
                position: 'relative',
                maxWidth: '100%',
                maxHeight: '520px',
                display: 'inline-block',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }}
            >
              {/* Target Image with CSS filters for preview */}
              <img
                ref={imageRef}
                src={imageItem.previewUrl}
                alt="Source for editing"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '520px',
                  objectFit: 'contain',
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease, filter 0.2s ease'
                }}
              />

              {/* Crop Overlay Darkening */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.55)',
                  pointerEvents: 'none'
                }}
              />

              {/* Crop Box Window */}
              <div
                style={{
                  position: 'absolute',
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                  border: '2px solid var(--accent-cyan)',
                  cursor: 'move',
                  boxSizing: 'border-box'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
              >
                {/* Rule of Thirds Grid Lines */}
                <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', background: 'rgba(255, 255, 255, 0.25)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', background: 'rgba(255, 255, 255, 0.25)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', background: 'rgba(255, 255, 255, 0.25)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', background: 'rgba(255, 255, 255, 0.25)', pointerEvents: 'none' }} />

                {/* 4 Corner Resize Handles */}
                <div 
                  onMouseDown={(e) => handleMouseDown(e, 'nw')}
                  style={{ position: 'absolute', top: -5, left: -5, width: 12, height: 12, background: '#fff', border: '2px solid var(--accent-cyan)', cursor: 'nwse-resize' }} 
                />
                <div 
                  onMouseDown={(e) => handleMouseDown(e, 'ne')}
                  style={{ position: 'absolute', top: -5, right: -5, width: 12, height: 12, background: '#fff', border: '2px solid var(--accent-cyan)', cursor: 'nesw-resize' }} 
                />
                <div 
                  onMouseDown={(e) => handleMouseDown(e, 'se')}
                  style={{ position: 'absolute', bottom: -5, right: -5, width: 12, height: 12, background: '#fff', border: '2px solid var(--accent-cyan)', cursor: 'nwse-resize' }} 
                />
                <div 
                  onMouseDown={(e) => handleMouseDown(e, 'sw')}
                  style={{ position: 'absolute', bottom: -5, left: -5, width: 12, height: 12, background: '#fff', border: '2px solid var(--accent-cyan)', cursor: 'nesw-resize' }} 
                />
              </div>
            </div>
          </div>

          {/* Right Toolbar Panel */}
          <div 
            style={{
              padding: '20px',
              borderLeft: '1px solid var(--border-subtle)',
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflowY: 'auto'
            }}
          >
            {/* 1. Tỉ lệ khung hình (Aspect Ratio) */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                1. Tỉ lệ cắt cúp (Aspect Ratio)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {ratios.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleApplyCropRatio(r.id)}
                    style={{
                      background: aspectRatio === r.id ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${aspectRatio === r.id ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      color: aspectRatio === r.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Xoay & Lật (Transform) */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                2. Xoay & Lật khung hình
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <button
                  onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                  title="Xoay trái 90°"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Xoay phải 90°"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={() => setFlipH(!flipH)}
                  title="Lật ngang (Horizontal)"
                  style={{
                    background: flipH ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${flipH ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    color: flipH ? 'var(--accent-cyan)' : '#fff',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FlipHorizontal size={16} />
                </button>
                <button
                  onClick={() => setFlipV(!flipV)}
                  title="Lật dọc (Vertical)"
                  style={{
                    background: flipV ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${flipV ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    color: flipV ? 'var(--accent-cyan)' : '#fff',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FlipVertical size={16} />
                </button>
              </div>
            </div>

            {/* 3. Tinh chỉnh màu sơ bộ (Color Adjustments) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Cân bằng sơ bộ
                </label>
                <button
                  onClick={() => {
                    setBrightness(100);
                    setContrast(100);
                    setSaturation(100);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  Đặt lại
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Độ sáng (Brightness)</span>
                    <span className="font-mono" style={{ color: '#fff' }}>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="140"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tương phản (Contrast)</span>
                    <span className="font-mono" style={{ color: '#fff' }}>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="140"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Độ tươi màu (Saturation)</span>
                    <span className="font-mono" style={{ color: '#fff' }}>{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="180"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                </div>
              </div>
            </div>

            {/* Estimated Resolution Box */}
            <div 
              style={{
                marginTop: 'auto',
                padding: '12px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}
            >
              <div>Độ phân giải sau cắt (ước tính):</div>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.85rem', marginTop: '2px' }}>
                {Math.round((crop.width / 100) * (rotation % 180 !== 0 ? imageItem.height : imageItem.width))} × {Math.round((crop.height / 100) * (rotation % 180 !== 0 ? imageItem.width : imageItem.height))} px
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
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
          <button
            onClick={() => {
              setRotation(0);
              setFlipH(false);
              setFlipV(false);
              setAspectRatio('free');
              setCrop({ x: 0, y: 0, width: 100, height: 100 });
              setBrightness(100);
              setContrast(100);
              setSaturation(100);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ResetIcon size={14} /> Khôi phục ảnh gốc
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleApplyChanges}
              className="btn-studio-primary"
              style={{
                borderRadius: '10px',
                padding: '8px 20px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Check size={16} /> Áp dụng thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
