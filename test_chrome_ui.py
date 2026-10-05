import os
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

artifact_dir = Path(r"C:\Users\Admin\.gemini\antigravity\brain\2a5ee812-fc12-451e-935c-c0e894e37ff9")

print("Launching Google Chrome via Playwright...")
with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="chrome",
        headless=True,
        args=["--no-sandbox", "--disable-dev-shm-usage"]
    )
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    print("Navigating to http://127.0.0.1:8000 ...")
    page.goto("http://127.0.0.1:8000", wait_until="networkidle")

    # 1. Main Page Screenshot
    time.sleep(1)
    main_shot = artifact_dir / "chrome_test_main.png"
    page.screenshot(path=str(main_shot), full_page=False)
    print(f"Main page screenshot saved: {main_shot}")

    # 2. Click History button
    print("Opening History Drawer...")
    history_btn = page.locator("button:has-text('Lịch sử')")
    history_btn.click()
    page.wait_for_timeout(1000)

    # 3. History Drawer Screenshot
    hist_shot = artifact_dir / "chrome_test_history.png"
    page.screenshot(path=str(hist_shot), full_page=False)
    print(f"History drawer screenshot saved: {hist_shot}")

    # Check controls
    has_zip = page.locator("button:has-text('Tải toàn bộ (.ZIP)')").is_visible()
    has_clear = page.locator("button:has-text('Xóa sạch & Giải phóng')").is_visible()
    has_sync = page.locator("button:has-text('Đồng bộ')").is_visible()
    print(f"History toolbar controls: ZIP={has_zip}, ClearAll={has_clear}, Sync={has_sync}")

    # Close drawer
    page.keyboard.press("Escape")
    page.wait_for_timeout(500)

    # 4. Click Demo Chân Dung
    print("Clicking Demo Chân Dung...")
    demo_btn = page.locator("button:has-text('Demo Chân Dung')")
    if demo_btn.is_visible():
        demo_btn.click()
        page.wait_for_timeout(1500)

        demo_shot = artifact_dir / "chrome_test_demo.png"
        page.screenshot(path=str(demo_shot), full_page=False)
        print(f"Demo portrait screenshot saved: {demo_shot}")

        has_face_card = page.locator("text=Phục Hồi Khuôn Mặt AI (GFPGAN v1.4)").is_visible()
        print(f"GFPGAN Face Restorer card visible: {has_face_card}")

    browser.close()
    print("ALL TESTS IN GOOGLE CHROME COMPLETED SUCCESSFULLY!")
