import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Trash2, 
  Plus, 
  Archive,
  RefreshCw,
  Eye,
  FileImage
} from 'lucide-react';

export default function BatchProcessingView({ 
  settings, 
  onLoadSingleItem, 
  onHistoryUpdated 
}) {
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFilesAdded = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newItems = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file: file,
      name: file.name,
      size: file.size,
      sizeHuman: formatBytes(file.size),
      previewUrl: URL.createObjectURL(file),
      status: 'pending', // 'pending' | 'processing' | 'done' | 'error'
      error: null,
      result: null
    }));

    setQueue(prev => [...prev, ...newItems]);
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const handleRemoveItem = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleClearQueue = () => {
    if (isProcessing) return;
    setQueue([]);
    setCurrentIndex(-1);
  };

  const handleStartBatch = async () => {
    if (isProcessing || queue.length === 0) return;

    setIsProcessing(true);
    const updatedQueue = [...queue];

    for (let i = 0; i < updatedQueue.length; i++) {
      if (updatedQueue[i].status === 'done') continue;

      setCurrentIndex(i);
      setQueue(prev => {
        const next = [...prev];
        next[i] = { ...next[i], status: 'processing' };
        return next;
      });

      const item = updatedQueue[i];
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('model', settings.model || 'realesrgan-x4plus');
      formData.append('preset', settings.preset || '4k');
      formData.append('tile_size', settings.tile_size ?? 100);
      formData.append('enhance_sharpness', settings.enhance_sharpness ?? true);
      formData.append('sharpen_percent', settings.sharpen_percent ?? 120);
      formData.append('detail_blend', settings.detail_blend ?? 0.40);
      formData.append('enhance_face', settings.enhance_face ?? false);
      formData.append('face_strength', settings.face_strength ?? 0.85);
      formData.append('enable_clahe', settings.enable_clahe ?? false);
      formData.append('enable_denoise', settings.enable_denoise ?? false);
      formData.append('output_format', settings.output_format || 'png');
      formData.append('gpu_id', 0);

      try {
        const res = await fetch('/api/upscale', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.detail || 'Lỗi xử lý AI');
        }

        setQueue(prev => {
          const next = [...prev];
          next[i] = {
            ...next[i],
            status: 'done',
            result: data.data
          };
          return next;
        });
      } catch (err) {
        console.error('Lỗi khi upscale file:', item.name, err);
        setQueue(prev => {
          const next = [...prev];
          next[i] = {
            ...next[i],
            status: 'error',
            error: err.message || 'Lỗi xử lý'
          };
          return next;
        });
      }
    }

    setIsProcessing(false);
    setCurrentIndex(-1);
    if (onHistoryUpdated) onHistoryUpdated();
  };

  const handleDownloadAllZip = async () => {
    const doneItems = queue.filter(item => item.status === 'done' && item.result);
    if (doneItems.length === 0) return;

    setIsDownloadingZip(true);
    try {
      const jobIds = doneItems.map(item => item.result.job_id);
      const res = await fetch('/api/history/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_ids: jobIds })
      });

      if (!res.ok) throw new Error('Không thể tạo file ZIP');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_upscaled_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Lỗi khi tải ZIP hàng loạt:', e);
      alert('Không thể tạo file nén ZIP.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const completedCount = queue.filter(item => item.status === 'done').length;
  const progressPercent = queue.length > 0 ? Math.round((completedCount / queue.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*, .heic, .heif, .tiff, .tif, .avif"
        onChange={(e) => {
          if (e.target.files) handleFilesAdded(e.target.files);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />

      {/* Top Banner / Dropzone */}
      <div
        className="glass-panel"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '16px',
          padding: queue.length === 0 ? '48px 24px' : '24px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragOver ? 'rgba(0, 242, 254, 0.05)' : 'var(--bg-card)',
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: queue.length === 0 ? '60px' : '44px',
            height: queue.length === 0 ? '60px' : '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(121, 40, 202, 0.2))',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)'
          }}
        >
          <UploadCloud size={queue.length === 0 ? 28 : 22} />
        </div>

        <div>
          <h3 style={{ fontSize: queue.length === 0 ? '1.25rem' : '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
            {queue.length === 0 ? 'Kéo thả nhiều ảnh để xử lý hàng loạt' : 'Thêm ảnh khác vào hàng đợi'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Chọn 10, 20 hoặc 50 ảnh cùng lúc. Hệ thống sẽ tự động nâng cấp lần lượt qua GPU Intel Iris Xe chống tràn RAM.
          </p>
        </div>

        <button
          type="button"
          className="glow-btn"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          style={{
            padding: '8px 20px',
            fontSize: '0.84rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={15} /> Chọn Thêm Ảnh (Đa File)
        </button>
      </div>

      {/* Queue Toolbar & Stats */}
      {queue.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(0, 242, 254, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
                Hàng đợi: <strong style={{ color: 'var(--accent-cyan)' }}>{queue.length} ảnh</strong>
              </span>
              <span className="badge-tag badge-emerald font-mono" style={{ fontSize: '0.75rem' }}>
                Đã xong: {completedCount} / {queue.length}
              </span>
              {isProcessing && (
                <span className="badge-tag badge-cyan font-mono" style={{ fontSize: '0.75rem' }}>
                  <RefreshCw size={12} className="spin-anim" /> Đang chạy ảnh {currentIndex + 1}/{queue.length}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleClearQueue}
                disabled={isProcessing}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isProcessing ? 0.5 : 1
                }}
              >
                <Trash2 size={13} /> Xóa hàng đợi
              </button>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isDownloadingZip}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid var(--accent-emerald)',
                    color: '#34d399',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: isDownloadingZip ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Archive size={14} />
                  {isDownloadingZip ? 'Đang nén ZIP...' : `Tải tất cả (${completedCount} ảnh ZIP)`}
                </button>
              )}

              <button
                type="button"
                className="glow-btn"
                onClick={handleStartBatch}
                disabled={isProcessing || completedCount === queue.length}
                style={{
                  padding: '8px 20px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: (isProcessing || completedCount === queue.length) ? 0.6 : 1
                }}
              >
                <Sparkles size={16} />
                {isProcessing ? `Đang xử lý ${currentIndex + 1}/${queue.length}...` : 'Bắt Đầu Nâng Cấp Tất Cả'}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #00f2fe, #3b82f6, #10b981)',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Queue Items List */}
      {queue.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {queue.map((item, idx) => {
            const isCurrent = currentIndex === idx;
            return (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  border: isCurrent 
                    ? '1px solid var(--accent-cyan)' 
                    : item.status === 'done'
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid var(--border-subtle)',
                  background: isCurrent ? 'rgba(0, 242, 254, 0.06)' : 'rgba(15, 23, 42, 0.45)'
                }}
              >
                {/* Left: Thumbnail & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '20px' }}>
                    {idx + 1}.
                  </span>

                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#050811',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span 
                      style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        color: '#fff', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        maxWidth: '280px'
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span>Gốc: {item.sizeHuman}</span>
                      {item.result && (
                        <>
                          <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>
                            {item.result.output.width} × {item.result.output.height} ({item.result.output.size_human})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Indicator & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.status === 'pending' && (
                    <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                      <Clock size={12} /> Chờ xử lý
                    </span>
                  )}

                  {item.status === 'processing' && (
                    <span className="badge-tag badge-cyan font-mono" style={{ fontSize: '0.74rem' }}>
                      <RefreshCw size={12} className="spin-anim" /> Đang nâng cấp...
                    </span>
                  )}

                  {item.status === 'done' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge-tag badge-emerald font-mono" style={{ fontSize: '0.74rem' }}>
                        <CheckCircle2 size={12} /> {item.result?.elapsed_seconds}s
                      </span>
                      {onLoadSingleItem && (
                        <button
                          type="button"
                          onClick={() => onLoadSingleItem(item.result)}
                          title="Mở trong Split-Slider để soi chi tiết"
                          style={{
                            background: 'rgba(0, 242, 254, 0.12)',
                            border: '1px solid var(--accent-cyan)',
                            color: '#00f2fe',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={13} /> Soi nét
                        </button>
                      )}
                      <a
                        href={item.result?.download_url}
                        download={item.result?.filename}
                        title="Tải ảnh này về"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fff',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none'
                        }}
                      >
                        <Download size={13} /> Tải
                      </a>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <span className="badge-tag" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: '0.74rem' }}>
                      <AlertCircle size={12} /> Lỗi
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={item.status === 'processing'}
                    title="Xóa khỏi danh sách"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: item.status === 'processing' ? 'not-allowed' : 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
