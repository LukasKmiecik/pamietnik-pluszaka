const DATA_URL = "data/journal.json";

let entries = [];
let currentIndex = 0;
let mapScale = 1;
let playTimer = null;

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
  pinsLayer: document.getElementById("pinsLayer"),
  timeline: document.getElementById("timeline"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  playBtn: document.getElementById("playBtn"),
  zoomInBtn: document.getElementById("zoomInBtn"),
  zoomOutBtn: document.getElementById("zoomOutBtn"),
  mapFrame: document.getElementById("mapFrame"),
  routePath: document.getElementById("routePath"),
  routePathBg: document.getElementById("routePathBg"),
};

function buildRoutePath(points) {
  if (!points.length) return "";

  if (points.length === 1) {
    return `M ${points[0].x},${points[0].y}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    d += ` C ${midX},${prev.y} ${midX},${curr.y} ${curr.x},${curr.y}`;
  }

  return d;
}

function renderPins() {
  ui.pinsLayer.innerHTML = "";

  entries.forEach((entry, index) => {
    const pinWrap = document.createElement("button");
    pinWrap.type = "button";
    pinWrap.className = `pin-wrap ${index === currentIndex ? "active" : ""}`;
    pinWrap.style.left = `${entry.map.x}%`;
    pinWrap.style.top = `${entry.map.y}%`;
    pinWrap.setAttribute("aria-label", `${entry.place} - ${entry.city}`);

    pinWrap.innerHTML = `
      <span class="pin"></span>
      <span class="pin-label">${entry.place}</span>
    `;

    pinWrap.addEventListener("click", () => {
      stopPlayback();
      setCurrentEntry(index);
    });

    ui.pinsLayer.appendChild(pinWrap);
  });
}

function renderTimeline() {
  ui.timeline.innerHTML = "";

  entries.forEach((entry, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `timeline-item ${index === currentIndex ? "active" : ""}`;
    item.innerHTML = `
      <div class="timeline-date">${entry.date}</div>
      <div class="timeline-place">${entry.place}</div>
      <div class="timeline-country">${entry.country} • ${entry.city}</div>
    `;

    item.addEventListener("click", () => {
      stopPlayback();
      setCurrentEntry(index);
    });

    ui.timeline.appendChild(item);
  });
}

function renderRoute() {
  const points = entries.map((entry) => ({
    x: entry.map.svgX,
    y: entry.map.svgY,
  }));

  const path = buildRoutePath(points);
  ui.routePath.setAttribute("d", path);
  ui.routePathBg.setAttribute("d", path);
}

function renderEntry() {
  const entry = entries[currentIndex];
  if (!entry) return;

  ui.bookTitle.textContent = entry.bookTitle || "Książeczka naszej Maskotki";
  ui.entryImage.src = entry.image;
  ui.entryImage.alt = entry.alt || entry.place;
  ui.entryCaption.textContent = `${entry.city} - ${entry.place}`;
  ui.entryDescription.textContent = entry.description;
  ui.factIcon.textContent = entry.factIcon || "🌍";
  ui.factTitle.textContent = entry.factTitle || "Ciekawostka:";
  ui.factText.textContent = entry.fact;
  ui.entryCountry.textContent = entry.country;
  ui.entryCity.textContent = entry.city;
  ui.entryDate.textContent = entry.date;
  ui.mapSubtitle.textContent = `${currentIndex + 1} / ${entries.length} etapów podróży`;

  renderPins();
  renderTimeline();
}

function setCurrentEntry(index) {
  if (index < 0) index = entries.length - 1;
  if (index >= entries.length) index = 0;
  currentIndex = index;
  renderEntry();
}

function zoomMap(multiplier) {
  mapScale *= multiplier;
  mapScale = Math.max(1, Math.min(mapScale, 1.8));
  ui.mapFrame.style.transform = `scale(${mapScale})`;
}

function startPlayback() {
  stopPlayback();
  ui.playBtn.textContent = "Zatrzymaj podróż";

  playTimer = setInterval(() => {
    setCurrentEntry(currentIndex + 1);
  }, 2200);
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

  ui.zoomInBtn.addEventListener("click", () => zoomMap(1.1));
  ui.zoomOutBtn.addEventListener("click", () => zoomMap(0.9));
}

async function loadData() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error("Nie udało się wczytać danych podróży.");
    }

    const data = await response.json();
    entries = data.entries || [];

    if (!entries.length) {
      throw new Error("Brak wpisów w journal.json");
    }

    renderRoute();
    renderEntry();
  } catch (error) {
    console.error(error);
    ui.entryCaption.textContent = "Błąd ładowania danych";
    ui.entryDescription.textContent = error.message;
    ui.factText.textContent = "Sprawdź plik data/journal.json i ścieżki do zdjęć.";
  }
}

bindEvents();
loadData();
