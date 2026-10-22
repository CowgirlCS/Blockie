# Blockie

A blocky side-scrolling adventure for young players. Help Blockie, a little red knight,
collect points and beat the 5 bosses of the Blockie Forest!

## How to play

Double-click **`index.html`**. It opens in your web browser (Chrome, Edge or Firefox).
No internet and no installing needed.

| Key         | What it does                        |
|-------------|-------------------------------------|
| ← →         | Walk                                |
| ↑           | Jump                                |
| Space       | Swing your weapon                   |
| ↓           | Block with the shield (if you have one) |
| P or Esc    | Pause                               |
| Enter       | Pick in menus                       |

- **Easy mode** gives 5 hearts. **Normal mode** gives 3. Pick it on the title screen.
- Get the level's points, beat the boss, then touch the red flag.
- Food heals one heart and makes you fast for a bit.
- Armor (helmet, chest plate, shield) blocks one hit each, then breaks.
- Walk past an elephant to say hi. It gives you a gem!
- Spend gems in the **Castle Shop** on upgrades.
- Progress saves by itself in the browser.

## The levels

1. **Blockie Meadow** - zombies, farms and elephants. Boss: Farmer Grumble
2. **Mushroom Woods** - skeletons and mobs. Boss: Giant Spider
3. **Spider Hollow** - a dark cave full of spiders. Boss: Spider Queen
4. **Skeleton Ruins** - an old graveyard. Boss: Skeleton King
5. **Castle of the Forest** - robots and everyone else. Boss: The Mob Lord

After levels 1 to 4 there is a bonus round (Gem Rain or Spider Chase).

## For grown-ups

Plain HTML, CSS and JavaScript. No libraries, no build step.

- `js/levels.js` - the level maps (easy to edit: each level is a list of simple calls)
- `js/entities.js` - Blockie, monsters, elephants
- `js/bosses.js` - the five bosses
- `js/world.js` - playing a level, the camera and the HUD
- `js/screens.js` - menus, shop, win and game-over screens
- `js/draw.js` - all the drawing (everything is made of rectangles)
- `js/audio.js` - beeps and boops made with the Web Audio API

To start over, pick **New Game** on the title screen.
