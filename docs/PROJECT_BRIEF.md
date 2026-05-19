# Project Brief — Chromatic Echoes

## At a glance

- **Title:** Chromatic Echoes
- **Larger direction:** Sound Science Museum — a recurring installation series
  that uses the senses to teach a single sound concept per visit.
- **First instalment:** the **Dead Room** experience at TU Delft.
- **Target users:** first-time teenage visitors (groups of 3–6), unfamiliar
  with anechoic chambers and acoustic science.
- **Context:** the TU Delft anechoic chamber ("Dode kamer") in the Department
  of Imaging Physics — a room whose walls absorb nearly all reflected sound.
  Visitors usually find it disorienting: voices sound flat, claps don't echo,
  and silence is *louder* than expected.
- **Format:** a 5–8 minute guided walkthrough composed of four short stages,
  driven by a web app on each visitor's phone plus a single shared projection
  screen.

## Why this project exists

Anechoic chambers are real research tools, but to most teenagers they look
like a strange room covered in foam. The brief is to make sound itself
visible and playful for them — to turn the chamber from "weird foam room"
into a memorable encounter with concepts (loudness, rhythm, silence) that
otherwise live only in physics textbooks.

The design choice is **interpretive, not measurement-grade**. We are not
building a scientific sonification of impulse responses or a tool for
acoustic researchers. We are building a museum exhibit: a controlled
experience that gives a teenage visitor an honest *feel* for a concept,
then asks a single reflective question about it.

## Visitor identity

Each visitor becomes a **coloured player** — Red, Green, or Blue. The
colour is the visitor's voice for the duration of the experience: when they
make sound, the projection shows their colour; when they fall silent, their
colour drifts away. Coloured wristbands act as physical identity markers
(MVP only — not interactive hardware), so visitors can see at a glance who
"is" each colour in the projection.

## Experience flow

Four stages, each with its own goal and one main interaction. The shared
projection screen and each visitor's phone are kept in lock-step by a
single host operator.

### 1. Waiting Room — *briefing*
Before the chamber door opens, a short on-screen brief explains what the
Dead Room is and what the visitor will become inside it. The visitor reads
or hears: *"You are about to enter a room that swallows sound. Inside,
you'll become a colour. When you make sound, the room will paint with it."*
This stage sets the tone (quiet, contemplative, slightly austere) and lets
the visitor pick or confirm their colour identity.

### 2. Threshold — *crossing in*
A brief deliberate beat at the chamber door. The visitor is asked to *step
through* and notice what *isn't* there — no echo, no ambient noise, no
sense of room. The threshold stage is short by design: it's the calibration
moment between everyday hearing and the alien acoustics inside.

### 3. Dead Room — *the rounds*
The main exhibit. The host runs the group through a sequence of short
rounds, each highlighting a single sound concept:

| Round | Concept | What the visitor does |
|---|---|---|
| **Solo Echo** | hearing yourself without environmental coloration | makes a sound alone and watches their own colour appear from their position |
| **Move Echo** | directionality — where sound comes from | moves to a new zone in the room and watches the colour follow |
| **Mix Echo** | collaboration, overlap, blended colour | works with the other visitors to co-create a target colour by balancing voices |
| **Silent Echo** | attention, micro-sounds | stays silent and listens for the smallest sounds anyone can find |

The host advances the group from round to round. Rounds are short (under
a minute each); the goal is sensation and surprise, not mastery.

### 4. Exit / Archive — *reflection*
After the rounds, the screen presents a simple "echo trace" — a quiet
visual summary of how the group's voices moved through the rounds —
together with one reflective prompt (e.g. *"What surprised you most about
silence?"*). The visitor leaves with the question, not an answer. The
archive screen is intentionally low-tech and low-data; it's an exit pause,
not a leaderboard.

## Learning goals

Each visitor should leave with felt intuition for these eight concepts.
Not all of them are taught in every round; they emerge from the experience
as a whole.

| Concept | What "felt understanding" looks like |
|---|---|
| **Loudness** | a louder sound makes a bigger, brighter cloud |
| **Duration** | a short clap is a quick flash; a sustained note lingers |
| **Rhythm** | repeated short sounds make visible pulses; the screen breathes with the visitor |
| **Directionality** | sound has a source position; the colour appears where *you* are |
| **Overlap / mixing** | when two visitors speak together, their colours overlay and blend |
| **Silence** | true quiet is a state, not an absence — the screen still "listens" |
| **Attention** | tiny sounds (a finger tap, a breath) are visible when nothing else is happening |
| **Micro-sounds** | the body itself is a sound source; the room reveals what we usually filter out |
| **Collaboration** | matching a target colour requires balancing voices with the group, not shouting over each other |

## Out of scope (for the first instalment)

- Measurement-grade acoustics or impulse-response visualisation.
- Long-form curriculum content. Each visit is short and stand-alone.
- Multi-room or multi-chamber experiences. One chamber, one walkthrough.
- Persistent visitor accounts or scoring across visits.

See [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) for the engineering
roadmap and [`TECHNICAL_RISKS.md`](TECHNICAL_RISKS.md) for known constraints
that shape the design.
