## ADDED Requirements

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
