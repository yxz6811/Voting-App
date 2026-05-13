## ADDED Requirements

### Requirement: Voting requires a logged-in user

The system SHALL NOT record or change a vote unless a logged-in user session exists.

#### Scenario: Logged-out user cannot vote

- **WHEN** no user is logged in
- **THEN** the system SHALL NOT expose a control that can successfully persist a vote for any submission

### Requirement: Self-submissions cannot be voted by the uploader

The system SHALL NOT allow the currently logged-in user to cast a vote for a class submission whose `uploaderStudentId` equals the logged-in user's `studentId`.

#### Scenario: Own work is not votable

- **WHEN** a logged-in user views a submission they authored (matching `studentId`)
- **THEN** the system SHALL NOT offer a successful path to cast a vote for that submission

#### Scenario: Others' work is votable

- **WHEN** a logged-in user views a submission whose `uploaderStudentId` differs from the logged-in user's `studentId`
- **THEN** the system SHALL allow initiating a vote action for that submission subject to the single-vote rules

### Requirement: At most one active vote per voter

For any logged-in voter identity (`studentId`), the system SHALL persist at most one active `votedSubmissionId` at a time.

#### Scenario: First vote is recorded without a change-vote prompt

- **WHEN** the user has no current persisted vote and selects an eligible submission to vote for
- **THEN** the system SHALL persist the vote for that `submissionId` without requiring a change-vote confirmation dialog

### Requirement: Changing vote requires confirmation

When a persisted vote already exists for the current voter and the user attempts to vote for a different eligible `submissionId`, the system SHALL show a blocking confirmation dialog explaining that the previous vote will be replaced. If the user cancels, the persisted vote MUST remain unchanged. If the user confirms, the system MUST remove the vote from the previously selected submission and MUST persist the vote for the newly selected submission.

#### Scenario: Cancel keeps the old vote

- **WHEN** a current vote exists for submission `A` and the user initiates voting for eligible submission `B` but cancels the confirmation dialog
- **THEN** the persisted vote MUST still reference `A` and MUST NOT reference `B`

#### Scenario: Confirm moves the vote

- **WHEN** a current vote exists for submission `A` and the user initiates voting for eligible submission `B` and confirms the dialog
- **THEN** the persisted vote MUST reference `B` and MUST NOT reference `A`

#### Scenario: No confirmation when re-selecting the same submission

- **WHEN** a current vote exists for submission `A` and the user triggers the vote action again targeting `A`
- **THEN** the system MUST NOT show the change-vote confirmation dialog for switching votes

### Requirement: Vote persistence is scoped to voter identity

The system SHALL persist votes in client storage including both `voterStudentId` and `votedSubmissionId`. When restoring state, if the persisted `voterStudentId` does not equal the logged-in user's current `studentId`, the system SHALL ignore the persisted vote for decision-making and MUST NOT display it as the active vote for the current user.

#### Scenario: Vote restores after reload for same user

- **WHEN** a vote was persisted for voter `S` on submission `X` and the user reloads the app while still logged in as `S`
- **THEN** the UI MUST indicate an active vote on submission `X`

#### Scenario: Vote does not leak across different logged-in identities

- **WHEN** a vote was persisted for voter `S1` and a different user logs in as `S2`
- **THEN** the system MUST NOT treat `S1`'s persisted vote as `S2`'s active vote

### Requirement: Class list previews remain available alongside voting

The system SHALL continue to show each class list submission with inline media preview (image and video) consistent with the class submissions capability, and voting controls MUST appear in the same class list context without removing preview for eligible entries.

#### Scenario: Preview remains visible

- **WHEN** the user views the class list containing at least one submission
- **THEN** each submission card MUST still render the media preview area (or visible error placeholder) as applicable

### Requirement: Active vote is clearly indicated

When a vote is active for the current user, the system SHALL clearly indicate which submission is currently voted (e.g., highlighted card state and/or an explicit label).

#### Scenario: Voted submission is visually indicated

- **WHEN** the persisted vote references submission `X` for the current voter
- **THEN** submission `X` MUST be visually distinguishable as the voted submission in the list UI

### Requirement: Orphan vote recovery

If persisted vote state references a `votedSubmissionId` that is not present in the currently loaded class submissions list, the system SHALL clear the persisted vote and treat the user as having no active vote.

#### Scenario: Missing submission clears vote

- **WHEN** persisted vote references `missingId` and the loaded submissions contain no record with `submissionId === missingId`
- **THEN** the system SHALL clear persisted vote state and SHALL NOT show an active vote on any entry
