# 🎩 Office Mafia — Development Plan

---

## 🎯 Project Overview

- **Name**: Office Mafia
- **Purpose**: Host a themed Mafia game with custom office-inspired roles and voiceovers, playable on mobile via web browser.
- **Target Users**: Internal use with friends/colleagues for now, scalable later.
- **Platform**: Web app (mobile-first), hosted on Vercel
- **Tech Stack**:
    - **Frontend**: React Native for Web via Expo
    - **Backend**: Supabase (Postgres DB, Edge Functions, Storage)
    - **Hosting**: Vercel
    - **Voice**: AI-generated using ElevenLabs or similar

---
git 
## 🎮 Game Flow & Features

### 👤 Host Flow

- Host visits `/host` route and creates a game session
- QR code is generated for players to join
- Host sees the lobby view and player join status
- Host can press **Start Game** when ready
- Host's device will be playing the voiceover prompts (moderator audio) for everyone to follow
- Host inputs:
    - Voting results (who gets voted)
    - 

### 👥 Player Flow

- Player scans QR code and joins via `/player` route
- Player enters their name and is added to session
- After game start, player is shown their role privately
- During night:
    - If player has a special role, they receive instructions
    - Otherwise screen says "close your eyes"
- During day:
    - Player sees daily updates
    - No player input required unless role demands

### 🧑‍💼 Role Types

- **Employees** (citizens): Regular players with no special power
- **Rogue Employees** (mafia): Secretly collaborate to eliminate others
- **Audit** (cop): Can investigate a player each night to reveal if they're rogue
- **HR** (doctor): Can protect a player from elimination each night

### 🔊 Voiceover Handling

- Moderator audio (intro, night/day transition, results) plays **only from host's device**
- Audio files are hosted in Supabase Storage and fetched as needed
- Voiceovers include:
    - Game intro
    - "Everyone close your eyes"
    - Role prompts (e.g. "Rogue employee, open your eyes...")
    - Announce day and death results
    - Announce voting phase and ask for host input
    - End game: win/lose announcements

### 📋 Core Functional Requirements

- Create/join sessions via Supabase
- Host creates a game session
- QR code is generated for players to join
- Players enter names and join the session
- Host sees player list and starts the game
- Assign roles randomly from player pool, using a logic to determine the number of each roles based on the number of players
- Handle game phase transitions (lobby → night → day → end)
- Private role visibility (per device)
- Host-only voiceover playback
- Deaths and events are announced by voiceover
- Host inputs vote results manually for each day
- Trigger game end condition

---

## 🧱📁 File & Folder Structure (Expo + Supabase)

---

```
/app
  /screens
    Lobby.tsx
    RoleReveal.tsx
    GamePhase.tsx
    Voting.tsx
    Results.tsx
  /components
    PlayerList.tsx
    RoleCard.tsx
    PhaseBanner.tsx
  /utils
    supabaseClient.ts
    audioHelpers.ts
/assets
  /audio
  /images
```

---

## 📅 Development Timeline

### Roadmap

## ✅ **Phase 1: Project Setup & Foundations(COMPLETED)**

**Goal:** Lay down the environment and core structure for host/player experience.

### Tasks

- [ ]  Setup **monorepo** using **Expo for Web + React Native**
- [ ]  Deploy base app to **Vercel**
- [ ]  Connect **Supabase** project:
    - Postgres DB
    - Auth (if needed later)
    - Realtime (for session/player syncing)
- [ ]  Setup routes:
    - `/host`
    - `/player`
- [ ]  Build a simple landing page with buttons to go to host/player flows

---

## 🧑‍💻 **Phase 2: Host Game Flow (Lobby to Start)**

**Goal:** Enable hosts to create sessions and see players joining.

### Tasks

- [ ]  Host page: `/host`
    - [ ]  Create new game session in Supabase (`games` table)
    - [ ]  Generate & display **Game ID** + **QR code**
- [ ]  Players can join via `/player?gameId=XXXX`
    - [ ]  Enter name → saved to `players` table (with game ID reference)
- [ ]  Lobby view for host:
    - [ ]  Show real-time list of joined players
    - [ ]  Add “Start Game” button

---

## 🎭 **Phase 3: Role Assignment & Private Reveal**

**Goal:** Assign and deliver secret roles to each player after the host starts the game.

### Tasks

- [ ]  Backend function to:
    - [ ]  Determine role counts based on player total
    - [ ]  Assign roles randomly
    - [ ]  Store role mapping in Supabase (`roles` table or column in `players`)
- [ ]  Player screen logic:
    - [ ]  Once game starts → fetch and show role privately
    - [ ]  Display custom role UI
- [ ]  Host dashboard updates to “Game in Progress”

---

## 🌗 **Phase 4: Night/Day Cycle + Voiceover (Host Only)**

**Goal:** Allow host to progress the game with synchronized voiceover prompts.

### Tasks

- [ ]  Host UI controls:
    - [ ]  “Begin Night”, “Rogues Wake Up”, “Audit Wake Up”, etc.
    - [ ]  “Begin Day”, “Announce Votes”, “End Game”
- [ ]  Upload voiceover files to Supabase Storage
- [ ]  Implement host-only audio playback:
    - [ ]  Ensure only host’s browser plays audio
- [ ]  Build day/night phase display logic

---

## ⚰️ **Phase 5: Voting, Deaths & Game Logic**

**Goal:** Let host input votes, eliminate players, and check win conditions.

### Tasks

- [ ]  Host UI:
    - [ ]  Input: Who was voted out?
    - [ ]  Record death in DB
- [ ]  Game logic engine:
    - [ ]  Check win condition after each death (e.g. mafia = citizens)
    - [ ]  Handle HR saves and Audit investigations
- [ ]  Voiceover to announce:
    - [ ]  “Player X has been eliminated”
    - [ ]  “Game Over: Rogue Employees win!”

---

## 🎉 **Phase 6: End Game & Polishing**

**Goal:** Wrap up game experience and prepare for internal testing/demo.

### Tasks

- [ ]  Show victory screen to all players
- [ ]  Reveal full role list at the end
- [ ]  Add “Play Again” or “Return to Lobby”
- [ ]  Polish UI styling (mobile-first)
- [ ]  Light error handling (e.g. reconnect, game not found)

---

---

## 🔊 Voiceover Plan

- Use ElevenLabs to generate expressive voice clone
- Script + export: intro, role announcements, night/day transitions, etc.
- Store audio files in Supabase Storage
- Load audio conditionally per role/phase from frontend
- Ensure only host device plays audio

---

## 🧪 Testing Plan

- Local test with 2+ devices
- Simulate full game flow with sample roles
- Confirm voiceover only plays from host
- Supabase latency/performance checks

---

## 🌐 Deployment Plan

- Use Vercel GitHub integration (main branch)
- Configure domain + redirect for join links
- Add Supabase secrets to Vercel env vars
- Test with live game rounds

---

## 🌞 Future Considerations

- Authenticated profiles with match history
- Persistent sessions with reconnect
- Scoring/leaderboard system
- Export game logs or stats
- Scalable game loop refactor for remote play
- Dark mode support