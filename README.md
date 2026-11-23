# Ember Court — A Duel of Elemental Cards

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Vellocatta/best-card-game-20261122-1826-entry/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Vellocatta/best-card-game-20261122-1826-entry/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original card game built for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826). You are the Duelist, and the Cinder Warden holds the Ember Court. Beat the Warden to 0 life before it beats you to 0.

## How to play

Serve the game and open it in a desktop browser — no build step, no network:

```sh
node serve.ts
# open http://localhost:8080
```

- **Click a card** in your hand (or press its number key) to pick it, then click where it goes: creatures onto your side of the table, spells onto their target.
- **Click one of your creatures** to pick it as an attacker, then click an enemy creature or the Warden to strike. Creatures attack on the turn after they are played.
- **End Turn** (or press Enter) hands the table to the Warden, which plays and attacks one move at a time so you can watch it think.
- **Space** starts the game; **R** restarts after a win or a loss; **M** mutes the sound.

## The rules

- Both heroes start at **30 life** and gain mana each turn, up to 10.
- Four elements — **Flame, Tide, Thorn, Stone** — each told apart by colour *and* shape. The advantage cycle runs Flame → Thorn → Stone → Tide → Flame: an attack with advantage deals +1 damage.
- **SURGE:** play two cards of the same element in one turn and all your creatures gain +1/+1.
- Creatures stay on the table (at most 5 a side) and fight until destroyed; spells strike once and are gone. The hand holds at most 7 cards.

## What is in this repository

- `game/` — the whole game as plain static files: `index.html` and its ES modules under `game/src/` (one file per job: `cards`, `world`, `ai`, `render`, `input`, `sound`, `random`, `shots`, `config`, `main`). Everything it loads is a file under `game/` or a `data:` URI.
- `screenshots/` — four real renders of the game: the table mid-duel, the title screen, the victory screen and the defeat screen.
- `main.ts` — the entry program (Node 22, standard library only): it copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `serve.ts` — a tiny static server for playing locally.

## The opponent

The Cinder Warden is no random player: it weighs its hand, plays the card that buys the most board, attacks where advantage pays, and holds back when the trade is bad. Read its board, count its mana, and strike when its hand is empty.
