import { expect, test, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function enter(page: Page, level = "G1", row = "F") {
  await page
    .getByRole("button", { name: /Save (my parking spot|a new location)/ })
    .click();
  await page.getByLabel("Garage name").fill("2121 Crystal Drive");
  await page.getByLabel("Level", { exact: false }).fill(level);
  await page.getByLabel("Row", { exact: false }).fill(row);
}

test("save, reload, reopen a tab, replace, and preserve history", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.getByText("No parking location saved.")).toBeVisible();
  await enter(page);
  await page
    .getByRole("button", { name: "Save parking location", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "2121 Crystal Drive" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Your parking location is saved.",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "2121 Crystal Drive" }),
  ).toBeVisible();
  const next = await context.newPage();
  await page.close();
  await next.goto("/");
  await expect(
    next.getByRole("heading", { name: "2121 Crystal Drive" }),
  ).toBeVisible();
  await enter(next, "G2", "B");
  await next
    .getByRole("button", { name: "Save parking location", exact: true })
    .click();
  await expect(next.locator(".location-grid")).toContainText("G2");
  await expect(next.locator(".location-grid")).toContainText("B");
  const sessions = await next.evaluate(async () => {
    return await new Promise<
      Array<{ status: string; level: string; row: string }>
    >((resolve, reject) => {
      const request = indexedDB.open("findcarparked");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const read = db
          .transaction("sessions")
          .objectStore("sessions")
          .getAll();
        read.onsuccess = () => {
          db.close();
          resolve(read.result);
        };
        read.onerror = () => {
          db.close();
          reject(read.error);
        };
      };
    });
  });
  expect(sessions.filter((s) => s.status === "active")).toHaveLength(1);
  expect(sessions.find((s) => s.status === "archived")).toMatchObject({
    level: "G1",
    row: "F",
  });
});

test("invalid entry and failed save preserve the current location", async ({
  page,
}) => {
  await page.goto("/");
  await enter(page);
  await page
    .getByRole("button", { name: "Save parking location", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "2121 Crystal Drive" }),
  ).toBeVisible();
  await enter(page, "G2", "B");
  await page.getByLabel("Row", { exact: false }).fill("   ");
  await page
    .getByRole("button", { name: "Save parking location", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Enter a garage, level, and row",
  );
  await page.getByLabel("Row", { exact: false }).fill("B");
  await page.evaluate(() => {
    IDBObjectStore.prototype.add = function () {
      throw new DOMException("Device storage full", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Save parking location", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "wasn’t saved",
  );
  await page.getByRole("button", { name: "Back to your parking" }).click();
  await expect(page.locator(".location-grid")).toContainText("G1");
  await page.reload();
  await expect(page.locator(".location-grid")).toContainText("G1");
});

test("storage failure offers retry instead of a false empty state", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (name, version) {
      if (name === "findcarparked") throw new Error("Storage denied");
      return original.call(this, name, version);
    };
  });
  await page.goto("/");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "couldn’t read",
  );
  await expect(page.getByText("No parking location saved.")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save my parking spot" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Try again" })).toBeEnabled();
});

test("fits narrow phones and desktop without horizontal overflow", async ({
  page,
}) => {
  for (const width of [320, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByText("No parking location saved.")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await enter(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("survives a real browser process restart with a persistent profile", async ({
  playwright,
  browserName,
}) => {
  const profile = await mkdtemp(join(tmpdir(), "findcarparked-browser-"));
  let persistent;
  try {
    persistent = await playwright[browserName].launchPersistentContext(
      profile,
      { headless: true },
    );
    let page = await persistent.newPage();
    await page.goto("http://127.0.0.1:3000");
    await enter(page);
    await page
      .getByRole("button", { name: "Save parking location", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "2121 Crystal Drive" }),
    ).toBeVisible();
    await persistent.close();
    persistent = await playwright[browserName].launchPersistentContext(
      profile,
      { headless: true },
    );
    page = await persistent.newPage();
    await page.goto("http://127.0.0.1:3000");
    await expect(
      page.getByRole("heading", { name: "2121 Crystal Drive" }),
    ).toBeVisible();
  } finally {
    await persistent?.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test("supports keyboard entry and restores focus when cancelling", async ({
  page,
}) => {
  await page.goto("/");
  const action = page.getByRole("button", { name: "Save my parking spot" });
  await expect(action).toBeEnabled();
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Where did you park?" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Garage name")).toBeFocused();
  await page.getByRole("button", { name: "Back to your parking" }).click();
  await expect(action).toBeFocused();
});
