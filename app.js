const DATA_URL = "data/journal.json";

let entries = [];
let currentIndex = 0;
let playTimer = null;
let map = null;
let markers = [];
let routeLine = null;
let previewObjectUrl = null;

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
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  playBtn: document.getElementById("playBtn"),
  menuToggle: document.getElementById("menuToggle"),
  menuClose: document.getElementById("menuClose"),
  editorPanel: document.getElementById("editorPanel"),
  form: document.getElementById("entryForm"),
  generatedJson: document.getElementById("generatedJson"),
  previewEntryBtn: document.getElementById("previewEntryBtn"),
  copyEntryBtn: document.getElementById("copyEntryBtn"),
  downloadJsonBtn: document.getElementById("downloadJsonBtn"),
  formDate: document.getElementById("formDate"),
  formCountry: document.getElementById("formCountry"),
  formCity: document.getElementById("formCity"),
  formPlace: document.getElementById("formPlace"),
  formImage: document.getElementById("formImage"),
  formImageFile: document.getElementById("formImageFile"),
  formDescription: document.getElementById("formDescription"),
  formFactIcon: document.getElementById("formFactIcon"),
  formFactTitle: document.getElementById("formFactTitle"),
  formFact: document.getElementById("formFact"),
  formLat: document.getElementById("formLat"),
  formLng: document.getElementById("formLng"),
  formAlt: document.getElementById("formAlt")
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
  markers.forEach((marker) => marker?.remove());
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

  updateMarkerStates();

  if (map && entry.map?.lat && entry.map?.lng) {
    map.flyTo([entry.map.lat, entry.map.lng], Math.max(map.getZoom(), 5), {
      animate: true,
      duration: 1.2
    });

    if (markers[currentIndex]) {
      setTimeout(() => markers[currentIndex]?.openPopup(), 300);
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

function toggleEditor(forceState) {
  const shouldOpen = typeof forceState === "boolean" ? forceState : !ui.editorPanel.classList.contains("open");
  ui.editorPanel.classList.toggle("open", shouldOpen);
  ui.editorPanel.setAttribute("aria-hidden", String(!shouldOpen));
  ui.menuToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function buildEntryFromForm() {
  const localFile = ui.formImageFile.files?.[0] || null;
  const localImageUrl = localFile ? getPreviewObjectUrl(localFile) : null;

  return {
    bookTitle: ui.bookTitle.textContent || "Książeczka naszej Maskotki",
    date: ui.formDate.value.trim() || "Do uzupełnienia",
    country: ui.formCountry.value.trim() || "Do uzupełnienia",
    city: ui.formCity.value.trim() || "Do uzupełnienia",
    place: ui.formPlace.value.trim() || "Do uzupełnienia",
    image: localImageUrl || ui.formImage.value.trim() || "images/placeholder.svg",
    imageRepoPath: ui.formImage.value.trim() || "images/placeholder.svg",
    alt: ui.formAlt.value.trim() || `Maskotka w miejscu: ${ui.formPlace.value.trim() || "Do uzupełnienia"}`,
    description: ui.formDescription.value.trim() || "Opis do uzupełnienia.",
    factTitle: ui.formFactTitle.value.trim() || "Ciekawostka:",
    factIcon: ui.formFactIcon.value.trim() || "🌍",
    fact: ui.formFact.value.trim() || "Ciekawostka do uzupełnienia.",
    map: {
      lat: Number(ui.formLat.value || 0),
      lng: Number(ui.formLng.value || 0)
    }
  };
}

function buildPersistableEntry(entry) {
  return {
    bookTitle: entry.bookTitle,
    date: entry.date,
    country: entry.country,
    city: entry.city,
    place: entry.place,
    image: entry.imageRepoPath || entry.image,
    alt: entry.alt,
    description: entry.description,
    factTitle: entry.factTitle,
    factIcon: entry.factIcon,
    fact: entry.fact,
    map: {
      lat: entry.map.lat,
      lng: entry.map.lng
    }
  };
}

function updateGeneratedJson(entry) {
  const persistable = buildPersistableEntry(entry);
  ui.generatedJson.value = JSON.stringify(persistable, null, 2);
}

function previewFormEntry() {
  const entry = buildEntryFromForm();
  updateGeneratedJson(entry);

  ui.bookTitle.textContent = entry.bookTitle;
  ui.entryImage.src = entry.image;
  ui.entryImage.alt = entry.alt;
  ui.entryCaption.textContent = `${entry.city} - ${entry.place}`;
  ui.entryDescription.textContent = entry.description;
  ui.factIcon.textContent = entry.factIcon;
  ui.factTitle.textContent = entry.factTitle;
  ui.factText.textContent = entry.fact;
  ui.entryCountry.textContent = entry.country;
  ui.entryCity.textContent = entry.city;
  ui.entryDate.textContent = entry.date;

  if (map && entry.map?.lat && entry.map?.lng) {
    map.flyTo([entry.map.lat, entry.map.lng], 14, {
      animate: true,
      duration: 1.1
    });
  }
}

async function copyEntryJson() {
  if (!ui.generatedJson.value.trim()) {
    updateGeneratedJson(buildEntryFromForm());
  }

  try {
    await navigator.clipboard.writeText(ui.generatedJson.value);
    ui.copyEntryBtn.textContent = "Skopiowano";
    setTimeout(() => {
      ui.copyEntryBtn.textContent = "Kopiuj wpis JSON";
    }, 1400);
  } catch (error) {
    ui.copyEntryBtn.textContent = "Nie udało się skopiować";
    setTimeout(() => {
      ui.copyEntryBtn.textContent = "Kopiuj wpis JSON";
    }, 1600);
  }
}

function downloadUpdatedJson() {
  const entry = buildEntryFromForm();
  updateGeneratedJson(entry);

  const payload = {
    entries: [...entries.map(buildPersistableEntry), buildPersistableEntry(entry)]
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "journal.json";
  link.click();
  URL.revokeObjectURL(url);
}

function getPreviewObjectUrl(file) {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
  }
  previewObjectUrl = URL.createObjectURL(file);
  return previewObjectUrl;
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

  ui.menuToggle.addEventListener("click", () => toggleEditor());
  ui.menuClose.addEventListener("click", () => toggleEditor(false));
  ui.previewEntryBtn.addEventListener("click", previewFormEntry);
  ui.copyEntryBtn.addEventListener("click", copyEntryJson);
  ui.downloadJsonBtn.addEventListener("click", downloadUpdatedJson);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleEditor(false);
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
