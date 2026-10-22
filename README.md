# Minimal Floating Flip Clock for Windows

An elegant, unobtrusive, floating split-flap clock widget for Windows 10 and Windows 11. Designed specifically for focused coding and studying.

---

## 🌟 Key Features

- **Split-Flap Aesthetic**: Authentic 3D digit cards with a subtle horizontal split line, side notches, and genuine fold-down animations.
- **Ultra-Compact Floating Widget**: Minimal default size (~154 × 62 px) showing only hours & minutes (`HH:MM`).
- **Extend / Collapse Feature**: A small extend icon (`⤢`) seamlessly expands the widget into the full control interface (~270 × 168 px), and collapses back to the minimal flip clock.
- **Three Distinct Backgrounds**: Instantly tell modes apart with customized deep dark gradients:
  - **Timer**: Warm Amber / Espresso (`#351a05` -> `#0f0701`)
  - **Work**: Deep Emerald / Forest Mint (`#07311e` -> `#010e08`)
  - **Clock**: Midnight / Sapphire Cyan (`#0a2b4e` -> `#010915`)
- **12-Hour & 24-Hour Clock**: Toggle between 12-hour (with sleek `AM`/`PM` indicator) and 24-hour time.
- **Custom Countdown Setter**: Set both custom hours and minutes or choose from one-click presets (`5m`, `15m`, `25m`, `45m`, `1h`).
- Automatically halts at `00:00` without running into negative values.
- Preserves remaining time when paused or when switching between modes.

### 2. Mode B: Work Timer (`Mint Green #10b981`)
- **Active Work vs. Breaks**: Manually tracks actual work time vs. break duration.
- **Launch behavior**: When Windows or the app launches, the widget opens with the work timer safely stopped at `00:00:00`.
- **Work Session**: Click `Start` to begin tracking active work upward (`HH:MM:SS`) with a subtle `● WORK` mint indicator.
- **Break Measurement**: Click `Pause` to freeze active work and immediately begin measuring break duration using the same flip digits, accompanied by a subtle `● BREAK` indicator.
- **Resume**: Click `Resume` to end the break and continue tracking cumulative work time from where it left off.
- **Accuracy**: Cumulative work time strictly equals the sum of active work sessions (break time is never added to work time).
- **Persistence**: Work time is saved across mode switches and application restarts. Time while the app is closed is never counted.

### 3. Mode C: Live Clock (`Cool Cyan #06b6d4`)
- Displays local system time in `HH:MM:SS`.
- Ticks synchronized to exact OS second boundaries to eliminate clock drift.
- Minimalist, distraction-free display with no extraneous controls.

---

## 🛡️ Security & Architecture

- **Context Isolation**: Enabled (`contextIsolation: true`).
- **Node Integration**: Disabled in renderer (`nodeIntegration: false`).
- **Sandboxed IPC**: Strict, secure IPC bridge through `electron/preload.js` exposing only necessary window and persistence methods.
- **100% Offline**: No telemetry, no external network requests, zero accounts or cloud dependencies.

---

## 📂 Project Structure

```text
clock/
├── electron/
│   ├── main.js             # Electron main process (window, snapping, IPC, startup, store)
│   └── preload.js          # Safe IPC bridge with contextIsolation
├── src/
│   ├── components/
│   │   ├── FlipDigit.jsx   # 3D split-flap digit card with top/bottom folds
│   │   ├── FlipClock.jsx   # Digit pair grouping and colon separators
│   │   ├── Controls.jsx    # Mode-specific control bar and duration input
│   │   ├── ModeSelector.jsx# Header mode tabs, settings, and close button
│   │   └── SettingsModal.jsx # Startup toggle and corner jump grid
│   ├── hooks/
│   │   ├── useLiveClock.js # Drift-free local time hook
│   │   ├── useCountdownTimer.js # Timestamp-based countdown hook
│   │   └── useWorkTimer.js # Cumulative work & break tracking hook
│   ├── utils/
│   │   └── time.js         # Formatting and conversion utilities
│   ├── App.jsx             # Main container with pointer capture drag
│   ├── index.css           # Vanilla CSS with 3D perspective animations
│   └── main.jsx            # React root
├── test/
│   └── timer.test.mjs      # Unit verification tests
├── package.json
├── vite.config.mjs
└── index.html
```

---

## 🚀 Development & Build Commands

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Windows 10 or 11

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Launches Vite dev server and Electron simultaneously with hot-reloading:
```bash
npm run dev
```

### 3. Run Unit Tests
Verifies time calculations, formatting, and cumulative work simulation:
```bash
node test/timer.test.mjs
```

### 4. Build Vite UI Production Assets
```bash
npm run build:vite
```

### 5. Build Standalone Unpacked Executable
Generates `release/win-unpacked/FlipClock.exe` which can be executed directly without installation:
```bash
npm run pack
```

### 6. Build Windows Distributable Installer
Generates `release/FlipClock Setup 1.0.0.exe`:
```bash
npm run build
# Or directly:
npm run build:electron
```

---

## 🖥️ Corner Snapping & Multi-Monitor Support

The widget implements an intelligent corner-snapping system:
1. **Interactive Dragging**: Left-click and drag anywhere on the widget surface (except active buttons). Pointer capture ensures smooth tracking even at high cursor speeds.
2. **Display Detection**: When released, the widget identifies the display closest to its center point (`screen.getDisplayNearestPoint`).
3. **Usable Work Area**: Respects the Windows taskbar (whether positioned at the bottom, top, left, or right) and reserves a 16px border margin.
4. **Smooth Animation**: Interpolates position to the closest of the 4 corners using a cubic ease-out curve (~160 ms).
5. **Display Changes**: Automatically repositions if monitor resolution or display scaling changes.
