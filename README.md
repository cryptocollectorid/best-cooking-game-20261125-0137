# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/cryptocollectorid/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/cryptocollectorid/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Wok & Ember — Warung Rush: a fast-paced Indonesian street-food cooking game. Take orders from the board, toss the right ingredients into the wok, plate the dish and serve it before the customer's patience runs out. One 3-minute shift, four dishes, seven ingredients, and combos for fast serves.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network: the game is plain static files under `game/`.

## How to play

- **Orders** arrive on the board at the top. Each ticket names a dish, its three ingredients, a patience bar and its coin reward.
- **Cook:** click an ingredient bin on the counter (or press keys `1`–`7`) to toss it into the wok. A wrong ingredient spoils the wok — clear it with the trash can or `X`.
- **Plate:** once all three ingredients are in and the dish has sizzled, press `Space` (or click the wok) to plate it.
- **Serve:** click the ticket that matches the plated dish. Serving fast chains a combo multiplier.
- **Shift:** 3 minutes. A ticket that runs out of patience costs a heart; three lost hearts end the shift early. `P` pauses, `M` mutes, `R` restarts after game over.

Four dishes on the menu: Nasi Goreng, Mie Ayam, Sate Ayam and Gado-Gado. All art is drawn in code and all sound is synthesized with WebAudio — the game loads nothing from the network.

---

<sub>Entered on [make.fun](https://make.fun/?ref=1mxzsqmr&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
