import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  Scissors, 
  Palette, 
  Crop, 
  Film, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function ImageDropzone({ 
  onImageSelected, 
  currentImage, 
  onSelectDemo,
  onOpenFeature,
  onSwitchTab
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const pendingFeatureRef = useRef(null);

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
    const isImage = file.type.startsWith('image/') || 
      /\.(jpg|jpeg|png|webp|heic|heif|tiff|tif|bmp|avif)$/i.test(file.name);
    if (!isImage) {
      alert('Vui lòng chỉ chọn file hình ảnh (PNG, JPG, WEBP, HEIC, TIFF, AVIF).');
      return;
    }

    const featureToOpen = pendingFeatureRef.current;
    pendingFeatureRef.current = null;

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
        }, featureToOpen);
      };
      img.onerror = () => {
        onImageSelected({
          file: file,
          previewUrl: e.target.result,
          width: 0,
          height: 0,
          name: file.name,
          size: file.size,
          sizeHuman: formatBytes(file.size)
        }, featureToOpen);
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

  const triggerFeature = (featureName) => {
    if (featureName === 'video') {
      if (onSwitchTab) onSwitchTab('video');
      return;
    }
    if (featureName === 'batch') {
      if (onSwitchTab) onSwitchTab('batch');
      return;
    }

    pendingFeatureRef.current = featureName;
    fileInputRef.current?.click();
  };

  const features = [
    {
      id: 'colorize',
      title: 'Tô Màu Ảnh Cổ',
      badge: 'MỚI CẬP NHẬT',
      badgeColor: '#c084fc',
      badgeBg: 'rgba(168, 85, 247, 0.2)',
      desc: 'Phục hồi màu sắc sống động cho ảnh đen trắng xưa với 5 phong cách màu nghệ thuật.',
      icon: Palette,
      color: '#c084fc',
      border: 'rgba(168, 85, 247, 0.4)',
      bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(20, 20, 35, 0.7) 100%)',
      btnText: 'Tô Màu Ngay'
    },
    {
      id: 'bg_remover',
      title: 'Tách Nền AI',
      badge: 'AI REMOVE',
      badgeColor: '#f472b6',
      badgeBg: 'rgba(236, 72, 153, 0.2)',
      desc: 'Tự động cắt chủ thể sắc nét từng sợi tóc, xuất file PNG trong suốt hoặc màu nền studio.',
      icon: Scissors,
      color: '#f472b6',
      border: 'rgba(236, 72, 153, 0.4)',
      bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(20, 20, 35, 0.7) 100%)',
      btnText: 'Tách Nền Ngay'
    },
    {
      id: 'crop',
      title: 'Cắt Cúp & Cân Tỷ Lệ',
      badge: 'STUDIO TOOL',
      badgeColor: 'var(--accent-cyan)',
      badgeBg: 'rgba(6, 182, 212, 0.2)',
      desc: 'Xoay góc, lật ảnh và cắt theo tỷ lệ chuẩn 1:1, 4:3, 16:9 trước khi upscale.',
      icon: Crop,
      color: 'var(--accent-cyan)',
      border: 'rgba(6, 182, 212, 0.4)',
      bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(20, 20, 35, 0.7) 100%)',
      btnText: 'Cắt Ảnh Ngay'
    },
    {
      id: 'video',
      title: 'Studio Video AI 4K',
      badge: 'GPU VULKAN',
      badgeColor: '#fb923c',
      badgeBg: 'rgba(251, 146, 60, 0.2)',
      desc: 'Siêu phân giải video mờ lên 1080p / 4K 60FPS sắc nét, giảm 80% dung lượng đĩa tạm.',
      icon: Film,
      color: '#fb923c',
      border: 'rgba(251, 146, 60, 0.4)',
      bg: 'linear-gradient(135deg, rgba(251, 146, 60, 0.12) 0%, rgba(20, 20, 35, 0.7) 100%)',
      btnText: 'Mở Video Studio'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*, .heic, .heif, .tiff, .tif, .avif"
        style={{ display: 'none' }}
      />

      {/* Main Upload Dropzone */}
      <div
        className="glass-panel"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          pendingFeatureRef.current = null;
          fileInputRef.current?.click();
        }}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--accent-cyan)' : 'rgba(0, 242, 254, 0.25)'}`,
          borderRadius: '16px',
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragOver ? 'rgba(0, 242, 254, 0.08)' : 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(10, 15, 29, 0.8) 100%)',
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '240px',
          boxShadow: isDragOver ? '0 0 30px rgba(0, 242, 254, 0.25)' : 'none'
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(121, 40, 202, 0.2) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            color: 'var(--accent-cyan)',
            boxShadow: '0 0 24px rgba(0, 242, 254, 0.3)'
          }}
        >
          <UploadCloud size={28} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
          Kéo thả ảnh cần nâng cấp vào đây
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '460px', lineHeight: '1.5', marginBottom: '14px' }}>
          Hỗ trợ JPG, PNG, WebP, <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>iPhone HEIC/HEIF</span>, TIFF, AVIF.
          Tự động phục hồi chi tiết, khử mờ và khử nhiễu bằng AI Vulkan.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="glow-btn"
            onClick={(e) => {
              e.stopPropagation();
              pendingFeatureRef.current = null;
              fileInputRef.current?.click();
            }}
            style={{
              padding: '10px 24px',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            Chọn Ảnh Từ Máy Tính
          </button>
          
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <span>💡 Mẹo: Nhấn</span>
            <kbd style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.3)', fontFamily: 'monospace', fontWeight: 600 }}>Ctrl + V</kbd>
            <span>để dán ảnh chụp màn hình / ảnh copy tức thì</span>
          </div>
        </div>
      </div>

      {/* Quick Demo Selector */}
      {onSelectDemo && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            flexWrap: 'wrap',
            padding: '2px 0' 
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Hoặc thử nhanh ảnh mẫu:
          </span>
          <button
            onClick={() => onSelectDemo('photo')}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '0.76rem',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={13} /> Ảnh mẫu Chân dung (GFPGAN)
          </button>
          <button
            onClick={() => onSelectDemo('anime')}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '0.76rem',
              color: '#c084fc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <ImageIcon size={13} /> Ảnh mẫu Anime 2D
          </button>
        </div>
      )}

      {/* AI CREATIVE SUITE SHOWCASE CARDS (LÀM NỔI BẬT TOÀN BỘ TÍNH NĂNG MỚI) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bộ Công Cụ AI Sáng Tạo Nổi Bật
            </h4>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Nhấp vào bất kỳ công cụ nào để chọn ảnh và sử dụng ngay
          </span>
        </div>

        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '12px' 
          }}
        >
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                onClick={() => triggerFeature(feat.id)}
                className="glass-panel"
                style={{
                  background: feat.bg,
                  border: `1px solid ${feat.border}`,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${feat.border}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: feat.badgeBg, 
                      color: feat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span 
                    style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '999px',
                      background: feat.badgeBg,
                      color: feat.badgeColor,
                      border: `1px solid ${feat.border}`
                    }}
                  >
                    {feat.badge}
                  </span>
                </div>

                <div>
                  <h5 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    {feat.title}
                  </h5>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: '1.4', minHeight: '32px' }}>
                    {feat.desc}
                  </p>
                </div>

                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: feat.color,
                    marginTop: 'auto',
                    paddingTop: '6px'
                  }}
                >
                  <span>{feat.btnText}</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
