# Pamiętnik Pluszaka

Interaktywna strona w formie książeczki i mapy podróży klasowej maskotki.

## Co jest w tej wersji

- responsywny układ książki,
- interaktywna mapa Leaflet,
- sztywny układ zdjęcia i opisu,
- ukryta oś czasu,
- boczne menu do przygotowania nowych wpisów do `journal.json`.

## Ważne

To nadal jest **strona statyczna**.

To znaczy:
- możesz podejrzeć nowy wpis w panelu,
- możesz skopiować gotowy JSON,
- możesz pobrać nowy plik `journal.json`,
- ale zdjęcia nadal trzeba ręcznie dodać do folderu `images` w repo.

## Jak dodać nowy wpis

1. Kliknij **Menu wpisu**.
2. Uzupełnij pola formularza.
3. Kliknij **Pokaż podgląd**.
4. Kliknij **Kopiuj wpis JSON** albo **Pobierz nowy journal.json**.
5. Dodaj zdjęcie do folderu `images` i zaktualizowany `journal.json` do repo.

## Struktura projektu

- `index.html` — układ strony
- `styles.css` — wygląd książki i panelu
- `app.js` — logika mapy i menu wpisu
- `data/journal.json` — dane podróży
- `images/` — zdjęcia maskotki
