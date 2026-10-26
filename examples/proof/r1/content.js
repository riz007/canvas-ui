window.PF = {
  name: "Proof", price: "£49", ships: "January",
  line: "Know the moment your starter peaks.",
  sub: "A lid for the jar you already have. It watches the rise every five minutes and tells your phone when it's time to bake or feed.",
  cta: "Join the January list",
  specs: [["Reads", "every 5 min"], ["Accuracy", "±1 mm"], ["Battery", "6 months"], ["Fits", "70–100 mm jars"]],
  // Starter height (% rise) over 14 hours after a 9:40 feed: slow lag, rise to a ~7 h peak, slower collapse.
  rise(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const h = (i / (n - 1)) * 14, w = h < 6.97 ? 2.6 : 3.9;
      out.push([h, 118 * Math.exp(-(((h - 6.97) / w) ** 2)) * Math.min(1, h / 1.2)]);
    }
    return out;
  },
};
