# Plantaloon

**A free, private houseplant care app for Android.** Keep track of your plants, get reminders to water, feed and repot, identify a plant from a photo, and keep a care journal with pictures. No account, no cloud, no ads, no tracking. Your plants stay on your phone.

## Features

**Your plants**
- **Over 2,200 plants** to choose from, each with a full care page: watering, light, food, soil and repotting, warmth, pet safety, propagation, and common problems and pests. Most have a photo.
- **Plant scanner:** take or pick a photo and see the five closest matches. It runs entirely on the phone; the model is downloaded once, only if you ask for it.
- **Rooms** with their light, grow light, air, warmth and draughts, and indoor or outdoor. Any plant can have **its own spot** when it sits somewhere different, like a sunny sill or beside a radiator.
- **Light meter** using the phone's light sensor. Save a reading for a room or for one plant, and see which plants would like it there.
- **Pots:** small, medium or large, or the exact width; material and drainage. These adjust how often to water. Plants **sharing one pot** are watered and fed together.
- **Cuttings:** start one from a plant and follow it from rooting to potted.
- **Wishlist** of plants you'd like, and an **Archive** for plants that died or that you gave away, with their journal kept.

**Care**
- **Today:** what needs watering, feeding, misting, turning, cleaning, pruning or repotting, plus your own named tasks. Mark them done or "not yet" in a tap, with undo.
- **Schedules that adapt:** slower watering in winter, a feeding pause where the plant rests, and a suggestion to water less often when the soil keeps being too damp.
- **Outdoor months:** share a rough area (optional) and Plantaloon says when outdoor plants should come in, from local climate data kept on the phone.
- **One daily reminder** notification, at a time you choose, with **Watered** and **Remind me later** buttons that work without opening the app.
- **Home-screen widget:** what needs doing today, with a Watered button.
- **Journal** of every watering, feed, note, health check and photo.

**Your data**
- **Backup and restore** to a single file (data and photos) you keep wherever you like.
- Light or dark theme and a choice of accent colours.

## Privacy

Plantaloon has no accounts, no analytics, no ads and no servers. Everything is stored in a database on your phone and leaves it only when you share a backup file yourself. Android's own automatic cloud backup is turned off for Plantaloon, so your plants, photos and rough location aren't copied to your Google account behind your back; use Settings › Back up instead. Your rough location is never included in backups.

**Why each permission:**

| Permission | Why |
|---|---|
| Camera | Taking photos of your plants, and the plant scanner. Photos stay on the phone. |
| Approximate location | Optional, only if you turn on outdoor months: your rough area, rounded to about 50 km and stored only on the phone. Precise and background location are not requested. |
| Notifications, run at startup, wake lock | The daily care reminder (set again after the phone restarts), and its Watered / Remind me later buttons. |
| Internet, network state | Only to download the plant scanner's model from this project's [scanner repository](https://github.com/jjroth001/plantaloon-scanner), once, when you ask for it. Nothing else is sent or fetched. |
| Foreground service | Lets Android run the widget and the reminder's buttons for a moment while the app is closed. |
| Vibrate | Gentle haptic feedback when you tick something off. |

The notifications library Plantaloon uses (expo-notifications) includes Google's Firebase messaging code, because it also supports push notifications. Plantaloon doesn't use push notifications and has no Firebase configuration, so that code is never set up and no push service is contacted.

## Install

Plantaloon is distributed as an APK (Android 7 and newer, 64-bit ARM phones).

1. Download the latest `Plantaloon-x.y.z.apk` from the [Releases](../../releases) page.
2. Open it on your phone and allow installing from that source when Android asks.
3. To get updates automatically, add this repository to [Obtainium](https://github.com/ImranR98/Obtainium).

Every release is signed with the same key, so updates install over the previous version and keep your plants. To check that an APK really comes from this project, run `apksigner verify --print-certs Plantaloon-x.y.z.apk` (from the Android SDK build tools) and compare the certificate's SHA-256 digest:

```
bdb50f7f55f2501859cf07b11a18d9c2513f916604837c587d42989e17d4d4ec
```

## Not professional advice

Care guidance is general and written for typical homes; every plant and room is different.

Pet safety comes from the ASPCA's lists where they cover a plant, and is otherwise judged from related plants and labelled "likely". If a pet or a person may have eaten a plant, call a vet, a doctor or a poison control service rather than relying on the app.

## Sources and credits

- **Plant list and light needs:** [GrowSpot light datasets](https://growspotapp.com/data/) (CC BY 4.0). Care groups, care details, guides and descriptions are written for Plantaloon.
- **Plant photos:** [Wikimedia Commons](https://commons.wikimedia.org), by many photographers under free licences. Each photo's author and licence are shown with it and in About › Plant photos.
- **Pet safety:** the [ASPCA toxic and non-toxic plant lists](https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants) (plant names and toxic or non-toxic only).
- **Climate:** [NASA POWER](https://power.larc.nasa.gov) monthly temperatures, on a 1° grid.
- **Plant scanner:** [BioCLIP](https://imageomics.github.io/bioclip/) (MIT), with example photos from openly licensed [iNaturalist](https://www.inaturalist.org) observations. Details in the [scanner repository](https://github.com/jjroth001/plantaloon-scanner).
- **Icons:** [Phosphor Icons](https://phosphoricons.com) (MIT).
- Built with [Expo](https://expo.dev) and React Native.

Plantaloon is an independent project, not affiliated with or endorsed by Planta, the ASPCA or any other plant-care app or organisation.

## Development

Plantaloon is an [Expo](https://expo.dev) app (React Native, TypeScript, Expo Router, SQLite).

```bash
npm install
npx expo start      # try most screens in Expo Go
npx tsc --noEmit    # typecheck
npx expo lint       # lint
npx jest            # tests
```

Expo Go runs most of the app, but not reminders, the widget or the plant scanner, which need Plantaloon's own native code. For those, build an APK: see [BUILDING.md](BUILDING.md).

| Where | What |
|---|---|
| `src/app/` | Screens (Expo Router: every file is a route) |
| `src/components/` | UI: cards, forms, the plant page sections |
| `src/db/` | SQLite schema, migrations, queries and backups |
| `src/lib/` | Pure logic: schedules, light, spots, shared pots, reminders, the scanner |
| `src/catalog/` | Plants, care groups, guides, pet safety, photos and climate data |
| `src/widget/` | The home-screen widget (drawn by react-native-android-widget) |
| `modules/plant-scanner/` | Small native Android module that runs the scanner model |
| `scripts/` | Build scripts for the catalog, photos, climate, pet safety, scanner data and icons |
| `data/` | Source data the catalog is built from |

Other docs: [SPEC.md](SPEC.md) (product scope and history), [BUILDING.md](BUILDING.md) (building and signing the APK).

Bug reports and ideas are welcome as issues. For a bigger change, please open an issue to talk it over first.

## License

Copyright (C) 2026 jjroth001

Plantaloon is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See [LICENSE](LICENSE) for the full text.

In short: you can use, study, change and share Plantaloon, including your own modified versions, as long as what you distribute stays open source under the same license.

Plant photos keep their own licences (shown with each photo), and the GrowSpot data stays under CC BY 4.0. Some starter code comes from Expo's create-expo-app template, under the MIT License; see [LICENSE-expo-template](LICENSE-expo-template).
