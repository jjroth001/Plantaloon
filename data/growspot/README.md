# GrowSpot species light levels

`species-light-levels.csv` is from GrowSpot's open houseplant light datasets
(snapshot 2026-10-03), mirrored at https://github.com/ranson0318-dot/growspot-light-dataset.

- Licence: Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Attribution: GrowSpot — growspotapp.com (DOI 10.5281/zenodo.22023336)

Plantaloon uses it, unchanged, for its species list (scientific and common names) and each
species' light tier. `scripts/build-species.js` turns it into `src/catalog/growspot-species.ts`.
The lux band boundaries (low 270–800, medium 800–1,600, high 1,600–10,800, very high 10,800+)
come from the same datasets' indoor light measurements file.
