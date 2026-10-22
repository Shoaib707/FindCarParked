import "fake-indexeddb/auto";
import { openDB } from "idb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParkingRepository } from "./parking";

const input = { garageName: "2121 Crystal Drive", level: "G1", row: "F" };
const repositories: ParkingRepository[] = [];
function setup() {
  const name = `test-${crypto.randomUUID()}`;
  const repository = new ParkingRepository(name);
  repositories.push(repository);
  return { name, repository };
}
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(repositories.splice(0).map((r) => r.close()));
});

describe("parking persistence", () => {
  it("starts empty and persists normalized data across database connections", async () => {
    const { name, repository } = setup();
    expect(await repository.getActive()).toBeUndefined();
    const saved = await repository.save({
      ...input,
      garageName: " 2121 Crystal Drive ",
      level: "g1",
      row: "f",
    });
    expect(saved).toMatchObject({ ...input, status: "active" });
    await repository.close();
    const reopened = new ParkingRepository(name);
    repositories.push(reopened);
    expect(await reopened.getActive()).toEqual(saved);
  });
  it("atomically archives previous sessions and retains their original timestamps", async () => {
    const { name, repository } = setup();
    const old = await repository.save(input);
    const current = await repository.save({ ...input, level: "G2", row: "B" });
    expect(await repository.getActive()).toEqual(current);
    const db = await openDB(name);
    const archived = await db.get("sessions", old.id);
    expect(archived).toMatchObject({
      status: "archived",
      parkedAt: old.parkedAt,
      createdAt: old.createdAt,
    });
    expect(await db.count("sessions")).toBe(2);
    db.close();
  });
  it.each([
    { ...input, garageName: "  " },
    { ...input, level: "" },
    { ...input, row: "\t" },
    { ...input, row: "x".repeat(21) },
  ])(
    "rejects invalid data without overwriting an active location: %j",
    async (invalid) => {
      const { repository } = setup();
      const saved = await repository.save(input);
      await expect(repository.save(invalid)).rejects.toThrow();
      expect(await repository.getActive()).toEqual(saved);
    },
  );
  it("rolls back archiving when a write fails and does not report success", async () => {
    const { repository } = setup();
    const saved = await repository.save(input);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      saved.id as `${string}-${string}-${string}-${string}-${string}`,
    );
    await expect(repository.save({ ...input, row: "B" })).rejects.toThrow();
    expect(await repository.getActive()).toEqual(saved);
  });
  it("serializes competing saves from separate connections into one active location", async () => {
    const { name, repository } = setup();
    const other = new ParkingRepository(name);
    repositories.push(other);
    await Promise.all([
      repository.save(input),
      other.save({ ...input, row: "B" }),
    ]);
    const db = await openDB(name);
    const all = await db.getAll("sessions");
    expect(all.filter((s) => s.status === "active")).toHaveLength(1);
    expect(all.filter((s) => s.status === "archived")).toHaveLength(1);
    db.close();
  });
  it("retains the location after seven days without expiration", async () => {
    const { repository } = setup();
    const saved = await repository.save(input);
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      expect(await repository.getActive()).toEqual(saved);
    } finally {
      vi.useRealTimers();
    }
  });
  it("generates a valid ID when randomUUID is unavailable on a LAN HTTP preview", async () => {
    const { repository } = setup();
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    });
    try {
      const saved = await repository.save(input);
      expect(saved.id).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
      );
      expect(await repository.getActive()).toEqual(saved);
    } finally {
      Object.defineProperty(crypto, "randomUUID", {
        value: original,
        configurable: true,
      });
    }
  });
  it("surfaces an aborted read and can retrieve the preserved location afterward", async () => {
    const { repository } = setup();
    const saved = await repository.save(input);
    const original = IDBIndex.prototype.getAll;
    const spy = vi
      .spyOn(IDBIndex.prototype, "getAll")
      .mockImplementation(function (this: IDBIndex, ...args) {
        this.objectStore.transaction.abort();
        return original.apply(this, args);
      });
    await expect(repository.getActive()).rejects.toThrow();
    spy.mockRestore();
    expect(await repository.getActive()).toEqual(saved);
  });
  it("surfaces database open failures", async () => {
    const { repository } = setup();
    vi.spyOn(indexedDB, "open").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    await expect(repository.getActive()).rejects.toThrow("Storage unavailable");
    await expect(repository.save(input)).rejects.toThrow("Storage unavailable");
  });
});
