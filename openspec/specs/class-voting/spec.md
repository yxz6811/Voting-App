# class-voting Specification

## Purpose
TBD - created by archiving change class-list-voting. Update Purpose after archive.
## Requirements
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

### Requirement: Each class list entry displays current vote count

For every class list submission entry, the system SHALL display a visible non-negative integer label representing the current aggregate vote count for that submission (as provided by the authoritative server tally).

#### Scenario: New submission shows zero

- **WHEN** a submission exists and its aggregate vote count is zero
- **THEN** the class list entry for that submission MUST display the vote count as the integer `0`

#### Scenario: Count visible without voting

- **WHEN** a logged-in user views the class list and has not cast a vote
- **THEN** each entry MUST show the aggregate vote count consistent with the server for that submission

### Requirement: Casting or changing vote updates tallies

After a logged-in user successfully persists a vote or confirms a vote change per existing change-vote rules, the system SHALL reflect updated aggregate counts for affected submissions (previous target decreases, new target increases when applicable) in the class list without requiring a full page reload, or after the next successful list refresh if incremental update is not used.

#### Scenario: First vote increments target

- **WHEN** a voter had no prior vote and successfully casts a vote for submission `X`
- **THEN** the displayed count for `X` MUST increase by one relative to immediately before the vote (assuming server had no prior mapping for that voter)

#### Scenario: Change vote moves count

- **WHEN** a voter changes vote from `A` to `B` successfully
- **THEN** the displayed count for `A` MUST decrease by one and the displayed count for `B` MUST increase by one relative to immediately before the change

### Requirement: Vote leaderboard appears beside the class list

When a logged-in user views the class list in the classroom experience, the system SHALL present a dedicated **leaderboard** region alongside the scrollable submission list on viewports wide enough for a two-column layout (implementation-defined breakpoint). On narrow viewports, the system SHALL still present the same leaderboard content in the same view without horizontal-only clipping (e.g., by stacking the leaderboard below or above the list).

The leaderboard region MUST have an accessible name (e.g., a visible heading and/or appropriate landmark role) that identifies it as a ranking by votes.

#### Scenario: Leaderboard is visible in class list tab

- **WHEN** a logged-in user switches to the class list tab and submissions have finished loading successfully
- **THEN** the leaderboard region MUST be visible at the same time as the submission list

#### Scenario: Narrow viewport still shows leaderboard

- **WHEN** the viewport is below the product’s two-column breakpoint
- **THEN** the leaderboard MUST remain available in the class list tab without requiring a different route

### Requirement: Leaderboard orders all works by vote count descending

The leaderboard SHALL list every submission currently shown in the class list context, ordered by `voteCount` from highest to lowest.

When two submissions have equal `voteCount`, the system SHALL order the higher `createdAt` (newer) before the lower. When `voteCount` and `createdAt` are equal, the system SHALL order by ascending `submissionId` string comparison as a final deterministic tie-break.

Each leaderboard row MUST show at least: the ordinal rank (starting at 1 for the highest vote count), the same human-readable work title used as the primary title in the list (i.e., `displayTitle` with fallback to `originalFileName` per existing rules), and the integer `voteCount` for that submission.

#### Scenario: Higher votes rank above lower votes

- **WHEN** submission `A` has `voteCount` 5 and submission `B` has `voteCount` 2 in the same loaded set
- **THEN** the leaderboard MUST list `A` above `B`

#### Scenario: Tie-break uses newer created first

- **WHEN** two submissions have the same `voteCount` and different `createdAt` values
- **THEN** the submission with the later `createdAt` MUST appear above the other in the leaderboard

#### Scenario: Full set listed

- **WHEN** the class list context contains `N` submissions
- **THEN** the leaderboard MUST contain exactly `N` rows (one per submission), with ranks `1` through `N` after sorting

