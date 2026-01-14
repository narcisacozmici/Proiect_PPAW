# Frontend - PDF to Word Converter

Frontend React pentru conversie PDF to Word, creat cu Vite, React, Tailwind CSS, Zustand și Clerk pentru autentificare.

## Setup

1. Instalează dependențele:

```bash
npm install
```

2. Creează un fișier `.env` în root-ul proiectului și adaugă cheia ta Clerk:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

3. Asigură-te că backend-ul rulează pe `http://localhost:3001` (vezi `../BE/README.md`)

4. Rulează proiectul în modul development:

```bash
npm run dev
```

## Structura proiectului

- `src/components/Login.tsx` - Componenta de login folosind Clerk (SignIn/SignUp)
- `src/components/PDFToWordConverter.tsx` - Componenta pentru conversie PDF to Word
- `src/components/Sidebar.tsx` - Sidebar cu navigare și profil utilizator
- `src/store/useStore.ts` - Store Zustand pentru state management
- `src/locales/ro.ts` - Traduceri în română pentru Clerk
- `src/App.tsx` - Componenta principală
- `src/main.tsx` - Entry point cu ClerkProvider

## Configurare Backend

Frontend-ul comunică cu backend-ul prin proxy Vite. Configurația se află în `vite.config.ts`:

- Toate request-urile către `/api/*` sunt redirecționate către `http://localhost:3001`

## Tehnologii

- **Vite** - Build tool
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Clerk** - Authentication
