import React from 'react';
import { Sparkles, Cpu, Layers, History, HelpCircle, Film } from 'lucide-react';

export default function Header({ 
  systemInfo, 
  onToggleHistory, 
  historyCount, 
  currentMode = 'single', 
  onChangeMode 
}) {
  return (
    <header
      className="glass-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        borderRadius: '16px',
        width: '100%',
        marginBottom: '24px',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '16px'
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #7928ca 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)'
          }}
        >
          <Sparkles size={24} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
              Tạo Ảnh <span style={{ color: 'var(--accent-cyan)' }}>Đẹp</span>
            </h1>
            <span 
              className="badge-tag badge-cyan font-mono" 
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
            >
              AI STUDIO
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Công Cụ AI Làm Nét & Nâng Cấp Siêu Độ Phân Giải (720p ➔ 1080p, 2K, 4K, 8K)
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      {onChangeMode && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.45)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '4px'
          }}
        >
          <button
            onClick={() => onChangeMode('single')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: currentMode === 'single' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(121, 40, 202, 0.2))' : 'transparent',
              color: currentMode === 'single' ? '#00f2fe' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: currentMode === 'single' ? 700 : 500,
              cursor: 'pointer',
              boxShadow: currentMode === 'single' ? '0 0 12px rgba(0, 242, 254, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={14} />
            <span>Studio Đơn Ảnh</span>
          </button>

          <button
            onClick={() => onChangeMode('batch')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: currentMode === 'batch' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(121, 40, 202, 0.2))' : 'transparent',
              color: currentMode === 'batch' ? '#00f2fe' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: currentMode === 'batch' ? 700 : 500,
              cursor: 'pointer',
              boxShadow: currentMode === 'batch' ? '0 0 12px rgba(0, 242, 254, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={14} />
            <span>Nhiều Ảnh (Batch)</span>
            <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(0, 242, 254, 0.2)', color: '#00f2fe', fontWeight: 700 }}>
              AUTO
            </span>
          </button>

          <button
            onClick={() => onChangeMode('video')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: currentMode === 'video' ? 'linear-gradient(135deg, rgba(121, 40, 202, 0.3), rgba(0, 242, 254, 0.3))' : 'transparent',
              color: currentMode === 'video' ? '#c084fc' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: currentMode === 'video' ? 700 : 500,
              cursor: 'pointer',
              boxShadow: currentMode === 'video' ? '0 0 12px rgba(121, 40, 202, 0.35)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Film size={14} />
            <span>Studio Video AI (4K)</span>
            <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(251, 146, 60, 0.25)', color: '#fb923c', fontWeight: 700 }}>
              MỚI
            </span>
          </button>
        </div>
      )}

      {/* Hardware Acceleration & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Hardware Status Pill */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '8px 16px',
            borderRadius: '999px'
          }}
        >
          <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
              {systemInfo?.device?.gpu || 'Intel(R) Iris(R) Xe Graphics'}
            </span>
            <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)' }}>
              Vulkan Hardware Acceleration Active
            </span>
          </div>
        </div>

        {/* History Button */}
        <button
          onClick={onToggleHistory}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px 14px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.82rem',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
        >
          <History size={16} />
          <span>Lịch sử ({historyCount})</span>
        </button>
      </div>
    </header>
  );
}
