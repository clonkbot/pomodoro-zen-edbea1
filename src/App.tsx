import { useState, useEffect, useCallback, useRef } from 'react';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerConfig {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

const TIMER_DURATIONS: TimerConfig = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

function App() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const totalTime = TIMER_DURATIONS[mode];
  const progress = 1 - timeLeft / totalTime;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModeChange = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
    setIsRunning(false);
  }, []);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(TIMER_DURATIONS[mode]);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'focus') {
        setCompletedPomodoros((prev) => prev + 1);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode]);

  // SVG circle calculations
  const size = 320;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="min-h-[100dvh] bg-stone-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background texture overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative ink wash circles */}
      <div className="absolute top-10 right-10 md:top-20 md:right-20 w-32 h-32 md:w-64 md:h-64 rounded-full bg-gradient-radial from-stone-300/40 to-transparent blur-2xl" />
      <div className="absolute bottom-20 left-5 md:bottom-40 md:left-20 w-24 h-24 md:w-48 md:h-48 rounded-full bg-gradient-radial from-amber-200/30 to-transparent blur-xl" />

      <main className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Header */}
        <header className="text-center mb-6 md:mb-10">
          <h1 className="font-display text-3xl md:text-4xl text-stone-800 tracking-wide mb-2">
            Pomodoro
          </h1>
          <p className="font-body text-stone-500 text-sm md:text-base tracking-widest uppercase">
            {MODE_LABELS[mode]}
          </p>
        </header>

        {/* Timer Circle */}
        <div className="relative mb-8 md:mb-12">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 w-64 h-64 md:w-80 md:h-80"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#d6d3d1"
              strokeWidth={strokeWidth}
              className="opacity-50"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={mode === 'focus' ? '#c2410c' : '#059669'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
              style={{
                filter: 'url(#inkEffect)',
              }}
            />
            {/* Ink brush filter */}
            <defs>
              <filter id="inkEffect">
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
              </filter>
            </defs>
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl md:text-7xl text-stone-800 tracking-tight tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <div className="flex items-center gap-1 mt-2 md:mt-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors duration-300 ${
                    i < completedPomodoros % 4 ? 'bg-orange-700' : 'bg-stone-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 md:gap-4 mb-8 md:mb-12">
          <button
            onClick={toggleTimer}
            className={`px-8 md:px-12 py-3 md:py-4 font-body text-sm md:text-base tracking-widest uppercase transition-all duration-300 ${
              isRunning
                ? 'bg-stone-800 text-stone-100 hover:bg-stone-700'
                : 'bg-orange-700 text-stone-100 hover:bg-orange-600'
            }`}
            style={{
              clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
            }}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="px-4 md:px-6 py-3 md:py-4 font-body text-sm md:text-base tracking-widest uppercase bg-transparent border border-stone-400 text-stone-600 hover:bg-stone-200 hover:border-stone-500 transition-all duration-300"
          >
            Reset
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 px-4">
          {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3 md:px-5 py-2 md:py-2.5 font-body text-xs md:text-sm tracking-wider uppercase transition-all duration-300 ${
                mode === m
                  ? 'bg-stone-800 text-stone-100'
                  : 'bg-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-200'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Session count */}
        <div className="mt-8 md:mt-12 text-center">
          <p className="font-body text-stone-400 text-xs md:text-sm tracking-wider">
            {completedPomodoros} {completedPomodoros === 1 ? 'session' : 'sessions'} completed
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center">
        <p className="font-body text-stone-400 text-xs tracking-wider">
          Requested by @brandonn2221 · Built by @clonkbot
        </p>
      </footer>
    </div>
  );
}

export default App;
