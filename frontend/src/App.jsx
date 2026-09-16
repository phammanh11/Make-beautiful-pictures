import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageDropzone from './components/ImageDropzone';
import SettingsPanel from './components/SettingsPanel';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import MetricsHUD from './components/MetricsHUD';
import ProcessProgress from './components/ProcessProgress';
import HistoryDrawer from './components/HistoryDrawer';
import { Sparkles, RefreshCw, Layers, CheckCircle } from 'lucide-react';

export default function App() {
  const [systemInfo, setSystemInfo] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Auto-detection state
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  const [settings, setSettings] = useState({
    preset: '4k',
    model: 'realesrgan-x4plus',
    enhance_sharpness: true,
    output_format: 'png',
    tile_size: 100
  });

  // Fetch system info and history on mount
  useEffect(() => {
    fetch('/api/system-info')
      .then(res => res.json())
      .then(data => setSystemInfo(data))
      .catch(err => console.error('Failed to load system info:', err));

    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (data.history) setHistory(data.history);
      })
      .catch(err => console.error('Failed to load history:', err));
  }, []);

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
          // Tự động cập nhật mô hình tối ưu tương ứng
          setSettings(prev => ({ ...prev, model: data.detection.recommended_model }));
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
        setSettings(prev => ({ ...prev, model: 'realesrgan-x4plus-anime' }));
      } else {
        setSettings(prev => ({ ...prev, model: 'realesrgan-x4plus' }));
      }
    } catch (e) {
      console.error('Demo load error', e);
    }
  };

  const handleStartUpscale = async () => {
    if (!currentImage || !currentImage.file) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', currentImage.file);
    formData.append('model', settings.model);
    formData.append('preset', settings.preset);
    formData.append('tile_size', settings.tile_size);
    formData.append('enhance_sharpness', settings.enhance_sharpness);
    formData.append('output_format', settings.output_format);
    formData.append('gpu_id', 0);

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
      setHistory(prev => [data.data, ...prev]);
    } catch (err) {
      console.error('Upscale error:', err);
      setErrorMsg(err.message || 'Đã xảy ra lỗi khi kết nối tới AI Engine.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadHistoryItem = (item) => {
    setProcessResult(item);
    setCurrentImage({
      previewUrl: item.original_url,
      width: item.input.width,
      height: item.input.height,
      sizeHuman: item.input.size_human,
      name: item.filename
    });
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 60px 20px' }}>
      {/* Top Navigation */}
      <Header
        systemInfo={systemInfo}
        onToggleHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

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

      {/* Main Studio Grid */}
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
          {isProcessing ? (
            <ProcessProgress
              preset={settings.preset}
              model={settings.model}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge-tag badge-cyan font-mono">ĐÃ CHỌN ẢNH ĐẦU VÀO</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{currentImage.name}</span>
                </div>
                <button
                  onClick={() => setCurrentImage(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Thay đổi ảnh
                </button>
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

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoadItem={handleLoadHistoryItem}
      />
    </div>
  );
}
