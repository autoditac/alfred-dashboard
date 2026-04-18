# Alfred Dashboard

Lightweight status and control app for [Alfred](https://alfred.grauonline.de/)
mowers running the [Sunray](https://github.com/Ardumower/Sunray) firmware.
Designed for quick at-a-glance checks from a phone — complex operations
(map editing, mowing schedules, path planning) are handled by
[CaSSAndRA](https://github.com/EinEinfach/CaSSAndRA).

## Features

- **Live telemetry** — GPS position, satellite count, fix quality, battery
  voltage, motor current, lateral error
- **WiFi signal** — reads signal strength directly from the OS
  (`/proc/net/wireless`), not from the firmware
- **Mower control** — start, stop, dock, skip waypoint, reboot
- **PWA** — installable as a home-screen app on iOS and Android
- **Hostname display** — shows the mower's hostname instead of a generic title

## Architecture

```
┌─────────────────────────────────────┐
│  Browser (Svelte 5 SPA)            │
│  polls /api/status every 2 s       │
└──────────────┬──────────────────────┘
               │ HTTP
┌──────────────▼──────────────────────┐
│  Hono backend (Node.js, port 3000) │
│  proxies AT commands to Sunray     │
│  reads /proc/net/wireless for WiFi │
│  reads os.hostname() for title     │
└──────────────┬──────────────────────┘
               │ HTTP POST (AT protocol)
┌──────────────▼──────────────────────┐
│  Sunray firmware (port 80)         │
│  AT+S status, AT+T stats, AT+V ver │
└─────────────────────────────────────┘
```

The backend caches Sunray responses and polls independently so the browser
never talks to the firmware directly.

## Development

```bash
npm install
npm run dev       # Vite dev server with HMR (port 5173)
npm run server    # Hono backend (port 3000)
```

Set `MOCK=1` to run the backend with simulated data (no mower needed):

```bash
MOCK=1 npm run server
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `SUNRAY_HOST` | `localhost` | Sunray firmware HTTP host |
| `SUNRAY_PORT` | `80` | Sunray firmware HTTP port |
| `SUNRAY_PASS` | `123456` | AT protocol password (for Caesar cipher handshake) |
| `PORT` | `3000` | Dashboard listen port |
| `MOCK` | — | Set to `1` for simulated data |

## Container build

```bash
docker buildx build --platform linux/arm64 \
  -t ghcr.io/autoditac/alfred-dashboard:latest .
```

## Deployment

Runs as a Podman Quadlet on the mower's Raspberry Pi (host networking):

```ini
# /etc/containers/systemd/alfred-dashboard.container
[Container]
Image=ghcr.io/autoditac/alfred-dashboard:latest
Network=host
Environment=SUNRAY_HOST=127.0.0.1
```

Managed by the [alfred-ansible](https://github.com/autoditac/alfred-ansible)
role (`services` tag).

## Project structure

```
alfred-dashboard/
  src/
    App.svelte              Main layout — status grid + control tab
    lib/api.js              Fetch wrapper for /api/* endpoints
    components/
      Header.svelte         Hostname, firmware + MCU version, WiFi signal, connection dot
      StatusBadge.svelte    Operation state (IDLE / MOW / CHARGE / ERROR)
      BatteryCard.svelte    Voltage and current
      GpsCard.svelte        Satellites, fix, accuracy, DGPS age
      OperationCard.svelte  Mow progress, lateral error
      StatsCard.svelte      Cumulative stats (mow time, distance, recoveries)
      ControlPanel.svelte   Start / stop / dock / reboot buttons
      ConnectionLost.svelte Offline overlay
  server/
    index.js                Hono API server
    sunray.js               AT command client with CRC and Caesar cipher
    mock.js                 Simulated data for development
  public/
    manifest.json           PWA manifest
    favicon.svg             App icon (SVG)
    icon-192.png            App icon (192×192 PNG)
    icon-512.png            App icon (512×512 PNG)
  deploy/
    alfred-dashboard.container   Podman Quadlet file
```
