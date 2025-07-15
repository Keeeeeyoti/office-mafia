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

### 🚀 **Beta Version Focus**
**Due to time constraints, we're focusing on a simplified but complete beta:**
- ✅ **Completed**: Game creation, QR joining, real-time lobby
- 🎯 **Beta Goal**: Role assignment + moderator scripts + basic elimination
- 📱 **Player Experience**: Join → See role → Wait for host → Victory/defeat screen  
- 🎤 **Host Experience**: Create → Start → Read scripts → Mark eliminations → End game
- 🔮 **Post-Beta**: Automated gameplay, audio, complex mechanics

---
git 
## 🎮 Game Flow & Features (Beta Version)

### 👤 Host Flow (Moderator)

- Host visits `/host` route and creates a game session
- QR code is generated for players to join
- Host sees the lobby view and player join status
- Host can press **Start Game** when ready
- **Beta: Host becomes the moderator (doesn't participate)**
- Host reads funny office-themed scripts provided by the app
- Host manually marks players as "fired" (eliminated)
- Host ends the game when ready

### 👥 Player Flow (Simplified Beta)

- Player scans QR code and joins via `/player` route
- Player enters their name and is added to session
- After game start, player is shown their role privately with office theme
- **Beta: Player waits for moderator to guide the game**
- At game end: Player sees victory/defeat screen based on team outcome
- **No complex interactions - just role reveal and final result**

### 🧑‍💼 Role Types

- **Employees** (citizens): Regular players with no special power
- **Rogue Employees** (mafia): Secretly collaborate to eliminate others
- **Audit** (cop): Can investigate a player each night to reveal if they're rogue
- **HR** (doctor): Can protect a player from elimination each night

### 🔊 Voiceover Handling (Post-Beta Feature)

- **Beta: Text scripts only** - Host reads provided office-themed scripts aloud
- **Future: Automated audio** - AI-generated voiceovers will play from host device
- Post-beta voiceovers will include:
    - Game intro with office humor
    - Role prompts: "Rogue employees, open your eyes..."
    - Elimination announcements: "John has been fired for productivity issues"
    - End game: "The employees have saved the company!" / "Rogue employees have taken over!"

### 📋 Core Functional Requirements (Beta Version)

- ✅ Create/join sessions via Supabase
- ✅ Host creates a game session
- ✅ QR code is generated for players to join
- ✅ Players enter names and join the session
- ✅ Host sees player list and starts the game
- 🎯 Assign roles randomly from player pool with office themes
- 🎯 Private role visibility (per device) with corporate descriptions
- 🎯 Host moderator dashboard with player status (employed/fired)
- 🎯 Text-based scripts for host to read aloud
- 🎯 Manual elimination system (host marks players as "fired")
- 🎯 Victory/defeat screens for players
- 🎯 Simple game end trigger

**Post-Beta Features:**
- Automated game phase transitions
- Audio voiceover playback
- Complex voting systems
- Advanced role abilities

### 🥚 Easter Eggs & Special Features

- ✅ **"Oowee" Performance Bonus System**
  - Hidden button at the bottom of player lobby screen during waiting period
  - Subtle design maintains minimalist aesthetic with brand colors (#8BB4D8)
  - Every 10 clicks = +1% performance bonus stored in database
  - Blue badges display bonuses next to player names in all views:
    - Player lobby screen
    - Host dashboard during game
    - Player role cards
  - Real-time synchronization across all connected clients
  - Database field: `performance_bonus` (integer) in players table
  - Corporate humor: rewards "dedication" and "extra effort" for the company

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

## 🧑‍💻 **Phase 2: Host Game Flow (Lobby to Start)(COMPLETED)**

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
npm
### Tasks

- [ ]  Backend function to:
    - [ ]  Determine role counts based on player total
    - [ ]  Assign roles randomly
    - [ ]  Store role mapping in Supabase (`roles` table or column in `players`)
- [ ]  Player screen logic:
    - [ ]  Once game starts → fetch and show role privately
    - [ ]  Display custom role UI with office-themed descriptions
- [ ]  Host dashboard updates to "Game in Progress"

---

## 🎯 **Phase 3.5: Beta Version Completion (PRIORITY FOR DELIVERY)**

**Goal:** Complete the beta version with moderator scripts and basic game state tracking.

### Tasks

- [ ]  **Moderator Script System:**
    - [ ]  Create collection of funny office-themed mafia scripts
    - [ ]  Host UI displays scripts for each game phase (intro, day phases, eliminations)
    - [ ]  Scripts include corporate humor: "The coffee machine has been sabotaged!"
- [ ]  **Host Dashboard (Moderator View):**
    - [ ]  Show player list with employed/fired status (alive/dead)
    - [ ]  Simple buttons to mark players as "fired" (eliminated)
    - [ ]  Manual game progression controls
    - [ ]  Game end trigger when ready
- [ ]  **Player End Game:**
    - [ ]  Victory/defeat screen based on team outcome
    - [ ]  Display final team results: "Employees Win!" or "Rogue Employees Win!"
- [ ]  **Beta Game Flow:**
    - [ ]  Start → Role Reveal → Host reads scripts → Mark eliminations → End game
    - [ ]  No complex automation - host controls everything manually

---

## 🌗 **Phase 4: Advanced Game Mechanics (POST-BETA DELIVERY)**

**Goal:** Add automated game flow and complex mechanics after beta feedback.

### Tasks (Future Development)

- [ ]  Automated night/day cycle progression
- [ ]  Player action inputs (voting, special abilities)
- [ ]  Automated win condition detection
- [ ]  Audio/voiceover integration with ElevenLabs
- [ ]  Advanced role abilities (HR saves, Audit investigations)

---

## ⚰️ **Phase 5: Enhanced Features (POST-BETA)**

**Goal:** Polish and advanced features based on beta testing feedback.

### Tasks (Future Development)

- [ ]  Real-time voting system
- [ ]  Game history and statistics tracking
- [ ]  Multiple game modes and variants
- [ ]  Enhanced mobile UI/UX improvements
- [ ]  Reconnection and error handling

---

## 🎉 **Phase 6: Production Polish (POST-BETA)**

**Goal:** Production-ready features and full deployment optimization.

### Tasks (Future Development)

- [ ]  User authentication and player profiles
- [ ]  Game replays and detailed logs
- [ ]  Admin dashboard for game management
- [ ]  Performance optimization and scaling
- [ ]  Comprehensive error handling and monitoring

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