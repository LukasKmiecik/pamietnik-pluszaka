const DATA_URL = './data/journal.json';

const state = {
  entries: [],
  activeId: null,
  markers: new Map(),
  map: null,
  lineBounds: null,
  globeMode: false,
  playbackRunning: false,
};

const elements = {
  stats: document.getElementById('stats'),
  timeline: document.getElementById('timeline'),
  image: document.getElementById('entry-image'),
  countryBadge: document.getElementById('country-badge'),
  date: document.getElementById('entry-date'),
  host: document.getElementById('entry-host'),
  title: document.getElementById('entry-title'),
  story: document.getElementById('entry-story'),
  fact: document.getElementById('entry-fact'),
  place: document.getElementById('entry-place'),
  city: document.getElementById('entry-city'),
  category: document.getElementById('entry-category'),
  legend: document.getElementById('entry-legend'),
  fitRoute: document.getElementById('fit-route'),
  toggleProjection: document.getElementById('toggle-projection'),
  playRoute: document.getElementById('play-route'),
};

init().catch((error) => {
  console.error(error);
  elements.story.textContent = 'Nie udało się wczytać danych pamiętnika. Sprawdź plik data/journal.json.';
});

async function init() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Błąd wczytywania danych: ${response.status}`);
  }

  const payload = await response.json();
  const entries = [...payload.entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  state.entries = entries;
  state.activeId = entries[0]?.id ?? null;

  renderStats(entries);
  renderTimeline(entries);
  setupMap(entries);
  bindUi();

  if (entries.length > 0) {
    setActiveEntry(entries[0].id, { fly: false });
    fitAllEntries();
  }
}

function renderStats(entries) {
  const countryCount = new Set(entries.map((entry) => entry.country)).size;
  const hostCount = new Set(entries.map((entry) => entry.host)).size;

  const cards = [
    { value: entries.length, label: 'miejsc odwiedzonych' },
    { value: hostCount, label: 'dzieci / rodzin' },
    { value: countryCount, label: 'krajów' },
  ];

  elements.stats.innerHTML = cards
    .map(
      (card) => `
        <div class="stat">
          <strong>${card.value}</strong>
          <span>${card.label}</span>
        </div>
      `
    )
    .join('');
}

function renderTimeline(entries) {
  elements.timeline.innerHTML = entries
    .map(
      (entry) => `
        <button class="timeline-item" data-entry-id="${entry.id}">
          <div class="timeline-date">${formatDate(entry.date)}</div>
          <div class="timeline-main">
            <strong>${escapeHtml(entry.place)}</strong>
            <span>${escapeHtml(entry.country)} · ${escapeHtml(entry.host)}</span>
          </div>
        </button>
      `
    )
    .join('');

  elements.timeline.querySelectorAll('[data-entry-id]').forEach((button) => {
    button.addEventListener('click', () => setActiveEntry(button.dataset.entryId));
  });
}

function setupMap(entries) {
  const map = new maplibregl.Map({
    container: 'map',
    center: [12, 50],
    zoom: 2.2,
    pitch: 55,
    bearing: -12,
    antialias: true,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap Contributors',
          maxzoom: 19,
        },
        terrainSource: {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256,
        },
        route: {
          type: 'geojson',
          data: buildRouteGeoJson(entries),
        },
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
        },
        {
          id: 'route-shadow',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#ffffff',
            'line-width': 10,
            'line-opacity': 0.9,
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
        },
        {
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#ef6c57',
            'line-width': 5,
            'line-dasharray': [1.3, 1],
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
        },
      ],
      terrain: {
        source: 'terrainSource',
        exaggeration: 0.7,
      },
      sky: {},
    },
    maxZoom: 17,
    maxPitch: 80,
  });

  map.addControl(
    new maplibregl.NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true,
    }),
    'top-right'
  );

  map.on('load', () => {
    entries.forEach((entry) => {
      const markerNode = document.createElement('button');
      markerNode.className = 'custom-marker';
      markerNode.type = 'button';
      markerNode.setAttribute('aria-label', `Pokaż wpis: ${entry.place}`);
      markerNode.addEventListener('click', () => setActiveEntry(entry.id));

      const popup = new maplibregl.Popup({ offset: 18 }).setHTML(`
        <h4 class="popup-title">${escapeHtml(entry.place)}</h4>
        <p class="popup-text">${escapeHtml(entry.country)} · ${escapeHtml(entry.host)}</p>
      `);

      const marker = new maplibregl.Marker({ element: markerNode, anchor: 'bottom' })
        .setLngLat(entry.coordinates)
        .setPopup(popup)
        .addTo(map);

      state.markers.set(entry.id, { marker, markerNode, popup });
    });

    state.lineBounds = getBounds(entries.map((entry) => entry.coordinates));
  });

  state.map = map;
}

function bindUi() {
  elements.fitRoute.addEventListener('click', fitAllEntries);

  elements.toggleProjection.addEventListener('click', () => {
    state.globeMode = !state.globeMode;
    state.map.setProjection({ type: state.globeMode ? 'globe' : 'mercator' });
  });

  elements.playRoute.addEventListener('click', playRoute);
}

function setActiveEntry(entryId, options = { fly: true }) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) return;

  state.activeId = entry.id;
  updateEntryCard(entry);
  updateTimelineActive(entry.id);
  updateMarkerActive(entry.id);

  if (options.fly && state.map) {
    state.map.flyTo({
      center: entry.coordinates,
      zoom: entry.zoom ?? 5.2,
      pitch: 64,
      bearing: entry.bearing ?? -12,
      speed: 0.8,
      curve: 1.25,
      essential: true,
    });
  }
}

function updateEntryCard(entry) {
  elements.image.src = entry.image || './images/placeholder.svg';
  elements.image.alt = `Maskotka w miejscu: ${entry.place}`;
  elements.countryBadge.textContent = `${entry.flag || '📍'} ${entry.country}`;
  elements.date.textContent = formatDate(entry.date);
  elements.host.textContent = entry.host;
  elements.title.textContent = entry.title;
  elements.story.textContent = entry.story;
  elements.fact.textContent = entry.fact;
  elements.place.textContent = entry.place;
  elements.city.textContent = entry.city || '—';
  elements.category.textContent = entry.category;
  elements.legend.textContent = entry.legend;
}

function updateTimelineActive(entryId) {
  elements.timeline.querySelectorAll('[data-entry-id]').forEach((item) => {
    item.classList.toggle('active', item.dataset.entryId === entryId);
  });
}

function updateMarkerActive(entryId) {
  state.markers.forEach(({ markerNode, popup }, id) => {
    markerNode.classList.toggle('active', id === entryId);
    if (id === entryId) {
      popup.addTo(state.map);
      markerNode.focus({ preventScroll: true });
    }
  });
}

function fitAllEntries() {
  if (!state.lineBounds || !state.map) return;
  state.map.fitBounds(state.lineBounds, {
    padding: { top: 80, right: 80, bottom: 80, left: 80 },
    maxZoom: 4.6,
    duration: 1200,
  });
}

async function playRoute() {
  if (state.playbackRunning || state.entries.length === 0) return;
  state.playbackRunning = true;
  elements.playRoute.disabled = true;
  elements.playRoute.textContent = 'Odtwarzanie…';

  try {
    for (const entry of state.entries) {
      setActiveEntry(entry.id, { fly: true });
      await wait(2100);
    }
  } finally {
    state.playbackRunning = false;
    elements.playRoute.disabled = false;
    elements.playRoute.textContent = 'Odtwórz podróż';
  }
}

function buildRouteGeoJson(entries) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: entries.map((entry) => entry.coordinates),
        },
        properties: {},
      },
    ],
  };
}

function getBounds(coordinates) {
  const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
  coordinates.slice(1).forEach((coord) => bounds.extend(coord));
  return bounds;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
