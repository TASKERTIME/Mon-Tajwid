# Mon Tajwid

Application gamifiee d'apprentissage du Coran avec reconnaissance vocale et analyse du Tajwid.

## Stack

- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend** : Supabase (Auth, PostgreSQL, Storage)
- **IA Vocale** : OpenAI Whisper (speech-to-text arabe)
- **Tajwid Engine** : Moteur rule-based extensible
- **Deploy** : Vercel + GitHub Actions CI/CD

## Installation

```bash
git clone https://github.com/YOUR_REPO/mon-tajwid-app.git
cd mon-tajwid-app
npm install
cp .env.example .env.local
npm run dev
```

## Configuration Supabase

1. Creer un projet sur supabase.com
2. Copier URL + cle anon dans .env.local
3. Executer supabase/migration.sql dans SQL Editor
4. Activer auth Email + Google

## Deploiement Vercel

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
vercel --prod
```

## Moteur Tajwid

7 regles implementees : Ikhfa, Idgham, Iqlab, Qalqalah, Ghunnah, Madd Tabii, Ikhfa Shafawi.
Architecture extensible — chaque regle est un module independant.

## Sources

- Texte Uthmani : api.quran.com v4
- Audio HQ : qurancdn.com
- Le texte coranique est sacre et ne doit jamais etre modifie.

## Roadmap

- [x] Phase 1 : Auth, Navigation Coran, Audio, Progression, Validation
- [ ] Phase 2 : Tajwid IA avance, Mode tournoi, Social
- [ ] Phase 3 : Coach IA, Stats avancees, Classement global
