const DATA_URL = "data/journal.json";

let entries = [];
let currentIndex = 0;
let currentPhotoIndex = 0;
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
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  playBtn: document.getElementById("playBtn"),
  photoPrevBtn: document.getElementById("photoPrevBtn"),
  photoNextBtn: document.getElementById("photoNextBtn"),
  photoCounter: document.getElementById("photoCounter"),
  photoThumbs: document.getElementById("photoThumbs"),
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

function getEntryImages(entry) {
  if (!entry) return [];

  if (Array.isArray(entry.image)) {
    return entry.image.filter((item) => typeof item === "string" && item.trim() !== "");
  }

  if (typeof entry.image === "string" && entry.image.trim() !== "") {
    return [entry.image];
  }

  return [];
}

function renderPhotoGallery() {
  const entry = entries[currentIndex];
  if (!entry) return;

  const images = getEntryImages(entry);

  if (!images.length) {
    ui.entryImage.src = "";
    ui.entryImage.alt = "Brak zdjęcia";
    ui.photoPrevBtn.classList.add("hidden");
    ui.photoNextBtn.classList.add("hidden");
    ui.photoCounter.classList.add("hidden");
    ui.photoThumbs.classList.add("hidden");
    ui.photoThumbs.innerHTML = "";
    return;
  }

  if (currentPhotoIndex < 0) currentPhotoIndex = 0;
  if (currentPhotoIndex >= images.length) currentPhotoIndex = 0;

  ui.entryImage.src = images[currentPhotoIndex];
  ui.entryImage.alt = entry.alt || entry.place || "Zdjęcie maskotki";

  const manyPhotos = images.length > 1;

  ui.photoPrevBtn.classList.toggle("hidden", !manyPhotos);
  ui.photoNextBtn.classList.toggle("hidden", !manyPhotos);
  ui.photoCounter.classList.toggle("hidden", !manyPhotos);
  ui.photoThumbs.classList.toggle("hidden", !manyPhotos);

  ui.photoCounter.textContent = `${currentPhotoIndex + 1} / ${images.length}`;

  ui.photoThumbs.innerHTML = "";

  if (manyPhotos) {
    images.forEach((src, index) => {
      const thumbBtn = document.createElement("button");
      thumbBtn.type = "button";
      thumbBtn.className = `photo-thumb ${index === currentPhotoIndex ? "active" : ""}`;
      thumbBtn.setAttribute("aria-label", `Pokaż zdjęcie ${index + 1}`);

      thumbBtn.innerHTML = `<img src="${src}" alt="Miniatura ${index + 1}" />`;

      thumbBtn.addEventListener("click", () => {
        currentPhotoIndex = index;
        renderPhotoGallery();
      });

      ui.photoThumbs.appendChild(thumbBtn);
    });
  }
}

function renderEntry() {
  const entry = entries[currentIndex];
  if (!entry) return;

  ui.bookTitle.textContent = entry.bookTitle || "Książeczka naszej Maskotki";
  ui.entryCaption.textContent = `${entry.city} - ${entry.place}`;
  ui.entryDescription.textContent = entry.description;
  ui.factIcon.textContent = entry.factIcon || "🌍";
  ui.factTitle.textContent = entry.factTitle || "Ciekawostka:";
  ui.factText.textContent = entry.fact;
  ui.entryCountry.textContent = entry.country;
  ui.entryCity.textContent = entry.city;
  ui.entryDate.textContent = entry.date;
  ui.mapSubtitle.textContent = `${currentIndex + 1} / ${entries.length} etapów podróży`;

  renderPhotoGallery();
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
  currentPhotoIndex = 0;
  renderEntry();
}

function showPrevPhoto() {
  const images = getEntryImages(entries[currentIndex]);
  if (images.length <= 1) return;

  currentPhotoIndex = (currentPhotoIndex - 1 + images.length) % images.length;
  renderPhotoGallery();
}

function showNextPhoto() {
  const images = getEntryImages(entries[currentIndex]);
  if (images.length <= 1) return;

  currentPhotoIndex = (currentPhotoIndex + 1) % images.length;
  renderPhotoGallery();
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

  ui.photoPrevBtn.addEventListener("click", showPrevPhoto);
  ui.photoNextBtn.addEventListener("click", showNextPhoto);

  document.addEventListener("keydown", (event) => {
    const images = getEntryImages(entries[currentIndex]);
    if (images.length <= 1) return;

    if (event.key === "ArrowLeft") {
      showPrevPhoto();
    }

    if (event.key === "ArrowRight") {
      showNextPhoto();
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

    requestAnimationFrame(() => {
      if (map) map.invalidateSize();
    });
  } catch (error) {
    console.error(error);
    ui.entryCaption.textContent = "Błąd ładowania danych";
    ui.entryDescription.textContent = error.message;
    ui.factText.textContent = "Sprawdź plik data/journal.json, ścieżki do zdjęć i strukturę wpisów.";
  }
}

bindEvents();
loadData();

window.addEventListener("resize", () => {
  if (map) {
    setTimeout(() => map.invalidateSize(), 120);
  }
});
