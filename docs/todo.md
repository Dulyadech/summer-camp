# Implementation Roadmap: Summer Camp Romance
*(Source of Truth: [docs/gdd.md](file:///c:/Users/Acer/Documents/Coding/Project/GAME/summer-camp/docs/gdd.md))*

---

## Global Definition of Done (DoD)
A task or phase is considered **Done** only when:
1. **Working & Executable:** The code compiles with zero TypeScript errors and executes cleanly without runtime exceptions.
2. **Deterministic Flow:** The defined user flow or automated test for the phase can be executed end-to-end and verified.
3. **GDD Alignment:** Implements the exact data schemas, scene counts (24 scenes), relationship rules, and endings specified in `docs/gdd.md` without feature creep.
4. **Boundary Integrity:** Strict separation of concerns is maintained (React for UI, Zustand for state, Scene Runner for logic, PixiJS for WebGPU rendering, Tauri/Rust for native file I/O only).
5. **No Regressions:** Prior working flows remain functional after new code is integrated.

---

## Phase 1 — Project Foundation & Build Pipeline
> **Goal:** Establish a working desktop application skeleton running React 19, TypeScript, Tailwind CSS, PixiJS v8 with WebGPU (and WebGL fallback), wrapped in Tauri v2.

- [x] Initialize Tauri v2 project with React 19, Vite, and TypeScript.
- [x] Configure Tailwind CSS for styling dialogue boxes and application UI.
- [x] Configure PixiJS v8 with WebGPU primary renderer and automatic WebGL fallback.
- [x] Verify window creation, hot-reloading (Vite HMR), and basic Tauri desktop build execution.
- [x] Implement capability detection log in console verifying whether WebGPU or WebGL is active.
- [x] Set up project directory structure:
  ```text
  src/
  ├── assets/          # Static audio, backgrounds, sprites, CGs
  ├── components/      # React UI components (Dialogue, Menus, Profile)
  ├── engine/          # Scene Runner, Condition Evaluator, Ending Resolver
  ├── narrative/       # Declarative JSON/TS episode & scene data
  ├── renderer/        # PixiJS WebGPU viewport, camera, sprite managers
  ├── state/           # Zustand stores (GameState, EngineState, Settings)
  └── types/           # Core TypeScript schemas and contracts
  src-tauri/           # Rust native backend (File I/O only)
  ```

### Phase 1 Acceptance Criteria
- [x] Tauri app launches into a native window displaying a PixiJS canvas and a Tailwind-styled overlay.
- [x] Console logs confirm successful initialization of PixiJS v8 (reporting WebGPU or WebGL).
- [x] `pnpm run tauri dev` runs without TypeScript or compilation errors.

---

## Phase 2 — Core Game State & Data Contracts
> **Goal:** Implement the full TypeScript data contracts and centralized Zustand store matching the GDD specifications.

- [x] Create `src/types/game.ts` defining:
  - `RelationshipStatus` (`'casual_interest' | 'romantic_interest' | 'mutually_acknowledged' | 'exclusive'`)
  - `CharacterState` (`attraction: number`, `trust: number`, `status: RelationshipStatus`)
  - `GameState` (`currentSceneId`, `protagonistName`, `characters: { jake, ethan, ryan }`, `flags: Record<string, boolean>`, `history: string[]`)
- [x] Create `src/types/narrative.ts` defining:
  - `DeclarativeCondition` (`type`, `target`, `statKey`, `flagKey`, `operator`, `value`)
  - `ConditionalDialogueVariant` (`conditions: DeclarativeCondition[]`, `overrideText`, `overrideExpression`)
  - `ChoiceOption` (`id`, `text`, `category`, `consequences`, `nextSceneId`)
  - `DialogueLine` (`id`, `speaker`, `text`, `spriteState`, `cameraEffect`, `conditionalVariant`)
  - `GameScene` (`id`, `episode: 1 | 2 | 3 | 4`, `day: 1 | 2 | 3 | 4 | 5`, `backgroundId`, `bgmId`, `dialogue`, `choices`, `nextSceneId`)
- [x] Implement `src/state/gameStore.ts` using Zustand:
  - Initial state matching GDD defaults (Attraction = 0, Trust = 50, Status = `'casual_interest'`, Flags = `{}`).
  - Mutations for `applyConsequences` (attractionDelta, trustDelta, newStatus, setFlags).
  - Mutations for `setCurrentScene`, `recordHistory`, and `resetGame`.
- [x] Unit test: Verify state mutations clamp `attraction` and `trust` within `0 - 100`.

### Phase 2 Acceptance Criteria
- [x] All TypeScript types compile cleanly and reflect `docs/gdd.md` Section 20 exactly.
- [x] State mutations correctly update numerical stats, toggle flags, and maintain visited scene history.

---

## Phase 3 — Declarative Condition & Scene Runner Engine
> **Goal:** Build the narrative runtime engine that evaluates declarative conditions, resolves choices with strict priority, and steps through dialogue.

- [ ] Implement `src/engine/conditionEvaluator.ts`:
  - Evaluates `DeclarativeCondition` objects against the current `GameState`.
  - Supports operators: `==`, `!=`, `>`, `>=`, `<`, `<=`.
  - Supports targets: `'stat'`, `'flag'`, and `'relationshipStatus'`.
  - Evaluates multiple conditions using logical AND.
- [ ] Implement `src/engine/sceneRunner.ts`:
  - `getCurrentLine()`: Returns active dialogue line, resolving `conditionalVariant` if conditions pass.
  - `advanceDialogue()`: Steps to next line in the active scene.
  - `selectChoice(choiceId: string)`:
    - Applies choice consequences to `gameStore`.
    - Routes to next scene according to **Priority 1 (`ChoiceOption.nextSceneId`)**.
    - If choice has no `nextSceneId`, routes via **Priority 2 (`GameScene.nextSceneId`)**.
    - If neither exists, signals **Priority 3 (Episode / Story Conclusion)**.
- [ ] Implement automated tests for:
  - Condition evaluation (testing true, false, edge boundary values).
  - Choice routing priority (choice-level destination overriding scene-level fallback).

### Phase 3 Acceptance Criteria
- [ ] Condition evaluator correctly overrides dialogue text when flags or stat thresholds are satisfied.
- [ ] Scene Runner advances line-by-line and transitions between scenes based on choice priority.
- [ ] Zero executable JavaScript functions exist in narrative data files.

---

## Phase 4 — Relationship & Social Dynamics Engine
> **Goal:** Implement the relationship progression rules, contextual jealousy evaluations, and lie tracking logic.

- [ ] Implement `src/engine/relationshipManager.ts`:
  - **Status Progression Rule:** Automatically updates character status based on thresholds:
    - `'romantic_interest'` if `attraction >= 40 && trust >= 30`
    - `'mutually_acknowledged'` if `attraction >= 60 && trust >= 50 && mutual_scene_flag`
    - `'exclusive'` if `attraction >= 75 && trust >= 65 && exclusive_choice_flag`
  - **Contextual Jealousy Evaluator:**
    - Checks: `(attraction >= 50) && (interactingWithOther) && (status !== 'exclusive')`.
    - Returns expression mode: `'playful_tease'` (if Trust $\ge$ 50), `'bitter_confrontation'` (if Trust $<$ 50), or `'none'` (if Attraction $<$ 50).
  - **Lie Memory Helper:**
    - Tracks active deception flags (`lied_about_*`).
    - Provides utility `getLieCount(state: GameState): number` for ending checks.
- [ ] Unit test: Verify jealousy triggers and expression modes under varying Attraction/Trust combinations.

### Phase 4 Acceptance Criteria
- [ ] Status transitions adhere strictly to GDD Section 7.2.
- [ ] Jealousy evaluates correctly and dynamically without storing a persistent jealousy stat.
- [ ] Lie memory helper deterministically counts active lies.

---

## Phase 5 — Visual Rendering Layer (PixiJS v8 WebGPU)
> **Goal:** Create the 2D cinematic viewport with background rendering, camera effects, and layered character sprites.

- [ ] Implement `src/renderer/PixiViewport.tsx`:
  - Mounts PixiJS canvas inside a responsive container.
  - Handles resize events and maintains 16:9 cinematic aspect ratio.
  - Automatically initializes WebGPU with fallback to WebGL.
- [ ] Implement `src/renderer/backgroundManager.ts`:
  - Loads and transitions between the 5 camp backgrounds (Cabin, Dock, Mess Hall, Forest, Campfire).
  - Implements lighting tint presets for Day, Sunset, and Night.
- [ ] Implement `src/renderer/spriteManager.ts`:
  - Renders 2D character sprites for Jake, Ethan, and Ryan.
  - Positions sprites at `'left'`, `'center'`, or `'right'`.
  - Supports expression texture swaps (neutral, smiling, flirty, tense, annoyed).
  - Supports outfit variants (casual summer vs. athletic/swimwear).
- [ ] Implement `src/renderer/cameraController.ts`:
  - Implements cinematic camera effects: `'zoom_in'` (close-up intimacy), `'pan_left'`, `'shake'` (tension/impact), and `'default'`.
- [ ] Implement `src/renderer/cgManager.ts`:
  - Fullscreen display of Event CGs with smooth alpha fade-in.

### Phase 5 Acceptance Criteria
- [ ] PixiJS viewport renders background, character sprites, and camera zoom smoothly.
- [ ] Swapping expressions and positions responds immediately to scene instructions.
- [ ] WebGPU runs by default on supported hardware; WebGL fallback functions on older systems.

---

## Phase 6 — Dialogue UI & React Presentation Layer
> **Goal:** Build the interactive narrative UI overlay in React, connected directly to Scene Runner and Zustand.

- [ ] Implement `src/components/DialogueBox.tsx`:
  - Displays speaker nameplate (with character-specific accent color).
  - Displays typewriter animated text with configurable speed and instant-click skip.
  - Renders dialogue action buttons: `Auto`, `Skip`, `Log`, `Settings`.
- [ ] Implement `src/components/ChoiceModal.tsx`:
  - Displays choice buttons categorized by tone/action/deception.
  - Triggers selection in Scene Runner on click.
- [ ] Implement `src/components/FeedbackOverlay.tsx`:
  - Renders subtle floating micro-indicators on choices:
    - Rose-gold heart on Attraction Up.
    - Golden spark on Trust Up.
    - Hairline crack on Trust Drop.
- [ ] Implement `src/components/BacklogDrawer.tsx`:
  - Slides out scrollable transcript of previously read dialogue lines in the current session.

### Phase 6 Acceptance Criteria
- [ ] Player can advance dialogue via keyboard (Space/Enter) or mouse click.
- [ ] Typewriter text renders fluidly and completes immediately on second click.
- [ ] Choice modal displays correctly when choices exist and routes dialogue on selection.
- [ ] Floating relationship feedback icons display briefly without disrupting dialogue flow.

---

## Phase 7 — Narrative Content Implementation (Exact 24 Scenes)
> **Goal:** Author and integrate the full 24 scenes across 4 episodes as declarative JSON/TypeScript data.

### Episode 1: Day 1 — The Arrival & Spark (5 Scenes)
- [ ] **Scene 1.1 (Day 1 - Camp Arrival):** Bus arrival, check-in, meeting Jake at the welcome desk.
- [ ] **Scene 1.2 (Day 1 - Shared Cabin):** Unpacking in Cabin 4, meeting Ethan organizing gear, initial banter.
- [ ] **Scene 1.3 (Day 1 - Mess Hall Intro):** Lunch assembly, Ryan makes an entrance, teasing Ethan, group dynamic established.
- [ ] **Scene 1.4 (Day 1 - Afternoon Free Time):** First choice point: explore dock (Jake), quiet trail (Ethan), or rec hall (Ryan).
- [ ] **Scene 1.5 (Day 1 - Welcome Bonfire):** First night gathering, subtle eye contact, establishing initial attraction flags.

### Episode 2: Days 2–3 — Sunlight & Sweat (7 Scenes)
- [ ] **Scene 2.1 (Day 2 - Morning Lake Tournament):** Water sports announcement, rivalry between Jake and Ethan.
- [ ] **Scene 2.2 (Day 2 - Canoe Race Choice):** Choice: partner with Jake, Ethan, or Ryan in the lake race.
- [ ] **Scene 2.3 (Day 2 - Dockside Rest):** Shared converged scene reacting to race choice; towel/water interaction.
- [ ] **Scene 2.4 (Day 2 - Locker Room Intimacy):** **CG 2 (Jake)** shirtless cooldown, locker banter, high sensual tension beat.
- [ ] **Scene 2.5 (Day 3 - Forest Trail Hike):** Day 3 exploration, quiet one-on-one conversation with Ethan, opening up.
- [ ] **Scene 2.6 (Day 3 - Lifeguard Tower Rendezvous):** **CG 4 (Ryan)** private afternoon encounter in the tower, teasing advances.
- [ ] **Scene 2.7 (Day 3 - Sunset Dock Gathering):** Converged group wind-down, jealousy evaluation based on Days 2–3 choices.

### Episode 3: Day 4 — Midnight Whispers & Simmering Tension (6 Scenes)
- [ ] **Scene 3.1 (Day 4 - Curfew Whispers):** Night falls, invitations to sneak out.
- [ ] **Scene 3.2 (Day 4 - Midnight Lake Encounter):** **CG 3 (Ethan)** stargazing on the dock, deep confession or evasion.
- [ ] **Scene 3.3 (Day 4 - The Clandestine Meeting):** Sneaking back or meeting second character; first major Deception Choice (`lied_about_*`).
- [ ] **Scene 3.4 (Day 4 - Breakfast Suspicion):** Next morning, subtle interrogation, lie detection checks, tension between trio.
- [ ] **Scene 3.5 (Day 4 - Pre-Campfire Mini-Events):** Exclusive conditional one-on-one interludes based on top attraction.
- [ ] **Scene 3.6 (Day 4 - Approaching Reckoning):** Night 4 climax, rumors solidify, Jake and Ethan friction peaks.

### Episode 4: Day 5 — Campfire & Reckoning (6 Scenes)
- [ ] **Scene 4.1 (Day 5 - Final Camp Morning):** Packing bags, bittersweet morning air, last preparations.
- [ ] **Scene 4.2 (Day 5 - The Campfire Assembly):** The final evening gathering begins, shared memories.
- [ ] **Scene 4.3 (Day 5 - Confrontation & Truth):** **CG 5 (Climax)** Lie flags checked; secrets surfaced; drama erupts if two-timing.
- [ ] **Scene 4.4 (Day 5 - Final Choice / Commitment):** Crucial decision point: declare feelings, step back, or embrace honesty.
- [ ] **Scene 4.5 (Day 5 - Private Epilogue Walk):** Walking away from the fire with the resolved partner (or alone).
- [ ] **Scene 4.6 (Day 5 - Ending Resolution & Epilogue):** Triggers `evaluateEndings()` to transition into one of the 6 ending routes.

### Phase 7 Acceptance Criteria
- [ ] All 24 scenes load correctly through the Scene Runner.
- [ ] Every scene contains accurate `episode` (1–4) and `day` (1–5) metadata.
- [ ] All choices correctly mutate GameState and route according to GDD specifications.

---

## Phase 8 — Ending Evaluation & Epilogue System
> **Goal:** Implement the deterministic ending evaluation engine and the 6 distinct ending outcomes.

- [ ] Implement `src/engine/endingResolver.ts`:
  - Evaluates endings in strict priority order:
    1. **Crash & Burn:** `jake.trust < 35 && ethan.trust < 35 && ryan.trust < 35 && countLies >= 2`.
    2. **Polyamorous:** `all(attraction >= 65) && all(trust >= 70) && countLies === 0`.
    3. **Jake Solo:** `jake.attraction >= 70 && jake.trust >= 60 && !lied_to_jake && jakeScore > others`.
    4. **Ethan Solo:** `ethan.attraction >= 70 && ethan.trust >= 60 && !lied_to_ethan && ethanScore > others`.
    5. **Ryan Solo:** `ryan.attraction >= 70 && ryan.trust >= 60 && !lied_to_ryan && ryanScore > others`.
    6. **Summer Fling:** `any(attraction >= 65) && trust in [40, 59]`.
    7. **Fallback:** Amicable Departure.
- [ ] Implement ending epilogue scenes for all 6 outcomes:
  - Epilogue script for Crash & Burn (lonely departure).
  - Epilogue script for Polyamorous (honest four-way summer bond).
  - Epilogue script for Jake Solo (warm promises and post-camp plans).
  - Epilogue script for Ethan Solo (vulnerable starlit confession).
  - Epilogue script for Ryan Solo (committed relationship declaration).
  - Epilogue script for Summer Fling (tender, bittersweet kiss and fond memories).
- [ ] Unit tests for `endingResolver`:
  - Verify every branch of the priority tree with mock `GameState` inputs.

### Phase 8 Acceptance Criteria
- [ ] All 6 endings can be deterministically triggered via test states without human ambiguity.
- [ ] Tie-breakers resolve cleanly using sum of Attraction + Trust.

---

## Phase 9 — Save / Load & State Persistence
> **Goal:** Implement robust multi-slot save and load functionality via Tauri native file I/O (with web localStorage fallback).

- [ ] Implement Tauri Rust command for save management in `src-tauri/src/main.rs`:
  - `save_game(slot_id: String, data: String) -> Result<(), String>`
  - `load_game(slot_id: String) -> Result<String, String>`
  - `list_saves() -> Result<Vec<SaveMetadata>, String>`
- [ ] Implement `src/engine/saveManager.ts`:
  - Serializes complete `GameState`, scene pointer, active line index, and timestamp.
  - Automatically detects Tauri vs. Web environment: writes to disk in Tauri, falls back to `localStorage` in browser.
  - Implements auto-save slot updated on every scene transition.
- [ ] Implement `src/components/SaveLoadModal.tsx`:
  - Visual grid of 6 save slots with thumbnail, scene title, and play timestamp.
  - Separate `Save` and `Load` modes with confirmation prompts.
- [ ] Unit test: Verify round-trip serialization and deserialization of `GameState`.

### Phase 9 Acceptance Criteria
- [ ] Game state successfully saves to disk in Tauri and reloads to the exact scene and dialogue line.
- [ ] Auto-save updates on every new scene.
- [ ] Web fallback functions identically using `localStorage`.

---

## Phase 10 — Player Menus, Profile Screen & Replay Tools
> **Goal:** Implement the meta-game menus, Relationship Profile screen, 24-Node Flowchart, and CG Gallery.

- [ ] Implement `src/components/TitleScreen.tsx`:
  - New Game, Load Game, Flowchart (unlocked after 1 clear), Gallery, Settings, Quit.
- [ ] Implement `src/components/ProfileModal.tsx`:
  - Polaroid display of Jake, Ethan, and Ryan.
  - Displays qualitative status badge (`casual_interest`, `romantic_interest`, `mutually_acknowledged`, `exclusive`).
  - Hides raw numerical stats from player view.
- [ ] Implement `src/components/FlowchartModal.tsx`:
  - Node graph representing all 24 scenes across Episodes 1–4.
  - Highlights cleared scenes and discovered ending badges.
  - Allows jumping directly into any previously visited scene.
- [ ] Implement `src/components/GalleryModal.tsx`:
  - Grid of the 6 Core CGs (+ 2 stretch); unblurs unlocked CGs with fullscreen viewer.
- [ ] Implement `src/components/SettingsModal.tsx`:
  - Text speed slider, auto-forward delay slider, audio volume sliders.

### Phase 10 Acceptance Criteria
- [ ] Title Screen navigates cleanly to all sub-menus and starts new games.
- [ ] Profile Modal reflects accurate qualitative status for all three characters.
- [ ] Flowchart visualizes unlocked scenes and allows direct scene navigation.
- [ ] Gallery correctly records and unlocks visited CGs.

---

## Phase 11 — Audio Engine & Sound Design
> **Goal:** Integrate Howler.js for multi-channel BGM, ambience loops, and sound effects.

- [ ] Implement `src/engine/audioManager.ts` using Howler.js:
  - BGM channel with smooth cross-fading between tracks.
  - Ambience channel (lake waves, cicadas, campfire crackle).
  - SFX channel (splashes, footfalls, heartbeat).
  - Master, Music, and SFX volume buses tied to `settingsStore`.
- [ ] Wire audio triggers into `GameScene` metadata (`bgmId`) and `DialogueLine` effects.
- [ ] Add sound effects to UI clicks, choice selections, and status feedback icons.

### Phase 11 Acceptance Criteria
- [ ] Background music loops and cross-fades without popping or clipping.
- [ ] Volume sliders in Settings immediately modify active audio output.

---

## Phase 12 — Production Assets, Polish & Integration
> **Goal:** Replace placeholder assets with production-ready 2D sprites, backgrounds, CGs, and polish transitions.

- [ ] Integrate 3 character sprite sheets (Jake, Ethan, Ryan) with expressions and outfit layers.
- [ ] Integrate 5 backgrounds across Day, Sunset, and Night lighting variants.
- [ ] Integrate 6 Core Event CGs:
  - CG 1: Group Lake Dock (Intro)
  - CG 2: Jake Locker Cooldown (Shirtless)
  - CG 3: Ethan Night Dock (Stargazing)
  - CG 4: Ryan Lifeguard Tower (Tease)
  - CG 5: Climax Campfire Tension
  - CG 6: Intimate Romantic Climax (Partner variant)
- [ ] Fine-tune camera easing curves (zoom in, pan, screen shake).
- [ ] Typography and dialogue box visual pass (drop shadows, glassmorphism, readability).

### Phase 12 Acceptance Criteria
- [ ] All 24 scenes display final visual assets without missing texture warnings.
- [ ] CG transitions fade in smoothly without visual hitches.

---

## Phase 13 — QA, Playtesting, Balancing & Packaging
> **Goal:** Conduct end-to-end playtesting, tune stat curves, and generate desktop and web release builds.

- [ ] Playthrough Verification Checklist:
  - [ ] Path to Jake Solo Ending verified.
  - [ ] Path to Ethan Solo Ending verified.
  - [ ] Path to Ryan Solo Ending verified.
  - [ ] Path to Polyamorous Ending verified (zero lies, high trust).
  - [ ] Path to Crash & Burn Ending verified (multiple lies, low trust).
  - [ ] Path to Summer Fling Ending verified.
- [ ] Stat Balancing Pass:
  - Verify that standard positive choices reward sufficient Attraction/Trust to achieve solo endings without requiring a rigid walkthrough.
- [ ] Cross-Platform Build Generation:
  - Run `npm run tauri build` to generate Windows (`.exe` / `.msi`) and macOS (`.dmg`) installers.
  - Run `npm run build` to generate static Web distribution package for browser testing.

### Phase 13 Acceptance Criteria
- [ ] All 6 endings can be achieved through legitimate player decision paths.
- [ ] Release builds package and execute cleanly on target operating systems.

---

## Open Questions & Pre-Implementation Clarifications

- [ ] **Protagonist Sprite Display:** GDD specifies a loosely-defined, nameable gay male protagonist. Confirm whether the protagonist has an on-screen sprite during dialogue or remains first-person off-screen with presence limited to CGs and choices. *(Recommended default: First-person camera during dialogue, featured visually in CGs).*
- [ ] **Flowchart State Retention across Saves:** Confirm whether the Flowchart unlocked nodes should be persisted in a global player profile file (independent of individual save slots) so that cleared scenes remain accessible across multiple playthroughs. *(Recommended default: Global profile storage in Tauri/localStorage).*

---

## Recommended Implementation Order

```
[Phase 1: Foundation (Tauri + React + PixiJS)]
                       │
                       ▼
[Phase 2: Game State & Data Contracts]
                       │
                       ▼
[Phase 3: Condition Evaluator & Scene Runner]
                       │
                       ▼
[Phase 4: Relationship & Jealousy Engine]
                       │
                       ▼
[Phase 5: PixiJS WebGPU Viewport] ◄───► [Phase 6: React Dialogue UI]
                       │
                       ▼
[Phase 7: Narrative Content (24 Scenes)]
                       │
                       ▼
[Phase 8: Ending Evaluation & Epilogues]
                       │
                       ▼
[Phase 9: Save / Load System]
                       │
                       ▼
[Phase 10: Player Menus, Profile & Flowchart]
                       │
                       ▼
[Phase 11: Audio Engine (Howler.js)]
                       │
                       ▼
[Phase 12: Production Assets & Polish]
                       │
                       ▼
[Phase 13: QA, Balancing & Release Builds]
```

### Dependency Rationale:
1. **Phases 1–3 form the headless core:** Game state, declarative conditions, and the scene runner must function first so game flow can be unit tested without graphics.
2. **Phases 4–6 assemble the playable interactive loop:** Relationship rules and the presentation layer (PixiJS canvas + React dialogue) allow developers to play scenes immediately.
3. **Phases 7–8 introduce the full content:** 24 scenes and ending resolutions are added to a stable, already-working runtime.
4. **Phases 9–11 layer meta-features:** Save/load, menus, flowcharts, and audio wrap around a complete story experience.
5. **Phases 12–13 finalize the product:** Art drop-ins, balancing, and release packaging occur once narrative and engine stability are guaranteed.
