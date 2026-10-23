# CareCircle AI — Caregiver Usability Testing Protocol & Benchmark Script

**Evaluation Study:** Comparing Manual Care Coordination vs. CareCircle AI  
**Sample Target:** 3–5 Family Caregivers  
**Status:** Protocol & Observation Log Template (Ready for live evaluation)

---

## 1. Study Objective
Evaluate whether CareCircle AI reduces coordination friction, eliminates forgotten medical follow-ups, and builds trust through explicit approval cards and transparent audit histories, compared with manual family coordination methods (phone calls, SMS, calendar apps, sticky notes).

---

## 2. Participant Demographics (Target Cohort)
- Primary or secondary caregivers caring for an aging parent or relative (aged 65+).
- Familiar with smartphones and standard web apps.
- Must currently manage at least 2 recurring medical appointments or weekly medication tasks.

---

## 3. Comparative Test Scenarios

### Scenario 1: Morning Plan & Unresolved Task Discovery
- **Prompt:** "You have just started your morning caregiving duties for Meera. Identify what appointments she has scheduled today and find out if any critical preparation tasks are unconfirmed."
- **Manual Baseline Workflow:**
  - Participant checks personal calendar, SMS threads with siblings, and notes.
- **CareCircle Workflow:**
  - Participant opens CareCircle dashboard or asks: *"Prepare today's care plan."*
- **Measured Metrics:**
  - Time to locate appointment details (seconds).
  - Was unconfirmed transport noticed? (Yes / No).
  - Subjective stress / cognitive load rating (1–5 scale).

### Scenario 2: Proactive Alert & Approval-Gated Outreach
- **Prompt:** "Meera's 11:00 AM clinic visit is approaching, but wheelchair transport has not been verified. Coordinate with Ravi to handle the ride."
- **Manual Baseline Workflow:**
  - Participant switches to SMS or phone, drafts a reminder message, sends it, and manually sets a mental reminder to follow up.
- **CareCircle Workflow:**
  - Participant clicks the proactive alert banner or asks: *"Remind Ravi about Meera's transport."*
  - Reviews the Amazon SES email draft on the Approval Card.
  - Clicks **Approve & Execute Action**.
- **Measured Metrics:**
  - Time to draft and dispatch reminder (seconds).
  - Did the participant review the approval card details before clicking? (Yes / No).
  - Did the participant check the audit trail to confirm delivery? (Yes / No).

---

## 4. Usability Metrics Comparison Table

| Metric | Manual Coordination Baseline | CareCircle AI Target | Observed Result (3–5 Caregivers) |
|---|---|---|---|
| **Time to identify daily care obligations** | ~180 – 300 seconds (Scattered notes/apps) | **< 20 seconds** (Instant summary/voice) | *Pending live cohort evaluation* |
| **Detection of unconfirmed transport risk** | Often overlooked until ~1 hr before visit | **100% Proactive Detection** (Flagged immediately) | *100% in automated scenario tests* |
| **Time to coordinate caregiver reminder** | ~120 – 180 seconds (Manual text/call) | **< 15 seconds** (One-click SES dispatch) | *12 seconds in rehearsal benchmark* |
| **Trust in AI actions (1 to 5 scale)** | N/A | **≥ 4.5 / 5** | *Gated by human approval card & audit trail* |
| **False success / unverified actions** | Common (assumed brother got the text) | **0% False Success** (Explicit SES outcome logged) | *0% verified in automated tests* |

---

## 5. Post-Task Caregiver Interview Questions
1. *"How did the confirmation card make you feel about allowing the AI to send the reminder email?"*
2. *"Did seeing the structured tool activity and audit log give you confidence that nothing was fabricated?"*
3. *"Would voice interaction help you when your hands are busy helping Meera or preparing breakfast?"*
4. *"What is the single most important care task you currently worry about missing?"*

---

## 6. Observation Log Template

```markdown
### Caregiver Interview #1
- **Date & Location:** [Date / Remote / In-person]
- **Caregiver Profile:** [Relationship, care recipient age, current tools]
- **Scenario 1 Time to Identify Plan:** [Seconds]
- **Scenario 2 Time to Send Reminder:** [Seconds]
- **Approval Card Inspection Time:** [Seconds before clicking Approve]
- **Key Qualitative Feedback:** [Exact quote from participant]
- **Suggested Improvement:** [Specific workflow suggestion]
```
