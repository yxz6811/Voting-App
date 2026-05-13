## ADDED Requirements

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
