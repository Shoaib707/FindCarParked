"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Check,
  CheckCheck,
  Clock3,
  MapPin,
  Navigation,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parkingRepository } from "@/services/database/parking";
import { ParkingValidationError, type ParkingSession } from "./model";

function parkedTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ParkingApp() {
  const [active, setActive] = useState<ParkingSession>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const generation = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    if (busy.current) return;
    const current = ++generation.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        parkingRepository.getActive(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Storage unavailable")),
            8000,
          );
        }),
      ]);
      if (current === generation.current) {
        setActive(result);
        setLoadError(false);
        setLoading(false);
      }
    } catch {
      if (current === generation.current) {
        setLoadError(true);
        setLoading(false);
      }
    } finally {
      clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      void load();
    }, 0);
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  useEffect(() => {
    if (editing) heading.current?.focus();
  }, [editing]);

  function finishEditing() {
    setEditing(false);
    setError("");
    requestAnimationFrame(() => addButton.current?.focus());
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const fields = new FormData(event.currentTarget);
    busy.current = true;
    ++generation.current;
    setSaving(true);
    setError("");
    try {
      const session = await parkingRepository.save({
        garageName: String(fields.get("garageName") ?? ""),
        level: String(fields.get("level") ?? ""),
        row: String(fields.get("row") ?? ""),
        spotNumber: String(fields.get("spotNumber") ?? ""),
      });
      setActive(session);
      setSaved(true);
      finishEditing();
    } catch (error) {
      if (error instanceof ParkingValidationError) {
        setError(error.message);
      } else
        setError(
          "Your location wasn’t saved. Your previous location is unchanged. Check available device storage and try again.",
        );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="FindCarParked home">
          <span className="brand-icon">
            <CarFront size={22} strokeWidth={1.8} />
          </span>
          FindCar<span className="wordmark-muted">Parked</span>
          <span className="brand-dot" />
        </Link>
        <span className="header-note">
          <span className="status-dot" /> A little peace of mind
        </span>
      </header>

      <main id="main-content">
        {editing ? (
          <section className="entry-section">
            <Button variant="ghost" onClick={finishEditing} disabled={saving}>
              <ArrowLeft size={17} /> Back to your parking
            </Button>
            <p className="eyebrow">A PLACE TO REMEMBER</p>
            <h1 ref={heading} tabIndex={-1}>
              Where did you park?
            </h1>
            <p className="intro">
              A few details now. An easier walk back later.
            </p>
            <form onSubmit={save} className="entry-form">
              {active && (
                <div className="replacement-note">
                  <ShieldCheck size={20} />
                  <span>
                    Your current location stays saved until this one is
                    successfully stored.
                  </span>
                </div>
              )}
              <label htmlFor="garageName">
                Garage name <span>Required</span>
              </label>
              <input
                id="garageName"
                name="garageName"
                placeholder="e.g. 2121 Crystal Drive"
                autoComplete="off"
                required
                maxLength={120}
              />
              <div className="form-columns">
                <div>
                  <label htmlFor="level">
                    Level <span>Required</span>
                  </label>
                  <input
                    id="level"
                    name="level"
                    placeholder="e.g. G1"
                    autoCapitalize="characters"
                    required
                    maxLength={20}
                  />
                </div>
                <div>
                  <label htmlFor="row">
                    Row <span>Required</span>
                  </label>
                  <input
                    id="row"
                    name="row"
                    placeholder="e.g. F"
                    autoCapitalize="characters"
                    required
                    maxLength={20}
                  />
                </div>
              </div>
              <label htmlFor="spotNumber">
                Spot number <span>Optional</span>
              </label>
              <input
                id="spotNumber"
                name="spotNumber"
                placeholder="e.g. 128"
                maxLength={30}
              />
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={saving} className="save-button">
                {saving ? "Saving your location…" : "Save parking location"}
                {!saving && <Check size={19} />}
              </Button>
              <p className="form-footnote">
                <ShieldCheck size={15} /> Saved on this device. No account
                needed.
              </p>
            </form>
          </section>
        ) : (
          <>
            <section className="page-intro">
              <p className="eyebrow">LESS SEARCHING. MORE LIVING.</p>
              <h1>
                Your car.
                <br className="mobile-break" /> Right where you left it.
              </h1>
              <p className="intro">Save your spot. Get on with your day.</p>
            </section>
            <div className="dashboard-grid">
              <section
                className={`parking-card ${active ? "has-location" : ""}`}
                aria-label="Your parking location"
                aria-busy={loading}
              >
                <div className="card-topline">
                  <span>
                    <span className="live-dot" /> YOUR PARKING SPOT
                  </span>
                  <CarFront size={25} strokeWidth={1.5} />
                </div>
                {loading ? (
                  <div className="card-state" role="status">
                    <div className="loading-mark" />
                    <h2>Finding your saved spot…</h2>
                    <p>Checking this device’s storage.</p>
                  </div>
                ) : loadError ? (
                  <div className="card-state">
                    <ShieldCheck size={42} />
                    <h2>Let’s reconnect to your spot.</h2>
                    <p role="alert">
                      We couldn’t read device storage. Close older tabs of this
                      app, check that website storage is allowed, then try
                      again.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLoading(true);
                        void load();
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                ) : active ? (
                  <>
                    <div className="location-heading">
                      <p>YOUR CAR IS PARKED AT</p>
                      <h2>{active.garageName}</h2>
                    </div>
                    <div className="location-grid">
                      <div>
                        <span>LEVEL</span>
                        <strong>{active.level}</strong>
                      </div>
                      <div>
                        <span>ROW</span>
                        <strong>{active.row}</strong>
                      </div>
                    </div>
                    {active.spotNumber && (
                      <p className="spot-number">
                        SPOT <strong>{active.spotNumber}</strong>
                      </p>
                    )}
                    <div className="card-bottomline">
                      <span>
                        <Clock3 size={16} />
                        <time dateTime={active.parkedAt}>
                          {parkedTime(active.parkedAt)}
                        </time>
                      </span>
                      <span>
                        <CheckCheck size={17} /> Saved on device
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="card-state">
                    <div className="empty-illustration">
                      <MapPin size={42} strokeWidth={1.4} />
                      <span className="illustration-orbit" />
                    </div>
                    <h2>No parking location saved.</h2>
                    <p>
                      Your next walk back starts here.
                      <br />
                      Save your garage, level, and row.
                    </p>
                    <span className="empty-card-note">
                      <ShieldCheck size={15} /> On this device. No account
                      needed.
                    </span>
                  </div>
                )}
                <div className="card-stripes" aria-hidden="true" />
              </section>
              <aside className="action-panel">
                <span className="panel-symbol">
                  <Navigation size={23} strokeWidth={1.5} />
                </span>
                <p className="eyebrow">ONE LESS THING TO REMEMBER</p>
                <h2>
                  {active
                    ? "New day. New spot?"
                    : "Park it. Save it.\nForget about it."}
                </h2>
                <p>
                  {active
                    ? "Parked somewhere new? Save your location here before you head out."
                    : "A garage, a level, a row. That’s all you need to find your way back."}
                </p>
                <Button
                  ref={addButton}
                  disabled={loading || loadError}
                  onClick={() => {
                    setSaved(false);
                    setEditing(true);
                  }}
                >
                  <Plus size={20} />
                  {active ? "Save a new location" : "Save my parking spot"}
                  <ArrowRight size={18} className="button-arrow" />
                </Button>
                <span className="action-note">
                  {active
                    ? "Your previous spot is safely archived."
                    : "Takes a moment. Saves the search."}
                </span>
              </aside>
            </div>
            {saved && (
              <p role="status" className="saved-message">
                <Check size={17} /> Your parking location is saved.
              </p>
            )}
            <section className="reassurance">
              <div className="reassurance-icon">
                <ShieldCheck size={21} strokeWidth={1.5} />
              </div>
              <div>
                <h3>A reminder that stays with you.</h3>
                <p>
                  Your spot stays saved until you replace it. No accounts, no
                  tracking, no automatic expiry.
                </p>
              </div>
              <span className="local-badge">ON YOUR DEVICE</span>
            </section>
            <section className="how-it-works" aria-label="How it works">
              <p className="eyebrow">A SMALL HABIT. A BETTER DAY.</p>
              <div className="steps">
                <div>
                  <span>01</span>
                  <h3>Park your car</h3>
                  <p>Go ahead. Take any available spot.</p>
                </div>
                <div>
                  <span>02</span>
                  <h3>Save the details</h3>
                  <p>Your garage, level, and row.</p>
                </div>
                <div>
                  <span>03</span>
                  <h3>Walk back with confidence</h3>
                  <p>Your location is here when you return.</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <footer>
        <span className="footer-brand">
          <CarFront size={17} /> FindCarParked
        </span>
        <p>
          Stored in this browser. Clearing website data or browser storage
          eviction can remove saved locations.
        </p>
        <span className="footer-tag">Made for the way back.</span>
      </footer>
    </div>
  );
}
