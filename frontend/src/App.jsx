import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageDropzone from './components/ImageDropzone';
import SettingsPanel from './components/SettingsPanel';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import MetricsHUD from './components/MetricsHUD';
import ProcessProgress from './components/ProcessProgress';
import HistoryDrawer from './components/HistoryDrawer';
import BatchProcessingView from './components/BatchProcessingView';
import ImageEditorModal from './components/ImageEditorModal';
import VideoStudioView from './components/VideoStudioView';
import BgRemoverModal from './components/BgRemoverModal';
import { Sparkles, RefreshCw, Layers, CheckCircle, ClipboardCheck, Crop, Scissors, Palette, Film } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'batch' | 'video'
  const [pasteToast, setPasteToast] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBgRemoverOpen, setIsBgRemoverOpen] = useState(false);
  const [isColorizing, setIsColorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Real-time Progress Streaming State
  const [realPercent, setRealPercent] = useState(0);
  const [progressStage, setProgressStage] = useState('init');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Auto-detection state
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  const [settings, setSettings] = useState({
    preset: '4k',
    model: 'realesrgan-x4plus',
    enhance_sharpness: true,
    sharpen_percent: 120,
    detail_blend: 0.40,
    enhance_face: false,
    face_strength: 0.85,
    enable_clahe: false,
    enable_denoise: false,
    output_format: 'png',
    tile_size: 100
  });

  const loadHistory = () => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (data.history) setHistory(data.history);
        if (data.storage) setStorageInfo(data.storage);
      })
      .catch(err => console.error('Failed to load history:', err));
  };

  useEffect(() => {
    fetch('/api/system-info')
      .then(res => res.json())
      .then(data => setSystemInfo(data))
      .catch(err => console.error('Failed to load system info:', err));

    loadHistory();
  }, []);

  // Lắng nghe sự kiện Paste toàn cục (Ctrl + V)
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Don't intercept if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (!e.clipboardData || !e.clipboardData.items) return;
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                handleImageSelected({
                  file: file,
                  previewUrl: event.target.result,
                  width: img.width,
                  height: img.height,
                  name: `Ảnh chụp dán Clipboard (${new Date().toLocaleTimeString()}).png`,
                  size: file.size,
                  sizeHuman: (file.size / 1024).toFixed(1) + ' KB'
                });
                setActiveTab('single');
                setPasteToast(true);
                setTimeout(() => setPasteToast(false), 3000);
              };
              img.src = event.target.result;
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [autoDetectEnabled]);

  const handleUpdateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleImageSelected = async (imgData) => {
    setCurrentImage(imgData);
    setProcessResult(null);
    setErrorMsg(null);
    setDetectionResult(null);

    // Tự động quét và nhận diện loại ảnh
    if (imgData && imgData.file && autoDetectEnabled) {
      setIsScanningImage(true);
      try {
        const formData = new FormData();
        formData.append('file', imgData.file);
        const res = await fetch('/api/detect-model', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success && data.detection) {
          setDetectionResult(data.detection);
          // Tự động kích hoạt Face Enhancement nếu phát hiện có người
          const hasHuman = data.detection.has_human || data.detection.detected_type.includes('portrait');
          setSettings(prev => ({ 
            ...prev, 
            model: data.detection.recommended_model,
            enhance_face: hasHuman ? true : prev.enhance_face
          }));
        }
      } catch (err) {
        console.error('Lỗi khi tự động quét ảnh:', err);
      } finally {
        setIsScanningImage(false);
      }
    }
  };

  // Demo selection
  const handleSelectDemo = async (type) => {
    const filename = type === 'photo' ? 'input.jpg' : 'input2.jpg';
    try {
      const imgUrl = `/engine-static/${filename}`;
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      
      const img = new Image();
      img.onload = () => {
        handleImageSelected({
          file: file,
          previewUrl: imgUrl,
          width: img.width,
          height: img.height,
          name: type === 'photo' ? 'Demo Chân Dung (input.jpg)' : 'Demo Anime (input2.jpg)',
          size: blob.size,
          sizeHuman: (blob.size / 1024).toFixed(1) + ' KB'
        });
      };
      img.src = imgUrl;

      if (type === 'anime') {
        setSettings(prev => ({ ...prev, model: 'realesrgan-x4plus-anime', enhance_face: false }));
      } else {
        setSettings(prev => ({ ...prev, model: 'realesrgan-x4plus', enhance_face: true }));
      }
    } catch (e) {
      console.error('Demo load error', e);
    }
  };

  const handleColorize = async () => {
    if (!currentImage || !currentImage.file) return;
    setIsColorizing(true);
    try {
      const formData = new FormData();
      formData.append('file', currentImage.file);
      const res = await fetch('/api/colorize', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || 'Lỗi khi tô màu ảnh.');
      }
      const imgRes = await fetch(data.download_url);
      const blob = await imgRes.blob();
      const file = new File([blob], data.filename, { type: 'image/jpeg' });
      handleImageSelected({
        file: file,
        previewUrl: data.download_url,
        width: data.width,
        height: data.height,
        name: data.filename,
        size: blob.size,
        sizeHuman: data.size_human
      });
    } catch (e) {
      console.error('Lỗi tô màu:', e);
      setErrorMsg(e.message || 'Không thể tô màu ảnh.');
    } finally {
      setIsColorizing(false);
    }
  };

  const handleStartUpscale = async () => {
    if (!currentImage || !currentImage.file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setRealPercent(0);
    setProgressStage('init');
    setStatusMessage('Đang khởi tạo kết nối AI Engine...');

    const formData = new FormData();
    formData.append('file', currentImage.file);
    formData.append('model', settings.model);
    formData.append('preset', settings.preset);
    formData.append('tile_size', settings.tile_size ?? 100);
    formData.append('enhance_sharpness', settings.enhance_sharpness);
    formData.append('sharpen_percent', settings.sharpen_percent ?? 120);
    formData.append('detail_blend', settings.detail_blend ?? 0.40);
    formData.append('enhance_face', settings.enhance_face ?? false);
    formData.append('face_strength', settings.face_strength ?? 0.85);
    formData.append('enable_clahe', settings.enable_clahe ?? false);
    formData.append('enable_denoise', settings.enable_denoise ?? false);
    formData.append('output_format', settings.output_format);
    formData.append('gpu_id', 0);

    let streamCompleted = false;

    try {
      const response = await fetch('/api/upscale-stream', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Máy chủ trả về mã lỗi ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Trình duyệt không hỗ trợ stream phản hồi');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // giữ lại phần chưa hoàn chỉnh

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const event = JSON.parse(trimmed.slice(6));
              if (event.type === 'progress') {
                setRealPercent(event.percent);
                setProgressStage(event.stage);
                setStatusMessage(event.message);
              } else if (event.type === 'complete') {
                setRealPercent(100);
                setProgressStage('done');
                setProcessResult(event.data);
                loadHistory();
                streamCompleted = true;
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Lỗi khi xử lý AI');
              }
            } catch (err) {
              console.warn('Lỗi phân tích event SSE:', err);
            }
          }
        }
      }
    } catch (err) {
      if (!streamCompleted) {
        console.warn('Stream gặp sự cố, tự động fallback sang endpoint chuẩn...', err);
        try {
          const res = await fetch('/api/upscale', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.detail || 'Lỗi trong quá trình xử lý AI.');
          }
          setProcessResult(data.data);
          loadHistory();
        } catch (fallbackErr) {
          console.error('Upscale fallback error:', fallbackErr);
          setErrorMsg(fallbackErr.message || 'Đã xảy ra lỗi khi kết nối tới AI Engine.');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadHistoryItem = (item) => {
    setProcessResult(item);
    setCurrentImage({
      previewUrl: item.original_url,
      width: item.input?.width,
      height: item.input?.height,
      sizeHuman: item.input?.size_human,
      name: item.filename
    });
  };

  const handleDeleteHistoryItem = async (jobId) => {
    try {
      const res = await fetch(`/api/history/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.job_id !== jobId));
        if (processResult && processResult.job_id === jobId) {
          setProcessResult(null);
        }
        loadHistory();
      }
    } catch (e) {
      console.error('Delete history error:', e);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
        if (processResult) {
          setProcessResult(null);
        }
        loadHistory();
      }
    } catch (e) {
      console.error('Clear history error:', e);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 60px 20px' }}>
      {/* Top Navigation */}
      <Header
        systemInfo={systemInfo}
        onToggleHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        currentMode={activeTab}
        onChangeMode={setActiveTab}
      />

      {/* Toast Clipboard Paste Notification */}
      {pasteToast && (
        <div
          className="glass-panel"
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid var(--accent-emerald)',
            color: '#34d399',
            padding: '12px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <ClipboardCheck size={18} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            Đã nhận diện và dán ảnh thành công từ Clipboard! Bạn có thể bắt đầu nâng cấp ngay.
          </span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div 
          className="glass-panel"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
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

      {/* Main Studio Grid or Video Studio */}
      {activeTab === 'video' ? (
        <VideoStudioView />
      ) : (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1.1fr)',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Visual Stage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeTab === 'batch' ? (
              <BatchProcessingView
                settings={settings}
                onLoadSingleItem={(item) => {
                  handleLoadHistoryItem(item);
                  setActiveTab('single');
                }}
                onHistoryUpdated={loadHistory}
              />
            ) : isProcessing ? (
              <ProcessProgress
                preset={settings.preset}
                model={settings.model}
                realPercent={realPercent}
                stage={progressStage}
                statusMessage={statusMessage}
              />
            ) : processResult ? (
              <>
                <BeforeAfterSlider
                  originalUrl={processResult.original_url}
                  upscaledUrl={processResult.download_url}
                  originalInfo={processResult.input}
                  upscaledInfo={processResult.output}
                  onDownload={() => {
                    const a = document.createElement('a');
                    a.href = processResult.download_url;
                    a.download = processResult.filename;
                    a.click();
                  }}
                />
                <MetricsHUD
                  result={processResult}
                  onDownload={() => {
                    const a = document.createElement('a');
                    a.href = processResult.download_url;
                    a.download = processResult.filename;
                    a.click();
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      setCurrentImage(null);
                      setProcessResult(null);
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
                    <RefreshCw size={14} /> Nâng cấp ảnh mới khác
                  </button>
                </div>
              </>
            ) : currentImage ? (
              /* Image Preview before starting */
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge-tag badge-cyan font-mono">ĐÃ CHỌN ẢNH ĐẦU VÀO</span>
                    <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{currentImage.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setIsEditorOpen(true)}
                      style={{
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid var(--accent-cyan)',
                        color: 'var(--accent-cyan)',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Crop size={13} /> Cắt cúp & Chỉnh sửa
                    </button>

                    <button
                      onClick={() => setIsBgRemoverOpen(true)}
                      style={{
                        background: 'rgba(236, 72, 153, 0.15)',
                        border: '1px solid #ec4899',
                        color: '#f472b6',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Scissors size={13} /> Tách Nền AI
                    </button>

                    <button
                      onClick={handleColorize}
                      disabled={isColorizing}
                      style={{
                        background: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid #a855f7',
                        color: '#c084fc',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        cursor: isColorizing ? 'wait' : 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Palette size={13} /> {isColorizing ? 'Đang tô màu...' : 'Tô Màu Cổ'}
                    </button>

                    <button
                      onClick={() => setCurrentImage(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.78rem'
                      }}
                    >
                      Thay đổi ảnh
                    </button>
                  </div>
                </div>

                <div 
                  style={{
                    width: '100%',
                    height: '460px',
                    background: '#04060a',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <img
                    src={currentImage.previewUrl}
                    alt="Preview input"
                    style={{
                      maxWidth: '92%',
                      maxHeight: '92%',
                      objectFit: 'contain'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>Độ phân giải gốc: <strong style={{ color: '#fff' }}>{currentImage.width} × {currentImage.height} px</strong></span>
                  <span>Dung lượng: <strong style={{ color: '#fff' }}>{currentImage.sizeHuman}</strong></span>
                </div>
              </div>
            ) : (
              <ImageDropzone
                onImageSelected={handleImageSelected}
                currentImage={currentImage}
                onSelectDemo={handleSelectDemo}
              />
            )}
          </div>

          {/* Right Column: Settings & Controls */}
          <div>
            <SettingsPanel
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              currentImage={currentImage}
              onStartUpscale={handleStartUpscale}
              isProcessing={isProcessing}
              systemInfo={systemInfo}
              autoDetectEnabled={autoDetectEnabled}
              onToggleAutoDetect={() => setAutoDetectEnabled(!autoDetectEnabled)}
              isScanningImage={isScanningImage}
              detectionResult={detectionResult}
            />
          </div>
        </div>
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        storageInfo={storageInfo}
        onLoadItem={handleLoadHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
        onSyncHistory={loadHistory}
      />

      {/* Image Editor Modal (Pre-processing Studio) */}
      <ImageEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageItem={currentImage}
        onApply={(editedData) => {
          handleImageSelected(editedData);
        }}
      />

      {/* AI Background Remover Modal */}
      <BgRemoverModal
        isOpen={isBgRemoverOpen}
        onClose={() => setIsBgRemoverOpen(false)}
        imageItem={currentImage}
        onApplyToStudio={(newImg) => {
          handleImageSelected(newImg);
        }}
      />
    </div>
  );
}
