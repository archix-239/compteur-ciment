from playwright.sync_api import sync_playwright
import time

def verify(url, filename):
    print(f"Verifying {url}...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        try:
            page.goto(url, wait_until="networkidle")
            time.sleep(3)
            page.screenshot(path=f"./{filename}.png")
            print(f"Saved {filename}.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify("http://localhost:3000/monitoring/live", "live_stream_v2")
    verify("http://localhost:3000/quality/verification", "manual_verification")
    verify("http://localhost:3000/reports/production", "production_reports")
