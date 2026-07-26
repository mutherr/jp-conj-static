import { expect, test } from "@playwright/test";

const VERB_PATH = "verbs/たべる-877/";

test("renders the conjugation chart as a table with the dictionary form highlighted", async ({
  page,
}) => {
  await page.goto(VERB_PATH);

  const tables = page.getByRole("table");
  await expect(tables).toHaveCount(3);

  const coreTense = tables.first();
  await expect(
    coreTense.getByRole("columnheader", { name: "Form" }),
  ).toBeVisible();
  await expect(
    coreTense.getByRole("columnheader", { name: "Plain" }),
  ).toBeVisible();
  await expect(
    coreTense.getByRole("columnheader", { name: "Polite" }),
  ).toBeVisible();

  const dictionaryRow = coreTense
    .getByRole("row")
    .filter({ hasText: "Dictionary" });
  await expect(dictionaryRow.getByText("Base form")).toBeVisible();

  // textContent interleaves <rt> readings with the base text (e.g.
  // "食べる" becomes "食たべる"), so strip <rt> nodes before asserting
  // on the actual conjugated forms.
  const textWithoutFurigana = await dictionaryRow.evaluate((el) => {
    const clone = el.cloneNode(true) as typeof el;
    clone.querySelectorAll("rt").forEach((rt) => rt.remove());
    return clone.textContent;
  });
  expect(textWithoutFurigana).toContain("食べる");
  expect(textWithoutFurigana).toContain("食べます");
});

test("lays out form/plain/polite side by side on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(VERB_PATH);

  const dictionaryRow = page
    .getByRole("table")
    .first()
    .getByRole("row")
    .filter({ hasText: "Dictionary" });
  const cells = dictionaryRow.getByRole("cell");

  const formBox = await cells.nth(0).boundingBox();
  const plainBox = await cells.nth(1).boundingBox();
  if (!formBox || !plainBox) throw new Error("expected visible cells");

  // Side by side: same row (top edges align), plain cell to the right of form.
  expect(Math.abs(formBox.y - plainBox.y)).toBeLessThan(5);
  expect(plainBox.x).toBeGreaterThanOrEqual(formBox.x + formBox.width);
});

test("stacks form/plain/polite into a card below the md breakpoint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(VERB_PATH);

  await expect(
    page.getByRole("columnheader", { name: "Form" }).first(),
  ).toBeHidden();

  const dictionaryRow = page
    .getByRole("table")
    .first()
    .getByRole("row")
    .filter({ hasText: "Dictionary" });
  const cells = dictionaryRow.getByRole("cell");

  const formBox = await cells.nth(0).boundingBox();
  const plainBox = await cells.nth(1).boundingBox();
  if (!formBox || !plainBox) throw new Error("expected visible cells");

  // Stacked: plain cell starts below the form cell, not beside it.
  expect(plainBox.y).toBeGreaterThanOrEqual(formBox.y + formBox.height - 1);
});

test("hides furigana readings within the chart when toggled off", async ({
  page,
}) => {
  await page.goto(VERB_PATH);

  const dictionaryRow = page
    .getByRole("table")
    .first()
    .getByRole("row")
    .filter({ hasText: "Dictionary" });
  const rt = dictionaryRow.locator("rt").first();

  await expect(rt).toBeVisible();
  await page.locator("#furigana-toggle").click();
  await expect(rt).not.toBeVisible();
});
