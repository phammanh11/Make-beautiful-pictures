import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';

export default function ImageDropzone({ onImageSelected, currentImage, onSelectDemo }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn file hình ảnh (PNG, JPG, WEBP).');
      return;
    }

    // Read image info
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageSelected({
          file: file,
          previewUrl: e.target.result,
          width: img.width,
          height: img.height,
          name: file.name,
          size: file.size,
          sizeHuman: formatBytes(file.size)
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        style={{ display: 'none' }}
      />

      <div
        className="glass-panel"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '16px',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragOver ? 'rgba(0, 242, 254, 0.05)' : 'var(--bg-card)',
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(121, 40, 202, 0.15) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--accent-cyan)',
            boxShadow: '0 0 24px rgba(0, 242, 254, 0.2)'
          }}
        >
          <UploadCloud size={30} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          Kéo thả ảnh cần nâng cấp vào đây
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', lineHeight: '1.5', marginBottom: '16px' }}>
          Hỗ trợ ảnh 480p, 720p, 1080p, ảnh mờ, vỡ hạt (JPG, PNG, WebP). Tự động khử nhiễu và tái tạo chi tiết 4K bằng AI.
        </p>

        <button
          type="button"
          className="glow-btn"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          style={{
            padding: '10px 22px',
            fontSize: '0.875rem'
          }}
        >
          Chọn Ảnh Từ Máy Tính
        </button>
      </div>

      {/* Quick Demo Selector */}
      {onSelectDemo && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            padding: '8px 0' 
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Hoặc thử nhanh ảnh mẫu:
          </span>
          <button
            onClick={() => onSelectDemo('photo')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={13} /> Ảnh mẫu Chân dung / Đời sống
          </button>
          <button
            onClick={() => onSelectDemo('anime')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              color: '#c084fc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ImageIcon size={13} /> Ảnh mẫu Anime / Manga 2D
          </button>
        </div>
      )}
    </div>
  );
}
