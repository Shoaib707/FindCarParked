import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  validateParking,
  type ParkingInput,
  type ParkingSession,
} from "../../features/parking/model";

interface ParkingDatabase extends DBSchema {
  sessions: {
    key: string;
    value: ParkingSession;
    indexes: { "by-status": ParkingSession["status"] };
  };
}

export const DATABASE_NAME = "findcarparked";

function sessionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // getRandomValues also works on a local-network HTTP preview on iPhone.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export class ParkingRepository {
  private connection?: Promise<IDBPDatabase<ParkingDatabase>>;
  constructor(private readonly name = DATABASE_NAME) {}

  private open() {
    if (!this.connection) {
      this.connection = openDB<ParkingDatabase>(this.name, 1, {
        upgrade(db) {
          const sessions = db.createObjectStore("sessions", { keyPath: "id" });
          sessions.createIndex("by-status", "status");
        },
        blocked() {
          /* The UI's loading timeout explains how to close older tabs. */
        },
        blocking: () => {
          void this.close();
        },
        terminated: () => {
          this.connection = undefined;
        },
      }).catch((error: unknown) => {
        this.connection = undefined;
        throw error;
      });
    }
    return this.connection;
  }

  async getActive(): Promise<ParkingSession | undefined> {
    const db = await this.open();
    const tx = db.transaction("sessions", "readonly");
    const completion = tx.done;
    void completion.catch(() => undefined);
    const active = await tx.store.index("by-status").getAll("active");
    await completion;
    if (active.length > 1)
      throw new Error(
        "Multiple active locations found. Your data has been preserved.",
      );
    return active[0];
  }

  async save(input: ParkingInput): Promise<ParkingSession> {
    const clean = validateParking(input);
    // Generate all fallible input-derived values before beginning the transaction.
    const now = new Date().toISOString();
    const session: ParkingSession = {
      ...clean,
      id: sessionId(),
      status: "active",
      parkedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const db = await this.open();
    const tx = db.transaction("sessions", "readwrite");
    // Attach rejection handling immediately, including when an individual request fails.
    const completion = tx.done;
    void completion.catch(() => undefined);
    try {
      const previous = await tx.store.index("by-status").getAll("active");
      for (const old of previous)
        await tx.store.put({ ...old, status: "archived", updatedAt: now });
      await tx.store.add(session);
      await completion; // Success is reported only after the atomic transaction commits.
      return session;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* The transaction may have already aborted. */
      }
      await completion.catch(() => undefined);
      throw error;
    }
  }

  async close() {
    const connection = this.connection;
    this.connection = undefined;
    if (connection) (await connection).close();
  }
}

export const parkingRepository = new ParkingRepository();
