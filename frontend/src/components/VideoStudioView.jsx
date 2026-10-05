import React, { useState, useRef } from 'react';
import { 
  Video, 
  UploadCloud, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Clock, 
  Download, 
  RefreshCw, 
  Film, 
  Zap, 
  Cpu, 
  AlertCircle 
} from 'lucide-react';

export default function VideoStudioView() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [scale, setScale] = useState(2);
  const [model, setModel] = useState('realesr-animevideov3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processPercent, setProcessPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [stage, setStage] = useState('init');
  const [resultVideo, setResultVideo] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  const handleVideoSelected = async (file) => {
    if (!file || !file.type.startsWith('video/')) return;
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setResultVideo(null);
    setErrorMsg(null);
    setProcessPercent(0);

    // Lấy thông tin video từ backend
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/video/info', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.info) {
        setVideoInfo(data.info);
      }
    } catch (e) {
      console.warn('Lỗi đọc metadata video:', e);
    }
  };

  const handleStartUpscale = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setProcessPercent(0);
    setStage('init');
    setStatusMessage('Đang khởi tạo Neural Video Engine...');

    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('scale', scale);
    formData.append('model', model);
    formData.append('tile_size', 100);
    formData.append('gpu_id', 0);

    try {
      const response = await fetch('/api/video/upscale-stream', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Máy chủ trả về mã lỗi ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const event = JSON.parse(trimmed.slice(6));
              if (event.type === 'progress') {
                setProcessPercent(event.percent);
                setStage(event.stage);
                setStatusMessage(event.message);
              } else if (event.type === 'complete') {
                setProcessPercent(100);
                setStage('done');
                setResultVideo(event.data);
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Lỗi khi xử lý video');
              }
            } catch (err) {
              console.warn('Lỗi phân tích event video stream:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Lỗi siêu phân giải video:', err);
      setErrorMsg(err.message || 'Đã xảy ra lỗi trong quá trình siêu phân giải video.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div 
        className="glass-panel"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(121, 40, 202, 0.15) 0%, rgba(0, 242, 254, 0.1) 100%)',
          border: '1px solid rgba(121, 40, 202, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7928ca, #00f2fe)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 24px rgba(121, 40, 202, 0.5)'
            }}
          >
            <Film size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                AI Video Super-Resolution Studio
              </h2>
              <span className="badge-tag badge-cyan font-mono">4K 60FPS ENGINE</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Nâng cấp video 480p/720p lên Full HD & 4K sắc nét qua Real-ESRGAN Vulkan NCNN & FFmpeg
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <Zap size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>Tối ưu cho GPU Intel Iris Xe & Core i5 đa luồng</span>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div 
          className="glass-panel"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '14px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{errorMsg}</span>
          <button 
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Upload / Preview + Settings */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(340px, 1.1fr)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Video Visual Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isProcessing ? (
            /* Realtime Video Progress */
            <div 
              className="glass-panel"
              style={{
                padding: '48px 32px',
                borderRadius: '16px',
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(121, 40, 202, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(121, 40, 202, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              <div 
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #7928ca 0%, #00f2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 0 40px rgba(121, 40, 202, 0.6)',
                  animation: 'pulseDot 2s infinite ease-in-out'
                }}
              >
                <Film size={36} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  {statusMessage || 'Đang xử lý siêu phân giải video qua GPU...'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Mô hình <strong>{model}</strong> • Tỷ lệ phóng đại <strong>{scale}X</strong>
                </p>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', maxWidth: '520px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Tiến trình mã hóa video
                  </span>
                  <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {processPercent.toFixed(1)}%
                  </span>
                </div>
                <div 
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    style={{
                      height: '100%',
                      width: `${processPercent}%`,
                      background: 'linear-gradient(90deg, #7928ca, #00f2fe)',
                      borderRadius: '999px',
                      transition: 'width 0.25s ease-out',
                      boxShadow: '0 0 16px rgba(0, 242, 254, 0.8)'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : resultVideo ? (
            /* Result Video Stage */
            <div 
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge-tag badge-emerald font-mono">SIÊU PHÂN GIẢI THÀNH CÔNG</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{resultVideo.filename}</span>
                </div>
                <a
                  href={resultVideo.download_url}
                  download={resultVideo.filename}
                  className="btn-studio-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none'
                  }}
                >
                  <Download size={14} /> Tải Video Về Máy
                </a>
              </div>

              {/* Video Player */}
              <div 
                style={{
                  width: '100%',
                  background: '#000',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <video 
                  src={resultVideo.download_url}
                  controls 
                  autoPlay 
                  loop
                  style={{ width: '100%', maxHeight: '500px', display: 'block' }}
                />
              </div>

              {/* Metrics HUD for Video */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Độ phân giải gốc</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                    {resultVideo.input?.width} × {resultVideo.input?.height} px
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Độ phân giải sau AI</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    {resultVideo.output?.width} × {resultVideo.output?.height} px
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Khung hình đã xử lý</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                    {resultVideo.frames_processed} frames ({resultVideo.input?.fps} FPS)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Thời gian thực thi</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                    {resultVideo.elapsed_seconds} giây
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreviewUrl(null);
                    setResultVideo(null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    borderRadius: '10px',
                    padding: '8px 18px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={14} /> Nâng cấp video khác
                </button>
              </div>
            </div>
          ) : videoFile ? (
            /* Input Video Preview */
            <div 
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge-tag badge-cyan font-mono">ĐÃ NẠP VIDEO ĐẦU VÀO</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{videoFile.name}</span>
                </div>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreviewUrl(null);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Đổi video khác
                </button>
              </div>

              <div 
                style={{
                  width: '100%',
                  background: '#04060a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <video 
                  src={videoPreviewUrl}
                  controls 
                  style={{ width: '100%', maxHeight: '440px', display: 'block' }}
                />
              </div>

              {videoInfo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Kích thước: <strong style={{ color: '#fff' }}>{videoInfo.width} × {videoInfo.height} px</strong></span>
                  <span>Tốc độ: <strong style={{ color: '#fff' }}>{videoInfo.fps} FPS</strong></span>
                  <span>Thời lượng: <strong style={{ color: '#fff' }}>{videoInfo.duration_seconds}s ({videoInfo.total_frames} frames)</strong></span>
                  <span>Dung lượng: <strong style={{ color: '#fff' }}>{videoInfo.size_human}</strong></span>
                </div>
              )}
            </div>
          ) : (
            /* Dropzone for Video */
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="glass-panel"
              style={{
                padding: '60px 32px',
                borderRadius: '16px',
                border: '2px dashed rgba(121, 40, 202, 0.4)',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s ease',
                background: 'rgba(121, 40, 202, 0.03)'
              }}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="video/*" 
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleVideoSelected(e.target.files[0]);
                  }
                }}
              />
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(121, 40, 202, 0.2)',
                  color: 'var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <UploadCloud size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Kéo thả file Video cần nâng cấp vào đây
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Hỗ trợ định dạng MP4, MOV, AVI, WEBM. Tự động bảo toàn âm thanh gốc.
                </p>
              </div>
              <button 
                type="button"
                className="btn-studio-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '0.88rem',
                  borderRadius: '10px'
                }}
              >
                Chọn Video Từ Máy Tính
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Video Settings */}
        <div 
          className="glass-panel"
          style={{
            padding: '24px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
              1. Tỉ lệ phóng đại Video (Scale)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { s: 2, label: 'Scale 2X Gốc', desc: '720p ➔ 1440p • 1080p ➔ 4K (Khuyên dùng)' },
                { s: 4, label: 'Scale 4X Gốc', desc: 'Phóng đại cực đại chi tiết' }
              ].map(item => (
                <button
                  key={item.s}
                  onClick={() => setScale(item.s)}
                  style={{
                    background: scale === item.s ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${scale === item.s ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    color: scale === item.s ? '#00f2fe' : 'var(--text-secondary)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: scale === item.s ? '#fff' : 'inherit' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
              2. Mô hình AI Video
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'realesr-animevideov3', name: 'RealESR AnimeVideo v3 (Siêu Tốc)', desc: 'Xử lý hàng trăm frames chỉ trong vài giây, cực nhẹ trên Intel Iris Xe.' },
                { id: 'realesrgan-x4plus', name: 'Real-ESRGAN x4plus (Đời Sống Thực)', desc: 'Phục vụ video quay đời thực người, vật thể, cảnh vật.' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  style={{
                    background: model === m.id ? 'rgba(121, 40, 202, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${model === m.id ? '#a855f7' : 'var(--border-subtle)'}`,
                    color: model === m.id ? '#c084fc' : 'var(--text-secondary)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: model === m.id ? '#fff' : 'inherit' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {videoInfo && (
            <div 
              style={{
                padding: '12px',
                background: 'rgba(0, 242, 254, 0.05)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: '10px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div>Dự kiến đầu ra sau nâng cấp:</div>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>
                {videoInfo.width * scale} × {videoInfo.height * scale} px • {videoInfo.fps} FPS
              </div>
            </div>
          )}

          <button
            onClick={handleStartUpscale}
            disabled={!videoFile || isProcessing}
            className="glow-btn"
            style={{
              padding: '14px',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: (!videoFile || isProcessing) ? 'not-allowed' : 'pointer'
            }}
          >
            <Sparkles size={18} />
            {isProcessing ? 'ĐANG SIÊU PHÂN GIẢI VIDEO...' : 'BẮT ĐẦU SIÊU PHÂN GIẢI VIDEO'}
          </button>
        </div>
      </div>
    </div>
  );
}
