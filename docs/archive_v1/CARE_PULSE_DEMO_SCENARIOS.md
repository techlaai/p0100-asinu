# Care Pulse Demo Scenarios (Plain Language)

1) **Normal daily check-in**
- The user opens the app and selects “Ổn / Bình thường”.
- The system records the check-in as normal.
- No escalation is triggered.

2) **Tired / uể oải**
- The user selects “Hơi mệt”.
- The system records the check-in as tired.
- The app does not escalate unless silence rules are met later.

3) **Emergency**
- The user selects “Không ổn”.
- The system records the emergency status immediately.
- This is visible to care teams and used for urgent follow-up.

4) **Silence escalation (2 ignores / 20 minutes)**
- The user ignores two consecutive Care Pulse prompts **or** does not respond for 20 minutes.
- The backend marks the record with `requires_immediate_action = true`.
- The system flags this for immediate attention.

5) **Family member viewing status/logs**
- A connected family member views recent Care Pulse status/logs.
- They can see the latest status, including any escalation flags.
- Access is only allowed for accepted connections.
