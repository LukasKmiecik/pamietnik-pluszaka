# Roczna podróż naszej maskotki

Gotowa statyczna strona do wrzucenia na GitHub Pages albo Cloudflare Pages.

## Co już działa

- duże zdjęcie po lewej
- opis, ciekawostka i pytanie / legenda pod zdjęciem
- interaktywna mapa MapLibre z efektem 3D
- pinezki dla kolejnych etapów podróży
- linia trasy przez cały rok
- oś czasu
- przycisk „Odtwórz podróż”
- łatwe dodawanie nowych wpisów przez `data/journal.json`

## Struktura plików

```text
maskotka-github-repo/
├─ index.html
├─ styles.css
├─ app.js
├─ data/
│  └─ journal.json
├─ images/
│  └─ placeholder.svg
└─ README.md
```

## Jak uruchomić lokalnie

Najprościej przez prosty serwer statyczny, bo `fetch()` nie działa poprawnie przy zwykłym otwieraniu pliku `index.html` z dysku.

### Opcja 1: VS Code + Live Server
1. Otwórz folder w VS Code.
2. Zainstaluj rozszerzenie **Live Server**.
3. Kliknij prawym na `index.html` → **Open with Live Server**.

### Opcja 2: Python

```bash
python -m http.server 8000
```

Potem wejdź na:

```text
http://localhost:8000
```

## Jak dodać nowy etap podróży

1. Wrzuć zdjęcie do folderu `images/`, np.:
   - `images/ania-bergen.jpg`
2. Otwórz `data/journal.json`.
3. Dodaj nowy obiekt do tablicy `entries`.

Przykład:

```json
{
  "id": "2026-03-05-bergen",
  "date": "2026-03-05",
  "host": "Rodzina Ani",
  "country": "Norwegia",
  "flag": "🇳🇴",
  "city": "Bergen",
  "place": "Bryggen",
  "title": "Kolorowe domy nad wodą",
  "story": "Maskotka spacerowała po drewnianych domkach i oglądała port.",
  "fact": "Bergen to znane norweskie miasto portowe. Często pada tam deszcz.",
  "category": "Geografia",
  "legend": "Dlaczego miasta portowe budowano blisko wody?",
  "coordinates": [5.3221, 60.3971],
  "zoom": 10,
  "bearing": -20,
  "image": "./images/ania-bergen.jpg"
}
```

## Skąd wziąć współrzędne

### Jeśli zdjęcie ma GPS
Możesz odczytać współrzędne z danych EXIF zdjęcia.

### Jeśli zdjęcie nie ma GPS
Najprościej:
1. otwórz mapę Google albo OpenStreetMap,
2. kliknij miejsce,
3. skopiuj współrzędne,
4. wklej je jako:

```json
"coordinates": [długość_geograficzna, szerokość_geograficzna]
```

Uwaga: kolejność to **longitude, latitude**, nie odwrotnie.

## Publikacja na GitHub Pages

### Wariant prosty
1. Załóż repozytorium na GitHubie.
2. Wrzuć wszystkie pliki.
3. Włącz GitHub Pages dla gałęzi `main`.
4. Ustaw folder root (`/`).

## Publikacja na Cloudflare Pages

1. Połącz repo z GitHubem.
2. Wskaż katalog główny projektu.
3. Build command zostaw pusty.
4. Output directory ustaw na `/` lub zostaw projekt jako statyczny.

## Co warto zrobić później

- dodać prawdziwe zdjęcia maskotki
- podmienić placeholder na Wasze zdjęcia
- dodać filtr po miesiącach
- dodać generowanie wpisu z formularza
- dodać eksport do PDF na koniec roku

## Przekazanie szkole

Ten projekt jest łatwy do przekazania, bo:
- to zwykła statyczna strona
- dane są w jednym pliku JSON
- zdjęcia są w jednym folderze
- nie ma bazy danych ani skomplikowanego backendu

Szkoła może po prostu przejąć repo i dalej aktualizować plik `data/journal.json`.
