# Lokalni development — Supabase + Docker

Ovaj dokument opisuje dva toka:

1. **Dnevni lokalni dev** — `supabase start` (ceo Supabase stek lokalno) + `pnpm dev`. Ovo je tvoj glavni tok sa Cursorom.
2. **Produkcioni image test** — `Dockerfile` + `compose.app.yml` za testiranje produkcione slike aplikacije.

> Pretpostavka: imaš [Colimu](https://github.com/abiosoft/colima) + Docker CLI na Macu:
> ```bash
> brew install colima docker docker-compose docker-buildx
> colima start --vm-type vz --mount-type virtiofs --vz-rosetta --cpu 6 --memory 8
> ```

---

## 1. Dnevni lokalni dev

Supabase CLI podiže **ceo lokalni stek** (Postgres + Auth + Realtime + Storage + Studio) u Docker kontejnerima i automatski primenjuje sve migracije iz `supabase/migrations/` i seed iz `supabase/seed.sql`.

### Jednom

```bash
# Instaliraj Supabase CLI
brew install supabase/tap/supabase

# Podesi env (već sadrži lokalne default ključeve za supabase start)
cp .env.local.example .env.local

# Instaliraj zavisnosti
pnpm install
```

### Svakodnevni ciklus

```bash
# 1. Podigni lokalni Supabase stek (Postgres, Auth, Studio na :54323)
pnpm supabase:start

# 2. (opciono) resetuj bazu + primeni migracije + seed — sveže okruženje
pnpm db:reset

# 3. Pokreni Next.js app
pnpm dev
# → http://localhost:3000
```

Korisne komande:

```bash
pnpm supabase:status   # ispiše URL-ove i ključeve lokalnog steka
pnpm supabase:stop      # ugasi stek (oslobodi RAM)
pnpm db:reset           # obriši bazu, primeni migracije + seed
pnpm db:push            # gurni lokalne migracije na linkovani cloud projekat
```

### Šta se dešava ispod haube

```
pnpm dev (Next.js :3000)
        │  čita NEXT_PUBLIC_SUPABASE_URL = http://127.0.0.1:54321
        ▼
Supabase lokalni stek (Docker kontejneri, podigao `supabase start`)
  ├── API gateway (Kong)        :54321   ← app razgovara ovde
  ├── Postgres                  :54322   ← Drizzle / psql / GUI
  ├── Studio (UI)                :52343   ← pregled podataka u browseru
  ├── Auth / Realtime / Storage / Inbucket (email)
  └── migracije iz supabase/migrations/ + seed.sql (automatski)
```

Tvoj kod (Cursor piše) koristi iste `lib/supabase/*` klijente kao u produkciji — jedina razlika je `NEXT_PUBLIC_SUPABASE_URL` koji u lokalu pokazuje na `127.0.0.1:54321`, a u produkciji na `https://YOUR_PROJECT.supabase.co`. **Identičan kod, drugi URL** — to je poenta.

---

## 2. Produkcioni image test (Dockerfile)

`next.config.ts` koristi `output: "standalone"`, pa `pnpm build` generiše samodovoljan server. `Dockerfile` to pakuje u lean Alpine sliku (ne-root korisnik, ~150 MB).

```bash
# Izgradi sliku
docker build -t conversionos .

# Pokreni protiv cloud Supabase (koristi .env.production ili stavi prave vrednosti)
docker compose -f compose.app.yml --env-file .env.local up
# → http://localhost:3000
```

> **Zašto `compose.app.yml` a ne `docker-compose.yml`?** Da te ne navede da zameniš `supabase start`. Lokalni dev stek pokreće Supabase CLI; ovaj compose samo testira produkcionu sliku aplikacije protiv nekog Supabase projekta.

### O `NEXT_PUBLIC_*` u kontejneru

Browser bundle se "peče" u build vremenu, pa `NEXT_PUBLIC_*` varijable koje menjaš posle build-a ne utiču na client kod. Za server-side varijable (`SUPABASE_SERVICE_ROLE_KEY`, `IP_SALT`) prosleđivanje preko `--env-file` radi normalno u runtime.

---

## Mapa fajlova

| Fajl | Svrha |
|---|---|
| `supabase/config.toml` | Konfiguracija lokalnog Supabase steka (portovi, auth, storage) |
| `supabase/migrations/` | SQL migracije (primenjuju se automatski) |
| `supabase/seed.sql` | Demo podaci (agent + landing page + visit + lead) |
| `.env.local.example` | Env šablon sa lokalnim Supabase default ključevima |
| `Dockerfile` | Produkcioni image za Next.js (standalone, Alpine) |
| `.dockerignore` | Šta se isključuje iz Docker build konteksta |
| `compose.app.yml` | Opcioni compose za smoke-test produkcione slike |
