/* A date count yields the same invitation and road conditions after reloading. */
window.Outings = (() => {
  const places = ["Pier", "Bakery", "Clock", "Park", "Bridge", "Books", "Florist", "Café", "Tram"];
  const clues = [
    "where the boats tie up",
    "where the loaves cool",
    "under the big clock",
    "beside the park benches",
    "above the water",
    "among the bookshelves",
    "under the flower awning",
    "where they pour our coffee",
    "beside the tram tracks",
  ];
  const errands = [
    {
      title: "Picnic for two",
      stops: [1, 6],
      tasks: ["Pick up rolls", "Pick daisies"],
      bag: ["rolls", "daisies"],
      ordered: false,
    },
    {
      title: "The borrowed book",
      stops: [5, 7],
      tasks: ["Borrow a book", "Leave it at the café"],
      bag: ["book", "delivery"],
      ordered: true,
    },
    {
      title: "Photo walk",
      stops: [0, 3],
      tasks: ["Photograph the water", "Photograph the trees"],
      bag: ["water photo", "tree photo"],
      ordered: false,
    },
    {
      title: "A surprise for Axel",
      stops: [6, 1],
      tasks: ["Choose a bouquet", "Trade a bloom for a pastry"],
      bag: ["bouquet", "pastry"],
      ordered: true,
    },
  ];
  const distance = (a, b) => Math.abs((a % 3) - (b % 3)) + Math.abs(Math.floor(a / 3) - Math.floor(b / 3));
  function plan(count) {
    const card = errands[count % errands.length];
    const choices = [7, 2, 3, 8, 1, 6, 5, 0, 4].filter((n) => !card.stops.includes(n));
    const goal = choices[(count + Math.floor(count / 4)) % choices.length];
    const closures = [
      [3, 4],
      [1, 4],
      [4, 7],
      [4, 5],
    ];
    const closed = closures[(count + Math.floor(count / 4)) % 4];
    const [a, b] = card.stops;
    const forward = distance(0, a) + distance(a, b) + distance(b, goal);
    const backward = distance(0, b) + distance(b, a) + distance(a, goal);
    const budget = (card.ordered ? forward : Math.min(forward, backward)) + 1;
    return { ...card, goal, closed, budget, clue: clues[goal] };
  }
  const fresh = () => ({ steps: 0, mask: 0, opened: false, rode: false });
  const blocked = (from, to, card, trip) =>
    !trip.opened && card.closed.includes(from) && card.closed.includes(to);
  return { places, plan, distance, fresh, blocked };
})();
