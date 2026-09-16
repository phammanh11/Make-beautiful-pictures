# Make-beautiful-pictures • Tạo Ảnh Đẹp (AI Super-Resolution Studio)

> **Công cụ nâng cấp chất lượng và làm nét ảnh chuyên nghiệp bằng Deep Learning (từ 720p lên 1080p, 2K, 4K, 8K UHD).**
> Được tối ưu hóa phần cứng cho GPU Intel Iris Xe qua Vulkan API và CPU Intel Core i5 thế hệ 13 đa luồng trên Windows.

---

## 🌟 Tính Năng Nổi Bật

1. **Siêu Phân Giải Đa Mục Tiêu (Resolution Presets)**:
   - `720p ➔ 1080p Full HD (1920 × 1080)`: Làm nét chuẩn video & web.
   - `720p/1080p ➔ 2K QHD (2560 × 1440)`: Chuẩn sắc nét cho màn hình 2K.
   - `1080p ➔ 4K Ultra HD (3840 × 2160)`: Siêu nét, phóng to không vỡ hạt.
   - `4K ➔ 8K Extreme UHD (7680 × 4320)`: Phục vụ in ấn khổ lớn.
   - `Scale tự do (2X, 4X, 8X)`: Giữ nguyên tỷ lệ khung hình gốc.

2. **Các Mô Hình AI Deep Learning Hàng Đầu**:
   - **Real-ESRGAN x4+**: Tối ưu nhất cho ảnh đời sống, chân dung, phong cảnh, đồ vật. Tái tạo vân tóc, mắt, làn da, chất liệu vải tự nhiên.
   - **Real-ESRGAN Anime x4+**: Chuyên biệt cho tranh vẽ 2D, manga, anime. Khử viền răng cưa, làm mịn mảng màu và nét line sắc sảo.
   - **Real-ESRGAN AnimeVideo v3**: Mô hình siêu tốc độ (xử lý chỉ trong 1-2 giây).

3. **Giao Diện Studio Cao Cấp & Thanh Trượt So Sánh (Split-Slider)**:
   - Kéo thanh chia đôi màn hình tương tác trực tiếp Before / After từng pixel.
   - Chế độ Zoom & Pan đồng bộ (100%, 200%, 400%) để soi cận cảnh chi tiết.
   - Các chế độ hiển thị: `Split View (So sánh trượt)`, `Ảnh gốc (Before)`, `AI Super-Resolution (After)`.
   - Bảng đo lường HUD trực quan: hiển thị chi tiết độ phân giải, số Megapixels (+800%), dung lượng file và thời gian xử lý.

4. **Tối Ưu Phần Cứng & Chống Tràn Bộ Nhớ (Zero Out-Of-Memory)**:
   - Sử dụng **Vulkan NCNN Engine** chạy trực tiếp trên GPU Intel Iris Xe mà không cần cài 10GB CUDA driver.
   - Tự động chia nhỏ khối ảnh (**Tiling 100-128px**) giúp xử lý ảnh khổng lồ mà không bao giờ bị crash hoặc tràn VRAM.
   - Thuật toán **Lanczos-4 SuperSampling** kết hợp **Bộ lọc Unsharp Masking** cho ảnh trong trẻo, sắc sảo vượt trội so với phóng to thông thường.

---

## 🚀 Hướng Dẫn Sử Dụng 1-Click

### Cách 1: Chạy nhanh bằng file `run_app.bat`
Chỉ cần nhấp đúp chuột vào file **`run_app.bat`** ở thư mục gốc:
- Script sẽ tự động bật FastAPI Backend và AI Engine.
- Tự động mở trình duyệt web tại địa chỉ: `http://127.0.0.1:8000`.

### Cách 2: Chạy thủ công từ Terminal

1. **Khởi động Backend:**
```powershell
cd "d:\New folder\backend"
py -m uvicorn main:app --host 127.0.0.1 --port 8000
```

2. **Truy cập ứng dụng:**
Mở trình duyệt và truy cập: **`http://127.0.0.1:8000`**

*(Nếu muốn phát triển Frontend với Hot-Reload):*
```powershell
cd "d:\New folder\frontend"
npm run dev
# Mở http://localhost:5173
```

---

## 📁 Cấu Trúc Dự Án

```
d:\New folder\
├── run_app.bat                  # Script chạy nhanh 1-click cho Windows
├── README.md                    # Hướng dẫn chi tiết
├── backend\
│   ├── main.py                  # FastAPI API Server & Static Mount
│   ├── config.py                # Cấu hình đường dẫn, model, presets
│   ├── processor.py             # Pipeline AI Tiling, Inference, Resampling & Sharpening
│   ├── engine\
│   │   ├── realesrgan-ncnn-vulkan.exe # Engine thực thi Vulkan GPU Intel/AMD/Nvidia
│   │   ├── models\              # Trọng số pre-trained (x4plus, anime, videov3)
│   │   ├── input.jpg            # Ảnh mẫu chân dung đời sống
│   │   └── input2.jpg           # Ảnh mẫu tranh vẽ 2D
│   ├── uploads\                 # Thư mục chứa ảnh gốc người dùng tải lên
│   └── outputs\                 # Thư mục chứa ảnh đã upscale độ phân giải cao
└── frontend\
    ├── index.html               # Entry HTML với Google Fonts Outfit/Inter
    ├── src\
    │   ├── App.jsx              # Master UI Controller & State Manager
    │   ├── index.css            # Hệ thống Dark Glassmorphism Studio Design System
    │   └── components\
    │       ├── Header.jsx           # HUD thông tin GPU & nút lịch sử
    │       ├── ImageDropzone.jsx    # Kéo thả ảnh & chọn ảnh mẫu 1-click
    │       ├── SettingsPanel.jsx    # Cấu hình preset 1080p/2K/4K/8K & AI Model
    │       ├── BeforeAfterSlider.jsx# Thanh trượt Split-Slider so sánh độ nét
    │       ├── MetricsHUD.jsx       # Bảng đo đạc Before/After & Tải về
    │       ├── ProcessProgress.jsx  # Hiệu ứng tiến trình AI Cyber Shimmer
    │       └── HistoryDrawer.jsx    # Quản lý danh sách các ảnh đã xử lý
    └── dist\                    # Production bundle đã build tối ưu
```

---

## 🔬 Thông Số Đo Lường Thực Tế (Benchmark)

| Ảnh Đầu Vào | Độ Phân Giải Gốc | Mục Tiêu AI | Độ Phân Giải Kết Quả | Dung Lượng | Thời Gian (Intel Iris Xe GPU) |
|---|---|---|---|---|---|
| Chân dung mẫu | 220 × 220 px (0.05 MP) | **Full HD 1080p** | 1920 × 1920 px (3.69 MP) | 3.17 MB | **~8.5 giây** |
| Chân dung mẫu | 220 × 220 px (0.05 MP) | **4K Ultra HD** | 3840 × 3840 px (14.75 MP) | 7.74 MB | **~6.5 giây** |
| Tranh vẽ Anime | 220 × 220 px (0.05 MP) | **Anime Video v3** | 880 × 880 px (0.77 MP) | 1.1 MB | **~1.2 giây** |

---

## 🛡️ Bản Quyền & Giấy Phép
Dự án được xây dựng dựa trên kiến trúc mã nguồn mở **Real-ESRGAN** (Tencent ARC Lab & Xinntao) và thư viện tăng tốc **NCNN Vulkan** (Nihui).
