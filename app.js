const DATA_URL = "data/journal.json";

let entries = [];
let currentIndex = 0;
let playTimer = null;
let map = null;
let markers = [];
let routeLine = null;

const ui = {
  bookTitle: document.getElementById("bookTitle"),
  entryImage: document.getElementById("entryImage"),
  entryCaption: document.getElementById("entryCaption"),
  entryDescription: document.getElementById("entryDescription"),
  factIcon: document.getElementById("factIcon"),
  factTitle: document.getElementById("factTitle"),
  factText: document.getElementById("factText"),
  entryCountry: document.getElementById("entryCountry"),
  entryCity: document.getElementById("entryCity"),
  entryDate: document.getElementById("entryDate"),
  mapSubtitle: document.getElementById("mapSubtitle"),
  timeline: document.getElementById("timeline"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  playBtn: document.getElementById("playBtn"),
};

function createPinIcon(isActive = false) {
  return L.divIcon({
    className: "",
    html: `<div class="map-pin ${isActive ? "active" : ""}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20]
  });
}

function initMap() {
  map = L.map("realMap", {
    zoomControl: false,
    scrollWheelZoom: true
  }).setView([54.5, 15.5], 4);

  L.control.zoom({ position: "topright" }).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
}

function renderMap() {
  markers.forEach((marker) => marker.remove());
  markers = [];

  if (routeLine) {
    routeLine.remove();
    routeLine = null;
  }

  const latlngs = entries
    .filter((entry) => entry.map && typeof entry.map.lat === "number" && typeof entry.map.lng === "number")
    .map((entry) => [entry.map.lat, entry.map.lng]);

  if (latlngs.length > 1) {
    routeLine = L.polyline(latlngs, {
      color: "#d39b19",
      weight: 5,
      dashArray: "10, 10",
      opacity: 0.95
    }).addTo(map);
  }

  entries.forEach((entry, index) => {
    if (!entry.map || typeof entry.map.lat !== "number" || typeof entry.map.lng !== "number") {
      markers.push(null);
      return;
    }

    const marker = L.marker([entry.map.lat, entry.map.lng], {
      icon: createPinIcon(index === currentIndex)
    }).addTo(map);

    marker.bindPopup(`
      <strong>${escapeHtml(entry.city)} - ${escapeHtml(entry.place)}</strong><br>
      ${escapeHtml(entry.country)}<br>
      ${escapeHtml(entry.date)}
    `);

    marker.on("click", () => {
      stopPlayback();
      setCurrentEntry(index);
    });

    markers.push(marker);
  });

  if (latlngs.length) {
    map.fitBounds(latlngs, { padding: [50, 50] });
  }
}

function updateMarkerStates() {
  markers.forEach((marker, index) => {
    if (!marker) return;
    marker.setIcon(createPinIcon(index === currentIndex));
  });
}

function renderTimeline() {
  ui.timeline.innerHTML = "";

  entries.forEach((entry, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `timeline-item ${index === currentIndex ? "active" : ""}`;
    item.innerHTML = `
      <div class="timeline-date">${escapeHtml(entry.date)}</div>
      <div class="timeline-place">${escapeHtml(entry.place)}</div>
      <div class="timeline-country">${escapeHtml(entry.country)} • ${escapeHtml(entry.city)}</div>
    `;

    item.addEventListener("click", () => {
      stopPlayback();
      setCurrentEntry(index);
    });

    ui.timeline.appendChild(item);
  });
}

function renderEntry() {
  const entry = entries[currentIndex];
  if (!entry) return;

  ui.bookTitle.textContent = entry.bookTitle || "Książeczka naszej Maskotki";
  ui.entryImage.src = entry.image;
  ui.entryImage.alt = entry.alt || entry.place || "Zdjęcie maskotki";
  ui.entryCaption.textContent = `${entry.city} - ${entry.place}`;
  ui.entryDescription.textContent = entry.description;
  ui.factIcon.textContent = entry.factIcon || "🌍";
  ui.factTitle.textContent = entry.factTitle || "Ciekawostka:";
  ui.factText.textContent = entry.fact;
  ui.entryCountry.textContent = entry.country;
  ui.entryCity.textContent = entry.city;
  ui.entryDate.textContent = entry.date;
  ui.mapSubtitle.textContent = `${currentIndex + 1} / ${entries.length} etapów podróży`;

  renderTimeline();
  updateMarkerStates();

  if (map && entry.map?.lat && entry.map?.lng) {
    map.flyTo([entry.map.lat, entry.map.lng], Math.max(map.getZoom(), 5), {
      animate: true,
      duration: 1.2
    });

    if (markers[currentIndex]) {
      setTimeout(() => {
        markers[currentIndex].openPopup();
      }, 300);
    }
  }
}

function setCurrentEntry(index) {
  if (index < 0) index = entries.length - 1;
  if (index >= entries.length) index = 0;
  currentIndex = index;
  renderEntry();
}

function startPlayback() {
  stopPlayback();
  ui.playBtn.textContent = "Zatrzymaj podróż";

  playTimer = setInterval(() => {
    setCurrentEntry(currentIndex + 1);
  }, 2500);
}

function stopPlayback() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
  ui.playBtn.textContent = "Odtwórz podróż";
}

function bindEvents() {
  ui.prevBtn.addEventListener("click", () => {
    stopPlayback();
    setCurrentEntry(currentIndex - 1);
  });

  ui.nextBtn.addEventListener("click", () => {
    stopPlayback();
    setCurrentEntry(currentIndex + 1);
  });

  ui.playBtn.addEventListener("click", () => {
    if (playTimer) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadData() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error("Nie udało się wczytać danych podróży.");
    }

    const data = await response.json();
    entries = Array.isArray(data.entries) ? data.entries : [];

    if (!entries.length) {
      throw new Error("Brak wpisów w pliku data/journal.json");
    }

    initMap();
    renderMap();
    renderEntry();
  } catch (error) {
    console.error(error);
    ui.entryCaption.textContent = "Błąd ładowania danych";
    ui.entryDescription.textContent = error.message;
    ui.factText.textContent = "Sprawdź plik data/journal.json, ścieżki do zdjęć i strukturę wpisów.";
  }
}

bindEvents();
loadData();
