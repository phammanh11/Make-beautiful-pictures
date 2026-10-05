import os
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

def smooth_move_to(page, target_x, target_y, steps=30):
    page.mouse.move(target_x, target_y, steps=steps)
    time.sleep(0.15)

def smooth_click_locator(page, locator, steps=30):
    box = locator.bounding_box()
    if not box:
        locator.scroll_into_view_if_needed()
        time.sleep(0.3)
        box = locator.bounding_box()
    if box:
        target_x = box['x'] + box['width'] / 2
        target_y = box['y'] + box['height'] / 2
        page.mouse.move(target_x, target_y, steps=steps)
        time.sleep(0.3)
        page.mouse.down()
        time.sleep(0.2)
        page.mouse.up()
        time.sleep(0.5)

def inject_visual_effects(page):
    page.evaluate("""() => {
        if (!document.getElementById('ai-neon-cursor')) {
            const cursor = document.createElement('div');
            cursor.id = 'ai-neon-cursor';
            cursor.style.position = 'fixed';
            cursor.style.top = '100px';
            cursor.style.left = '100px';
            cursor.style.width = '24px';
            cursor.style.height = '24px';
            cursor.style.borderRadius = '50%';
            cursor.style.background = 'radial-gradient(circle, #00f2fe 30%, rgba(0,242,254,0.4) 80%)';
            cursor.style.border = '2px solid #ffffff';
            cursor.style.boxShadow = '0 0 20px #00f2fe, 0 0 40px #00f2fe';
            cursor.style.pointerEvents = 'none';
            cursor.style.zIndex = '9999999';
            cursor.style.transform = 'translate(-50%, -50%)';
            cursor.style.transition = 'transform 0.1s ease-out, background 0.15s, box-shadow 0.15s';
            document.body.appendChild(cursor);

            window.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            });
            window.addEventListener('mousedown', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
                cursor.style.background = '#ef4444';
                cursor.style.boxShadow = '0 0 25px #ef4444, 0 0 50px #ef4444';
            });
            window.addEventListener('mouseup', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursor.style.background = 'radial-gradient(circle, #00f2fe 30%, rgba(0,242,254,0.4) 80%)';
                cursor.style.boxShadow = '0 0 20px #00f2fe, 0 0 40px #00f2fe';
            });
        }

        if (!document.getElementById('ai-demo-banner')) {
            const banner = document.createElement('div');
            banner.id = 'ai-demo-banner';
            banner.innerHTML = '🤖 <strong>CHẾ ĐỘ TỰ ĐỘNG HÓA AI:</strong> Đang di chuột & thao tác trực tiếp trên màn hình...';
            banner.style.position = 'fixed';
            banner.style.top = '16px';
            banner.style.left = '50%';
            banner.style.transform = 'translateX(-50%)';
            banner.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.95), rgba(121, 40, 202, 0.95))';
            banner.style.color = '#ffffff';
            banner.style.padding = '10px 24px';
            banner.style.borderRadius = '999px';
            banner.style.fontWeight = '600';
            banner.style.fontSize = '14px';
            banner.style.zIndex = '9999998';
            banner.style.boxShadow = '0 8px 32px rgba(0, 242, 254, 0.5)';
            banner.style.backdropFilter = 'blur(8px)';
            banner.style.border = '1px solid rgba(255, 255, 255, 0.4)';
            banner.style.transition = 'all 0.3s ease';
            document.body.appendChild(banner);
        }
    }""")

def update_banner(page, text, color=None):
    page.evaluate("""([text, color]) => {
        const b = document.getElementById('ai-demo-banner');
        if (b) {
            b.innerHTML = text;
            if (color) b.style.background = color;
        }
    }""", [text, color])

print("Starting Google Chrome in GUI mode (visible on desktop)...")
with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="chrome",
        headless=False,
        args=["--start-maximized"],
        slow_mo=350
    )
    context = browser.new_context(no_viewport=True)
    page = context.new_page()

    print("Navigating to http://127.0.0.1:8000 ...")
    page.goto("http://127.0.0.1:8000", wait_until="networkidle")
    time.sleep(1)
    inject_visual_effects(page)

    # 1. Hover brand & hardware status
    print("Action: Hovering hardware acceleration badge...")
    gpu_badge = page.locator("header div:has-text('Intel(R) Iris(R)')").first
    if gpu_badge.is_visible():
        box = gpu_badge.bounding_box()
        if box:
            smooth_move_to(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=30)
            time.sleep(1)

    # 2. Move to Demo Chân Dung and Click
    print("Action: Moving mouse to 'Ảnh mẫu Chân dung'...")
    update_banner(page, "👆 Đang chọn 'Ảnh mẫu Chân dung & Đời sống'...")
    demo_btn = page.locator("button:has-text('Chân dung')")
    demo_btn.scroll_into_view_if_needed()
    smooth_click_locator(page, demo_btn, steps=35)
    time.sleep(2)

    # 3. Select 1080p preset
    print("Action: Selecting 1080p preset...")
    update_banner(page, "⚙️ Đang chọn chuẩn Full HD 1080p...")
    preset_btn = page.locator("button:has-text('Full HD 1080p')")
    if preset_btn.is_visible():
        smooth_click_locator(page, preset_btn, steps=25)
        time.sleep(1)

    # 4. Scroll down right panel to showcase GFPGAN
    print("Action: Hovering AI Face Restoration (GFPGAN v1.4)...")
    update_banner(page, "✨ Tự động nhận diện chân dung & kích hoạt GFPGAN v1.4...")
    face_card = page.locator("text=Phục Hồi Khuôn Mặt AI (GFPGAN v1.4)")
    if face_card.is_visible():
        box = face_card.bounding_box()
        if box:
            smooth_move_to(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=30)
            time.sleep(1.2)

    # 5. Move to Face Strength slider and adjust
    slider_input = page.locator("input[type='range'][min='0.1']").first
    if slider_input.is_visible():
        update_banner(page, "🎛️ Điều chỉnh độ nét khuôn mặt (Face Strength: 90%)...")
        box = slider_input.bounding_box()
        if box:
            smooth_move_to(page, box['x'] + box['width'] * 0.7, box['y'] + box['height']/2, steps=25)
            page.mouse.down()
            time.sleep(0.2)
            page.mouse.move(box['x'] + box['width'] * 0.9, box['y'] + box['height']/2, steps=15)
            time.sleep(0.2)
            page.mouse.up()
            time.sleep(1)

    # 6. Click Start Upscale
    print("Action: Clicking 'BẮT ĐẦU NÂNG CẤP HÌNH ẢNH'...")
    update_banner(page, "🚀 BẮT ĐẦU NÂNG CẤP HÌNH ẢNH QUA REAL-ESRGAN + GFPGAN...")
    start_btn = page.locator("button:has-text('BẮT ĐẦU NÂNG CẤP')")
    start_btn.scroll_into_view_if_needed()
    smooth_click_locator(page, start_btn, steps=30)

    # 7. Wait for processing to complete
    update_banner(page, "⏳ AI đang xử lý trên GPU Intel Iris Xe (Real-ESRGAN + GFPGAN)...", "linear-gradient(135deg, #f59e0b, #ef4444)")
    page.wait_for_selector("text=Nâng cấp hoàn tất thành công", timeout=90000)
    time.sleep(1.5)

    # 8. Showcase Before/After slider dragging
    update_banner(page, "🔍 Đang kéo thanh trượt so sánh Before / After trực tiếp...", "linear-gradient(135deg, #10b981, #00f2fe)")
    slider_divider = page.locator(".slider-divider").first
    if slider_divider.is_visible():
        box = slider_divider.bounding_box()
        if box:
            center_x = box['x'] + box['width']/2
            center_y = box['y'] + box['height']/2
            smooth_move_to(page, center_x, center_y, steps=25)
            page.mouse.down()
            time.sleep(0.2)
            
            # Drag left
            page.mouse.move(center_x - 180, center_y, steps=35)
            time.sleep(0.8)
            # Drag right
            page.mouse.move(center_x + 180, center_y, steps=45)
            time.sleep(0.8)
            # Drag back to center
            page.mouse.move(center_x, center_y, steps=35)
            time.sleep(0.3)
            page.mouse.up()
            time.sleep(1)

    # 9. Open History Drawer
    update_banner(page, "📂 Đang mở Lịch sử & Kiểm tra dung lượng ổ đĩa...")
    hist_btn = page.locator("button:has-text('Lịch sử')")
    smooth_click_locator(page, hist_btn, steps=30)
    time.sleep(2)

    # 10. Hover over download and delete
    trash_btn = page.locator("button[title*='Xóa ảnh']").first
    if trash_btn.is_visible():
        update_banner(page, "🗑️ Bấm nút Thùng rác đỏ để xóa ảnh & giải phóng ổ đĩa...")
        smooth_click_locator(page, trash_btn, steps=25)
        time.sleep(2)

    # 11. Final notification banner
    update_banner(page, "🎉 TEST HOÀN TẤT 100%! Cửa sổ Chrome này sẽ giữ nguyên để bạn dùng tự do!", "linear-gradient(135deg, #10b981, #3b82f6)")
    print("\n>>> LIVE DEMO COMPLETED! Keeping Chrome open on screen for user...")

    # Keep browser open for user interaction
    try:
        for _ in range(600):
            if page.is_closed():
                break
            time.sleep(1)
    except Exception:
        pass
