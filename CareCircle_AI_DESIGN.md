# CareCircle AI --- Premium Product Design Specification

**Version:** 1.0\
**Purpose:** Visual design and frontend quality specification for the
hackathon MVP\
**Primary track:** Alexa+ simulated web experience

This document supplements `CareCircle_AI_PRD.md`. The PRD remains the
source of truth for product functionality, security, architecture,
acceptance criteria and hackathon scope. If instructions conflict,
preserve the PRD's functional and safety requirements.

## 1. Design north star

Act as an award-winning product designer, senior UI/UX architect and
frontend design engineer.

Design CareCircle AI as a premium, human-centered family-care
coordination product. It should feel like a thoughtfully crafted,
trustworthy digital product---not a generic AI-generated admin
dashboard.

The experience should communicate: - "I know what needs attention." -
"My family is coordinated." - "Nothing important is hidden." - "I can
trust what this assistant tells me."

Prioritize warmth, clarity, accessibility, confidence and functional
depth.

**Product name:** CareCircle AI\
**Tagline:** Care, thoughtfully coordinated.

## 2. Visual identity

Direction: Premium editorial healthcare SaaS combined with a warm,
modern family-wellness application.

### Suggested color tokens

-   Deep forest green: `#23483D` --- primary brand color.
-   Dark forest: `#19372F` --- strong emphasis and dark brand surfaces.
-   Warm ivory: `#F7F6F0` --- main application background.
-   White: `#FFFFFF` --- primary card surfaces.
-   Soft sage: `#E7EEE7` --- secondary backgrounds and subtle
    highlights.
-   Primary text: `#202A26`.
-   Secondary text: `#68736D`.
-   Border: `#E5E8E2`.
-   Attention amber: `#A96A20` --- pending items requiring attention.
-   Error red: `#B54747` --- genuine errors or important warnings only.

Treat these as starting tokens and verify contrast. Use color
purposefully rather than decorating every element.

### Avoid

-   Generic purple-and-blue AI gradients.
-   Neon colors.
-   Excessive glassmorphism.
-   Strong shadows on every card.
-   Randomly colored widgets.
-   Overuse of rounded pills.
-   Decorative charts that communicate no useful information.
-   Unnecessary animation or visual clutter.

## 3. Typography

Use a refined, readable type system: - Headings: Manrope or a similar
modern sans-serif. - Body and interface: Inter or a similar readable
sans-serif.

Use no more than two font families, with sensible system fallbacks.
Establish a clear hierarchy among page titles, section titles, body text
and metadata. Use comfortable line height, consistent weights and
legible task/appointment information. Use tabular numerals for times and
counts where useful. Essential information must never rely on tiny gray
text.

## 4. Layout and spacing

Create a responsive application shell with: - Desktop sidebar around
230--250px. - Flexible main content, with a maximum width around
1440px. - Optional assistant panel around 340--400px when space
permits. - Consistent 4px/8px spacing scale. - Aligned card edges and
section headings. - Generous whitespace and clear grouping.

Do not make every section a floating card. Combine open page sections,
restrained dividers and a small number of meaningful surfaces.

On mobile, prioritize the daily summary, important coordination tasks
and assistant interaction. Prevent horizontal overflow.

## 5. Application shell

Create a recognizable and cohesive shell.

Sidebar navigation: - A simple circular/connected-care brand mark. -
CareCircle AI wordmark. - Overview. - Care tasks. - Appointments. -
Family. - Activity. - Settings only if the settings screen is
implemented.

At the bottom, show the active demo profile and a clearly visible **Demo
data** indicator.

Navigation must distinguish the active destination, use a consistent
outline icon set, and provide hover, focus, active and disabled states.
Every visible navigation item must work. Do not include placeholder
destinations that appear complete but do nothing.

## 6. Overview screen --- flagship experience

The overview is the most important screen. Make it immediately
understandable and visually memorable.

### Header

-   Natural greeting such as "Good morning, Anika."
-   Contextual subtitle such as "Here's what needs your attention
    today."
-   Current date.
-   Discreet but visible demo-data label.

### Today summary

Create a distinctive "Today, at a glance" section containing: - Concise
daily care summary. - Next appointment and actual coordination status. -
Most important pending task. - A prominent but restrained **Prepare
today's plan** action.

Never claim an appointment, reminder or task has been completed unless
the system confirms it.

### Care tasks

Show real task titles, priority, owner, due information and status. Make
completion and assignment actions discoverable. Distinguish pending,
overdue and completed states using both text and visual cues.

### Appointments

Use a refined vertical timeline or readable list. Show time, appointment
label, transport coordination and follow-up status. Keep upcoming events
easy to scan. Use meaningful empty states when there are no
appointments.

### Family coordination

Show caregiver initials or tasteful avatars, task ownership and concise
role labels. Avoid unnecessary demographic or medical details.

### Recent activity

Use a subtle chronological timeline. Show meaningful actions and actual
outcomes. Distinguish proposed, confirmed, failed and completed actions
when applicable.

## 7. AI assistant --- signature feature

Design the assistant as a premium conversational workspace, not a
generic chatbot clone.

Include: - Clear assistant identity. - Brief explanation of what it can
coordinate. - Suggested request chips that actually work. - Distinct
user and assistant message styles. - Structured result cards for tasks,
appointments and assignments. - Visible tool activity when a tool is
actually running. - Loading, failure and retry states. - Accessible
message composer. - Clear indication when the assistant uses demo data.

Suggested requests: - "Prepare today's care plan." - "Show outstanding
tasks." - "What needs attention before the next appointment?" - "Assign
the transport follow-up to Anika."

When tools run, show meaningful stages such as reviewing appointments,
checking open tasks and preparing a summary---**only when those
operations actually occur**. Never fake tool activity to create an
illusion of intelligence.

Assistant responses should prioritize actionable findings and display
supporting application data in scannable structured cards.

## 8. Confirmation experience

Create a polished confirmation card for consequential actions.

Example:

**Assign transport follow-up?** - Task: Confirm transport - Current
owner: Unassigned - Proposed owner: Anika Rao

Actions: - Confirm assignment - Cancel

Make the proposed change clear without an alarming warning style.

After confirmation: - Show success only after the backend confirms the
update. - Update the task in the interface. - Reflect the new state
everywhere relevant. - Add an accurate activity event.

If the operation fails, preserve the previous state and show a useful
recovery option.

## 9. Tasks, appointments and activity screens

Keep a consistent design language across every route.

### Tasks

-   Clear status and ownership.
-   Useful filtering and sorting.
-   Functional creation and assignment forms.
-   Working completion/reopen controls.
-   Useful validation and empty states.

### Appointments

-   Readable timeline or list.
-   Strong time hierarchy.
-   Clear coordination status.
-   Relevant details without unnecessary clutter.

### Activity

-   Chronological audit history.
-   Human-readable action descriptions.
-   Distinction between attempted, confirmed, failed and completed
    actions.

Forms must include labels, validation, loading states and confirmation
feedback.

## 10. Micro-interactions and motion

Use subtle, purposeful motion: - Quick hover transitions. - Restrained
panel transitions. - Clear loading indicators. - Subtle completion
feedback. - Visible keyboard focus.

Keep most transitions around 150--220ms. Respect reduced-motion
preferences. Avoid animations that delay important actions or make the
app feel like a marketing landing page.

## 11. Component quality

Build reusable components and consistent design tokens. Consider: -
`AppShell` - `SidebarNavigation` - `PageHeader` - `TodaySummary` -
`AppointmentTimeline` - `CareTaskItem` - `CaregiverAvatar` -
`AssistantPanel` - `ToolActivityIndicator` - `ActionConfirmationCard` -
`ActivityTimeline` - `EmptyState` - `ErrorState` - `LoadingSkeleton` -
`Toast` or inline feedback

Avoid duplicated markup and one-off styling. Reuse an existing component
library if one is already established and appropriate; otherwise choose
a minimal, coherent solution. Use a consistent icon library. Do not mix
emojis, random icon styles and unrelated icon packs in the main UI.

## 12. Accessibility

-   Meet WCAG AA contrast targets wherever applicable.
-   Provide keyboard-accessible navigation and forms.
-   Use semantic HTML and accessible names.
-   Ensure visible keyboard focus.
-   Never communicate status through color alone.
-   Use comfortably sized touch targets.
-   Support reduced motion.
-   Do not hide essential information behind hover-only tooltips.

## 13. Responsive verification

Verify at minimum: - Desktop: 1440px wide. - Laptop: 1280px wide. -
Tablet: 768px wide. - Mobile: 390px wide.

Check for: - Horizontal overflow. - Overlapping text or controls. -
Intentional sidebar behavior. - Cards adapting to available width. -
Usable assistant interaction on mobile. - Accessible dialogs and
confirmation actions.

## 14. Visual acceptance criteria

Do not consider the design complete until: - Every primary screen
follows the same design system. - The overview has a clear visual focal
point. - The assistant feels like a first-class product feature. -
Information hierarchy is immediately understandable. - Whitespace,
alignment and typography are consistent. - There are no broken layouts
or awkward empty spaces. - No primary control looks functional but is
inert. - Loading, empty, error, confirmation and success states are
designed. - Desktop and mobile layouts work. - The result does not
resemble a default admin template.

## 15. Required implementation process

Before implementing: 1. Read `CareCircle_AI_PRD.md` and inspect the
existing project. 2. Present a short visual direction and component
plan. 3. Preserve the approved architecture and existing working
features. 4. Build the design tokens and application shell first. 5.
Implement the overview and signature assistant experience. 6. Apply the
design system to other screens. 7. Run the app and inspect the actual
rendered UI in a browser. 8. Test important interactions at desktop and
mobile sizes. 9. Fix visual defects, overflow, broken states and
inconsistent spacing. 10. Re-run relevant tests after changes.

Do not claim visual verification unless you actually inspect the
rendered application. If browser screenshots or previews are available,
inspect them and make specific corrections. Do not stop after the first
render if obvious defects remain.

## 16. Final quality bar

The finished product should feel like a polished application a real
family could trust and a hackathon judge could understand within 30
seconds.

Prioritize clarity, warmth, originality, accessibility, functional depth
and visual consistency over unnecessary effects.

Do not sacrifice functionality, security, accessibility or truthful
system status for aesthetics.
