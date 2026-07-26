import { expect, test, type Locator } from "@playwright/test";

// <ruby>/<rt> furigana readings interleave with the base text in
// textContent (e.g. "食べる" becomes "食たべる"), so strip <rt> nodes
// before asserting on plain Japanese text. Wrapped for expect.poll
// since the grid re-renders asynchronously after search/filter input.
function textWithoutFurigana(locator: Locator): Promise<string | null> {
  return locator.evaluate((el) => {
    const clone = el.cloneNode(true) as typeof el;
    clone.querySelectorAll("rt").forEach((rt) => rt.remove());
    return clone.textContent;
  });
}

test("searches and filters the production Pagefind index", async ({ page }) => {
  await page.goto("verbs");

  await expect(page.locator("#verbs-results")).toHaveText("12,291 matches");
  await expect(page.locator("#verbs-grid > a")).toHaveCount(96);

  await page.locator("#verb-search").fill("食べる");
  await expect(page.locator("#verbs-results")).not.toHaveText(
    "Loading verbs...",
  );
  await expect
    .poll(() => textWithoutFurigana(page.locator("#verbs-grid")))
    .toContain("食べる");
  await expect(page).toHaveURL(/q=%E9%A3%9F%E3%81%B9%E3%82%8B/);

  await page.locator("#verb-group").selectOption("ichidan");
  await expect(page.locator("#verbs-grid .badge").first()).toHaveText(
    "Ichidan",
  );
  await expect(page).toHaveURL(/group=ichidan/);
});

test("persists the furigana preference", async ({ page }) => {
  await page.goto("verbs");
  const toggle = page.locator("#furigana-toggle");

  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveClass(/hide-furigana/);
});

test("redirects the legacy search route with its query", async ({ page }) => {
  await page.goto("search?q=書く");

  await expect(page).toHaveURL(/\/verbs\?q=%E6%9B%B8%E3%81%8F/);
  await expect
    .poll(() => textWithoutFurigana(page.locator("#verbs-grid")))
    .toContain("書く");
});
