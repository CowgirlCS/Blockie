# Blockie

A blocky side-scrolling adventure for young players. Help Blockie, a little red knight,
collect points and beat the 8 bosses of the Blockie Forest!

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
- **Bedrock armor** (dark stone with a blue crystal) blocks **3 hits** per piece.
  The HUD shows how many hits each piece has left. Hold ↓ with the **bedrock shield**
  and it bounces bones, fire, snowballs and rocks back at the monsters!
  You can also buy Bedrock Armor in the Castle Shop to start every level wearing it.
- **Elemental dinos** walk up to you and roar before they attack:
  - **Fire** (red) and **ice** (blue) dinos breathe at you
  - **Lightning** (yellow) dinos stomp a zap along the ground. Jump over it!
  - **Wind** (green) dinos blow you backward
  Beat one and it drops its power orb.
- Walk past a friendly animal to say hi. Each one gives you a present:
  - **Elephant** and **sheep**: a gem
  - **Pig**: a bunch of coins
  - **Cow**: milk (+1 heart). You can ride on its back!
  - **Horse**: makes you run fast. Ride it too!
  - **Chicken**: lays an egg to eat
- **Gems**: blue = 1, green emerald = 2, red ruby = 3, sparkly diamond = 5.
  Spend them in the **Castle Shop** on upgrades.
- **Dragons** fly around and breathe fire (ouch!) or ice (brrr, it slows you down).
  Beat one and it drops a power orb.
- The **Fire Wand** shoots fireballs that fly at the nearest monster. Great for dragons!
- **Power orbs** give you an elemental power for 25 seconds:
  - **Fire** (red): hits do extra damage
  - **Ice** (blue): hits freeze monsters in a block of ice
  - **Lightning** (yellow): hits zap a second monster too
  - **Wind** (green): press ↑ again in the air for a double jump
- **Potions**:
  - **Heart** (red): +2 hearts
  - **Jump** (blue): super high jumps
  - **Star** (gold): nothing can hurt you, and monsters you touch get bonked
  - **Magnet** (purple): coins and gems fly to you
- Powers and potions show at the top left with a bar that runs down.
  Losing a life takes them away.
- Progress saves by itself in the browser.

## The levels

1. **Blockie Meadow** - zombies and two farms full of animals. Find the Wind orb! Boss: Farmer Grumble
2. **Mushroom Woods** - skeletons, mobs and your first dragon. Boss: Giant Spider
3. **Spider Hollow** - a dark cave full of spiders. The Fire Wand is here! Boss: Spider Queen
4. **Skeleton Ruins** - an old graveyard with fire and ice dragons. Boss: Skeleton King
5. **Castle of the Forest** - robots, dragons and everyone else. Boss: The Mob Lord
6. **Dino Valley** - volcanoes, palm trees and dinos of every element. The first bedrock armor is here!
   Boss: Rex the Dino King, who uses a new element every attack and charges across the room
7. **Frozen Peaks** - snow, ice dinos and ice dragons. Boss: The Big Yeti (snowballs and falling icicles)
8. **Bedrock Deep** - a dark cave with lava pits. Boss: The Bedrock Golem (boulders, ground slams and rock rain)

After levels 1 to 7 there is a bonus round (Gem Rain, Spider Chase or Dino Stampede).

**Bosses get ANGRY** at half health: they glow red, move faster and use new attacks,
like ground waves you have to jump over, extra webs and bones, or calling helpers.
Bosses have a little less health in Easy mode.

## For grown-ups

Plain HTML, CSS and JavaScript. No libraries, no build step.

- `js/levels.js` - the level maps (easy to edit: each level is a list of simple calls)
- `js/items.js` - gems, potions and elemental powers (names, colors, how long they last)
- `js/entities.js` - Blockie, monsters, dragons, dinos, the friendly animals
- `js/bosses.js` - the eight bosses
- `js/world.js` - playing a level, the camera and the HUD
- `js/screens.js` - menus, shop, win and game-over screens
- `js/draw.js` - all the drawing (everything is made of rectangles)
- `js/audio.js` - beeps and boops made with the Web Audio API

To start over, pick **New Game** on the title screen.
