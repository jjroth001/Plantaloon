# Turns ASPCA's plant list pages into data/aspca/plant-lists.json (names and toxic flags only).
#
#   Save https://www.aspca.org/pet-care/animal-poison-control/cats-plant-list as cats.html and
#   .../dogs-plant-list as dogs.html in one folder, then:
#   python scripts/parse-aspca.py <that folder> <retrieved date, YYYY-MM-DD>
#   node scripts/build-aspca.js
import html, json, os, re, sys

folder, retrieved = sys.argv[1], sys.argv[2]
out = {
    'source': 'https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants',
    'retrieved': retrieved,
    'note': 'Plant names and toxic/non-toxic flags only, from ASPCA Animal Poison Control Center '
            'lists for cats and dogs. Rows: [common name, scientific names, toxic].',
}
for animal in ['cats', 'dogs']:
    s = open(os.path.join(folder, f'{animal}.html'), encoding='utf-8', errors='replace').read()
    rows = []
    # The page has a "Plants Toxic to …" half and a "Plants Non-Toxic to …" half.
    parts = re.split(r'<h2>(Plants (?:Non-)?Toxic to \w+)</h2>', s)
    for i in range(1, len(parts), 2):
        toxic = 'Non-Toxic' not in parts[i]
        for m in re.finditer(r'<span class="field-content"><a[^>]*>([^<]*)</a>(.*?)</span>', parts[i + 1], re.S):
            sci = re.search(r'Scientific Names:</b>\s*(.*?)\s*\|', m.group(2), re.S)
            text = html.unescape(re.sub(r'<[^>]+>', '', sci.group(1))) if sci else ''
            names = [n.strip() for n in re.split(r'[,;]| and ', text) if n.strip()]
            rows.append([html.unescape(m.group(1)).strip(), names, toxic])
    out[animal] = rows
    print(animal, len(rows))
json.dump(out, open(os.path.join(os.path.dirname(__file__), '../data/aspca/plant-lists.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)
