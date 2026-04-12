import { test, expect } from "@playwright/test";

test("홈(/)이 정상 응답한다", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
});
