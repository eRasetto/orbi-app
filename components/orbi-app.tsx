"use client";

import Image from "next/image";
import {
  CalendarDays,
  Check,
  Clock3,
  History,
  LoaderCircle,
  Play,
  Save,
  Square,
  Target,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type HistoryRecord = {
  _id: string;
  contador: number;
  fechaInicio: string;
  fechaFin: string;
};

type ConfirmMode = "save" | "stop" | null;

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

function formatElapsed(start: string | null, now: number) {
  if (!start) return "00:00:00";
  const elapsed = Math.max(0, now - new Date(start).getTime());
  const totalSeconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatHistoryDuration(start: string, end: string) {
  const milliseconds = Math.max(
    0,
    new Date(end).getTime() - new Date(start).getTime()
  );
  const totalMinutes = Math.floor(milliseconds / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} d ${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export function OrbiApp() {
  const [count, setCount] = useState(0);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [multiplyMode, setMultiplyMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pulseKey, setPulseKey] = useState(0);

  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const active = Boolean(sessionStart);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    async function loadCounter() {
      try {
        const response = await fetch("/api/counter", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(await readError(response, "No se pudo cargar ORBI"));
        }
        const data = await response.json();
        setCount(typeof data.contador === "number" ? data.contador : 0);
        setSessionStart(data.fechaInicio ?? null);
      } catch (error) {
        setToast({
          type: "error",
          message:
            error instanceof Error ? error.message : "No se pudo cargar ORBI",
        });
      } finally {
        setLoading(false);
      }
    }

    void loadCounter();
  }, []);

  const queueCounterSave = useCallback((value: number) => {
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch("/api/counter/value", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contador: value }),
        });

        if (!response.ok) {
          throw new Error(
            await readError(response, "No se pudo guardar el contador")
          );
        }
      })
      .catch((error) => {
        setToast({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "No se pudo guardar el contador",
        });
      });

    return saveQueue.current;
  }, []);

  const updateCount = useCallback(
    (updater: (current: number) => number) => {
      if (!active || actionBusy) return;
      setCount((current) => {
        const next = updater(current);
        void queueCounterSave(next);
        return next;
      });
      setPulseKey((value) => value + 1);
    },
    [active, actionBusy, queueCounterSave]
  );

  const handleWhite = () => updateCount((value) => value + 1);
  const handleBlack = () => updateCount((value) => value - 1);
  const handleRed = () => {
    const shouldMultiply = multiplyMode;
    updateCount((value) =>
      shouldMultiply ? value * 2 : Math.floor(value / 2)
    );
    setMultiplyMode((value) => !value);
  };

  async function startSession() {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const response = await fetch("/api/counter/start", { method: "POST" });
      if (!response.ok) {
        throw new Error(await readError(response, "No se pudo iniciar la sesión"));
      }
      const data = await response.json();
      setCount(0);
      setMultiplyMode(true);
      setSessionStart(data.fechaInicio);
      setNow(Date.now());
      setToast({ type: "success", message: "Sesión iniciada" });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "No se pudo iniciar la sesión",
      });
    } finally {
      setActionBusy(false);
    }
  }

  async function stopSession() {
    setActionBusy(true);
    try {
      await saveQueue.current;
      const response = await fetch("/api/counter/reset", { method: "POST" });
      if (!response.ok) {
        throw new Error(await readError(response, "No se pudo detener la sesión"));
      }
      setCount(0);
      setSessionStart(null);
      setMultiplyMode(true);
      setConfirmMode(null);
      setToast({ type: "success", message: "Sesión detenida" });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "No se pudo detener la sesión",
      });
    } finally {
      setActionBusy(false);
    }
  }

  async function saveSession() {
    setActionBusy(true);
    try {
      await saveQueue.current;

      const syncResponse = await fetch("/api/counter/value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contador: count }),
      });

      if (!syncResponse.ok) {
        throw new Error(
          await readError(syncResponse, "No se pudo sincronizar el contador")
        );
      }

      const response = await fetch("/api/history", { method: "POST" });
      if (!response.ok) {
        throw new Error(await readError(response, "No se pudo guardar la sesión"));
      }

      setCount(0);
      setSessionStart(null);
      setMultiplyMode(true);
      setConfirmMode(null);
      setToast({ type: "success", message: "Sesión guardada en el historial" });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "No se pudo guardar la sesión",
      });
    } finally {
      setActionBusy(false);
    }
  }

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/history", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await readError(response, "No se pudo cargar el historial"));
      }
      const data = await response.json();
      setHistory(data.registros ?? []);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "No se pudo cargar el historial",
      });
    } finally {
      setHistoryLoading(false);
    }
  }

  const elapsed = formatElapsed(sessionStart, now);

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="app-frame">
        <header className="topbar">
          <div className="brand-wrap">
            <div className="brand-mark" aria-hidden="true">
              <span />
            </div>
            <div>
              <p className="eyebrow">CONTADOR</p>
              <h1 className="brand">ORBI</h1>
            </div>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={() => void openHistory()}
            aria-label="Abrir historial"
          >
            <History size={20} strokeWidth={1.8} />
          </button>
        </header>

        <div className="content-grid">
          <section className="counter-card" aria-live="polite">
            <div className="counter-header">
              <div className={`status-pill ${active ? "active" : ""}`}>
                <span className="status-dot" />
                {active ? "Sesión activa" : "Listo para iniciar"}
              </div>
              {active && (
                <div className="session-time">
                  <Clock3 size={15} strokeWidth={1.8} />
                  {elapsed}
                </div>
              )}
            </div>

            <div className="counter-center">
              {loading ? (
                <LoaderCircle className="spin loading-icon" size={42} />
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={`${count}-${pulseKey}`}
                    className={`counter-number ${count < 0 ? "negative" : ""}`}
                    initial={{ scale: 0.92, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.05, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                  >
                    {count}
                  </motion.div>
                </AnimatePresence>
              )}
              <p className="counter-label">ORbis acumulados</p>
            </div>

            <div className="counter-footer">
              <span>{active ? "Tocá un Orbi para registrar" : "Iniciá una sesión para contar"}</span>
            </div>
          </section>

          <section className="orbi-panel" aria-label="Acciones ORBI">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">ACCIONES</p>
                <h2>Elegí un Orbi</h2>
              </div>
              <span className="shortcut-hint">1 · 2 · 3</span>
            </div>

            <div className="orbi-grid">
              <OrbiButton
                image="/images/orbi-blanco.png"
                title="Blanco"
                value="+1"
                tone="white"
                disabled={!active || actionBusy}
                onClick={handleWhite}
              />
              <OrbiButton
                image="/images/orbi-negro.png"
                title="Negro"
                value="−1"
                tone="black"
                disabled={!active || actionBusy}
                onClick={handleBlack}
              />
              <OrbiButton
                image="/images/orbi-rojo.png"
                title="Rojo"
                value={multiplyMode ? "×2" : "÷2"}
                tone="red"
                disabled={!active || actionBusy}
                onClick={handleRed}
                highlighted={!multiplyMode}
              />
            </div>
          </section>
        </div>

        <nav className="control-dock" aria-label="Controles de sesión">
          <button
            className="dock-action primary"
            type="button"
            disabled={active || actionBusy || loading}
            onClick={() => void startSession()}
          >
            <Play size={18} fill="currentColor" />
            <span>Iniciar</span>
          </button>
          <button
            className="dock-action"
            type="button"
            disabled={!active || actionBusy}
            onClick={() => setConfirmMode("stop")}
          >
            <Square size={17} fill="currentColor" />
            <span>Detener</span>
          </button>
          <button
            className="dock-action"
            type="button"
            disabled={!active || actionBusy}
            onClick={() => setConfirmMode("save")}
          >
            <Save size={18} />
            <span>Guardar</span>
          </button>
        </nav>
      </section>

      <AnimatePresence>
        {historyOpen && (
          <HistorySheet
            records={history}
            loading={historyLoading}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmMode && (
          <ConfirmDialog
            mode={confirmMode}
            count={count}
            busy={actionBusy}
            onCancel={() => !actionBusy && setConfirmMode(null)}
            onConfirm={() =>
              confirmMode === "save" ? void saveSession() : void stopSession()
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.type}`}
            initial={{ y: 18, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.97 }}
          >
            {toast.type === "success" ? <Check size={17} /> : <X size={17} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function OrbiButton({
  image,
  title,
  value,
  tone,
  disabled,
  highlighted = false,
  onClick,
}: {
  image: string;
  title: string;
  value: string;
  tone: "white" | "black" | "red";
  disabled: boolean;
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      className={`orbi-button ${tone} ${highlighted ? "highlighted" : ""}`}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      aria-label={`Orbi ${title}, ${value}`}
    >
      <div className="orbi-image-wrap">
        <Image
          src={image}
          width={369}
          height={369}
          alt={`Orbi ${title}`}
          priority
        />
      </div>
      <div className="orbi-meta">
        <span className="orbi-name">{title}</span>
        <span className="orbi-value">{value}</span>
      </div>
    </motion.button>
  );
}

function HistorySheet({
  records,
  loading,
  onClose,
}: {
  records: HistoryRecord[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.aside
        className="history-sheet"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 31, stiffness: 320 }}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">ACTIVIDAD</p>
            <h2>Historial</h2>
          </div>
          <button className="icon-button subtle" onClick={onClose} aria-label="Cerrar historial">
            <X size={20} />
          </button>
        </div>

        <div className="history-content">
          {loading ? (
            <div className="history-state">
              <LoaderCircle className="spin" size={28} />
              <p>Cargando sesiones…</p>
            </div>
          ) : records.length === 0 ? (
            <div className="history-state empty">
              <div className="empty-icon"><History size={28} /></div>
              <h3>Todavía no hay sesiones</h3>
              <p>Cuando guardes una sesión, aparecerá acá.</p>
            </div>
          ) : (
            <div className="history-list">
              {records.map((record) => (
                <article className="history-card" key={record._id}>
                  <div className="history-score">
                    <span className="history-score-number">{record.contador}</span>
                    <span className="history-score-label">Orbis</span>
                  </div>
                  <div className="history-details">
                    <div>
                      <CalendarDays size={15} />
                      <span>{formatDate(record.fechaFin)}</span>
                    </div>
                    <div>
                      <Clock3 size={15} />
                      <span>{formatHistoryDuration(record.fechaInicio, record.fechaFin)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
}

function ConfirmDialog({
  mode,
  count,
  busy,
  onCancel,
  onConfirm,
}: {
  mode: Exclude<ConfirmMode, null>;
  count: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const saving = mode === "save";

  return (
    <motion.div
      className="overlay dialog-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <motion.div
        className="confirm-dialog"
        initial={{ y: 18, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.97, opacity: 0 }}
      >
        <div className={`dialog-icon ${saving ? "save" : "stop"}`}>
          {saving ? <Save size={22} /> : <Square size={20} fill="currentColor" />}
        </div>
        <h3>{saving ? "Guardar sesión" : "Detener sesión"}</h3>
        <p>
          {saving
            ? `Se guardarán ${count} Orbis en tu historial y el contador volverá a cero.`
            : "El contador volverá a cero y esta sesión no se guardará en el historial."}
        </p>
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className={`confirm-button ${saving ? "" : "danger"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <LoaderCircle className="spin" size={16} />}
            {saving ? "Guardar" : "Detener"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
