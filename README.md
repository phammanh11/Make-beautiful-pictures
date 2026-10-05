# Make-beautiful-pictures • Tạo Ảnh Đẹp (AI Super-Resolution Studio)

> **Công cụ nâng cấp chất lượng và làm nét ảnh chuyên nghiệp bằng Deep Learning (từ 720p lên 1080p, 2K, 4K, 8K UHD).**
> Được tối ưu hóa phần cứng cho GPU Intel Iris Xe qua Vulkan API và CPU Intel Core i5 thế hệ 13 đa luồng trên Windows.

---

## 🌟 Tính Năng Nổi Bật

1. **Siêu Phân Giải Đa Mục Tiêu (Resolution Presets)**:
   - 720p ➔ 1080p Full HD (1920 × 1080): Làm nét chuẩn video & web.
   - 720p/1080p ➔ 2K QHD (2560 × 1440): Chuẩn sắc nét cho màn hình 2K.
   - 1080p ➔ 4K Ultra HD (3840 × 2160): Siêu nét, phóng to không vỡ hạt.
   - 4K ➔ 8K Extreme UHD (7680 × 4320): Phục vụ in ấn khổ lớn.
   - Scale tự do (2X, 4X, 8X): Giữ nguyên tỷ lệ khung hình gốc.

2. **Các Mô Hình AI Deep Learning Hàng Đầu**:
   - **Real-ESRGAN x4+**: Tối ưu nhất cho ảnh đời sống, chân dung, phong cảnh, đồ vật. Tái tạo vân tóc, mắt, làn da, chất liệu vải tự nhiên.
   - **Real-ESRGAN Anime x4+**: Chuyên biệt cho tranh vẽ 2D, manga, anime. Khử viền răng cưa, làm mịn mảng màu và nét line sắc sảo.
   - **Real-ESRGAN AnimeVideo v3**: Mô hình siêu tốc độ (xử lý chỉ trong 1-2 giây).

3. **Công Nghệ Nhận Diện & Tinh Chỉnh Nâng Cao (Pro Tuning & Face Enhancer)**:
   - **Tự Động Phân Loại (Auto-Detect Classifier)**: Quét da người, bầu trời, cây cối, QR và kết cấu ma trận 4x4 để tự động kích hoạt model tối ưu.
   - **Tăng Cường Chân Dung (Face Enhancement)**: Nhận diện khuôn mặt YuNet + phục hồi chi tiết bằng GFPGAN DirectML.
   - **Tiến Trình GPU Thời Gian Thực (Real-time SSE Streaming)**: Đọc từng tile suy luận từ Vulkan NCNN C++ binary và stream phần trăm thực tế lên giao diện.
   - **Bộ Lọc Nâng Cao (CLAHE & Denoise)**: Cân bằng dải tương phản thích ứng cục bộ trong không gian màu LAB và khử nhiễu hạt cảm biến ISO.
   - **Chuẩn In Ấn 300 DPI & Bảo Tồn EXIF**: Tự động gán metadata 300 DPI, giữ thông số máy ảnh gốc và hỗ trợ xuất định dạng **TIFF** không nén, PNG, JPG, WEBP.
   - **Bộ Công Cụ Cắt Cúp & Chuẩn Bị Ảnh (Pre-processing Studio)**: Cắt ảnh chuẩn tỉ lệ (1:1, 4:5, 16:9, 9:16, 3:2, Tự do), xoay 90 độ, lật ngang/dọc và tinh chỉnh sáng tối trước khi siêu phân giải.

4. **Quản Lý Lịch Sử Bền Vững & Xuất File ZIP (Persistent Storage & Batch Export)**:
   - Cơ sở dữ liệu SQLite lưu trữ lịch sử xử lý vĩnh viễn trên đĩa, không bị mất khi tắt máy.
   - Xem lại ảnh cũ trong Split-Slider, xóa từng ảnh hoặc xóa toàn bộ.
   - **Xuất toàn bộ ảnh dạng file .ZIP** chỉ với 1 cú nhấp chuột.
   - Cơ chế tự động dọn dẹp bộ nhớ đệm (Auto-cleanup) bảo vệ dung lượng ổ cứng.

5. **Giao Diện Studio Cao Cấp & Thanh Trượt So Sánh (Split-Slider)**:
   - Kéo thanh chia đôi màn hình tương tác trực tiếp Before / After từng pixel.
   - Chế độ Zoom & Pan đồng bộ (100%, 200%, 400%) để soi cận cảnh chi tiết.
   - Kính lúp phóng đại Magnifier 3.0x - 5.0x tương tác di chuột.
   - Các chế độ hiển thị: Split View (So sánh trượt), Side-by-Side (Song song), Ảnh gốc (Before), AI Super-Resolution (After).
   - Phím tắt dán ảnh Clipboard toàn cục (`Ctrl + V`) mở ảnh tức thì.

6. **AI Video Super-Resolution Studio (Làm Nét Video Lên 4K 60fps)**:
   - Tự động tách frames và audio gốc qua **FFmpeg**.
   - Siêu phân giải hàng loạt frame bằng mô hình siêu tốc **Real-ESRGAN AnimeVideo v3** trên GPU Intel Iris Xe.
   - Ghép lại thành video MP4 chuẩn nén H.264 cao cấp, bảo toàn 100% âm thanh gốc và thời lượng.

7. **AI Tách Nền E-commerce (Background Remover) & Tô Màu Ảnh Cổ (Photo Colorizer)**:
   - **Tách Nền 1-Click (rembg)**: Tách phông nền trong suốt (PNG), nền trắng chuẩn sàn TMĐT (Shopee/Lazada), nền màu tùy chọn hoặc xóa phông Bokeh mờ ảo.
   - **Tô Màu Ảnh Đen Trắng Cổ Điển**: Phục chế ảnh ông bà xưa thành ảnh màu chân thực, sống động.

8. **Tối Ưu Phần Cứng & Chống Tràn Bộ Nhớ (Zero Out-Of-Memory)**:
   - Sử dụng **Vulkan NCNN Engine** chạy trực tiếp trên GPU Intel Iris Xe mà không cần cài 10GB CUDA driver.
   - Tự động chia nhỏ khối ảnh (**Tiling 100-400px**) giúp xử lý ảnh khổng lồ mà không bao giờ bị crash hoặc tràn VRAM.
   - Thuật toán **Lanczos-4 SuperSampling** kết hợp **Bộ lọc Unsharp Masking** cho ảnh trong trẻo, sắc sảo vượt trội so với phóng to thông thường.

---

## 🚀 Hướng Dẫn Sử Dụng 1-Click

### Cách 1: Chạy nhanh bằng file run_app.bat
Chỉ cần nhấp đúp chuột vào file **run_app.bat** ở thư mục gốc:
- Script sẽ tự động bật FastAPI Backend và AI Engine.
- Tự động mở trình duyệt web tại địa chỉ: http://127.0.0.1:8000.

### Cách 2: Chạy thủ công từ Terminal

1. **Cài đặt thư viện phụ thuộc (lần đầu tiên):**
`powershell
cd "d:\anh\backend"
py -m pip install -r requirements.txt
`

2. **Khởi động Backend:**
`powershell
cd "d:\anh\backend"
py -m uvicorn main:app --host 127.0.0.1 --port 8000
`

3. **Truy cập ứng dụng:**
Mở trình duyệt và truy cập: **http://127.0.0.1:8000**

*(Nếu muốn phát triển Frontend với Hot-Reload):*
`powershell
cd "d:\anh\frontend"
npm run dev
# Mở http://localhost:5173
`

---

## 📁 Cấu Trúc Dự Án

`
d:\anh\
├── run_app.bat                  # Script chạy nhanh 1-click cho Windows
├── README.md                    # Hướng dẫn chi tiết & tài liệu
├── backend\
│   ├── requirements.txt         # Khai báo phụ thuộc Python
│   ├── main.py                  # FastAPI API Server, Async Worker & Endpoints
│   ├── config.py                # Cấu hình đường dẫn, model, presets
│   ├── processor.py             # Pipeline AI Tiling, Inference, Resampling & Face Enhancer
│   ├── classifier.py            # Phân loại ảnh tự động bằng Computer Vision đa tầng
│   ├── history_manager.py       # Quản lý lịch sử bền vững SQLite & Nén file ZIP
│   ├── history.db               # Cơ sở dữ liệu lịch sử lưu trữ cục bộ
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
    │       ├── Header.jsx           # HUD thông tin GPU & Dung lượng bộ nhớ
    │       ├── ImageDropzone.jsx    # Kéo thả ảnh & chọn ảnh mẫu 1-click
    │       ├── SettingsPanel.jsx    # Cấu hình preset 1080p/2K/4K/8K, AI Model & Pro Controls
    │       ├── BeforeAfterSlider.jsx# Thanh trượt Split-Slider so sánh độ nét
    │       ├── MetricsHUD.jsx       # Bảng đo đạc Before/After & Tải về
    │       ├── ProcessProgress.jsx  # Hiệu ứng tiến trình AI Cyber Shimmer
    │       └── HistoryDrawer.jsx    # Quản lý lịch sử, Xóa ảnh & Tải toàn bộ ZIP
    └── dist\                    # Production bundle đã build tối ưu
`

---

## 🛡️ Bản Quyền & Giấy Phép
Dự án được xây dựng dựa trên kiến trúc mã nguồn mở **Real-ESRGAN** (Tencent ARC Lab & Xinntao) và thư viện tăng tốc **NCNN Vulkan** (Nihui).
