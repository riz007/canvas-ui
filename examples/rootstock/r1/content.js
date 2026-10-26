// Shared data for all three directions.
window.RS = {
  day: "Wednesday 28 October", shipBy: "Thursday",
  roasts: [
    { n: 1, coffee: "Kiambu AA", origin: "Kenya", profile: "Light", kg: 12, start: "07:30", dur: 11, status: "done", orders: 6, temp: 204 },
    { n: 2, coffee: "Gesha Village", origin: "Ethiopia", profile: "Light", kg: 6, start: "07:55", dur: 10, status: "done", orders: 3, temp: 202 },
    { n: 3, coffee: "La Esperanza", origin: "Colombia", profile: "Medium", kg: 15, start: "08:20", dur: 12, status: "roasting", orders: 9, temp: 211, elapsed: 7.5 },
    { n: 4, coffee: "Finca Rosa", origin: "Guatemala", profile: "Medium", kg: 15, start: "08:45", dur: 12, status: "next", orders: 8 },
    { n: 5, coffee: "House Espresso", origin: "Brazil · Colombia", profile: "Medium-dark", kg: 15, start: "09:10", dur: 13, status: "queued", orders: 14 },
    { n: 6, coffee: "Sumatra Wahana", origin: "Indonesia", profile: "Dark", kg: 9, start: "09:35", dur: 14, status: "queued", orders: 4 },
  ],
  stock: [
    { coffee: "House base (Brazil)", kg: 412, perWeek: 70 },
    { coffee: "La Esperanza", kg: 96, perWeek: 30 },
    { coffee: "Finca Rosa", kg: 118, perWeek: 28 },
    { coffee: "Kiambu AA", kg: 22, perWeek: 24 },
    { coffee: "Gesha Village", kg: 31, perWeek: 6 },
    { coffee: "Sumatra Wahana", kg: 64, perWeek: 9 },
  ],
  orders: [
    { who: "Kith & Kin", items: "House Espresso 12 kg", due: "Thu", state: "waiting on roast 5" },
    { who: "Laynes Espresso", items: "La Esperanza 6 kg · Kiambu 3 kg", due: "Thu", state: "waiting on roast 3" },
    { who: "Bundobust", items: "House Espresso 8 kg", due: "Thu", state: "waiting on roast 5" },
    { who: "Web shop (23 orders)", items: "Mixed 250 g bags, 9.4 kg", due: "Thu", state: "partly roasted" },
    { who: "Two Sisters", items: "Finca Rosa 4 kg", due: "Fri", state: "waiting on roast 4" },
  ],
  // A plausible roast curve: bean temp °C by minute, with a turning point and first crack ~8.5 min.
  curve(minutes, end) {
    const pts = [];
    for (let m = 0; m <= minutes; m += 0.25) {
      const t = m < 1.2 ? 200 - m * 95 : 86 + (end - 86) * (1 - Math.exp(-(m - 1.2) / 4.2)) / (1 - Math.exp(-(12 - 1.2) / 4.2));
      pts.push([m, t]);
    }
    return pts;
  },
};
