import {
  RWY_0927,
  RWY_1432,
  TAXI_N,
  TAXI_S,
  TAXI_N1,
  rwyPos,
  thresholdAlong,
  landingSign,
  physicalAlong,
  headingVec,
  type EndId,
  type OrientedRect,
  type RunwayDef,
} from "./world";

export type FeatureKind = "marking" | "light" | "sign" | "building";

export type Feature = {
  id: string;
  title: string;
  kind: FeatureKind;
  location: string;
  purpose: string;
  icao: string;
  dimensions: { label: string; value: string }[];
  notes: string;
  footprint: OrientedRect;
};

function fp(rwy: RunwayDef, along: number, across: number, length: number, width: number): OrientedRect {
  const p = rwyPos(rwy, along, across);
  return { x: p.x, z: p.z, headingDeg: rwy.heading, length, width };
}

function endFp(
  rwy: RunwayDef,
  endName: string,
  distPastThr: number,
  length: number,
  width: number,
  across = 0,
): OrientedRect {
  const end = rwy.ends[endName];
  const along = thresholdAlong(rwy, endName) + landingSign(end) * distPastThr;
  return fp(rwy, along, across, length, width);
}

function endFeatures(rwy: RunwayDef, endName: EndId): Feature[] {
  const end = rwy.ends[endName];
  const zebraCount = rwy.width >= 60 ? 16 : 12;
  const usable =
    rwy.length - rwy.ends[Object.keys(rwy.ends)[0]].displaced - rwy.ends[Object.keys(rwy.ends)[1]].displaced;
  const displacedLen = end.displaced;
  const other = Object.keys(rwy.ends).find((k) => k !== endName)!;

  return [
    {
      id: `mark.thr.${endName}`,
      title: `Threshold markings RWY ${endName}`,
      kind: "marking",
      location: `RWY ${endName} threshold, ${end.displaced} m in from the ${endName} physical end`,
      purpose:
        "Identify the beginning of the runway available for landing. Longitudinal white stripes (the “zebra”) are the ICAO threshold pattern.",
      icao: "Annex 14 Vol I §5.2.4 Threshold markings",
      dimensions: [
        { label: "Stripe length", value: "30 m" },
        { label: "Stripe width", value: "1.80 m" },
        { label: "Gap", value: "1.80 m" },
        { label: "Number of stripes", value: String(zebraCount) },
        { label: "Start from threshold", value: "6 m" },
        { label: "Runway width", value: `${rwy.width} m` },
      ],
      notes: `VABB RWY ${endName} is ${end.cat}. Displaced threshold ${end.displaced} m — landing is not authorised on the closed section before this bar.`,
      footprint: endFp(rwy, endName, 21, 30, rwy.width),
    },
    {
      id: `mark.des.${endName}`,
      title: `Runway designation ${endName}`,
      kind: "marking",
      location: `Painted on RWY ${rwy.pair}, ${endName} approach end`,
      purpose:
        "Two-digit magnetic heading (nearest 10°) so a landing crew can confirm they are on the correct runway.",
      icao: "Annex 14 Vol I §5.2.2 Runway designation marking",
      dimensions: [
        { label: "Character height", value: "9 m" },
        { label: "Numerals", value: endName },
        { label: "Placement", value: "12 m beyond threshold stripes" },
      ],
      notes: `True heading here is ~${end.heading}°. Mumbai magnetic variation is small; the painted ${endName} is the published designation.`,
      footprint: endFp(rwy, endName, 52.5, 9, 16),
    },
    {
      id: `mark.aim.${endName}`,
      title: `Aiming point RWY ${endName}`,
      kind: "marking",
      location: `400 m past RWY ${endName} threshold, both sides of centreline`,
      purpose:
        "Visual aim point for a 3° (or published) approach. The pair of rectangles is the primary visual glideslope cue with PAPI.",
      icao: "Annex 14 Vol I §5.2.5 Aiming point marking",
      dimensions: [
        { label: "Each rectangle", value: "50 × 8 m" },
        { label: "Distance from threshold", value: "400 m (code 4)" },
        { label: "Inner edge from CL", value: "9 m" },
      ],
      notes: `Paired with PAPI ${end.papiDeg.toFixed(2)}° on this end. CAT ${end.cat.replace("CAT ", "")} operations still use the same aiming-point location.`,
      footprint: endFp(rwy, endName, 425, 50, 42),
    },
    {
      id: `mark.tdz.${endName}`,
      title: `Touchdown zone RWY ${endName}`,
      kind: "marking",
      location: `Pairs at 150 m intervals from 150 m to 900 m past threshold ${endName}`,
      purpose:
        "Paint the usable touchdown zone so the aiming point is not a lone mark. Pair count reduces with distance from threshold.",
      icao: "Annex 14 Vol I §5.2.6 Touchdown zone marking",
      dimensions: [
        { label: "Longitudinal spacing", value: "150 m" },
        { label: "Extent", value: "150–900 m" },
        { label: "Bar size", value: "22.5 × 3 m (typical)" },
      ],
      notes: `Usable LDA is reduced by the ${end.displaced} m displacement. Marks are laid from the displaced threshold, not the physical end.`,
      footprint: endFp(rwy, endName, 525, 750, rwy.width),
    },
    {
      id: `mark.disp.${endName}`,
      title: `Displaced-threshold arrows RWY ${endName}`,
      kind: "marking",
      location: `Closed-to-landing section, ${end.displaced} m before threshold ${endName}`,
      purpose:
        "Chevron arrows point to the landing threshold and show pavement that may be used for take-off / roll-out but not for landing.",
      icao: "Annex 14 Vol I §5.2.4.9 / §5.2.7 Displaced threshold",
      dimensions: [
        { label: "Closed length", value: `${end.displaced} m` },
        { label: "Arrow type", value: "White chevrons toward threshold" },
      ],
      notes: `VABB published displacement ${endName}: ${end.displaced} m. Opposite end ${other} is displaced ${rwy.ends[other].displaced} m. Schematic LDA is ${Math.round(usable)} m.`,
      footprint: fp(
        rwy,
        (physicalAlong(rwy, end.sign) + thresholdAlong(rwy, endName)) / 2,
        0,
        displacedLen,
        rwy.width,
      ),
    },
    {
      id: `light.thr.${endName}`,
      title: `Threshold bar RWY ${endName}`,
      kind: "light",
      location: `Green wing-bar and threshold bar at ${endName}`,
      purpose:
        "Green lights facing the approach mark the landing threshold. A wing bar extends the cue beyond the pavement.",
      icao: "Annex 14 Vol I §5.3.10 Runway threshold lights / wing bars",
      dimensions: [
        { label: "Colour (approach face)", value: "Green" },
        { label: "Layout", value: "Bar across threshold + wing bars" },
      ],
      notes: `${end.cat} threshold at VABB ${endName}. Unidirectional green toward the approach; the opposite face of the bar is not a landing cue.`,
      footprint: endFp(rwy, endName, 0, 6, rwy.width + 24),
    },
    {
      id: `light.end.${endName}`,
      title: `Runway-end lights RWY ${endName}`,
      kind: "light",
      location: `Red bar at the ${endName} physical end`,
      purpose: "Red lights facing the runway warn that the usable pavement is ending.",
      icao: "Annex 14 Vol I §5.3.11 Runway end lights",
      dimensions: [
        { label: "Colour", value: "Red (runway face)" },
        { label: "Placement", value: "At the physical runway end" },
      ],
      notes: `The ${endName} end has a ${end.displaced} m displacement, so landing traffic stops well before this bar; departing traffic still needs the end lights.`,
      footprint: fp(rwy, physicalAlong(rwy, end.sign), 0, 8, rwy.width + 8),
    },
    {
      id: `light.als.${endName}`,
      title: `Approach lights ${endName} (${end.cat} ${end.alsM} m)`,
      kind: "light",
      location: `Extended centreline before threshold ${endName}`,
      purpose:
        "Lead the aircraft onto the runway centreline in low visibility. Category (and length) set the barrette / side-row pattern.",
      icao: "Annex 14 Vol I §5.3.4 Approach lighting systems",
      dimensions: [
        { label: "System length", value: `${end.alsM} m` },
        { label: "Category", value: end.cat },
        { label: "Glide path", value: `${end.papiDeg.toFixed(2)}°` },
      ],
      notes:
        endName === "27"
          ? "VABB 27 is CAT II: 900 m centreline barrettes, red side row in the inner 270 m, and a sequenced flashing “rabbit” toward the threshold."
          : endName === "09"
            ? "VABB 09 is CAT I with a 540 m simple approach centreline and a 300 m crossbar."
            : endName === "14"
              ? "VABB 14 uses a 740 m CAT I centreline (longer than 09 because of the approach path over the city/hills)."
              : "VABB 32 is a 420 m SALS — a short simple approach lighting system, matching the higher 3.26° PAPI.",
      footprint: endFp(rwy, endName, -end.alsM / 2, end.alsM, 30),
    },
    {
      id: `light.papi.${endName}`,
      title: `PAPI RWY ${endName}`,
      kind: "light",
      location: `Left of ${endName} as seen on approach, ~300 m past threshold, 15 m off the edge`,
      purpose:
        "Four-unit precision approach path indicator. Two white + two red means on slope. Colour is a function of the observer’s elevation angle.",
      icao: "Annex 14 Vol I §5.3.5.29 PAPI / §5.3.5.31 siting",
      dimensions: [
        { label: "Units", value: "4" },
        { label: "Spacing", value: "9 m" },
        { label: "Offset from edge", value: "15 m (inboard unit)" },
        { label: "Published angle", value: `${end.papiDeg.toFixed(2)}°` },
        { label: "On-slope cue", value: "two white + two red" },
      ],
      notes: `Walk or orbit through the approach and watch the units flip. Settings are 0.5° / 0.17° below and above ${end.papiDeg.toFixed(2)}°. This is a schematic — not a certified aiming aid.`,
      footprint: endFp(rwy, endName, 300, 12, 50, landingSign(end) === 1 ? -(rwy.width / 2 + 28) : rwy.width / 2 + 28),
    },
  ];
}

export const FEATURES: Feature[] = [
  {
    id: "mark.cl.0927",
    title: "RWY 09/27 centreline",
    kind: "marking",
    location: "Full usable length of RWY 09/27",
    purpose: "Provide directional guidance along the runway axis in low visibility and at night.",
    icao: "Annex 14 Vol I §5.2.3 Runway centre line marking",
    dimensions: [
      { label: "Stripe", value: "30 m" },
      { label: "Gap", value: "20 m" },
      { label: "Width", value: "0.90 m (code 4, width ≥ 45 m)" },
      { label: "Runway", value: "3448 × 60 m" },
    ],
    notes: "VABB 09/27 is the primary instrument runway. Centreline width is the ICAO 0.90 m value, not the 0.45 m used on 14/32.",
    footprint: fp(RWY_0927, 0, 0, 3448, 0.9),
  },
  {
    id: "mark.cl.1432",
    title: "RWY 14/32 centreline",
    kind: "marking",
    location: "Full usable length of RWY 14/32",
    purpose: "Same function as 09/27, on the crossing runway.",
    icao: "Annex 14 Vol I §5.2.3 Runway centre line marking",
    dimensions: [
      { label: "Stripe / gap", value: "30 m / 20 m" },
      { label: "Width", value: "0.45 m" },
      { label: "Runway", value: "2871 × 45 m" },
    ],
    notes: "45 m pavement uses the narrower 0.45 m centreline. Heading ~135/315 true.",
    footprint: fp(RWY_1432, 0, 0, 2871, 0.45),
  },
  ...endFeatures(RWY_0927, "09"),
  ...endFeatures(RWY_0927, "27"),
  ...endFeatures(RWY_1432, "14"),
  ...endFeatures(RWY_1432, "32"),
  {
    id: "mark.side.0927",
    title: "RWY 09/27 side stripes",
    kind: "marking",
    location: "Both edges of RWY 09/27",
    purpose: "Show the edge of the load-bearing pavement, especially where the shoulder contrast is poor.",
    icao: "Annex 14 Vol I §5.2.7 Runway side stripe marking",
    dimensions: [
      { label: "Width", value: "0.90 m" },
      { label: "Runway width", value: "60 m" },
    ],
    notes: "Continuous white. The displaced sections keep side stripes — only landing is restricted, not pavement width.",
    footprint: fp(RWY_0927, 0, 0, 3448, 60),
  },
  {
    id: "mark.side.1432",
    title: "RWY 14/32 side stripes",
    kind: "marking",
    location: "Both edges of RWY 14/32",
    purpose: "Edge of the 45 m crossing runway.",
    icao: "Annex 14 Vol I §5.2.7 Runway side stripe marking",
    dimensions: [
      { label: "Width", value: "0.90 m" },
      { label: "Runway width", value: "45 m" },
    ],
    notes: "Same 0.90 m stripe on a narrower runway — the inner face of the stripe sits 0.45 m in from each edge.",
    footprint: fp(RWY_1432, 0, 0, 2871, 45),
  },
  {
    id: "mark.hold.n1",
    title: "Runway-holding position N1",
    kind: "marking",
    location: "Taxiway N1, 75 m north of RWY 09/27 centreline",
    purpose:
      "The CAT I/II holding position: two solid + two dashed yellow lines. Solid pair faces the runway. Aircraft stop before the solids unless cleared to cross.",
    icao: "Annex 14 Vol I §5.2.10 Runway-holding position marking",
    dimensions: [
      { label: "Pattern", value: "2 solid + 2 dashed yellow" },
      { label: "Line width", value: "0.90 m" },
      { label: "Gap", value: "0.90 m" },
      { label: "Distance from CL", value: "75 m (code 4, precision)" },
    ],
    notes: "N1 is the schematic west connector onto 09/27. CAT II hold for 27 is further back in the real aerodrome; this lab shows the painted pattern at a code-4 distance.",
    footprint: { x: TAXI_N1.x, z: -75, headingDeg: 0, length: 8, width: 23 },
  },
  {
    id: "mark.taxi.n",
    title: "Taxiway N centreline",
    kind: "marking",
    location: "Parallel taxiway north of RWY 09/27",
    purpose: "Continuous yellow centreline for taxi guidance.",
    icao: "Annex 14 Vol I §5.2.8 Taxiway centre line marking",
    dimensions: [
      { label: "Style", value: "Continuous yellow" },
      { label: "Width", value: "0.30 m" },
      { label: "Taxiway width", value: "23 m (schematic)" },
    ],
    notes: "Schematic ribbon — VABB’s real N has fillets, stubs and CAT II routing that are intentionally omitted.",
    footprint: { x: 0, z: TAXI_N.z, headingDeg: 90, length: TAXI_N.x1 - TAXI_N.x0, width: 0.3 },
  },
  {
    id: "mark.taxi.s",
    title: "Taxiway S centreline",
    kind: "marking",
    location: "Parallel taxiway south of RWY 09/27, between the runway and T2",
    purpose: "South parallel taxiway centreline.",
    icao: "Annex 14 Vol I §5.2.8 Taxiway centre line marking",
    dimensions: [
      { label: "Style", value: "Continuous yellow" },
      { label: "Width", value: "0.30 m" },
    ],
    notes: "S sits between 09/27 and the T2 massing. Keep it in the layer toggle with other markings.",
    footprint: { x: 0, z: TAXI_S.z, headingDeg: 90, length: TAXI_S.x1 - TAXI_S.x0, width: 0.3 },
  },
  {
    id: "light.edge.0927",
    title: "RWY 09/27 edge lights",
    kind: "light",
    location: "Both edges, 60 m longitudinal spacing",
    purpose:
      "White edge lights define the runway at night. The last 600 m in the take-off direction are yellow caution zone.",
    icao: "Annex 14 Vol I §5.3.9 Runway edge lights",
    dimensions: [
      { label: "Spacing", value: "60 m" },
      { label: "Colour", value: "White; yellow last 600 m" },
      { label: "Runway length", value: "3448 m" },
    ],
    notes: "Bidirectional runway: both ends show a 600 m yellow caution zone. Elevated lights, schematic 0.4 m high.",
    footprint: fp(RWY_0927, 0, 0, 3448, 60),
  },
  {
    id: "light.edge.1432",
    title: "RWY 14/32 edge lights",
    kind: "light",
    location: "Both edges of the crossing runway, 60 m spacing",
    purpose: "Same edge-light rule on 14/32, including yellow caution ends.",
    icao: "Annex 14 Vol I §5.3.9 Runway edge lights",
    dimensions: [
      { label: "Spacing", value: "60 m" },
      { label: "Colour", value: "White; yellow last 600 m" },
    ],
    notes: "45 m runway — edge lights sit on the 0.90 m side stripe.",
    footprint: fp(RWY_1432, 0, 0, 2871, 45),
  },
  {
    id: "light.cl.0927",
    title: "RWY 09/27 centreline lights",
    kind: "light",
    location: "Inset on 09/27 centreline, 15 m spacing",
    purpose:
      "High-intensity centreline for low-visibility take-off and landing. Colour-coded by remaining distance: white, then alternate red/white last 900 m, red last 300 m.",
    icao: "Annex 14 Vol I §5.3.12 Runway centre line lights",
    dimensions: [
      { label: "Spacing", value: "15 m" },
      { label: "White section", value: "until 900 m remaining" },
      { label: "Alternate red/white", value: "900–300 m remaining" },
      { label: "Red", value: "last 300 m" },
    ],
    notes: "Fitted on 09/27 only in this lab (the instrument runway). Bidirectional coding is shown from both ends.",
    footprint: fp(RWY_0927, 0, 0, 3448, 1),
  },
  {
    id: "light.tdz.27",
    title: "Touchdown-zone lights RWY 27",
    kind: "light",
    location: "First 900 m of RWY 27 (CAT II end)",
    purpose:
      "White inset bars in the touchdown zone to define the landing area in CAT II. Not fitted on the CAT I 09 end in this schematic.",
    icao: "Annex 14 Vol I §5.3.13 Runway touchdown zone lights",
    dimensions: [
      { label: "Length", value: "900 m" },
      { label: "Colour", value: "White" },
      { label: "Typical spacing", value: "30 m rows" },
    ],
    notes: "VABB 27 is the CAT II runway — TDZ lights are the CAT II differentiator besides the 900 m ALS.",
    footprint: endFp(RWY_0927, "27", 450, 900, 40),
  },
  {
    id: "light.taxi.edge",
    title: "Taxiway edge lights",
    kind: "light",
    location: "Blue lights along N, S and N1 edges",
    purpose: "Blue edge lights outline the taxiway at night.",
    icao: "Annex 14 Vol I §5.3.17 Taxiway edge lights",
    dimensions: [
      { label: "Colour", value: "Blue" },
      { label: "Spacing (schematic)", value: "60 m" },
    ],
    notes: "Blue is reserved for taxiway edge — never used on the runway. Toggle the Lights layer to hide them.",
    footprint: { x: 0, z: TAXI_N.z, headingDeg: 90, length: 3400, width: 23 },
  },
  {
    id: "light.taxi.cl",
    title: "Taxiway centreline lights",
    kind: "light",
    location: "Green inset lights on N, S and N1 centrelines",
    purpose: "Green centreline lights for night / low-visibility taxi.",
    icao: "Annex 14 Vol I §5.3.16 Taxiway centre line lights",
    dimensions: [
      { label: "Colour", value: "Green" },
      { label: "Spacing (schematic)", value: "30 m" },
    ],
    notes: "Where a taxiway centreline meets a runway, real systems switch to alternate green/yellow. Schematic uses steady green on the taxiways only.",
    footprint: { x: 0, z: TAXI_S.z, headingDeg: 90, length: 3200, width: 1 },
  },
  {
    id: "light.rgl.n1",
    title: "Runway guard lights (wig-wag) N1",
    kind: "light",
    location: "Both sides of N1 at the holding position",
    purpose:
      "Alternating yellow wig-wag lights (configuration A) that shout “runway ahead”. Used in addition to the painted hold.",
    icao: "Annex 14 Vol I §5.3.23 Runway guard lights",
    dimensions: [
      { label: "Colour", value: "Yellow, alternating" },
      { label: "Config", value: "A — elevated pair" },
    ],
    notes: "Watch them alternate. They sit with the mandatory 09-27 sign at N1.",
    footprint: { x: TAXI_N1.x, z: -75, headingDeg: 0, length: 6, width: 28 },
  },
  {
    id: "light.reil.27",
    title: "REIL threshold 27",
    kind: "light",
    location: "White flashing pair at threshold 27, outboard of the wing bars",
    purpose:
      "Runway end identifier lights — high-intensity white flashers that help acquire the threshold in cluttered city lighting.",
    icao: "Annex 14 Vol I §5.3.8 Runway threshold identification lights",
    dimensions: [
      { label: "Colour", value: "White, flashing" },
      { label: "Units", value: "2" },
    ],
    notes: "Fitted on 27 in this lab (the CAT II / city-approach end). Flash is synchronised, ~1 Hz schematic.",
    footprint: endFp(RWY_0927, "27", 0, 8, 90),
  },
  {
    id: "sign.mand.0927",
    title: "Mandatory sign 09-27",
    kind: "sign",
    location: "N1 holding position, left of the taxiway facing the hold",
    purpose: "Red / white mandatory instruction: the runway you are about to enter.",
    icao: "Annex 14 Vol I §5.4.2 Mandatory instruction signs",
    dimensions: [
      { label: "Legend", value: "09-27" },
      { label: "Face", value: "White on red" },
    ],
    notes: "Installed at every runway/taxiway intersection. Combined with location sign N1 in a real array.",
    footprint: { x: TAXI_N1.x - 16, z: -75, headingDeg: 0, length: 1.2, width: 3.2 },
  },
  {
    id: "sign.mand.cat2",
    title: "Mandatory sign CAT II 27",
    kind: "sign",
    location: "Approach to 27 CAT II holding position (schematic, east N1-style hold)",
    purpose: "Marks the CAT II holding position for RWY 27. Aircraft must not pass in CAT II operations without clearance.",
    icao: "Annex 14 Vol I §5.4.2 / §5.2.10 Category I/II/III holding positions",
    dimensions: [
      { label: "Legend", value: "CAT II 27" },
      { label: "Face", value: "White on red" },
    ],
    notes: "VABB 27 is CAT II; 09 is CAT I. The extra hold protects the ILS critical/sensitive area.",
    footprint: { x: 1180, z: -78, headingDeg: 0, length: 1.2, width: 4.4 },
  },
  {
    id: "sign.mand.noentry",
    title: "NO ENTRY sign",
    kind: "sign",
    location: "West of T2 apron / S taxiway stub (schematic)",
    purpose: "Mandatory prohibition — do not proceed. Used at one-way stubs and closed pavement.",
    icao: "Annex 14 Vol I §5.4.2 Mandatory instruction signs",
    dimensions: [
      { label: "Legend", value: "NO ENTRY" },
      { label: "Face", value: "White on red" },
    ],
    notes: "Placed on a stub that looks like a runway entrance but is not. Classic hot-spot mitigation.",
    footprint: { x: 620, z: 118, headingDeg: 90, length: 1.2, width: 3.6 },
  },
  {
    id: "sign.loc.n1",
    title: "Location sign N1",
    kind: "sign",
    location: "N1 holding position, yellow on black",
    purpose: "Identifies the taxiway you are on. Location signs are yellow inscription on black.",
    icao: "Annex 14 Vol I §5.4.3 Location signs",
    dimensions: [
      { label: "Legend", value: "N1" },
      { label: "Face", value: "Yellow on black" },
    ],
    notes: "Never used alone at a hold — always paired with the red mandatory runway sign.",
    footprint: { x: TAXI_N1.x + 16, z: -75, headingDeg: 0, length: 1.2, width: 2.4 },
  },
  {
    id: "sign.dir.ne",
    title: "Direction sign N / E",
    kind: "sign",
    location: "Taxiway N at the N1 junction",
    purpose: "Black on yellow with arrows: continue on N or turn toward the east / runway connector.",
    icao: "Annex 14 Vol I §5.4.4 Direction/destination signs",
    dimensions: [
      { label: "Legend", value: "N ←  → E" },
      { label: "Face", value: "Black on yellow" },
    ],
    notes: "Information signs are yellow. A black-on-yellow arrow board is not a hold — it is routing.",
    footprint: { x: TAXI_N1.x, z: TAXI_N.z - 16, headingDeg: 90, length: 1.2, width: 4.8 },
  },
  {
    id: "sign.dtg.0927",
    title: "Distance-remaining markers 09/27",
    kind: "sign",
    location: "Every 1000 ft along RWY 09/27, white on black",
    purpose:
      "Runway distance-remaining (typically FAA-style) in thousands of feet, so a departing crew can judge accelerate-stop / remaining TODA at a glance.",
    icao: "Annex 14 Vol I §5.4.7 Information signs (distance-to-go is a commonly provided supplement)",
    dimensions: [
      { label: "Numerals", value: "10 … 1" },
      { label: "Interval", value: "1000 ft (304.8 m)" },
      { label: "Face", value: "White on black" },
    ],
    notes: "VABB 09/27 is 3448 m ≈ 11 312 ft, so markers 10 through 1 fit. This lab places them on the north shoulder for the 09 take-off direction.",
    footprint: fp(RWY_0927, 0, -38, 3448, 2),
  },
  {
    id: "bldg.t2",
    title: "Terminal 2 massing",
    kind: "building",
    location: "South of RWY 09/27, land-side of taxiway S",
    purpose: "Schematic stand-in for CSMIA Terminal 2. Not a photogrammetric model.",
    icao: "Not a visual aid — aerodrome obstacle / building restriction (Annex 14 §4)",
    dimensions: [
      { label: "Role", value: "Passenger terminal massing" },
      { label: "Position", value: "South of 09/27" },
    ],
    notes: "Block geometry only. Grok Runway Lab is not a digital twin and must not be used for real docking or hot-spot study.",
    footprint: { x: 380, z: 340, headingDeg: 90, length: 420, width: 160 },
  },
  {
    id: "bldg.tower",
    title: "Control tower",
    kind: "building",
    location: "South-west of T2 apron, overlooking both runways",
    purpose: "Visual control room with a view of 09/27 and 14/32.",
    icao: "Annex 14 Vol I §1.4 / tower siting (operational, not a marking)",
    dimensions: [
      { label: "Cab height (schematic)", value: "~65 m" },
    ],
    notes: "The real VABB tower sits on the south campus. Height and exact grid are schematic.",
    footprint: { x: -40, z: 260, headingDeg: 0, length: 18, width: 18 },
  },
  {
    id: "bldg.hangars",
    title: "Maintenance hangars",
    kind: "building",
    location: "North of taxiway N",
    purpose: "MRO / GHA hangar massing and a small apron for parked jets.",
    icao: "Not a visual aid",
    dimensions: [{ label: "Count", value: "3 sheds" }],
    notes: "Block hangars only — no photo textures as 3D meshes.",
    footprint: { x: -80, z: -280, headingDeg: 90, length: 280, width: 80 },
  },
  {
    id: "bldg.windsock",
    title: "Windsock",
    kind: "building",
    location: "Near threshold 09, left of approach",
    purpose: "Surface wind direction and a crude speed cue (extension of the sleeve).",
    icao: "Annex 14 Vol I §5.1.1 Wind direction indicator",
    dimensions: [
      { label: "Pole", value: "Illuminated schematic" },
      { label: "Colour", value: "Orange / white bands" },
    ],
    notes: "A wind direction indicator is required at an aerodrome. The sleeve here weathervanes on a fixed lab breeze.",
    footprint: { x: -1500, z: -70, headingDeg: 0, length: 8, width: 8 },
  },
  {
    id: "bldg.jets",
    title: "Parked jets (block geometry)",
    kind: "building",
    location: "South apron between taxiway S and T2",
    purpose: "Scale reference. Three narrow-body silhouettes, boxes and cylinders only.",
    icao: "Not a visual aid",
    dimensions: [
      { label: "Type", value: "Schematic narrow-body" },
      { label: "Count", value: "3" },
    ],
    notes: "No photographic textures, no airline livery. They exist so walk-mode has something human-scaled beside the 60 m runway.",
    footprint: { x: 220, z: 168, headingDeg: 90, length: 180, width: 50 },
  },
];

export const FEATURE_BY_ID = new Map(FEATURES.map((f) => [f.id, f]));

export function featuresOfKind(kind: FeatureKind) {
  return FEATURES.filter((f) => f.kind === kind);
}

export type LayerFlags = {
  markings: boolean;
  lights: boolean;
  signs: boolean;
  buildings: boolean;
};

const LAYER_OF: Record<FeatureKind, keyof LayerFlags> = {
  marking: "markings",
  light: "lights",
  sign: "signs",
  building: "buildings",
};

export function pickFeature(x: number, z: number, layers: LayerFlags) {
  let best: Feature | null = null;
  let bestArea = Infinity;
  for (const f of FEATURES) {
    if (!layers[LAYER_OF[f.kind]]) continue;
    const r = f.footprint;
    const { fx, fz, rx, rz } = headingVec(r.headingDeg);
    const dx = x - r.x;
    const dz = z - r.z;
    const along = dx * fx + dz * fz;
    const across = dx * rx + dz * rz;
    const pad = f.kind === "sign" ? 6 : f.kind === "light" ? 8 : 4;
    if (Math.abs(along) <= r.length / 2 + pad && Math.abs(across) <= r.width / 2 + pad) {
      const area = r.length * r.width;
      if (area < bestArea) {
        best = f;
        bestArea = area;
      }
    }
  }
  return best;
}

export function nearestFeature(x: number, z: number, layers: LayerFlags) {
  let best: Feature | null = null;
  let bestD = Infinity;
  for (const f of FEATURES) {
    if (!layers[LAYER_OF[f.kind]]) continue;
    const d = Math.hypot(f.footprint.x - x, f.footprint.z - z);
    if (d < bestD) {
      best = f;
      bestD = d;
    }
  }
  return best;
}
