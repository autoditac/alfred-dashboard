# Component Version Tracking Implementation

## Overview
Added functionality to display update information for Sunray Rover Firmware and CaSSAndRA Path Planner with links to commits (for alphas) or release notes (for releases).

## Backend Changes (`server/index.js`)

### New Endpoint: `/api/components`
Returns version information for system components with the following structure:

```json
{
  "components": [
    {
      "name": "Sunray Rover Firmware",
      "version": "1.0.331-autoditac.1",
      "channel": "alpha",      // or "release"
      "sha": "abc1234",        // only for alpha builds
      "timestamp": 1713607200000,
      "link": "https://github.com/autoditac/Sunray/commit/abc1234"
    }
  ],
  "lastUpdate": "2026-04-20T18:13:16.889Z"
}
```

### Version Parsing Logic
- **Alpha detection**: Matches `{version}-alpha.{7-char-hex-sha}`
  - Example: `1.0.331-autoditac.1-alpha.abc1234`
  - Generates link to GitHub commit: `https://github.com/autoditac/Sunray/commit/abc1234`

- **Release detection**: Clean version without `-alpha` suffix
  - Example: `1.0.331-autoditac.1`
  - Generates link to GitHub release: `https://github.com/autoditac/Sunray/releases/tag/v{version}`

### Sunray Firmware Version
- Extracted from existing `sunray.getCachedVersion().version` field
- Parsed to detect channel (alpha/release) and commit SHA

### CaSSAndRA Path Planner Version
Attempted via multiple fallback methods:
1. **podman images**: Query container image tag via `podman images ghcr.io/eineinfach/cassandra --format={{.Tag}}`
2. **API fallback**: Try `http://localhost:3001/api/version` if podman fails
3. **Returns null** if neither method succeeds

## Frontend Changes

### New Component: `ComponentVersionsCard.svelte`
Located at `src/components/ComponentVersionsCard.svelte`

Displays:
- Component name
- Current version (monospace font)
- Channel badge (blue for alpha, green for release)
- Short commit SHA (alpha builds only)
- Clickable external link button to GitHub
- Last update timestamp

### Updated API Module: `src/lib/api.js`
Added `getComponents()` function that calls `/api/components` endpoint

### Updated Main App: `src/App.svelte`
- **Imports**: Added `ComponentVersionsCard` import and `getComponents` from api
- **State**: Added `components` state variable
- **Polling**: Added `pollComponents()` function that runs every 60 seconds
- **Update tracking**: Similar to firmware tracking:
  - Uses `alfred.componentsAck.v1` to store acknowledged version
  - Uses `alfred.componentsPrev.v1` to store previous version
  - Infrastructure in place for future update detection UI
- **Display**: Added `ComponentVersionsCard` to status tab grid

## Version Tracking Architecture

Component updates are tracked using localStorage keys (similar to firmware updates):
- `alfred.componentsAck.v1`: Stores the acknowledged component versions
- `alfred.componentsPrev.v1`: Stores the previous component versions

This enables:
- Detecting when components are updated
- Showing update notifications (infrastructure ready)
- Acknowledging updates to prevent repeated notifications

## Features

✅ Automatic polling every 60 seconds
✅ Detects alpha vs release builds
✅ Extracts commit SHAs from alpha version strings
✅ Generates correct GitHub links for both alpha and release
✅ Shows channel-specific styling (blue for alpha, green for release)
✅ Displays last update timestamp
✅ Graceful handling of missing CaSSAndRA info
✅ Mock data for development/testing
✅ Update tracking infrastructure ready for future enhancements

## Testing

### API Endpoint
```bash
curl http://localhost:3000/api/components
# Returns:
# {"components":[{"name":"Sunray Rover Firmware","version":"1.0.331-autoditac.1","channel":"alpha","sha":"abc1234","timestamp":1776708796816,"link":"https://github.com/autoditac/Sunray/commit/abc1234"}],"lastUpdate":"2026-04-20T18:13:16.889Z"}
```

### Frontend Build
```bash
npm run build
# Compiles successfully without errors
```

## Limitations & Future Improvements

1. **CaSSAndRA Detection**: 
   - Requires either podman to be available or CaSSAndRA API to be running
   - Falls back silently if neither available
   - Could be enhanced to query container logs or config files

2. **Update Notifications**:
   - Infrastructure ready for showing modals/badges when updates detected
   - Not yet implemented in UI (similar pattern to firmware updates available)

3. **Version History**:
   - Only tracks current version
   - Could be extended to show version history or changelogs

## Files Modified

- `server/index.js` - Added `/api/components` endpoint and version parsing logic
- `server/mock.js` - Updated mock version to `1.0.331-autoditac.1-alpha.abc1234` for testing
- `src/lib/api.js` - Added `getComponents()` function
- `src/App.svelte` - Added component polling and display
- `src/components/ComponentVersionsCard.svelte` - New component (created)

## Files Created

- `src/components/ComponentVersionsCard.svelte` - New card component for displaying versions
- `COMPONENT_TRACKING.md` - This documentation file
