# Plantaloon — Product Spec

A free, private, open-source houseplant care app. Inspired by the feature set of apps like Planta,
built clean-room: no decompiled code, copied assets, or copied text.

**Phase 1 audience:** our family (Android only, sideloaded APK).
**Later:** public open-source release (GPL-3.0-or-later).

## Principles

1. **Calm, not naggy.** One gentle daily summary, not a notification per plant. Nothing turns red
   and shouts; overdue plants just float to the top.
2. **Offline-first.** All data, photos and the plant catalog live on the phone. The app never needs
   a network to work.
3. **Private by default.** No accounts, analytics, ads, or third-party services. No location.
4. **Care log is the source of truth.** Watering, fertilizing, repotting, notes and photos are
   timestamped entries; "next due" dates are derived from the log plus the plant's schedule.
5. **Our own words.** Care advice is written by us. Borrowed data (names, light tiers) is openly
   licensed and credited in the app.

## MVP (v1) — scope

### Rooms
- Name, icon, and a light level (Low / Medium / Bright indirect / Direct sun), set by hand or by
  the light meter.
- Plants are grouped by room everywhere in the app. One default room ("Living room") on first run;
  rename or delete freely.

### Plants
| Field | Notes |
|---|---|
| Nickname | Optional; defaults to the common name |
| Species | Picked from the catalog, or "Unlisted plant" + closest care group |
| Room | Required |
| Photo | Cover photo; defaults to the newest journal photo |
| Pot | Size (small / medium / large) and drainage (yes / no) — nudges the watering interval |
| Schedules | Water and fertilize intervals, prefilled from the care profile, editable |
| Acquired on | Optional date |

### Care tasks and reminders
- Tasks: **Water**, **Fertilize** (v1). Mist, rotate, repot and prune are journal entries, not
  scheduled tasks, until v2.
- Interval comes from the care profile, adjusted for pot size and season (winter = longer for
  watering, fertilizing paused Nov–Feb by default for plants whose profile says so).
- On a due task: **Done** (logs it, with Undo) or **Not yet** (soil still damp; check again
  tomorrow, in 2, 3 or 7 days). "Water all" ticks off a whole room.
- Gentle learning: if a plant is skipped 3 times in a row, offer to lengthen its interval. Never
  changes the schedule without asking.
- **One daily notification** at a chosen time (default 9:00): "4 plants need water today."
  Off-able. Not available in Expo Go, only in installed builds.

### Care journal
- Per-plant timeline of entries: watered, fertilized, repotted, pruned, misted, rotated, note,
  photo. Each entry can carry a note and photos.
- Photos are taken or picked with the system picker and copied into the app's own storage (no
  media-library permission). Shown as a photo strip on the plant page; tap for full screen and
  swipe through time to see growth.
- All entries editable and deletable.

### Care profiles (the catalog)
Bundled, offline, read-only. Two layers:
1. **Care groups (99)** — e.g. *Philodendron*, prayer plants (*Calathea*, *Goeppertia*,
   *Maranta*), *Hoya*, *Peperomia*, desert cacti, *Echeveria*-type succulents, ferns, *Phalaenopsis*
   orchids. Written by us. Fields: light range, watering style (let dry fully / top inch dry / keep
   lightly moist), base water interval (growing season and winter), fertilize interval and season,
   humidity, minimum temperature, pet safety (cats / dogs, with source), difficulty, and a few short
   care tips.
2. **Species (2,229)** — GrowSpot's species list (scientific name, common name, light tier), each
   linked to a care group by genus. About 180 species that break their group's rules have
   overrides (`src/catalog/overrides.ts`), and ~50 popular plants get extra everyday names
   (`src/catalog/extra-names.ts`) and rank first in search.

Sources, credited on an About screen:
- **GrowSpot light datasets** (CC BY 4.0) — the species list (scientific and common names),
  per-species light tier, and the lux bands. Attribution kept with the bundled file
  (`data/growspot/`, `src/catalog/growspot-species.ts`).
- **ASPCA toxic and non-toxic plant lists** — pet safety facts, cited per plant (facts only, no
  copied text).

Search matches common names, scientific names and cultivar names, typo-tolerant.

Care text is general guidance, not professional advice; the About screen says so.

### Light meter
- Uses the phone's **ambient light sensor** (expo-sensors `LightSensor`, Android). No camera, no
  permission.
- Live lux reading with a smoothed needle, plus the tier it falls in (using GrowSpot's boundaries).
- Instructions: hold the phone where the plant sits, screen facing the window, around midday.
- **Save to room** sets that room's light level. **Check a plant** shows whether a plant's profile
  fits that light ("A bit dark for a Fiddle-leaf fig — try closer to the window").
- If the phone has no light sensor, the screen says so and lets you set the room's light by hand.

### Screens
1. **Today** — tasks due today and overdue, grouped by room, with Done / Skip on each row and a
   "Water all in this room" shortcut. Below: "Coming up this week". An empty, friendly state when
   nothing is due.
2. **Plants** — all plants grouped by room, as photo cards. Add plant (+) and manage rooms from
   here.
3. **Plant page** — cover photo, name and species, next water / fertilize, care profile summary
   (light, water, humidity, pet safety), photo strip, journal timeline, schedule settings.
4. **Add plant** — search the catalog → pick room → optional photo → confirm schedule.
5. **Light meter** — as above.
6. **Settings** — reminder time, units (°F/°C), seasons (hemisphere), theme, backup and restore,
   About and credits.

Navigation: bottom tabs **Today · Plants · Light · Settings**.

Appearance: plain solid surfaces; Settings › Appearance picks light / dark / follow the phone and
one of six accent colors (Leaf, Moss, Teal, Ocean, Plum, Clay). Contrast is tested.

### Backup
- **Export backup**: one file with all data and photos, saved where you choose (e.g. Drive).
- **Restore backup**: replaces everything on the phone (also offered on the welcome screen).
- Format: JSON Lines — line 1 is every database row, then one line per photo (base64).
- **Erase all data**: type DELETE to confirm.

## v1.1 — fuller plant pages (2026-10-13)

Modelled on the depth of Planta's plant pages, in our own words and look
(mockup: `docs/mockups/plant-page.png`).

- **Care sheet** shared by a plant's page and the catalog page: quick facts (difficulty, light,
  watering, pets), then sticky tabs **Care · About · Growing · Problems** (+ **Journal** on your
  own plants) that jump to and follow each section.
  - Care: water, light (with the room's measured light), food and what to use, soil & repotting,
    humidity & cleaning, good-to-know tips.
  - About: pet safety (ASPCA), growth habit, leaves, lifecycle, care level.
  - Growing: ideal and minimum warmth, outdoor months, ways to propagate.
  - Problems: common warning signs and pests, each opening a guide.
- **Content** (`src/catalog/`): `details.ts` (per care group), `guides.ts` (35 learn-more guides),
  `descriptions.ts` (180 popular plants; cultivars borrow their species' text).
- **Catalog browsing**: search opens a plant's full page first; "Add to my plants" from there.
- **Wishlist**: heart on catalog pages; list under Plants › heart. New `wish` table (migration 2;
  older backups without it still restore).
- **Photos**: one Wikimedia Commons photo per species (from Wikidata), 320 px WebP, bundled;
  cultivars show their species' photo, labelled. Free licences only (PD, CC0, CC BY, CC BY-SA,
  GFDL); each credited on the page and in About › Plant photos. Built by
  `scripts/build-photos.js`.
- **Outdoor months**: opt-in rough area (approximate location once, rounded to ~50 km, not in
  backups, never sent anywhere) + bundled NASA POWER climatology (monthly average night lows,
  1° grid, `scripts/build-climate.js`). A month counts when nights stay above the plant's
  minimum. Without an area, a general rule is shown.

## v1.2 — free versions of Planta's premium extras (2026-10-13)

- **Pet safety from ASPCA's lists** for the 755 plants they cover (`data/aspca/`,
  `scripts/build-aspca.js`); others are inferred from related plants and labelled so.
- **Custom tasks**: mist, turn, clean leaves, prune, repot or a named task, each with its own
  interval (`schedule.task` = kind or `custom-<id>`, `schedule.label`). They count from when
  they were added (`schedule.started_at`), not from when the plant arrived.
- **Pot material** (plastic, terracotta, glazed, glass, other) nudges the watering suggestion.
- **Room conditions**: grow light (counts as bright light), air, warmth, draughts, outdoors.
  A "This spot" card lists mismatches; Today says when outdoor plants should come in, using the
  local climate.
- **Health status** (Thriving / Doing fine / Struggling / Unwell) as journal entries.
- **Cuttings**: start one from a plant (`plant.parent_id`, `prop_stage`, `prop_method`), follow
  it rooting → rooted → potted; potting gives it normal reminders.
- Migration 3; backup format 2 (older backups restore with defaults).

## v1.3 — plant scanner (2026-10-13)

- **Scan a plant** (Add plant › camera button): BioCLIP's image encoder (MIT) runs on the phone
  via a small Kotlin module and ONNX Runtime (`modules/plant-scanner`). The 87 MB model is
  downloaded once on request from https://github.com/jjroth001/plantaloon-scanner (release v1),
  checked by size and SHA-256, and can be removed in Settings. Photos never leave the phone.
- Matching (`src/lib/scanner.ts`) compares the photo's embedding with a fingerprint per catalog
  species: name embedding + 2 × the mean of ~18 openly licensed iNaturalist photos for 143
  popular plants (`src/catalog/scan-data.ts`, 1.3 MB, built by `scripts/build-scan-data.py`).
- Measured on 175 held-out photos of cultivated plants: right plant first 74%, in top 5 93%.
- Native libraries are packaged for arm64 only (`plugins/with-arm64-only.js`).

## v1.4 — pot diameter and shared pots (2026-10-13)

- **Pot diameter**: optional exact width (cm, or inches when temperatures are °F) beside the
  Small / Medium / Large picks. Watering suggestion scales with (diameter / 15 cm)^0.6, limited
  to ×0.6–×1.6 (10 cm ×0.8, 20 cm ×1.2, 30 cm ×1.5). Changing the pot re-suggests the interval
  unless it was set by hand.
- **Shared pots** (`plant.shared_pot`): link plants in Edit plant › "Shares a pot with". Watering
  and feeding are one schedule for the pot (shortest interval wins when linking; changing one
  changes all); Done and "Not yet" record for every plant; Today shows one row per pot. Other
  reminders stay per plant. A warning appears when pot-mates need very different watering.
- Migration 4; backup format 3.

## v1.5 — a plant's own spot (2026-10-13)

- A room sets the usual conditions; any plant can differ. On Edit plant, "Its spot" sets the
  plant's own light, grow light, draught, and whether it sits near a heater. Anything not
  changed follows the room, and "Use the room's" goes back.
- Humidity, warmth and outdoors stay room-wide (air mixes through a room).
- The light meter can save a reading for one plant (the pin beside it), as well as a room.
- A shared pot is one spot: its plants share these settings, and a plant joining a pot takes
  the pot's spot.
- Being near a heater warns plants that dislike dry air.

## v1.6 — the archive, and a new icon (2026-10-13)

- Edit plant → "Move to archive" for a plant that died, was given away, or anything else,
  with an optional note. Archived plants get no reminders and leave the plant list, Today and
  the light meter; their journal and photos are kept.
- Plants tab → Archive (shown once something is in it) lists them, newest first. An archived
  plant's page shows what happened, its photos and journal, with "Bring it back" and
  "Delete for good".
- Archiving leaves any shared pot. Deleting a room moves its archived plants to another room.
- New app icon and splash: a ZZ plant.

## v2 and later
- More scheduled tasks (mist, rotate, repot reminders).
- Home-screen widget ("3 plants need water").
- Sharing a plant collection between two phones.
- Photo identification (would need an on-device model; online services are out).
- Plant health diagnosis guides ("yellow leaves", "brown tips").
- Public release: F-Droid listing.

## Data model (v1)

```
room
  id, name, icon, light_tier ('low'|'medium'|'high'|'very_high'|null),
  light_lux (last measured, nullable), sort_order, created_at, updated_at

plant
  id, room_id → room.id, nickname, species_id (catalog id, nullable),
  care_group_id (catalog id), pot_size ('s'|'m'|'l'), pot_drainage (bool),
  cover_photo_id (nullable), acquired_on (local YYYY-MM-DD, nullable), notes,
  created_at, updated_at

schedule  (primary key: plant_id + task)
  plant_id → plant.id, task ('water'|'fertilize'), interval_days, enabled,
  hint_dismissed_at ("water less often?" suggestion dismissed), updated_at
  -- Due dates aren't stored: lib/schedule.ts works them out from the journal (last done,
  -- latest "not yet" since), the interval and the season, so they can never go stale.

entry  (the care journal)
  id, plant_id → plant.id,
  type ('water'|'fertilize'|'skip'|'repot'|'prune'|'mist'|'rotate'|'note'|'photo'),
  at (unix ms), note, data (JSON; 'skip': { task, days }), created_at, updated_at

photo
  id, entry_id → entry.id, plant_id → plant.id, file (name in the app's photos folder),
  width, height, taken_at, created_at

Deletes are real deletes (no sync yet, so no soft deletes); photo files are removed with them.

setting
  key, value
```

The catalog ships as JSON in the app bundle (`assets/catalog/`), versioned separately from user
data. Plants store catalog ids, so catalog updates improve care advice for existing plants.

## Tech
- Expo SDK 57, Expo Router, React Compiler, New Architecture. Android only.
- expo-sqlite (WAL, busy_timeout), expo-notifications (lazy, installed builds only),
  expo-image-picker, expo-file-system, expo-sensors (LightSensor), expo-image.
- Every native-only module gated on `Constants.executionEnvironment` so Expo Go keeps working.
- Jest via jest-expo for schedule maths, catalog search and migrations.

## Milestones

All six were built in one pass on 2026-10-12; none has been tried on a phone yet.

- **M1 — Rooms and plants:** database, rooms, add/edit plants, Plants tab. Catalog with ~20 groups
  to start.
- **M2 — Care tasks:** schedules, Today tab, Done / Skip / Snooze, season adjustment.
- **M3 — Journal and photos:** entries, photo capture and storage, plant page timeline.
- **M4 — Light meter:** sensor screen, room light, plant fit check.
- **M5 — Full catalog:** all ~80 groups, species list from Wikidata/GBIF, GrowSpot light tiers,
  pet safety, credits screen.
- **M6 — Reminders and backup:** daily notification, export/import, first APK.
