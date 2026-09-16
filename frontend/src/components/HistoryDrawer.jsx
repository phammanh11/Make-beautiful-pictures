import React from 'react';
import { X, Download, Eye, Clock, ArrowRight, Trash2 } from 'lucide-react';

export default function HistoryDrawer({ isOpen, onClose, history, onLoadItem }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '480px',
          height: '100%',
          borderRadius: '0',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          background: 'rgba(11, 15, 25, 0.98)'
        }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
            Lịch sử nâng cấp ảnh ({history.length})
          </h3>
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

        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              Chưa có lịch sử xử lý nào. Hãy thử nâng cấp ảnh đầu tiên!
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <img
                  src={item.download_url}
                  alt={item.filename}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {item.input.width}×{item.input.height}
                    </span>
                    <ArrowRight size={12} color="#00f2fe" />
                    <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00f2fe' }}>
                      {item.output.width}×{item.output.height}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>{item.output.size_human}</span>
                    <span>•</span>
                    <span className="font-mono">{item.elapsed_seconds}s</span>
                    <span>•</span>
                    <span className="badge-tag badge-purple" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                      {item.preset_used.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    onClick={() => {
                      onLoadItem(item);
                      onClose();
                    }}
                    title="Mở trong Split-Slider"
                    style={{
                      background: 'rgba(0, 242, 254, 0.15)',
                      border: '1px solid var(--accent-cyan)',
                      borderRadius: '6px',
                      padding: '6px',
                      color: '#00f2fe',
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={15} />
                  </button>
                  <a
                    href={item.download_url}
                    download={item.filename}
                    title="Tải về"
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
