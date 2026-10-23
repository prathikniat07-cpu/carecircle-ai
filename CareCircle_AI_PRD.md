# CareCircle AI --- Product Requirements Document (PRD)

**Version:** 1.0\
**Status:** Build specification for hackathon MVP\
**Primary hackathon track:** Alexa+\
**Initial submission route:** Simulated Alexa+ experience in a web app\
**Product tagline:** One family. One care plan. Fewer forgotten
follow-ups.

------------------------------------------------------------------------

## 1. Product vision

CareCircle AI helps families coordinate everyday care for an older
family member. It brings appointments, care tasks, caregiver
responsibilities and follow-ups into one clear plan. An AI assistant can
summarize what needs attention and use structured tools to retrieve or
update information, with confirmation before consequential actions.

CareCircle is a coordination product, **not a medical diagnosis or
treatment system**.

## 2. Problem statement

Family caregivers often coordinate care across conversations, calendars,
notes and memory. This makes it easy to miss a follow-up, forget who
owns a task, or lose track of what has been completed.

CareCircle should make it easy to answer: - What needs attention
today? - Which tasks are still incomplete? - What appointments are
coming up? - Who is responsible for each follow-up? - What changed, and
what action was actually completed?

## 3. Target users

### Primary user

A family caregiver coordinating appointments and day-to-day tasks for an
older relative.

### Secondary users

-   Another family member who can own a task.
-   A family member who needs a quick daily summary rather than the full
    dashboard.

### Demo persona

Use a fictional family and fictional care data. Do not use real medical
records or real personal information in the public demo.

## 4. Product principles

1.  **Action over chat:** The assistant should use structured tools and
    produce useful results, not only generate prose.
2.  **Truthful status:** Never say an action succeeded unless the
    application confirms it.
3.  **Human approval:** Ask for confirmation before sending messages,
    changing appointments, or making other consequential changes.
4.  **Privacy by design:** Keep secrets server-side; minimize personal
    data; make demo data fictional.
5.  **Accessible and calm:** Use readable typography, clear labels,
    keyboard-friendly controls and a responsive layout.
6.  **Reliable demo:** The core workflow must work even if an external
    AI provider is unavailable. Provide a clearly labeled demo/fallback
    mode.

## 5. Hackathon strategy and scope

Build the **simulated Alexa+ web experience first**, because the
supplied hackathon brief explicitly allows this route for people new to
MCP. Do not claim that the app is an official Alexa+ integration unless
the required integration has actually been completed and validated.

The app should demonstrate the ideas behind an agentic assistant through
a natural-language interface, visible structured tool calls, results,
confirmation and an action log.

A self-hosted MCP server using Streamable HTTP and a supported
specification can be a later milestone only if time and hackathon
requirements make it worthwhile. Do not let MCP infrastructure delay the
working product.

### MVP must include

-   A polished responsive dashboard.
-   Daily care summary.
-   Appointments list and appointment details.
-   Care task checklist with status updates.
-   Caregiver assignments using fictional demo users.
-   Assistant panel with a few supported natural-language requests.
-   Structured tool execution for assistant requests.
-   Confirmation step for consequential changes.
-   Persistent state across refreshes.
-   Activity/audit history.
-   Loading, empty and error states.
-   Setup and demo instructions.
-   Automated tests for the most important workflows.

### Explicitly out of scope for MVP

-   Medical diagnosis, treatment or medication dosage advice.
-   Real patient records or integrations with hospital systems.
-   Real emergency dispatch or emergency monitoring.
-   Payments, insurance or pharmacy integrations.
-   Real messages sent to family members without explicit confirmation.
-   Multi-tenant enterprise administration.
-   Voice calling or hardware-dependent functionality.
-   Claims that simulated integrations are real.

## 6. Core user journey

1.  User opens CareCircle and sees today's summary, upcoming
    appointments, open tasks and assigned caregivers.
2.  User asks: "Prepare today's care plan and tell me what needs
    attention."
3.  The assistant invokes structured tools to fetch appointments, list
    open tasks and retrieve assignments.
4.  The assistant presents a concise prioritized summary and explains
    which data it used.
5.  User asks: "Assign the transport follow-up to Anika."
6.  The app displays a confirmation card showing the proposed change.
7.  User confirms or cancels.
8.  On confirmation, the app updates the task, persists the change and
    adds an audit event.
9.  The UI shows the actual result and the updated owner/status.

## 7. Demo data

Seed the app with fictional data that makes the core workflow easy to
demonstrate.

### Fictional family

-   Care recipient: Meera Rao
-   Caregiver 1: Anika Rao
-   Caregiver 2: Ravi Rao

### Example appointments

-   11:00 AM --- Routine clinic appointment --- transport needs
    confirmation.
-   4:00 PM --- Follow-up call --- status pending.

### Example tasks

-   Confirm transport --- open --- assigned to Anika.
-   Prepare appointment documents --- open --- unassigned.
-   Complete post-visit checklist --- pending appointment completion.

These are fictional coordination records, not medical recommendations.
Clearly label the environment as "Demo data."

## 8. Functional requirements

### FR-1: Dashboard

Display: - Current day and concise care summary. - Upcoming
appointments. - Open and overdue tasks. - Caregiver/task ownership. -
Recent activity. - Entry point to the AI assistant.

Acceptance criteria: - The dashboard loads without errors from a fresh
start. - Counts and lists reflect persisted state. - Empty states are
understandable. - Layout works on common desktop and mobile viewport
sizes.

### FR-2: Task management

Users can: - View task details. - Mark a task complete or reopen it. -
Assign a task to a fictional caregiver. - Add a task with title, due
date/time, priority and owner. - Filter tasks by status or caregiver.

Acceptance criteria: - Changes update the UI immediately after the
server confirms them. - Changes survive a page refresh. - Invalid input
receives helpful validation. - Each consequential change is written to
the activity log.

### FR-3: Appointment management

Users can view appointment time, purpose/label, transport status and
follow-up status. The MVP may create and edit fictional appointments,
but must not connect to a real calendar unless a real integration is
implemented.

Acceptance criteria: - Appointment times are displayed consistently. -
Conflicts or missing coordination details are surfaced as reminders to
review, not medical judgments. - Any simulated calendar connection is
clearly labeled.

### FR-4: AI assistant

Support at least these requests: 1. "Prepare today's care plan." 2.
"Show the tasks that are still open." 3. "What needs attention before
the next appointment?" 4. "Assign the transport follow-up to Anika." 5.
"Mark the appointment documents as prepared."

Acceptance criteria: - Supported requests invoke structured application
tools rather than relying on a hardcoded text answer alone. - The
assistant identifies when it lacks information. - The UI shows a concise
explanation of the tool results. - For mutations, the app presents a
confirmation step before committing. - The assistant does not invent
successful actions.

### FR-5: Structured tools

Implement well-defined server-side functions, with input validation,
for: - `get_daily_summary` - `list_appointments` - `list_care_tasks` -
`get_caregivers` - `create_care_task` - `assign_care_task` -
`update_task_status` - `record_activity_event`

The assistant may use read tools to gather context. Any write tool must
be gated by the application's confirmation flow. Validate all arguments
server-side. Return structured success/error results.

### FR-6: Confirmation and audit history

Before a consequential write: - Show what will change. - Show the
proposed owner/status/details. - Offer Confirm and Cancel. - Execute
only after explicit confirmation. - Log actor, action, target, timestamp
and result.

Acceptance criteria: - Cancel leaves the data unchanged. - Confirm
updates persisted data. - A failed update is shown as failed, not
successful. - The audit history accurately matches completed actions.

### FR-7: Persistence

Use a database for durable state if credentials are available. Supabase
is a suggested option, not a mandatory dependency. A local database can
be used during development.

Acceptance criteria: - State survives refresh and application restart in
the chosen environment. - Database credentials are not exposed in client
code. - Include seed/reset instructions for the demo.

### FR-8: Accessibility and visual quality

Use a consistent design system with: - Calm, trustworthy visual
language. - Clear typographic hierarchy and spacing. - High-contrast
text and visible focus states. - Keyboard-accessible controls and form
labels. - Responsive layout. - Clear loading, success, empty and error
feedback. - No decorative controls that appear functional but do
nothing.

## 9. Technical direction

Preferred starting stack: - Frontend: React + TypeScript + Vite. -
Styling: Tailwind CSS or a similarly consistent component system. -
Backend: Node.js + TypeScript. - Validation: Zod or equivalent. -
Persistence: Supabase/Postgres or a suitable local database. - Testing:
Vitest and React Testing Library; API tests for server tools. - AI
provider: use an available model API behind a server-side adapter. Keep
the provider replaceable. - Deployment: choose a host that supports the
frontend and server/API requirements.

Do not install every suggested library automatically. Inspect the
project state first, choose the minimum dependencies needed and document
the decision.

### Architecture boundaries

-   The browser renders the UI and calls the app backend.
-   The backend validates requests, reads/writes the database and
    invokes the AI provider.
-   AI tool calls are restricted to an allowlist of server-side
    functions.
-   The UI owns the confirmation interaction; the backend must still
    validate every write.
-   Secrets stay in environment variables on the server.
-   Never put provider API keys in frontend environment variables that
    are bundled into the browser.
-   Demo/fallback behavior must be visibly labeled and must not imitate
    real external integrations.

### Alexa+/MCP path

For the first MVP, implement a simulated Alexa+-style experience in the
web app. Keep business logic in reusable server-side functions so it can
later be exposed through an MCP server if needed.

If building an MCP server: - Confirm the exact current hackathon
requirement and supported MCP specification before implementation. - Use
Streamable HTTP if required by the track. - Add authentication and input
validation appropriate to the deployment. - Test the endpoint from an
independent MCP client. - Do not describe the simulated web app as a
production Alexa+ integration.

## 10. Non-functional requirements

-   No secrets committed to source control.
-   Validate all API inputs.
-   Handle model/provider failures gracefully.
-   Handle database failures without falsely showing success.
-   Keep an error log useful for debugging, without logging unnecessary
    sensitive data.
-   Provide a README with prerequisites, setup, environment variables,
    seed/reset, test and deployment instructions.
-   No real medical or personal data in the demo.
-   No diagnosis, medication dosing, or emergency decision-making
    features.

## 11. Visual design direction

Create a premium, calm, trustworthy product---not a generic admin
template.

Suggested shell: - Left navigation: Overview, Care tasks, Appointments,
Family, Activity. - Main area: greeting, today's care summary, next
appointment, priority tasks and recent activity. - Assistant panel:
conversation, suggested requests, tool activity and confirmation
cards. - Use a restrained palette, generous whitespace, readable cards
and consistent icons. - Avoid clutter, excessive gradients, tiny text
and unnecessary animations.

Do not spend the first milestone polishing every screen. First make the
core journey work, then refine the visual design.

## 12. Delivery plan and build order

### Phase 0 --- Inspect and plan

-   Inspect the existing folder and tooling.
-   Confirm Node.js/package manager availability.
-   Write a short implementation plan and proposed file structure.
-   Identify unknowns and dependencies.
-   Do not overwrite existing files blindly.

**Exit gate:** Plan and architecture are documented; no feature
implementation has begun prematurely.

### Phase 1 --- Working app skeleton

-   Set up the frontend and backend.
-   Add routing, shared layout, design tokens and navigation.
-   Add health/status endpoint and a clear README.
-   Run the app locally.

**Exit gate:** App starts reliably; navigation works; no major console
errors.

### Phase 2 --- Dashboard with seeded demo data

-   Add fictional appointments, tasks, caregivers and activity events.
-   Build the overview, tasks, appointments and activity screens.
-   Add responsive behavior and realistic loading/empty/error states.

**Exit gate:** Judges can understand the product without using the
assistant.

### Phase 3 --- Functional task and appointment workflows

-   Implement create, assign, complete/reopen and filter actions.
-   Persist changes.
-   Add server validation and audit events.

**Exit gate:** Core workflows work without AI and survive refresh.

### Phase 4 --- AI assistant and structured tools

-   Implement the five supported sample requests.
-   Connect the assistant to the allowlisted tools.
-   Display tool activity and source data used.
-   Add the confirmation step for all writes.
-   Add provider failure handling and a clearly labeled fallback.

**Exit gate:** The main user journey works end-to-end; no false success
states.

### Phase 5 --- Quality, accessibility and security

-   Test the main workflow and edge cases.
-   Test cancel/confirm, invalid inputs, provider failure and database
    failure.
-   Verify secrets are server-side.
-   Check keyboard navigation and responsive layout.
-   Fix broken buttons and console/server errors.

**Exit gate:** All critical acceptance criteria pass.

### Phase 6 --- Alexa+ alignment and deployment

-   Recheck the hackathon's current submission rules.
-   Ensure the demo clearly identifies itself as a simulated Alexa+
    experience if using that route.
-   Deploy the app and configure secrets safely.
-   Test the deployed URL from a fresh browser session.
-   Add a short architecture diagram and a demo guide.
-   Only pursue a real MCP integration if it is feasible and improves
    submission compliance.

**Exit gate:** A judge can open the deployed demo and complete the main
journey.

### Phase 7 --- Pitch and demo rehearsal

-   Prepare a 2--3 minute demonstration.
-   Lead with the caregiver problem, not the technology stack.
-   Show a request, real tool execution, a useful finding, confirmation
    and persisted result.
-   Explain privacy and limitations.
-   Present measured results only; label any simulated evaluation as
    simulated.
-   Keep a backup video and seeded reset procedure ready.

**Exit gate:** Demo is repeatable from a known clean state.

## 13. Demo script (2--3 minutes)

1.  **Problem (15 seconds):** Family care coordination is spread across
    tasks, appointments and conversations.
2.  **Overview (20 seconds):** Show the daily plan and pending tasks.
3.  **Assistant (30 seconds):** Ask for today's care plan and show the
    structured tools being called.
4.  **Insight (20 seconds):** Show a pending transport follow-up or
    missing task owner.
5.  **Approval (30 seconds):** Ask to assign the follow-up, review the
    proposed change, then confirm.
6.  **Proof (20 seconds):** Show the persisted task update and audit
    event.
7.  **Impact and trust (15 seconds):** Explain the intended benefit,
    data boundaries and approval safeguards.

## 14. Success metrics

Track these during testing: - Main demo journey completion rate. -
Number of critical workflow tests passing. - Time to complete the sample
coordination task, compared with a stated manual baseline. - Correct
detection of seeded pending tasks. - Number of false success messages
(target: zero). - Number of broken primary controls (target: zero).

Do not invent impact claims. Report results from actual tests or clearly
identify estimates.

## 15. Risks and mitigations

-   **Overbuilding:** Limit MVP to the user journey and tool list above.
-   **AI instability:** Keep supported requests constrained, validate
    tool inputs and provide a clearly labeled fallback.
-   **Integration uncertainty:** Start with the permitted simulated
    Alexa+ experience; verify rules before investing in MCP.
-   **Fake functionality:** Every visible primary action must work or be
    explicitly labeled as a preview.
-   **Privacy concerns:** Use fictional demo data and server-side
    secrets.
-   **Time pressure:** Complete and test one end-to-end workflow before
    adding optional features.

## 16. Definition of done

The hackathon MVP is ready when: - The app launches from documented
instructions. - The main dashboard and core navigation work. - Tasks and
appointments are usable. - At least the five specified assistant
requests are handled appropriately. - Structured tools execute and show
real results from the app's data. - Mutations require confirmation and
are audited. - State persists after refresh. - Error cases do not
produce false success. - Critical tests pass. - The deployed demo is
accessible and repeatable. - The Alexa+ submission route is described
accurately. - A short demo script and README are included.

## 17. Instructions for the coding agent

Treat this PRD as the source of truth. Work phase by phase in the order
specified.

At the beginning of each phase: 1. Summarize the goal and files you
expect to change. 2. Identify blockers before adding dependencies. 3.
Implement only that phase's scope.

At the end of each phase: 1. Run the relevant tests and checks. 2.
Report what works, what failed and what remains. 3. Update a
`BUILD_STATUS.md` file with completed items, test results, known issues
and the next phase. 4. Do not claim an untested feature is complete. 5.
Do not start the next phase until the current phase's exit gate is met,
unless a blocking issue requires a documented adjustment.

Start with **Phase 0 only**. Inspect the environment, present the
implementation plan and file structure, and wait for approval before
beginning Phase 1.
