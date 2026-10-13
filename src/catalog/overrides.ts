/**
 * Per-species exceptions to the care groups in ./groups.
 *
 * Notes are original text written for Plantaloon and released under GPL-3.0-or-later. Care
 * values are general guidance, not exact rules. Pet toxicity follows the ASPCA Animal Poison
 * Control Center's toxic and non-toxic plant lists (aspca.org); a species is only marked
 * non-toxic here when we are confident it is listed that way.
 *
 * Keys are scientific names exactly as they appear in the GrowSpot species list.
 */
import type { CareGroup, SpeciesOverride } from './types';

const TOXIC: CareGroup['pets'] = { cats: 'toxic', dogs: 'toxic' };
const SAFE: CareGroup['pets'] = { cats: 'non_toxic', dogs: 'non_toxic' };
const UNKNOWN: CareGroup['pets'] = { cats: 'unknown', dogs: 'unknown' };

/**
 * Species that clearly belong with a different group than their genus, e.g. snake plants
 * that botanists moved from Sansevieria into Dracaena. Value is a CareGroup id.
 */
export const GROUP_OVERRIDES_BY_SPECIES: Record<string, string> = {
  // Former Sansevieria, now Dracaena: snake plant care, not dracaena care.
  'Dracaena trifasciata': 'snake-plants',
  "Dracaena trifasciata 'Bantel's Sensation'": 'snake-plants',
  "Dracaena trifasciata 'Black Coral'": 'snake-plants',
  "Dracaena trifasciata 'Black Gold'": 'snake-plants',
  "Dracaena trifasciata 'Black Hahnii'": 'snake-plants',
  "Dracaena trifasciata 'Fernwood'": 'snake-plants',
  "Dracaena trifasciata 'Futura Superba'": 'snake-plants',
  "Dracaena trifasciata 'Golden Hahnii'": 'snake-plants',
  "Dracaena trifasciata 'Hahnii'": 'snake-plants',
  "Dracaena trifasciata 'Jade Hahnii'": 'snake-plants',
  "Dracaena trifasciata 'Laurentii'": 'snake-plants',
  "Dracaena trifasciata 'Moonshine'": 'snake-plants',
  "Dracaena trifasciata 'Twist'": 'snake-plants',
  "Dracaena trifasciata 'Whitney'": 'snake-plants',
  "Dracaena trifasciata 'Zeylanica'": 'snake-plants',
  'Dracaena angolensis': 'snake-plants',
  'Dracaena hanningtonii': 'snake-plants',
  'Dracaena hyacinthoides': 'snake-plants',
  'Dracaena liberica': 'snake-plants',
  'Dracaena masoniana': 'snake-plants',
  'Dracaena pearsonii': 'snake-plants',

  // Poinsettia is a gift plant in practice, not a succulent.
  'Euphorbia pulcherrima': 'gift-flowers',
  // Scarlet sage is a bedding annual, not a kitchen herb.
  'Salvia splendens': 'balcony-flowers',
  // Mexican tarragon is grown as a kitchen herb.
  'Tagetes lucida': 'leafy-herbs',
  // Intergeneric hybrid (Fatsia × Hedera); its genus is written "x" in the data.
  'x Fatshedera lizei': 'aralias',
};

export const SPECIES_OVERRIDES: Record<string, SpeciesOverride> = {
  // ─── Dracaenas ──────────────────────────────────────────────────────────────────────────
  'Dracaena sanderiana': {
    water: { style: 'moist', days: 5 },
    note: 'Lucky bamboo is often grown in water: keep the roots covered and change the water weekly.',
  },
  'Dracaena marginata': {
    water: { days: 12 },
    note: 'One of the most drought-tolerant dracaenas; it would rather be too dry than too wet.',
  },
  'Dracaena draco': {
    water: { style: 'dry_out', days: 18 },
    light: { best: 'high', max: 'very_high' },
    note: 'A slow, succulent-like tree. Give it sun and let the soil dry fully.',
  },
  'Dracaena cinnabari': {
    water: { style: 'dry_out', days: 18 },
    light: { best: 'high', max: 'very_high' },
    difficulty: 'hard',
    note: 'Very slow and easily overwatered. Treat it like a desert succulent.',
  },
  'Dracaena fragrans': {
    note: 'Corn plants cope well with lower light; brown tips are usually from tap water.',
  },

  // ─── Figs ───────────────────────────────────────────────────────────────────────────────
  'Ficus pumila': {
    water: { style: 'moist', days: 4 },
    light: { min: 'low', best: 'medium' },
    humidity: 'high',
    difficulty: 'medium',
    note: 'Creeping fig has thin leaves that crisp quickly; never let it dry out.',
  },
  "Ficus pumila 'Quercifolia'": {
    water: { style: 'moist', days: 4 },
    light: { min: 'low', best: 'medium' },
    humidity: 'high',
    difficulty: 'medium',
  },
  "Ficus pumila 'Snowflake'": {
    water: { style: 'moist', days: 4 },
    light: { min: 'low', best: 'medium' },
    humidity: 'high',
    difficulty: 'medium',
  },
  'Ficus elastica': {
    difficulty: 'easy',
    note: 'The easiest indoor fig. Wipe the big leaves so they stay glossy.',
  },
  'Ficus lyrata': {
    difficulty: 'hard',
    note: 'Fiddle-leaf figs want bright light and a fixed spot; brown patches often mean wet roots.',
  },
  'Ficus benjamina': {
    note: 'Famous for dropping leaves after any change. Leave it be and it usually regrows them.',
  },

  // ─── Other foliage ──────────────────────────────────────────────────────────────────────
  'Peperomia ferreyrae': {
    water: { days: 14 },
    light: { best: 'high' },
    humidity: 'low',
  },
  'Peperomia columella': {
    water: { days: 14 },
    light: { best: 'high' },
    humidity: 'low',
  },
  'Peperomia graveolens': {
    water: { days: 14 },
    light: { best: 'high' },
    humidity: 'low',
  },
  'Peperomia nivalis': {
    water: { days: 14 },
    light: { best: 'high' },
    humidity: 'low',
  },
  'Peperomia prostrata': {
    water: { style: 'top_dry', days: 6 },
    humidity: 'high',
    difficulty: 'medium',
    note: 'String of turtles has tiny roots and leaves; it likes more humidity than most peperomias.',
  },
  'Rhaphidophora tetrasperma': {
    note: 'Often sold as "mini monstera". Fast and easy, and it climbs well on a pole.',
  },
  'Calathea orbifolia': {
    note: 'One of the fussiest prayer plants. Soft water and high humidity matter most.',
  },
  'Maranta leuconeura': {
    difficulty: 'medium',
    note: 'More forgiving than most prayer plants and happy trailing from a shelf.',
  },
  'Begonia rex': {
    water: { style: 'top_dry', days: 7 },
    note: 'Grown for the leaves; keep water off them and give it moist air.',
  },
  'Begonia tuberhybrida': {
    water: { winterFactor: 3 },
    note: 'Dies back in autumn. Store the tuber dry and frost-free, and restart it in spring.',
  },
  'Begonia semperflorens': {
    light: { max: 'very_high' },
    difficulty: 'easy',
    note: 'Wax begonias are tough bedding plants that also manage outdoors in sun.',
  },
  'Alocasia macrorrhizos': {
    difficulty: 'medium',
    light: { best: 'high', max: 'very_high' },
    note: 'A large, tougher alocasia that grows fast with plenty of light and water.',
  },
  'Alocasia odora': {
    difficulty: 'medium',
    note: 'Bigger and more forgiving than the small collector alocasias.',
  },
  'Tradescantia pallida': {
    light: { best: 'very_high', max: 'very_high' },
    note: 'Purple heart turns deepest purple in direct sun.',
  },
  'Selaginella lepidophylla': {
    water: { style: 'soak', days: 7 },
    humidity: 'average',
    difficulty: 'easy',
    note: 'The resurrection plant curls into a dry ball and unfurls in water. Do not keep it wet all the time.',
  },
  'Araucaria heterophylla': {
    light: { best: 'high' },
    water: { style: 'top_dry', days: 7 },
    note: 'Norfolk Island pine likes a cool, bright room. Never cut the top; it will not regrow.',
  },
  'Coffea arabica': {
    light: { min: 'medium', best: 'medium', max: 'high' },
    humidity: 'high',
    note: 'Coffee is an understory shrub: shade from strong sun and keep the soil lightly moist.',
  },
  'Ficus microcarpa': {
    note: 'Often sold as a "ginseng" bonsai; it is one of the easiest bonsai indoors.',
  },

  // ─── Palms ──────────────────────────────────────────────────────────────────────────────
  'Chamaedorea elegans': {
    light: { best: 'low' },
    note: 'The parlour palm is one of the best palms for dim rooms.',
  },
  'Howea forsteriana': {
    note: 'Kentia palms are slow but very tolerant of indoor conditions.',
  },
  'Dypsis lutescens': {
    pets: SAFE,
    humidity: 'high',
    note: 'Areca palms like moist air and steady watering; yellowing fronds often mean low light.',
  },
  'Phoenix roebelenii': {
    pets: SAFE,
    light: { best: 'medium' },
    note: 'The pygmy date palm is the most shade-tolerant Phoenix, but it has sharp spines at the base.',
  },
  'Licuala grandis': { pets: UNKNOWN, humidity: 'high', difficulty: 'medium' },
  'Caryota mitis': {
    pets: UNKNOWN,
    note: 'The fruit contains irritating crystals; remove any that form.',
  },

  // ─── Succulents & cacti ─────────────────────────────────────────────────────────────────
  'Crassula ovata': {
    note: 'Jade plants can live for decades. They get woody and tree-like with age.',
  },
  'Aloe vera': {
    note: 'The leaf gel and latex are not safe for pets to chew.',
  },
  'Euphorbia milii': {
    water: { days: 10 },
    note: 'Crown of thorns flowers most of the year in sun. The sap and spines both deserve care.',
  },
  'Euphorbia tirucalli': {
    note: 'Pencil cactus sap is especially harsh on eyes and skin. Always wear gloves.',
  },
  'Euphorbia pulcherrima': {
    water: { style: 'top_dry', days: 4 },
    light: { min: 'medium', best: 'high', max: 'high' },
    note: 'Keep poinsettias warm and out of draughts. Getting them to colour again needs weeks of long nights.',
  },
  'Kalanchoe blossfeldiana': {
    note: 'To rebloom, give it about six weeks of 14-hour nights in autumn.',
  },
  'Kalanchoe daigremontiana': {
    note: 'Plantlets drop and sprout everywhere; check nearby pots. Strongly toxic to pets.',
  },
  'Kalanchoe delagoensis': {
    note: 'Spreads by dropping plantlets and can become weedy. Strongly toxic to pets.',
  },
  'Sedum morganianum': {
    pets: SAFE,
    note: "Burro's tail drops leaves at a touch. Hang it where it won't be brushed.",
  },
  "Sedum morganianum 'Burrito'": { pets: SAFE },
  'Sedum burrito': { pets: SAFE },
  'Ceropegia ampliata': { pets: UNKNOWN },
  'Lophophora williamsii': {
    pets: TOXIC,
    note: 'Contains strong alkaloids. Keep away from pets and children.',
  },
  'Lophophora diffusa': { pets: TOXIC },
  'Schlumbergera truncata': {
    pets: SAFE,
    note: 'Thanksgiving cactus blooms in late autumn after cool nights and long darkness.',
  },
  'Schlumbergera bridgesii': { pets: SAFE },
  'Hatiora gaertneri': {
    pets: SAFE,
    note: 'Easter cactus wants a cool, drier rest in late winter to bloom in spring.',
  },
  'Hatiora salicornioides': { pets: SAFE },
  'Rhipsalis baccifera': { pets: SAFE },
  'Rhipsalis cereuscula': { pets: SAFE },
  'Epiphyllum oxypetalum': {
    note: 'Its huge, scented flowers open for a single night. Worth staying up for.',
  },
  'Selenicereus undatus': {
    light: { best: 'very_high' },
    note: 'Dragon fruit needs full sun, a sturdy support and several years before it fruits.',
  },
  'Yucca aloifolia': { pets: TOXIC },
  'Yucca gigantea': {
    pets: TOXIC,
    light: { min: 'medium' },
    note: 'The spineless yucca is the usual indoor kind and copes with less sun than most.',
  },
  'Beaucarnea recurvata': {
    pets: SAFE,
    note: 'Ponytail palm is not a palm. Its swollen base stores water, so water rarely.',
  },
  'Adenium obesum': {
    pets: TOXIC,
    note: 'Desert rose sap is poisonous. Keep it dry and warm while leafless in winter.',
  },
  'Adenium arabicum': { pets: TOXIC },
  'Adenium boehmianum': { pets: TOXIC },
  'Adenium multiflorum': { pets: TOXIC },
  'Adenium swazicum': { pets: TOXIC },
  'Jatropha podagrica': { pets: TOXIC },
  'Pachypodium lamerei': {
    note: 'Often sold as Madagascar palm. Leaves drop in a cold or dark winter and regrow in spring.',
  },

  // ─── Ferns ──────────────────────────────────────────────────────────────────────────────
  'Cyrtomium falcatum': { pets: SAFE },
  'Pellaea rotundifolia': {
    pets: SAFE,
    water: { days: 7 },
    note: 'Button ferns rot if kept soggy; let the top of the soil dry first.',
  },
  'Phlebodium aureum': { pets: SAFE },
  "Phlebodium aureum 'Mandaianum'": { pets: SAFE },
  'Davallia fejeensis': { pets: SAFE },
  'Platycerium bifurcatum': {
    difficulty: 'easy',
    note: 'The easiest staghorn, and the one most often sold.',
  },

  // ─── Carnivorous ────────────────────────────────────────────────────────────────────────
  'Dionaea muscipula': {
    pets: SAFE,
    note: 'Needs a cold winter rest (around 2–10 °C) for a few months, or it weakens and dies.',
  },
  'Drosophyllum lusitanicum': {
    water: { style: 'dry_out', days: 7 },
    note: 'Unlike other carnivores, it grows in dry, sandy soil. Do not stand it in water.',
  },
  'Cephalotus follicularis': {
    water: { style: 'top_dry' },
    note: 'Albany pitcher plant dislikes constantly wet roots; water when the surface starts to dry.',
  },

  // ─── Flowering plants ───────────────────────────────────────────────────────────────────
  'Saintpaulia ionantha': {
    note: 'Remove spent flowers and the occasional sucker to keep one tidy rosette.',
  },
  'Cyclamen persicum': {
    note: 'It rests in summer: let the leaves fade, keep the tuber nearly dry, and restart in autumn.',
  },
  'Hydrangea macrophylla': {
    water: { days: 2 },
    note: 'Very thirsty in flower. Plant it outdoors afterwards for a better second year.',
  },
  'Rhododendron simsii': {
    note: 'Florist azaleas want soft, lime-free water and must never dry out.',
  },
  'Calceolaria herbeohybrida': { pets: SAFE },
  'Exacum affine': { pets: SAFE },
  'Camellia japonica': {
    pets: SAFE,
    note: 'Buds drop if the plant dries out or gets too warm. Keep it cool and evenly moist.',
  },
  'Pericallis hybrida': { pets: UNKNOWN },
  'Pericallis cruenta': { pets: UNKNOWN },
  'Kohleria eriantha': { pets: UNKNOWN },
  'Hippeastrum hybridum': {
    note: 'Bulbs bought in autumn flower without help. To rebloom, give a dry rest after summer.',
  },
  'Narcissus papyraceus': {
    note: 'Paperwhites need no cold period and can bloom in a bowl of pebbles and water.',
  },
  'Zantedeschia aethiopica': {
    water: { style: 'moist' },
    note: 'This calla grows wild at stream edges and likes wet soil while growing.',
  },
  'Freesia alba': { pets: SAFE },
  'Freesia refracta': { pets: SAFE },
  'Freesia x hybrida': { pets: SAFE },
  'Lachenalia aloides': { pets: UNKNOWN },
  'Lachenalia bulbifera': { pets: UNKNOWN },
  'Veltheimia bracteata': { pets: UNKNOWN },
  'Veltheimia capensis': { pets: UNKNOWN },
  'Sparaxis tricolor': { pets: UNKNOWN },
  'Alstroemeria aurea': { pets: SAFE },
  'Alstroemeria ligtu': { pets: SAFE },
  'Trimezia candida': { pets: UNKNOWN },
  'Trimezia coerulea': { pets: UNKNOWN },
  'Trimezia gracilis': { pets: UNKNOWN },
  'Trimezia longifolia': { pets: UNKNOWN },
  'Torenia fournieri': { pets: UNKNOWN },
  'Browallia speciosa': { pets: UNKNOWN },
  'Jasminum officinale': { pets: SAFE },
  'Jasminum polyanthum': {
    pets: SAFE,
    note: 'Needs a cool autumn to set its winter flower buds.',
  },
  'Jasminum sambac': { pets: SAFE },
  'Stephanotis floribunda': { pets: SAFE },
  Clematis: { pets: TOXIC },
  'Hibiscus rosa-sinensis': {
    pets: SAFE,
    note: 'Each flower lasts a day or two, but a happy plant opens new ones all summer.',
  },
  'Gardenia jasminoides': {
    pets: TOXIC,
    humidity: 'high',
    difficulty: 'hard',
    note: 'Wants soft, lime-free water, steady warmth and humid air, or the buds drop.',
  },
  'Brugmansia arborea': { pets: TOXIC },
  'Brugmansia aurea': { pets: TOXIC },
  'Brugmansia sanguinea': { pets: TOXIC },
  'Brugmansia suaveolens': { pets: TOXIC },
  'Brugmansia versicolor': { pets: TOXIC },
  'Brugmansia x candida': {
    pets: TOXIC,
    note: 'Every part is highly poisonous to people and pets.',
  },
  'Nerium oleander': {
    pets: TOXIC,
    note: 'Every part is highly poisonous, even dried leaves. Not for homes with pets or children.',
  },
  'Brunfelsia pauciflora': { pets: TOXIC },
  'Abutilon hybridum': { pets: SAFE },
  'Aphelandra squarrosa': {
    pets: SAFE,
    difficulty: 'hard',
    note: 'Zebra plants drop lower leaves if they ever dry out.',
  },
  'Gynura aurantiaca': {
    pets: SAFE,
    note: 'The purple hairs fade in low light. Pinch out the smelly flowers.',
  },
  'Bertolonia maculata': { pets: UNKNOWN },
  'Bertolonia marmorata': { pets: UNKNOWN },
  'Sonerila margaritacea': { pets: UNKNOWN },
  'Nertera granadensis': { pets: UNKNOWN },
  'Biophytum sensitivum': { pets: UNKNOWN },
  'Acalypha hispida': { pets: UNKNOWN },
  'Acalypha wilkesiana': { pets: UNKNOWN },
  'Breynia disticha': { pets: UNKNOWN },
  "Breynia disticha 'Roseo-picta'": { pets: UNKNOWN },
  'Cissus rhombifolia': { pets: SAFE },
  'Cissus antarctica': { pets: SAFE },
  'Saxifraga stolonifera': { pets: SAFE },
  'Plectranthus verticillatus': { pets: SAFE },
  'Plectranthus amboinicus': { pets: UNKNOWN },
  'Ophiopogon japonicus': { pets: UNKNOWN },
  'Musa acuminata': { pets: SAFE },
  "Musa acuminata 'Ae Ae'": { pets: SAFE },
  'Musa velutina': { pets: SAFE },
  'Strelitzia reginae': {
    pets: TOXIC,
    note: 'Needs several years and plenty of sun before it flowers.',
  },
  'Strelitzia nicolai': { pets: TOXIC },
  'Canna hybrida': { pets: SAFE },

  // ─── Balcony flowers ────────────────────────────────────────────────────────────────────
  'Petunia hybrida': { pets: SAFE },
  'Petunia integrifolia': { pets: SAFE },
  'Zinnia elegans': { pets: SAFE },
  'Calendula officinalis': { pets: SAFE },
  'Antirrhinum majus': { pets: SAFE },
  'Gerbera jamesonii': { pets: SAFE },
  'Lantana camara': { pets: TOXIC },
  'Dianthus caryophyllus': { pets: TOXIC },
  'Catharanthus roseus': { pets: TOXIC },
  'Portulaca grandiflora': { pets: TOXIC },
  'Phytolacca americana': {
    pets: TOXIC,
    note: 'Pokeweed berries and roots are poisonous to people and pets.',
  },

  // ─── Herbs & edibles ────────────────────────────────────────────────────────────────────
  'Ocimum basilicum': {
    pets: SAFE,
    note: 'Basil hates cold: keep it above about 12 °C and away from chilly windows.',
  },
  'Salvia rosmarinus': {
    pets: SAFE,
    water: { style: 'dry_out', days: 7 },
    note: 'Rosemary dislikes wet roots; let the soil dry between drinks.',
  },
  'Mentha piperita': { pets: TOXIC },
  'Mentha spicata': {
    pets: TOXIC,
    note: 'Mint spreads fast. Give it its own pot.',
  },
  'Mentha pulegium': { pets: TOXIC },
  'Allium schoenoprasum': { pets: TOXIC },
  'Allium tuberosum': { pets: TOXIC },
  'Petroselinum crispum': { pets: TOXIC },
  'Chamaemelum nobile': { pets: TOXIC },
  'Cymbopogon citratus': { pets: TOXIC },
  'Aloysia citrodora': { pets: TOXIC },
  'Laurus nobilis': {
    pets: TOXIC,
    water: { style: 'top_dry', days: 7 },
  },
  'Lavandula angustifolia': { pets: TOXIC },
  'Lavandula stoechas': { pets: TOXIC },
  'Lavandula intermedia': { pets: TOXIC },
  'Citrus microcarpa': {
    difficulty: 'easy',
    note: 'Calamondin is the most forgiving citrus indoors and fruits while still small.',
  },
  'Olea europaea': {
    water: { style: 'dry_out', days: 10 },
    note: 'Olives are drought tolerant and need a cool winter to flower.',
  },
  'Prunus cerasus': { pets: TOXIC },
  'Prunus persica': { pets: TOXIC },
  'Malus baccata': { pets: TOXIC },
  'Malus domestica': { pets: TOXIC },
  'Persea americana': {
    pets: TOXIC,
    note: 'Avocado pits grow easily into houseplants but rarely fruit indoors.',
  },
  'Cannabis sativa': { pets: TOXIC },
  'Podocarpus macrophyllus': { pets: TOXIC },
};
