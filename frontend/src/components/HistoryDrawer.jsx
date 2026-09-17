import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Eye, 
  Clock, 
  ArrowRight, 
  Trash2, 
  Archive, 
  AlertCircle, 
  RefreshCw, 
  HardDrive,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export default function HistoryDrawer({ 
  isOpen, 
  onClose, 
  history, 
  storageInfo,
  onLoadItem, 
  onDeleteItem, 
  onClearAll,
  onSyncHistory
}) {
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  if (!isOpen) return null;

  const handleDownloadAllZip = async () => {
    if (!history || history.length === 0) return;
    setIsDownloadingZip(true);
    try {
      const res = await fetch('/api/history/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Không thể tải file ZIP');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'upscaled_images_all.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Lỗi khi tải ZIP:', e);
      alert('Đã xảy ra lỗi khi tạo file nén ZIP.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      if (onSyncHistory) {
        await onSyncHistory();
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleDeleteSingle = async (jobId) => {
    setDeletingId(jobId);
    try {
      await onDeleteItem(jobId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts * 1000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
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
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          height: '100%',
          borderRadius: '0',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px',
          background: 'rgba(10, 14, 23, 0.98)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Lịch sử nâng cấp ({history?.length || 0})
              </h3>
              <button
                onClick={handleManualSync}
                title="Quét lại toàn bộ ảnh trên đĩa"
                disabled={isSyncing}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: isSyncing ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem'
                }}
              >
                <RefreshCw size={12} className={isSyncing ? 'pulse-dot' : ''} />
                <span>{isSyncing ? 'Đang quét...' : 'Đồng bộ'}</span>
              </button>
            </div>

            {storageInfo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <HardDrive size={13} color="#38bdf8" />
                <span>Đang chiếm dụng: <strong style={{ color: '#38bdf8' }}>{storageInfo.total_human}</strong> ổ đĩa</span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        {history && history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleDownloadAllZip}
                disabled={isDownloadingZip}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(59, 130, 246, 0.15))',
                  border: '1px solid var(--accent-cyan)',
                  color: '#00f2fe',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flex: 1,
                  justifyContent: 'center'
                }}
              >
                {isDownloadingZip ? (
                  <>
                    <RefreshCw size={14} className="pulse-dot" /> Đang nén file...
                  </>
                ) : (
                  <>
                    <Archive size={14} /> Tải toàn bộ (.ZIP)
                  </>
                )}
              </button>

              <button
                onClick={() => setShowConfirmClear(true)}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} /> Xóa sạch & Giải phóng
              </button>
            </div>

            {/* Confirm Dialog */}
            {showConfirmClear && (
              <div 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.15)', 
                  border: '1px solid #ef4444', 
                  borderRadius: '10px', 
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={15} />
                  <span>Xóa toàn bộ <strong>{history.length} ảnh</strong> để giải phóng <strong>{storageInfo?.total_human || 'toàn bộ'}</strong> dung lượng ổ cứng?</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      onClearAll();
                      setShowConfirmClear(false);
                    }}
                    style={{
                      background: '#ef4444',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Xác nhận xóa sạch
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List of images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {!history || history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <HardDrive size={36} color="var(--border-subtle)" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Chưa có lịch sử xử lý nào.</p>
              <button
                onClick={handleManualSync}
                style={{
                  background: 'rgba(0, 242, 254, 0.1)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Quét tìm ảnh có sẵn trên ổ đĩa
              </button>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={item.job_id || idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Thumbnail */}
                <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
                  <img
                    src={item.download_url}
                    alt={item.filename}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: '#050811'
                    }}
                  />
                  {item.preset_used && (
                    <span 
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {item.preset_used.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {item.input?.width || '?'}×{item.input?.height || '?'}
                    </span>
                    <ArrowRight size={12} color="#00f2fe" />
                    <span className="font-mono" style={{ fontSize: '0.86rem', fontWeight: 700, color: '#00f2fe' }}>
                      {item.output?.width}×{item.output?.height}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{item.output?.size_human}</span>
                    <span>•</span>
                    <span className="font-mono">{item.elapsed_seconds || 0}s</span>
                    {item.created_at && (
                      <>
                        <span>•</span>
                        <span style={{ fontSize: '0.7rem' }}>{formatTimestamp(item.created_at)}</span>
                      </>
                    )}
                  </div>

                  {item.faces_restored > 0 && (
                    <span style={{ fontSize: '0.68rem', color: '#a855f7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={11} /> Phục hồi {item.faces_restored} khuôn mặt (GFPGAN)
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        onLoadItem(item);
                        onClose();
                      }}
                      title="Mở xem lại trong Before/After Slider"
                      style={{
                        background: 'rgba(0, 242, 254, 0.15)',
                        border: '1px solid var(--accent-cyan)',
                        borderRadius: '6px',
                        padding: '6px',
                        color: '#00f2fe',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Eye size={15} />
                    </button>

                    <a
                      href={item.download_url}
                      download={item.filename}
                      title="Tải ảnh này về máy"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none'
                      }}
                    >
                      <Download size={15} />
                    </a>
                  </div>

                  <button
                    onClick={() => handleDeleteSingle(item.job_id)}
                    disabled={deletingId === item.job_id}
                    title={`Xóa ảnh này khỏi đĩa (Giải phóng ${item.output?.size_human || ''})`}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '5px',
                      color: '#f87171',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {deletingId === item.job_id ? (
                      <RefreshCw size={14} className="pulse-dot" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
