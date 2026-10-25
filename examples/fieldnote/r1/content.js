// Shared copy and data for all three directions. Written once; each direction owns its own structure and CSS.
window.FN = {
  product: "Fieldnote",
  pitch: "41,280 location recordings for film and game sound, each logged with the hour, the weather and the mic that caught it.",
  stats: { recordings: "41,280", places: "312", format: "96 kHz / 24-bit" },
  query: "rain, forest, pre-dawn",
  clips: [
    { id: "FN-08812", name: "Rain on cedar canopy, pre-dawn", place: "Hoh Rainforest", region: "Washington, US", lat: 47.86, lon: -123.93, time: "04:12", len: "6:48", rate: "96k", mic: "MKH 8040 ORTF", weather: "Light rain, 11 °C", seed: 3 },
    { id: "FN-11204", name: "Harbour ropes creaking at slack tide", place: "Stavanger", region: "Rogaland, NO", lat: 58.97, lon: 5.73, time: "22:40", len: "2:31", rate: "96k", mic: "MKH 30/40 M/S", weather: "Calm, 6 °C", seed: 7 },
    { id: "FN-03390", name: "Night market generator hum", place: "Raohe Street", region: "Taipei, TW", lat: 25.05, lon: 121.58, time: "23:05", len: "3:05", rate: "48k", mic: "Sanken CSS-5", weather: "Humid, 27 °C", seed: 11 },
    { id: "FN-19977", name: "Wind through chain-link, high plateau", place: "Altiplano", region: "Oruro, BO", lat: -18.4, lon: -67.9, time: "15:20", len: "8:12", rate: "96k", mic: "MKH 8040 ORTF", weather: "Gusts 40 km/h", seed: 19 },
    { id: "FN-22410", name: "Dry lightning, distant thunder", place: "West MacDonnell Ranges", region: "Northern Territory, AU", lat: -23.7, lon: 132.8, time: "19:48", len: "4:40", rate: "96k", mic: "Schoeps MK4 XY", weather: "Dry storm, 31 °C", seed: 23 },
    { id: "FN-07761", name: "Tram brakes on wet rails", place: "Alfama", region: "Lisbon, PT", lat: 38.71, lon: -9.13, time: "07:55", len: "1:58", rate: "96k", mic: "MKH 416", weather: "Drizzle, 14 °C", seed: 29 },
    { id: "FN-15028", name: "Frogs and crickets over rice terraces", place: "Tegallalang", region: "Bali, ID", lat: -8.43, lon: 115.28, time: "20:10", len: "9:30", rate: "96k", mic: "MKH 8040 ORTF", weather: "Warm, still", seed: 31 },
    { id: "FN-30215", name: "Empty car park, fluorescent buzz", place: "Namba", region: "Osaka, JP", lat: 34.66, lon: 135.5, time: "02:30", len: "5:02", rate: "96k", mic: "Sanken CO-100K", weather: "Indoors, 18 °C", seed: 37 },
    { id: "FN-27741", name: "Ice cracking across a frozen lake", place: "Olkhon Island", region: "Lake Baikal, RU", lat: 53.15, lon: 107.4, time: "10:05", len: "7:16", rate: "192k", mic: "Hydrophone pair + MKH 8040", weather: "−24 °C, clear", seed: 41 },
    { id: "FN-12063", name: "Two people walking on river gravel", place: "Gorges de l'Ardèche", region: "Auvergne-Rhône-Alpes, FR", lat: 44.38, lon: 4.42, time: "17:35", len: "2:12", rate: "96k", mic: "MKH 50 + 30", weather: "Dry, 22 °C", seed: 43 },
  ],
  places: [
    { name: "Pacific Northwest", count: 1840, lat: 47.6, lon: -122.3 },
    { name: "Nordic coast", count: 960, lat: 60.4, lon: 5.3 },
    { name: "East Asian cities", count: 3120, lat: 34.7, lon: 135.5 },
    { name: "Andes", count: 740, lat: -16.5, lon: -68.1 },
    { name: "Central Australia", count: 510, lat: -23.7, lon: 133.9 },
    { name: "Iberian streets", count: 1220, lat: 38.7, lon: -9.1 },
    { name: "Indonesian islands", count: 1405, lat: -8.4, lon: 115.2 },
    { name: "Siberian lakes", count: 380, lat: 53.2, lon: 107.3 },
    { name: "French rivers", count: 690, lat: 44.4, lon: 4.4 },
    { name: "Sahel", count: 420, lat: 13.5, lon: 2.1 },
    { name: "Amazon basin", count: 1630, lat: -3.1, lon: -60.0 },
    { name: "Scottish highlands", count: 550, lat: 57.1, lon: -4.7 },
  ],
  // Deterministic waveform: n peaks in 0..1, with rain-like texture and slow swells.
  wave(seed, n) {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const swell = 0.45 + 0.3 * Math.sin(t * Math.PI * (2 + (seed % 3))) + 0.15 * Math.sin(t * 23 + seed);
      out.push(Math.max(0.06, Math.min(1, swell * (0.55 + rnd() * 0.6))));
    }
    return out;
  },
};
