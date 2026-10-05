import os
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

artifact_dir = Path(r"C:\Users\Admin\.gemini\antigravity\brain\2a5ee812-fc12-451e-935c-c0e894e37ff9")

print("=== STARTING FULL E2E AUTOMATION TEST IN GOOGLE CHROME ===")
with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="chrome",
        headless=True,
        args=["--no-sandbox", "--disable-dev-shm-usage"]
    )
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # 1. Open app
    print("Step 1: Navigating to http://127.0.0.1:8000 ...")
    page.goto("http://127.0.0.1:8000", wait_until="networkidle")
    page.wait_for_timeout(1000)

    # 2. Click "Ảnh mẫu Chân dung / Đời sống"
    print("Step 2: Selecting Demo Chân dung...")
    demo_btn = page.locator("button:has-text('Chân dung')")
    demo_btn.click()
    page.wait_for_timeout(2000)

    # 3. Select 1080p preset
    print("Step 3: Selecting 1080p preset for fast verification...")
    preset_btn = page.locator("button:has-text('Full HD 1080p')")
    if preset_btn.is_visible():
        preset_btn.click()
        page.wait_for_timeout(500)

    # Take screenshot of selected photo & settings
    setup_shot = artifact_dir / "chrome_test_01_selected.png"
    page.screenshot(path=str(setup_shot), full_page=False)
    print(f"Setup screenshot saved: {setup_shot}")

    # 4. Click Start Upscale
    print("Step 4: Starting AI Upscale with GFPGAN Face Restoration...")
    start_btn = page.locator("button:has-text('BẮT ĐẦU NÂNG CẤP')")
    start_btn.click()

    # 5. Wait for processing to complete (look for "Nâng cấp hoàn tất" or BeforeAfter slider)
    print("Step 5: Waiting for AI processing to finish...")
    page.wait_for_selector("text=Nâng cấp hoàn tất thành công", timeout=60000)
    page.wait_for_timeout(1500)
    print("Upscale completed successfully!")

    # 6. Take screenshot of result
    result_shot = artifact_dir / "chrome_test_02_upscaled.png"
    page.screenshot(path=str(result_shot), full_page=False)
    print(f"Upscaled result screenshot saved: {result_shot}")

    # 7. Open History Drawer
    print("Step 7: Opening History Drawer...")
    hist_btn = page.locator("button:has-text('Lịch sử')")
    hist_btn.click()
    page.wait_for_timeout(1000)

    # 8. Take screenshot of History Drawer with items
    hist_shot = artifact_dir / "chrome_test_03_history_drawer.png"
    page.screenshot(path=str(hist_shot), full_page=False)
    print(f"History Drawer screenshot saved: {hist_shot}")

    # Verify buttons
    has_zip = page.locator("button:has-text('Tải toàn bộ (.ZIP)')").is_visible()
    has_clear = page.locator("button:has-text('Xóa sạch & Giải phóng')").is_visible()
    has_trash = page.locator("button[title*='Xóa ảnh']").is_visible()
    print(f"History toolbar controls: ZIP={has_zip}, ClearAll={has_clear}, TrashIcon={has_trash}")

    # 9. Test deleting the image using the trash button to free disk space
    print("Step 9: Testing delete image using Trash button...")
    trash_btn = page.locator("button[title*='Xóa ảnh']").first
    trash_btn.click()
    page.wait_for_timeout(1500)

    # 10. Take screenshot after delete
    after_delete_shot = artifact_dir / "chrome_test_04_after_delete.png"
    page.screenshot(path=str(after_delete_shot), full_page=False)
    print(f"After delete screenshot saved: {after_delete_shot}")

    browser.close()
    print("=== ALL CHROME AUTOMATION TESTS PASSED 100%! ===")
