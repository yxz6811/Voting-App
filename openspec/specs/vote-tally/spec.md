# vote-tally Specification

## Purpose

服务端集中保存「学号 → 被投作品」映射，并据此为每件班级作品提供可聚合的得票数，供列表与多端展示。

## Requirements

### Requirement: Server stores at most one active vote per voter

The system SHALL persist, on the server, a mapping from `voterStudentId` to `votedSubmissionId` such that each distinct `voterStudentId` appears as a key at most once. When a new vote is recorded for an existing voter, the system SHALL replace the previous `votedSubmissionId` for that voter (no duplicate keys for the same voter).

#### Scenario: Upsert replaces prior vote

- **WHEN** a client records a vote for voter `S` targeting submission `B` and the server already stores `S → A`
- **THEN** the persisted mapping MUST become `S → B` and MUST NOT retain `S → A`

### Requirement: Votes target only existing non-own submissions

The system SHALL reject recording a vote when the target `votedSubmissionId` does not correspond to an existing submission directory with valid `meta.json`, or when the submission's `uploaderStudentId` equals the requesting `voterStudentId`.

#### Scenario: Reject vote for missing submission

- **WHEN** a client attempts to record a vote for a `votedSubmissionId` that does not exist on the server
- **THEN** the server MUST NOT change the votes store and MUST respond with an error indicating the target is invalid

#### Scenario: Reject self-vote

- **WHEN** a client attempts to record a vote where `voterStudentId` equals the target submission's `uploaderStudentId` from `meta.json`
- **THEN** the server MUST NOT change the votes store and MUST respond with an error indicating self-votes are not allowed

### Requirement: Aggregate vote counts per submission

The system SHALL be able to produce, for every `submissionId` that appears as a `votedSubmissionId` in the votes store, a non-negative integer count equal to the number of distinct voters whose mapped vote equals that `submissionId`.

#### Scenario: Two voters same target

- **WHEN** the votes store contains `S1 → X` and `S2 → X`
- **THEN** the aggregate count for submission `X` MUST be `2`

#### Scenario: No votes for a submission

- **WHEN** no voter maps to submission `Y`
- **THEN** the aggregate count for `Y` MUST be `0` when counts are requested for the full submission list context

### Requirement: List or tally API exposes counts to clients

The system SHALL expose vote counts to API clients in a way suitable for rendering the class list, either by including an integer `voteCount` on each submission in `GET /submissions` responses, or via a dedicated read endpoint that returns all tallies keyed by `submissionId`. Counts MUST match the aggregate defined in the previous requirement.

#### Scenario: Submissions list includes counts

- **WHEN** a client requests the class submissions list after votes have been recorded
- **THEN** each submission object in the response MUST include a field (e.g., `voteCount`) whose value equals the aggregate vote count for that submission's `submissionId`
