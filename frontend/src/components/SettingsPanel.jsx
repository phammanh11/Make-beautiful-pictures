import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  Sliders, 
  Zap, 
  CheckCircle2, 
  HelpCircle,
  FileImage,
  Scan,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  UserCheck,
  SlidersHorizontal,
  Smile
} from 'lucide-react';

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  currentImage,
  onStartUpscale,
  isProcessing,
  systemInfo,
  autoDetectEnabled = true,
  onToggleAutoDetect,
  isScanningImage = false,
  detectionResult = null
}) {
  const [showManual, setShowManual] = useState(false);
  const [showProTuning, setShowProTuning] = useState(false);

  const presets = [
    { id: '1080p', name: 'Full HD 1080p', desc: '1920 × 1080 (Tiêu chuẩn nét)', badge: 'Phổ biến' },
    { id: '2k', name: '2K QHD', desc: '2560 × 1440 (Màn hình 2K)', badge: null },
    { id: '4k', name: '4K Ultra HD', desc: '3840 × 2160 (Siêu nét chi tiết cao)', badge: 'Khuyên dùng' },
    { id: '8k', name: '8K Extreme', desc: '7680 × 4320 (In ấn & Cỡ lớn)', badge: 'Siêu phân giải' },
    { id: '2x', name: 'Scale 2X Gốc', desc: 'Nhân đôi kích thước gốc', badge: null },
    { id: '4x', name: 'Scale 4X Gốc', desc: 'Nhân 4 lần kích thước gốc', badge: null },
  ];

  const models = [
    {
      id: 'realesrgan-x4plus',
      name: 'Ảnh Chụp & Phong Cảnh (General)',
      desc: 'Tái tạo chi tiết da, tóc, vân vải, cây cối, đồ vật chân thực.',
      tag: 'Best for Photos'
    },
    {
      id: 'realesrgan-x4plus-anime',
      name: 'Tranh Vẽ & Anime 2D',
      desc: 'Khử răng cưa, làm mịn mảng màu và nét line vẽ hoạt hình.',
      tag: 'Best for 2D/Anime'
    },
    {
      id: 'realesr-animevideov3-x4',
      name: 'Anime Video v3 (Tốc Độ)',
      desc: 'Mô hình siêu nhẹ, xử lý cực nhanh.',
      tag: 'Fast'
    }
  ];

  const getEstimatedOutput = () => {
    if (!currentImage) return 'Chưa chọn ảnh';
    const { width, height } = currentImage;
    const aspect = width / height;

    if (settings.preset === '1080p') {
      const w = width >= height ? 1920 : Math.round(1920 * aspect);
      const h = width >= height ? Math.round(1920 / aspect) : 1920;
      return `${w} × ${h} px (${((w * h) / 1000000).toFixed(1)} MP • 1080p)`;
    } else if (settings.preset === '2k') {
      const w = width >= height ? 2560 : Math.round(2560 * aspect);
      const h = width >= height ? Math.round(2560 / aspect) : 2560;
      return `${w} × ${h} px (${((w * h) / 1000000).toFixed(1)} MP • 2K)`;
    } else if (settings.preset === '4k') {
      const w = width >= height ? 3840 : Math.round(3840 * aspect);
      const h = width >= height ? Math.round(3840 / aspect) : 3840;
      return `${w} × ${h} px (${((w * h) / 1000000).toFixed(1)} MP • 4K UHD)`;
    } else if (settings.preset === '8k') {
      const w = width >= height ? 7680 : Math.round(7680 * aspect);
      const h = width >= height ? Math.round(7680 / aspect) : 7680;
      return `${w} × ${h} px (${((w * h) / 1000000).toFixed(1)} MP • 8K)`;
    } else if (settings.preset === '2x') {
      return `${width * 2} × ${height * 2} px (${((width * 2 * height * 2) / 1000000).toFixed(1)} MP)`;
    } else if (settings.preset === '4x') {
      return `${width * 4} × ${height * 4} px (${((width * 4 * height * 4) / 1000000).toFixed(1)} MP)`;
    }
    return `${width * 4} × ${height * 4} px`;
  };

  return (
    <div 
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px',
        borderRadius: '16px',
        width: '100%'
      }}
    >
      {/* 1. Target Resolution */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1. Mục tiêu độ phân giải
          </label>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
            Preset: {settings.preset.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {presets.map((p) => {
            const isActive = settings.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`preset-btn ${isActive ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ preset: p.id })}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 600, color: isActive ? '#fff' : 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                  {p.badge && (
                    <span 
                      style={{ 
                        fontSize: '0.65rem', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        background: isActive ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                        color: isActive ? '#050811' : '#94a3b8',
                        fontWeight: 700
                      }}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: isActive ? '#93c5fd' : 'var(--text-muted)' }}>
                  {p.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Model Selection */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            2. Mô hình AI Deep Learning
          </label>
          <span 
            className="badge-tag badge-cyan font-mono" 
            style={{ fontSize: '0.68rem', padding: '2px 8px' }}
          >
            TỰ ĐỘNG 100%
          </span>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(121, 40, 202, 0.12) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 20px -5px rgba(0, 242, 254, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{ 
                width: '26px', 
                height: '26px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #00f2fe, #7928ca)', 
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)'
              }}
            >
              <Sparkles size={14} />
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
              TỰ ĐỘNG QUÉT & TỐI ƯU MÔ HÌNH
            </span>
          </div>

          {isScanningImage ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>
              <Scan size={16} className="pulse-dot" />
              <span>AI đang quét cấu trúc, nét vẽ và dải màu của ảnh...</span>
            </div>
          ) : detectionResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>
                  ✨ {detectionResult.label}
                </span>
                <span className="badge-tag badge-emerald font-mono" style={{ fontSize: '0.72rem' }}>
                  {detectionResult.confidence}% Chính xác
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {detectionResult.reason}
              </p>

              {detectionResult.tags && detectionResult.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}>
                  {detectionResult.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: tag.includes('người') 
                          ? 'rgba(121, 40, 202, 0.25)' 
                          : tag.includes('cảnh') 
                          ? 'rgba(0, 242, 254, 0.2)' 
                          : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${
                          tag.includes('người')
                            ? 'rgba(121, 40, 202, 0.5)'
                            : tag.includes('cảnh')
                            ? 'rgba(0, 242, 254, 0.4)'
                            : 'rgba(255, 255, 255, 0.15)'
                        }`,
                        color: tag.includes('người') ? '#c084fc' : tag.includes('cảnh') ? '#38bdf8' : '#cbd5e1'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  marginTop: '4px', 
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  color: '#34d399', 
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                <Check size={14} />
                <span>
                  Đã tự động chọn: <strong>{models.find(m => m.id === settings.model)?.name || settings.model}</strong>
                </span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Khi bạn tải ảnh lên, AI sẽ tự động phân tích và kích hoạt mô hình Real-ESRGAN phù hợp nhất, không cần chọn thủ công.
            </p>
          )}

          <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.73rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 0'
              }}
            >
              {showManual ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <span>{showManual ? 'Ẩn danh sách chọn thủ công' : 'Tùy chỉnh chọn mô hình thủ công (nếu muốn)'}</span>
            </button>

            {showManual && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {models.map((m) => {
                  const isActive = settings.model === m.id;
                  const isAutoRec = detectionResult && detectionResult.recommended_model === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => onUpdateSettings({ model: m.id })}
                      style={{
                        background: isActive ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isActive ? '#fff' : 'var(--text-primary)' }}>
                            {m.name}
                          </span>
                          {isAutoRec && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(0, 242, 254, 0.2)', color: '#00f2fe', fontWeight: 700 }}>
                              AI CHỌN
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {m.desc}
                        </span>
                      </div>
                      <div 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%',
                          border: `2px solid ${isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tinh Chỉnh Nâng Cao & Pro Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            3. Tinh chỉnh & Xuất file
          </label>
          <button
            type="button"
            onClick={() => setShowProTuning(!showProTuning)}
            style={{
              background: showProTuning ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showProTuning ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
              color: showProTuning ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
          >
            <SlidersHorizontal size={12} />
            <span>{showProTuning ? 'Thu gọn Pro Controls' : 'Mở Pro Controls'}</span>
          </button>
        </div>

        {/* AI Face Restoration Feature Card (Always visible prominently) */}
        <div
          style={{
            background: settings.enhance_face 
              ? 'linear-gradient(135deg, rgba(121, 40, 202, 0.2) 0%, rgba(0, 242, 254, 0.15) 100%)' 
              : 'rgba(0, 0, 0, 0.25)',
            border: `1px solid ${settings.enhance_face ? 'rgba(0, 242, 254, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: settings.enhance_face ? 'linear-gradient(135deg, #00f2fe, #7928ca)' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <UserCheck size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: settings.enhance_face ? '#fff' : 'var(--text-secondary)' }}>
                  Phục Hồi Khuôn Mặt AI (GFPGAN v1.4)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Tái tạo mắt, răng, biểu cảm & mịn da tự nhiên
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.enhance_face)}
              onChange={(e) => onUpdateSettings({ enhance_face: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>

          {settings.enhance_face && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Độ nét khuôn mặt (Face Strength):</span>
                <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {Math.round((settings.face_strength ?? 0.85) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.face_strength ?? 0.85}
                onChange={(e) => onUpdateSettings({ face_strength: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>

        {/* Basic Sharpening Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#fff' }}>
              Tăng cường vi chi tiết (Unsharp Mask)
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Làm rõ nét đường viền mắt, tóc và chất liệu
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.enhance_sharpness}
            onChange={(e) => onUpdateSettings({ enhance_sharpness: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
        </div>

        {/* PRO TUNING PANEL (Collapsible) */}
        {showProTuning && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 700 }}>
              <Sliders size={14} />
              <span>BẢNG ĐIỀU CHỈNH CHUYÊN SÂU (PRO TUNING)</span>
            </div>

            {/* Sharpening Strength Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Độ sắc nét AI (Sharpening):</span>
                <span className="font-mono" style={{ color: '#00f2fe', fontWeight: 700 }}>
                  {settings.sharpen_percent ?? 120}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="10"
                value={settings.sharpen_percent ?? 120}
                onChange={(e) => onUpdateSettings({ sharpen_percent: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
            </div>

            {/* Micro-detail Blending Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Chi tiết vi mô (Detail Blend):</span>
                <span className="font-mono" style={{ color: '#c084fc', fontWeight: 700 }}>
                  {Math.round((settings.detail_blend ?? 0.40) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.detail_blend ?? 0.40}
                onChange={(e) => onUpdateSettings({ detail_blend: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#c084fc', cursor: 'pointer' }}
              />
            </div>

            {/* Tile Size Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Kích thước khối (Tile Size):</span>
                <span className="font-mono" style={{ color: '#34d399', fontWeight: 700 }}>
                  {settings.tile_size ?? 100} px
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                step="50"
                value={settings.tile_size ?? 100}
                onChange={(e) => onUpdateSettings({ tile_size: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                100px: Tối ưu cho Intel Iris Xe • 200–400px: Cho card đồ họa rời (Nvidia/AMD)
              </span>
            </div>
          </div>
        )}

        {/* Output Format */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#fff' }}>
            Định dạng xuất
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['png', 'webp', 'jpg'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => onUpdateSettings({ output_format: fmt })}
                style={{
                  background: settings.output_format === fmt ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${settings.output_format === fmt ? 'var(--accent-cyan)' : 'transparent'}`,
                  color: settings.output_format === fmt ? '#00f2fe' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Preview Box */}
      {currentImage && (
        <div 
          style={{
            background: 'rgba(0, 242, 254, 0.05)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kích thước gốc:</span>
            <span className="font-mono" style={{ fontSize: '0.78rem', color: '#fff' }}>
              {currentImage.width} × {currentImage.height} px ({currentImage.sizeHuman})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dự kiến sau khi AI nâng cấp:</span>
            <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {getEstimatedOutput()}
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        className="glow-btn"
        onClick={onStartUpscale}
        disabled={!currentImage || isProcessing}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          letterSpacing: '0.02em'
        }}
      >
        <Sparkles size={18} />
        {isProcessing ? 'ĐANG XỬ LÝ AI SIÊU PHÂN GIẢI...' : 'BẮT ĐẦU NÂNG CẤP HÌNH ẢNH'}
      </button>

      {/* Hardware Status Footer */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
          <span>GPU: Intel Iris Xe (Vulkan & DirectML)</span>
        </div>
        <span className="font-mono">Tiling {settings.tile_size ?? 100}px • GFPGAN Active</span>
      </div>
    </div>
  );
}
