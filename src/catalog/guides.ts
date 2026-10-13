/**
 * Plantaloon's "learn more" guides: pests, warning signs, ways to propagate, and everyday care.
 *
 * Original Plantaloon text, written for this app. Licensed GPL-3.0-or-later, like the rest of
 * Plantaloon. This is general houseplant guidance, not professional advice: always read and
 * follow the label of any product you use, and keep treatments away from children and pets.
 */
import type { Guide } from './types';

export const GUIDES: Guide[] = [
  // --- Pests -----------------------------------------------------------------------------

  {
    id: 'mealybugs',
    kind: 'pest',
    title: 'Mealybugs',
    icon: 'bug',
    summary:
      'Small, slow insects that look like tufts of white cotton. They suck sap and hide in the tight spots where leaves meet stems.',
    sections: [
      {
        heading: 'How to spot them',
        points: [
          'Look for fluffy white blobs in leaf joints, along veins and under leaves.',
          'Sticky leaves or a black, sooty film nearby can mean they are feeding above.',
          'Some kinds live on the roots, so check the root ball if a plant fades for no clear reason.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Move the plant away from the others so they don’t spread.',
          'Dab each one with a cotton bud dipped in rubbing alcohol, or wipe them off with a damp cloth.',
          'Follow up with insecticidal soap or neem oil, covering every leaf joint and underside.',
          'Check again every few days and repeat for a few weeks, since eggs hatch after you clean.',
        ],
      },
      {
        heading: 'Keep them away',
        points: [
          'Look new plants over carefully and keep them apart for a couple of weeks.',
          'Peek into leaf joints whenever you water; small outbreaks are much easier to clear.',
        ],
      },
    ],
  },
  {
    id: 'spider-mites',
    kind: 'pest',
    title: 'Spider mites',
    icon: 'magnifying-glass-plus',
    summary:
      'Tiny mites that thrive in warm, dry air. They leave leaves speckled and dull, and in bad cases spin fine webbing.',
    sections: [
      {
        heading: 'How to spot them',
        points: [
          'Leaves get pale freckles or a dusty, bleached look, often starting underneath.',
          'Fine, silky webbing may appear between leaves and stems.',
          'Hold white paper under a leaf and tap it: moving specks the size of dust are mites.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Move the plant away from the others straight away.',
          'Rinse the whole plant in the shower, paying attention to the undersides of leaves.',
          'Then spray with insecticidal soap or neem oil every 5–7 days for a few weeks.',
          'For a stubborn problem, predatory mites are a safe option you can buy online.',
        ],
      },
      {
        heading: 'Keep them away',
        points: [
          'Mites love dry air, so a little extra humidity helps keep them down.',
          'Wipe or rinse leaves now and then, and keep plants off hot radiators.',
        ],
      },
    ],
  },
  {
    id: 'fungus-gnats',
    kind: 'pest',
    title: 'Fungus gnats',
    icon: 'bug',
    summary:
      'Small dark flies that hover around the pot. They’re mostly a nuisance, but their larvae live in damp soil and can nibble young roots.',
    sections: [
      {
        heading: 'How to spot them',
        points: [
          'Little black flies rise from the soil when you water or move the pot.',
          'Tiny clear larvae with dark heads may wriggle in the top layer of soil.',
          'They almost always mean the soil has been staying wet for too long.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Let the top few centimetres of soil dry out between waterings; the larvae can’t survive it.',
          'Stand yellow sticky traps by the pot to catch the adult flies.',
          'Water with a soak made from mosquito dunks (Bt israelensis), which targets the larvae.',
          'Watering from below keeps the surface drier, which makes the pot less inviting.',
        ],
      },
      {
        heading: 'Keep them away',
        points: [
          'Use pots with drainage holes and empty saucers after watering.',
          'A thin layer of sand or fine grit on top of the soil discourages egg laying.',
        ],
      },
    ],
  },
  {
    id: 'thrips',
    kind: 'pest',
    title: 'Thrips',
    icon: 'eye',
    summary:
      'Slender, fast insects that scrape at leaves and drink the sap. They leave silvery streaks and tiny black dots behind.',
    sections: [
      {
        heading: 'How to spot them',
        points: [
          'Look for silvery or bronze patches with little black specks, which are their droppings.',
          'New leaves and flowers may come out twisted or marked.',
          'The insects themselves are thin, pale or dark, and dart away when disturbed.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Move the plant away from the others, as thrips spread quickly.',
          'Rinse the plant well in the shower, then spray with insecticidal soap or neem oil.',
          'Repeat every 5–7 days for at least a month to catch each new hatch.',
          'Blue or yellow sticky traps help catch adults, and predatory mites can help too.',
        ],
      },
      {
        heading: 'Keep them away',
        points: [
          'Check cut flowers and new plants before they sit near your houseplants.',
          'Look at the undersides of leaves regularly, especially in warm months.',
        ],
      },
    ],
  },
  {
    id: 'scale',
    kind: 'pest',
    title: 'Scale insects',
    icon: 'bug-beetle',
    summary:
      'Sap-sucking insects that hide under small, hard or waxy bumps on stems and leaves. They barely move, so they are easy to miss.',
    sections: [
      {
        heading: 'How to spot them',
        points: [
          'Look for brown or tan bumps along stems and leaf veins that don’t wipe away easily.',
          'Sticky, shiny leaves or a black sooty film are common clues.',
          'Leaves may yellow and the plant can slowly weaken.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Move the plant away from the others.',
          'Gently scrape the bumps off with a fingernail or a soft toothbrush.',
          'Wipe stems with a cotton bud dipped in rubbing alcohol to get the ones you missed.',
          'Follow up with neem oil or horticultural oil, and repeat every week or two for a while.',
        ],
      },
      {
        heading: 'Keep them away',
        points: [
          'Check new plants closely along their stems before bringing them home.',
          'Wipe leaves from time to time; you’ll spot new bumps early.',
        ],
      },
    ],
  },
  {
    id: 'aphids',
    kind: 'pest',
    title: 'Aphids',
    icon: 'bug',
    summary:
      'Small, soft insects, often green or black, that gather on new growth. They multiply fast but are among the easiest pests to clear.',
    sections: [
      {
        heading: 'How to spot them',
        points: [
          'Clusters of tiny round insects sit on shoot tips, buds and under young leaves.',
          'New leaves may curl or come out misshapen.',
          'A sticky film on leaves below is another sign.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Squash small groups with your fingers, or wipe them off with a damp cloth.',
          'Rinse the plant with lukewarm water to knock the rest off.',
          'Spray with insecticidal soap or neem oil if they come back, and repeat weekly.',
        ],
      },
      {
        heading: 'Keep them away',
        points: [
          'Check plants that have been outside before bringing them back in.',
          'Go easy on feeding; lots of soft new growth attracts aphids.',
        ],
      },
    ],
  },
  {
    id: 'whitefly',
    kind: 'pest',
    title: 'Whitefly',
    icon: 'spray-bottle',
    summary:
      'Tiny white moth-like insects that live under leaves. They fly up in a little cloud when the plant is disturbed.',
    sections: [
      {
        heading: 'How to spot them',
        points: [
          'Brush the leaves: a puff of tiny white flies is a clear sign.',
          'Look under leaves for the flies and their flat, pale young.',
          'Leaves may go sticky, yellow or mottled.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Move the plant away from the others.',
          'Hang yellow sticky traps nearby to catch the adults.',
          'Rinse the undersides of leaves, then spray with insecticidal soap or neem oil.',
          'Repeat every 5–7 days for a few weeks, since new flies keep hatching.',
        ],
      },
      {
        heading: 'Keep them away',
        points: [
          'Check under the leaves of new plants and anything that has spent summer outside.',
          'A yellow sticky trap in a plant-filled room gives early warning.',
        ],
      },
    ],
  },

  // --- Warning signs ---------------------------------------------------------------------

  {
    id: 'yellow-leaves',
    kind: 'sign',
    title: 'Yellow leaves',
    icon: 'leaf',
    summary:
      'Yellowing is the most common sign of stress. Where it happens and how fast it spreads help point to the cause.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'Too much water is the usual culprit, especially if the soil stays wet and leaves feel soft.',
          'Bone-dry soil can also turn leaves yellow, often with crispy edges.',
          'An old lower leaf yellowing now and then is just the plant letting it go.',
          'Too little light or a lack of food can cause a slow, even yellowing.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Feel the soil a few centimetres down before you water again.',
          'If it’s soggy, let it dry out more and make sure the pot drains well.',
          'Move the plant somewhat brighter if it sits in a dim spot.',
          'Feed lightly in the growing season if it hasn’t been fed for months.',
        ],
      },
      {
        heading: 'When to worry',
        points: ['Many leaves turning yellow at once, with dark, mushy stems, can mean root rot.'],
      },
    ],
  },
  {
    id: 'brown-tips',
    kind: 'sign',
    title: 'Brown leaf tips',
    icon: 'wind',
    summary:
      'Dry, brown tips and edges are usually about dry air or uneven watering. They look untidy but rarely harm the plant.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'Dry air, especially from heating or air conditioning.',
          'Letting the soil dry out too much between waterings.',
          'A build-up of salts from fertiliser or hard tap water.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Water more evenly, before the soil goes completely dry, if the plant likes it moist.',
          'Raise the humidity a little by grouping plants or using a humidifier.',
          'Every few months, run plenty of water through the pot to flush out salts.',
          'Trim brown tips with clean scissors, following the leaf’s natural shape.',
        ],
      },
    ],
  },
  {
    id: 'brown-spots',
    kind: 'sign',
    title: 'Brown spots',
    icon: 'warning',
    summary:
      'Brown patches can come from sunburn, too much water, or leaf diseases. Their look helps you tell which.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'Dry, pale brown patches on the sunny side are usually sunburn.',
          'Soft, dark spots with a yellow ring often mean a fungal or bacterial leaf spot.',
          'Water sitting on leaves in cool, still air makes spots more likely.',
          'Overwatering can show up as dark patches spreading from the leaf edges.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Cut off badly spotted leaves with clean scissors and throw them away.',
          'Water the soil, not the leaves, and give the plant a bit more airflow.',
          'Move it out of harsh direct sun if the spots are on the side facing the window.',
          'Let the soil dry a little more between waterings.',
        ],
      },
      {
        heading: 'When to worry',
        points: [
          'Spots that spread quickly from leaf to leaf need the plant kept apart from others.',
        ],
      },
    ],
  },
  {
    id: 'drooping',
    kind: 'sign',
    title: 'Drooping',
    icon: 'drop',
    summary:
      'A wilting plant is asking for help. Most of the time it’s thirsty, but soggy roots can make a plant droop too.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'Dry soil: the most common reason, and the easiest to fix.',
          'Soggy soil: roots that sit wet can’t take up water, so the plant wilts anyway.',
          'Heat, a recent move or fresh repotting can cause a short sulk.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Feel the soil. If it’s dry, water thoroughly and the plant should perk up within a day.',
          'If it’s wet, don’t add more water; let it dry and check the roots if it doesn’t recover.',
          'Move it out of hot sun or away from a heater while it recovers.',
        ],
      },
      {
        heading: 'When to worry',
        points: ['A plant that droops in wet soil and doesn’t recover may have root rot.'],
      },
    ],
  },
  {
    id: 'root-rot',
    kind: 'sign',
    title: 'Root rot',
    icon: 'drop-slash',
    summary:
      'When soil stays wet for too long, roots run out of air and start to rot. Caught early, many plants can be saved.',
    sections: [
      {
        heading: 'Likely signs',
        points: [
          'The plant wilts or yellows even though the soil is wet.',
          'The base of the stems feels soft or turns dark.',
          'The soil smells sour or musty.',
          'Healthy roots are firm and pale; rotten ones are brown, mushy and pull apart easily.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Slide the plant out of its pot and gently shake off the wet soil.',
          'Cut away every soft, dark root with clean scissors.',
          'Repot into fresh, airy mix in a pot with drainage holes, ideally a clean or new one.',
          'Water lightly afterwards and keep it out of strong sun while it recovers.',
        ],
      },
      {
        heading: 'Prevent it',
        points: [
          'Water only when the plant needs it, and never leave a pot standing in water.',
          'If the rot has reached all the roots, take healthy cuttings to start again.',
        ],
      },
    ],
  },
  {
    id: 'leggy-growth',
    kind: 'sign',
    title: 'Leggy growth',
    icon: 'ruler',
    summary:
      'Long, thin stems with big gaps between the leaves mean the plant is stretching to find more light.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'Not enough light: the plant grows tall and pale as it reaches for the window.',
          'Leaning hard toward one side is another sign it wants a brighter spot.',
          'Some trailing plants naturally get long and bare with age.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Move the plant somewhere brighter, using the light meter to compare spots.',
          'Turn the pot a quarter turn every week or two so it grows evenly.',
          'Trim long stems back in spring to encourage bushier growth.',
          'Many stretched stems make good cuttings, so you can root them and fill out the pot.',
        ],
      },
    ],
  },
  {
    id: 'leaf-drop',
    kind: 'sign',
    title: 'Dropping leaves',
    icon: 'thermometer-cold',
    summary:
      'Leaves falling off suddenly is often a reaction to change: a move, a cold draught, or a big swing in watering.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'A new spot, especially with less light than before.',
          'Cold draughts from doors or windows, or hot blasts from heaters.',
          'Soil that has gone very dry, or stayed very wet.',
          'Losing one or two old lower leaves is normal.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Keep the plant in a steady, bright spot away from draughts and heaters.',
          'Check the soil and get back to a regular watering rhythm.',
          'Be patient: many plants, figs especially, settle after a few weeks.',
        ],
      },
      {
        heading: 'When to worry',
        points: ['Leaves dropping along with soft stems or bad-smelling soil points to root rot.'],
      },
    ],
  },
  {
    id: 'curling-leaves',
    kind: 'sign',
    title: 'Curling leaves',
    icon: 'thermometer-hot',
    summary:
      'Leaves curl to protect themselves from losing water or from too much heat and light. Pests can cause it too.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'Thirst: many plants curl their leaves when the soil is dry.',
          'Too much heat or strong sun.',
          'Very dry air, especially for thin-leaved plants.',
          'Pests such as aphids or thrips on new growth.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Check the soil and water if it’s dry.',
          'Move the plant away from hot windows, heaters and vents.',
          'Look under the leaves and at the growing tips for pests.',
          'Raise the humidity a little for plants that like moist air.',
        ],
      },
    ],
  },
  {
    id: 'pale-leaves',
    kind: 'sign',
    title: 'Pale leaves',
    icon: 'sun-dim',
    summary:
      'Leaves that look washed out or lose their markings usually need more light, or sometimes a little food.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'Too little light, which also makes variegated leaves turn plain green.',
          'Too much harsh sun, which can bleach leaves.',
          'Not being fed for a long time, especially in the growing season.',
          'Spider mites, which leave a fine pale speckling.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Use the light meter to check the spot, and move the plant brighter or softer as needed.',
          'Feed with a balanced houseplant food during spring and summer.',
          'Look under the leaves for mites or webbing.',
        ],
      },
    ],
  },
  {
    id: 'shrivelled-leaves',
    kind: 'sign',
    title: 'Shrivelled leaves',
    icon: 'drop-half',
    summary:
      'Wrinkled or deflated leaves, common on succulents, mean the plant is short of water, even if the soil isn’t the problem.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'Underwatering: the plant is using up the water stored in its leaves.',
          'Damaged or rotten roots that can no longer take up water.',
          'Very hot, dry conditions.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'If the soil is dry, give a deep watering and let the excess drain away.',
          'Leaves should plump up again within a few days.',
          'If the soil is wet and leaves still shrivel, check the roots for rot.',
        ],
      },
    ],
  },
  {
    id: 'sunburn',
    kind: 'sign',
    title: 'Sunburn',
    icon: 'sun',
    summary:
      'Too much direct sun, or a sudden move into it, can scorch leaves. The damage stays, but the plant usually recovers.',
    sections: [
      {
        heading: 'Likely signs',
        points: [
          'Pale, white or crispy brown patches on the leaves facing the light.',
          'It often appears after a move to a sunnier window or outdoors.',
          'Water droplets on leaves in hot sun can leave small scorched spots.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Move the plant back from the window, or filter the sun with a sheer curtain.',
          'Burnt patches won’t turn green again; trim badly damaged leaves if they bother you.',
          'When moving plants into more sun, do it gradually over a week or two.',
        ],
      },
    ],
  },
  {
    id: 'no-flowers',
    kind: 'sign',
    title: 'No flowers',
    icon: 'flower',
    summary:
      'A healthy plant that won’t bloom usually needs more light, a rest period, or simply more time.',
    sections: [
      {
        heading: 'Likely causes',
        points: [
          'Not enough light: flowering takes a lot of energy.',
          'Some plants need a cooler or darker rest in winter before they bloom.',
          'Too much nitrogen-rich feed can mean lots of leaves but no flowers.',
          'Young plants may simply not be old enough yet.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Give it the brightest spot it can handle.',
          'Check its care notes for any winter rest it needs, and try to give it.',
          'Switch to a feed made for flowering plants in the growing season.',
          'Some bloom best when a little snug in their pot, so don’t repot too often.',
        ],
      },
    ],
  },

  // --- Propagation -----------------------------------------------------------------------

  {
    id: 'stem-cuttings-water',
    kind: 'propagation',
    title: 'Stem cuttings in water',
    icon: 'drop',
    summary:
      'Root a piece of stem in a glass of water. It’s easy, and you can watch the roots grow.',
    sections: [
      {
        heading: 'When',
        points: [
          'Spring and summer, when the plant is growing, give the quickest results.',
          'Works well for pothos, philodendrons, tradescantia and many other vining plants.',
        ],
      },
      {
        heading: 'How',
        points: [
          'Cut a healthy stem just below a node, the bump where a leaf joins the stem.',
          'Take a piece with at least one or two nodes and a few leaves.',
          'Remove any leaves that would sit underwater.',
          'Stand it in a jar of room-temperature water in bright, indirect light.',
        ],
      },
      {
        heading: 'Aftercare',
        points: [
          'Change the water every week, or sooner if it turns cloudy.',
          'Pot it up once the roots are a few centimetres long.',
          'Keep the new soil a little moist for the first couple of weeks while it adjusts.',
        ],
      },
    ],
  },
  {
    id: 'stem-cuttings-soil',
    kind: 'propagation',
    title: 'Stem cuttings in soil',
    icon: 'scissors',
    summary:
      'Root a piece of stem straight into potting mix. The roots that form are already used to soil.',
    sections: [
      {
        heading: 'When',
        points: [
          'Spring and early summer are best.',
          'Good for woody or fleshy stems, such as succulents, figs and many herbs.',
        ],
      },
      {
        heading: 'How',
        points: [
          'Cut a healthy, non-flowering tip about 8–15 cm long, just below a node.',
          'Strip the lower leaves so only a few remain at the top.',
          'For succulents, let the cut end dry for a few days first.',
          'Push the stem into a small pot of moist, airy mix, so at least one node is buried.',
        ],
      },
      {
        heading: 'Aftercare',
        points: [
          'Keep the mix lightly moist, not wet, in bright, indirect light.',
          'A clear bag or cover helps leafy cuttings hold moisture; air it every few days.',
          'A gentle tug that meets resistance after a few weeks means roots have formed.',
        ],
      },
    ],
  },
  {
    id: 'leaf-cuttings',
    kind: 'propagation',
    title: 'Leaf cuttings',
    icon: 'leaf',
    summary:
      'Some plants can grow a whole new plant from a single leaf. It takes patience, but it’s very satisfying.',
    sections: [
      {
        heading: 'When',
        points: [
          'Spring and summer, in warm conditions.',
          'Works for many succulents, snake plants, African violets and some begonias.',
        ],
      },
      {
        heading: 'How',
        points: [
          'For succulents, gently twist off a whole, healthy leaf and let it dry for a few days.',
          'Lay it on top of dry succulent mix and mist the surface now and then.',
          'For snake plants, cut a leaf into sections and plant them the right way up.',
          'For African violets, root a leaf with its stalk in moist mix or water.',
        ],
      },
      {
        heading: 'Aftercare',
        points: [
          'Keep it in bright, indirect light and don’t overwater.',
          'Tiny roots and new plants can take weeks or even months to appear.',
          'Variegated snake plant leaves often grow back plain green.',
        ],
      },
    ],
  },
  {
    id: 'division',
    kind: 'propagation',
    title: 'Division',
    icon: 'shovel',
    summary:
      'Split a crowded clump into smaller plants, each with its own roots. You get new plants at once.',
    sections: [
      {
        heading: 'When',
        points: [
          'In spring, ideally when you would repot anyway.',
          'Suits clumping plants such as peace lilies, ferns, calatheas and snake plants.',
        ],
      },
      {
        heading: 'How',
        points: [
          'Water a day before, then ease the plant out of its pot.',
          'Loosen the soil and look for natural places where the clump separates.',
          'Gently pull it apart, or cut through the roots with a clean knife if needed.',
          'Make sure each piece has healthy roots and some leaves.',
        ],
      },
      {
        heading: 'Aftercare',
        points: [
          'Pot each piece in fresh mix in a pot just big enough for its roots.',
          'Water well and keep out of strong sun for a week or two.',
          'A bit of drooping at first is normal while the roots settle.',
        ],
      },
    ],
  },
  {
    id: 'offsets',
    kind: 'propagation',
    title: 'Offsets (pups)',
    icon: 'cactus',
    summary:
      'Many plants grow small copies of themselves at their base. Once these are big enough, they can be separated and potted up.',
    sections: [
      {
        heading: 'When',
        points: [
          'In spring or summer, once a pup is about a third of the parent’s size.',
          'Common on aloes, haworthias, bromeliads, many cacti and spider plants.',
        ],
      },
      {
        heading: 'How',
        points: [
          'Take the plant out of its pot to see where the pup joins the parent.',
          'Separate it with clean hands or a clean knife, keeping as many of its roots as you can.',
          'For succulents and cacti, let the cut dry for a day or two.',
          'Plant it in a small pot of mix that suits the parent plant.',
        ],
      },
      {
        heading: 'Aftercare',
        points: [
          'Water lightly at first and keep it in bright, indirect light.',
          'Pups without roots usually grow them within a few weeks.',
        ],
      },
    ],
  },
  {
    id: 'plantlets',
    kind: 'propagation',
    title: 'Plantlets',
    icon: 'potted-plant',
    summary:
      'Some plants grow baby plants on runners or leaves. These root very easily, making them one of the simplest ways to propagate.',
    sections: [
      {
        heading: 'When',
        points: [
          'Any time the plantlets have started to form little roots or root bumps.',
          'Common on spider plants, strawberry begonias and some kalanchoes.',
        ],
      },
      {
        heading: 'How',
        points: [
          'Rest a plantlet on a small pot of moist mix next to the parent, still attached.',
          'Pin it down gently with a bent paperclip if it won’t stay put.',
          'Once it has rooted after a few weeks, snip the runner.',
          'You can also cut plantlets off and root them in water or soil.',
        ],
      },
      {
        heading: 'Aftercare',
        points: [
          'Keep the soil lightly moist until the new plant is growing well.',
          'Give it the same light and care as the parent.',
        ],
      },
    ],
  },
  {
    id: 'air-layering',
    kind: 'propagation',
    title: 'Air layering',
    icon: 'tree',
    summary:
      'Coax roots to grow on a stem while it’s still attached to the plant. It’s handy for tall, woody plants that have lost their lower leaves.',
    sections: [
      {
        heading: 'When',
        points: [
          'Spring or early summer, when the plant is actively growing.',
          'Suits rubber plants, fiddle-leaf figs, dracaenas and monsteras.',
        ],
      },
      {
        heading: 'How',
        points: [
          'Pick a spot on a healthy stem, just below a node and where you want the new plant to start.',
          'Make a small, shallow upward cut or remove a thin ring of bark there.',
          'Wrap the spot in damp sphagnum moss and cover it with clear plastic, tied at both ends.',
          'Keep the moss damp, opening the wrap now and then to add a little water.',
        ],
      },
      {
        heading: 'Aftercare',
        points: [
          'When plenty of roots show through the moss, after a few weeks to months, cut below them.',
          'Pot the new plant with the moss still on, and water well.',
          'Wear gloves for plants with milky sap, which can irritate skin.',
        ],
      },
    ],
  },
  {
    id: 'seed',
    kind: 'propagation',
    title: 'Growing from seed',
    icon: 'sparkle',
    summary:
      'Starting from seed is slow but fun, and it works for many herbs, cacti and some tropical plants.',
    sections: [
      {
        heading: 'When',
        points: [
          'Late winter to spring, so seedlings grow with the longer days.',
          'Check the seed packet: some seeds need soaking, chilling or light to sprout.',
        ],
      },
      {
        heading: 'How',
        points: [
          'Fill a small tray or pot with fine seed-starting mix and water it first.',
          'Sow seeds on top and cover very lightly, about as deep as the seed is wide.',
          'Cover with a clear lid or bag to keep the moisture in.',
          'Keep warm and bright, but out of direct sun.',
        ],
      },
      {
        heading: 'Aftercare',
        points: [
          'Remove the cover once seedlings appear, and mist or water gently from below.',
          'When they have a couple of true leaves, move them into their own small pots.',
          'Seedlings stretch quickly without enough light, so a bright spot or grow light helps.',
        ],
      },
    ],
  },

  // --- How-tos ---------------------------------------------------------------------------

  {
    id: 'watering',
    kind: 'howto',
    title: 'Watering well',
    icon: 'drop',
    summary:
      'Most houseplant trouble comes from watering too often, not too little. Check the soil first, then water deeply.',
    sections: [
      {
        heading: 'Before you water',
        points: [
          'Push a finger a few centimetres into the soil; if it’s still damp, wait.',
          'Lift the pot: a dry pot feels noticeably lighter than a freshly watered one.',
          'Treat reminders as a nudge to check, not an order to water.',
        ],
      },
      {
        heading: 'How to water',
        points: [
          'Water slowly until it runs out of the drainage holes, so the whole root ball gets wet.',
          'Empty the saucer after 15–30 minutes so roots don’t sit in water.',
          'Use room-temperature water; very cold water can shock tropical plants.',
          'Bottom watering, letting the pot soak in a tray for a while, suits plants that dislike wet leaves.',
        ],
      },
      {
        heading: 'Good to know',
        points: [
          'Plants need less water in winter, in low light and in cool rooms.',
          'Pots without drainage holes make overwatering much more likely.',
        ],
      },
    ],
  },
  {
    id: 'repotting',
    kind: 'howto',
    title: 'Repotting',
    icon: 'potted-plant',
    summary:
      'Repotting gives roots fresh soil and room to grow. Most plants only need it every year or two, best done in spring.',
    sections: [
      {
        heading: 'Signs it’s time',
        points: [
          'Roots are coming out of the drainage holes or circling the top of the soil.',
          'Water runs straight through, or the soil dries out much faster than it used to.',
          'The plant has stopped growing in spring and summer, or it tips over easily.',
        ],
      },
      {
        heading: 'How to repot',
        points: [
          'Choose a pot only 2–5 cm wider than the old one, with drainage holes.',
          'Water the day before, then ease the plant out and gently loosen circling roots.',
          'Set it at the same depth as before on a layer of fresh mix, then fill in around it.',
          'Firm the soil lightly and water well.',
        ],
      },
      {
        heading: 'Aftercare',
        points: [
          'Keep it out of strong sun for a week or so while it settles.',
          'Skip feeding for about a month; fresh mix already contains some food.',
        ],
      },
    ],
  },
  {
    id: 'feeding',
    kind: 'howto',
    title: 'Feeding',
    icon: 'flask',
    summary:
      'Potting mix runs out of nutrients over time. A little food in the growing season keeps plants healthy and green.',
    sections: [
      {
        heading: 'When to feed',
        points: [
          'From spring to late summer, while the plant is putting out new growth.',
          'Stop or cut back in autumn and winter, when most plants rest.',
          'Don’t feed a plant that is very dry, sick or freshly repotted.',
        ],
      },
      {
        heading: 'How to feed',
        points: [
          'A balanced liquid houseplant food suits most plants.',
          'Follow the label, and use half strength if you’re unsure; less is safer than more.',
          'Water the soil first, then feed, so the roots don’t get scorched.',
          'Use special feeds for orchids, cacti and flowering plants if you grow a lot of them.',
        ],
      },
      {
        heading: 'Signs of too much',
        points: [
          'A white crust on the soil or pot, or brown, burnt-looking leaf tips.',
          'If you see this, flush the pot with plenty of water and feed less often.',
        ],
      },
    ],
  },
  {
    id: 'humidity',
    kind: 'howto',
    title: 'Humidity',
    icon: 'drop-half',
    summary:
      'Many tropical plants like moister air than most homes have, especially in winter. A few simple habits help.',
    sections: [
      {
        heading: 'Signs the air is too dry',
        points: [
          'Crispy brown leaf tips and edges.',
          'New leaves that get stuck or tear as they unfurl.',
          'More trouble with spider mites.',
        ],
      },
      {
        heading: 'Ways to help',
        points: [
          'Group plants together; they raise the humidity around each other.',
          'Stand pots on a tray of pebbles and water, keeping the pot base above the water.',
          'A small humidifier is the most reliable fix for plants that need very moist air.',
          'Bathrooms and kitchens with a window are often naturally more humid.',
        ],
      },
      {
        heading: 'Good to know',
        points: [
          'Misting only helps for a few minutes and can encourage leaf spots.',
          'Keep plants away from radiators, heaters and air-conditioning vents.',
        ],
      },
    ],
  },
  {
    id: 'cleaning-leaves',
    kind: 'howto',
    title: 'Cleaning leaves',
    icon: 'hand-pointing',
    summary:
      'Dust blocks light from reaching the leaves. A gentle clean now and then helps plants grow and lets you spot pests early.',
    sections: [
      {
        heading: 'How to clean',
        points: [
          'Wipe smooth leaves with a soft, damp cloth, supporting each leaf from below.',
          'Small or many-leaved plants can have a gentle lukewarm shower instead.',
          'Let leaves dry somewhere out of direct sun.',
          'Do it every month or two, or whenever you see a layer of dust.',
        ],
      },
      {
        heading: 'What to avoid',
        points: [
          'Skip leaf-shine products, which can clog the leaf surface.',
          'Don’t wipe fuzzy, waxy or powdery leaves; use a soft brush to dust them instead.',
          'Don’t wet cacti and succulents; a dry brush works well for them.',
        ],
      },
    ],
  },
  {
    id: 'winter-rest',
    kind: 'howto',
    title: 'Winter care',
    icon: 'snowflake',
    summary:
      'Shorter, darker days slow most houseplants down. Adjusting your care for winter helps them come through strong.',
    sections: [
      {
        heading: 'What changes',
        points: [
          'Plants use much less water, so the soil stays damp for longer.',
          'Light is weaker and days are shorter, even by a bright window.',
          'Indoor heating dries the air.',
        ],
      },
      {
        heading: 'What to do',
        points: [
          'Water less often, and always check the soil first.',
          'Stop feeding most plants until spring.',
          'Move plants closer to windows to catch more light, but not touching cold glass.',
          'Keep them away from cold draughts, and from radiators and heaters.',
        ],
      },
      {
        heading: 'Good to know',
        points: [
          'Some cacti, succulents and flowering plants bloom better after a cool, dry winter rest.',
          'A little slow or no growth in winter is normal, so wait until spring to repot.',
        ],
      },
    ],
  },
  {
    id: 'light',
    kind: 'howto',
    title: 'Reading the light',
    icon: 'sun-horizon',
    summary:
      'Light is a plant’s food. Spots that look bright to us can be quite dim for a plant, so it’s worth measuring.',
    sections: [
      {
        heading: 'Using the light meter',
        points: [
          'The meter uses your phone’s light sensor, usually near the front camera at the top.',
          'Hold the phone where the plant’s leaves are, screen facing the window.',
          'Measure around midday on a typical day, and try a few spots to compare.',
          'Readings are a guide, not exact; phone sensors vary from model to model.',
        ],
      },
      {
        heading: 'The four light levels',
        points: [
          'Low: a few metres from a window, or by a north-facing one. Few plants thrive here.',
          'Medium: a bright room, a little back from the window, with no sun on the leaves.',
          'Bright indirect: close to a window, with a wide view of the sky but little direct sun.',
          'Direct sun: sunlight falls straight on the leaves for several hours a day.',
        ],
      },
      {
        heading: 'Signs it’s not right',
        points: [
          'Too little: leggy stems, small or pale new leaves, leaning toward the window, slow growth.',
          'Too much: bleached or scorched patches, crispy edges, leaves curling away from the light.',
          'Move plants gradually when changing their light, over a week or two if you can.',
        ],
      },
    ],
  },
  {
    id: 'outdoors',
    kind: 'howto',
    title: 'Summer outdoors',
    icon: 'cloud-sun',
    summary:
      'Many houseplants love a summer holiday outside. Ease them into it, and bring them back in before it turns cold.',
    sections: [
      {
        heading: 'When to move them out',
        points: [
          'Wait until nights stay above about 12–15 °C; tropical plants dislike cold nights.',
          'Check the forecast for cold snaps, storms and strong wind.',
        ],
      },
      {
        heading: 'Getting used to the sun',
        points: [
          'Start in full shade, as even bright indoor light is much weaker than outdoor light.',
          'Over one to two weeks, move them gradually into the light they like.',
          'Keep shade-lovers such as ferns and calatheas in shade all summer.',
          'Outdoor plants dry out faster, so check the soil often, especially in heat or wind.',
        ],
      },
      {
        heading: 'Bringing them back in',
        points: [
          'Bring them in before nights drop below about 10–12 °C, usually late summer or early autumn.',
          'Check every leaf, stem and the soil for pests, and rinse plants off before moving them.',
          'Keep them apart from your other plants for a couple of weeks, just in case.',
          'Expect a few dropped leaves as they get used to the dimmer indoor light.',
        ],
      },
    ],
  },
];
