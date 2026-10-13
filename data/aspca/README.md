# ASPCA plant lists

`plant-lists.json` holds plant names and toxic / non-toxic flags (no descriptions) from the
ASPCA Animal Poison Control Center's toxic and non-toxic plant lists for cats and dogs:
https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants

To refresh: save the cats and dogs list pages as `cats.html` and `dogs.html`, then run
`python scripts/parse-aspca.py <folder> <YYYY-MM-DD>` and `node scripts/build-aspca.js`,
which rewrites `src/catalog/aspca.ts`. The app uses ASPCA's answer for every plant it lists;
other plants are judged by related plants and labelled as such.
