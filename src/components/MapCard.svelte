<script>
  import { onMount } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';

  let { status } = $props();
  let mapEl;
  let map;
  let marker;

  const HEADING_ICON = L.divIcon({
    className: 'mower-icon',
    html: `<svg viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="12" fill="#00c853" fill-opacity="0.25" stroke="#00c853" stroke-width="2"/>
      <polygon points="16,6 22,22 16,18 10,22" fill="#00c853"/>
    </svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  onMount(() => {
    map = L.map(mapEl, {
      zoomControl: false,
      attributionControl: false,
    }).setView([0, 0], 19);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 21,
      maxNativeZoom: 19,
    }).addTo(map);

    L.control.attribution({ prefix: false, position: 'bottomright' })
      .addAttribution('Esri')
      .addTo(map);

    return () => map.remove();
  });

  $effect(() => {
    if (!map || !status?.lat || !status?.lon) return;
    const pos = [status.lat, status.lon];
    if (!marker) {
      marker = L.marker(pos, { icon: HEADING_ICON, rotationAngle: 0 }).addTo(map);
      map.setView(pos, 19);
    } else {
      marker.setLatLng(pos);
    }
    // Rotate the arrow to match heading (radians → degrees)
    const deg = (status.heading ?? 0) * (180 / Math.PI);
    const el = marker.getElement();
    if (el) {
      const svg = el.querySelector('svg');
      if (svg) svg.style.transform = `rotate(${deg}deg)`;
    }
  });
</script>

<div class="card map-card">
  <div class="card-header">
    <span class="card-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    </span>
    <span class="card-title">Position</span>
  </div>
  <div class="map-container" bind:this={mapEl}></div>
  {#if !status?.lat}
    <div class="map-note">Set DOCK_LAT and DOCK_LON to enable the map</div>
  {/if}
</div>

<style>
  .map-card {
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--border);
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px 8px;
  }

  .card-icon {
    width: 18px;
    height: 18px;
    color: var(--text-dim);
  }

  .card-icon svg {
    width: 100%;
    height: 100%;
  }

  .card-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-dim);
  }

  .map-container {
    height: 250px;
    width: 100%;
  }

  .map-note {
    padding: 8px 16px 12px;
    font-size: 0.75rem;
    color: var(--text-dim);
    text-align: center;
  }

  :global(.mower-icon) {
    background: none !important;
    border: none !important;
  }
</style>
