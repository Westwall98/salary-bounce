import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Clock, Wallet, Coffee, X } from "lucide-react";

const DEFAULT_CONFIG = {
  salary: 1000,
  start: "09:00",
  end: "18:00",
  lunchStart: "12:00",
  lunchEnd: "13:00",
};

function timeToMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function getWorkMinutes(config) {
  const start = timeToMinutes(config.start);
  const end = timeToMinutes(config.end);
  const lunchStart = timeToMinutes(config.lunchStart);
  const lunchEnd = timeToMinutes(config.lunchEnd);

  return (end - start) - (lunchEnd - lunchStart);
}

function App() {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("work-money-config");

    if (saved) {
      return JSON.parse(saved);
    }

    return DEFAULT_CONFIG;
  });

  const [now, setNow] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [rateMode, setRateMode] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const currentMinutes =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const start = timeToMinutes(config.start);
    const end = timeToMinutes(config.end);

    const lunchStart = timeToMinutes(config.lunchStart);
    const lunchEnd = timeToMinutes(config.lunchEnd);

    const totalWorkMinutes = getWorkMinutes(config);

    let workedMinutes = 0;

    if (currentMinutes > start) {
      workedMinutes = Math.min(
        currentMinutes - start,
        end - start
      );

      if (currentMinutes > lunchStart) {
        const lunchWorked = Math.min(
          currentMinutes - lunchStart,
          lunchEnd - lunchStart
        );

        workedMinutes -= Math.max(0, lunchWorked);
      }
    }

    workedMinutes = Math.max(
      0,
      Math.min(workedMinutes, totalWorkMinutes)
    );

    const progress =
      totalWorkMinutes > 0
        ? workedMinutes / totalWorkMinutes
        : 0;

    const earned =
      config.salary * progress;

    const remaining =
      Math.max(0, config.salary - earned);

    return {
      totalWorkMinutes,
      workedMinutes,
      progress,
      earned,
      remaining,
    };
  }, [now, config]);

  const dateText = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const timeText = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function saveConfig() {
    localStorage.setItem(
      "work-money-config",
      JSON.stringify(config)
    );

    setShowSettings(false);
  }

  function formatMoney(value) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* Main */}
      <div className="relative flex min-h-screen items-center justify-center px-6">

        <div className="w-full max-w-3xl text-center">

          {/* Date */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="text-sm tracking-wide text-zinc-500">
              {dateText}
          </div>

          <div className="mt-2 text-xs tracking-[0.2em] text-zinc-600">
            {timeText}
          </div>
        </motion.div>

          {/* Money */}
          <motion.div
            layout
            className="text-7xl font-semibold tracking-tight sm:text-8xl"
          >
            <span className="text-zinc-500">¥</span>{" "}
            {formatMoney(stats.earned)}
          </motion.div>

          {/* Earnings Rate */}
          <button
            onClick={() => setRateMode((rateMode + 1) % 3)}
            className="mt-5 inline-flex items-center justify-center gap-2 text-zinc-500 transition hover:text-white"
            title="Click to change rate"
          >
            <Wallet size={16} />

            <span>
              + ¥
              {(() => {
                const perMinute =
                  config.salary / stats.totalWorkMinutes;

                if (rateMode === 0) {
                  return `${(perMinute * 60).toFixed(2)} / hour`;
                }

                if (rateMode === 1) {
                  return `${perMinute.toFixed(2)} / minute`;
                }

                return `${(perMinute / 60).toFixed(3)} / second`;
              })()}
            </span>
          </button>

          {/* Progress */}
          <div className="mx-auto mt-14 max-w-xl">

            <div className="mb-3 flex justify-between text-xs text-zinc-500">
              <span>{config.start}</span>

              <span>
                {(stats.progress * 100).toFixed(1)}%
              </span>

              <span>{config.end}</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">

              <motion.div
                className="h-full rounded-full bg-white"
                animate={{
                  width: `${stats.progress * 100}%`,
                }}
                transition={{
                  duration: 0.5,
                }}
              />

            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-4">

            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur">
              <div className="mb-2 flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Clock size={14} />
                Worked
              </div>

              <div className="text-xl font-medium">
                {formatDuration(stats.workedMinutes)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur">

              <div className="mb-2 flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Coffee size={14} />
                Remaining
              </div>

              <div className="text-xl font-medium">
                ¥{formatMoney(stats.remaining)}
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Settings Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
      >
        <Settings size={20} />
      </motion.button>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-sm rounded-3xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl"
            >

              <div className="mb-6 flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-medium">
                    Settings
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Configure your work schedule
                  </p>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="space-y-5">

                <SettingInput
                  label="Daily Salary"
                  value={config.salary}
                  type="number"
                  onChange={(value) =>
                    setConfig({
                      ...config,
                      salary: Number(value),
                    })
                  }
                />

                <SettingInput
                  label="Work Start"
                  value={config.start}
                  type="time"
                  onChange={(value) =>
                    setConfig({
                      ...config,
                      start: value,
                    })
                  }
                />

                <SettingInput
                  label="Work End"
                  value={config.end}
                  type="time"
                  onChange={(value) =>
                    setConfig({
                      ...config,
                      end: value,
                    })
                  }
                />

                <SettingInput
                  label="Lunch Start"
                  value={config.lunchStart}
                  type="time"
                  onChange={(value) =>
                    setConfig({
                      ...config,
                      lunchStart: value,
                    })
                  }
                />

                <SettingInput
                  label="Lunch End"
                  value={config.lunchEnd}
                  type="time"
                  onChange={(value) =>
                    setConfig({
                      ...config,
                      lunchEnd: value,
                    })
                  }
                />

              </div>

              <button
                onClick={saveConfig}
                className="mt-7 w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Save
              </button>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  );
}

function SettingInput({
  label,
  value,
  type,
  onChange,
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-xs text-zinc-500">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
      />

    </label>
  );
}

export default App;