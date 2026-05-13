## ADDED Requirements

### Requirement: Author may delete own class list submission

The system SHALL allow a logged-in user to remove a class list submission they authored. A submission is authored by the current user when the submission's persisted `uploaderStudentId` equals the logged-in user's `studentId`.

The system SHALL NOT complete deletion of a submission for a user who is not logged in.

The system SHALL NOT complete deletion when the acting user's `studentId` does not equal the submission's persisted `uploaderStudentId`.

For each class list entry where the current logged-in user is the author, the system SHALL expose a visible delete affordance that can initiate deletion.

Before performing deletion, the system SHALL require an explicit confirmation step; if the user cancels, the submission MUST remain unchanged.

After a successful deletion, the submission MUST disappear from the class list without requiring a full page reload, and MUST NOT reappear after a full page reload.

If deletion cannot be completed (e.g., network or server error), the system SHALL show a clear error message and MUST NOT remove the entry from the list unless the server confirms success.

#### Scenario: Author deletes own work after confirming

- **WHEN** a logged-in user views the class list and confirms deletion for a submission whose `uploaderStudentId` equals their `studentId`
- **THEN** the system SHALL remove that submission from persisted storage and the class list SHALL no longer include it after reload

#### Scenario: Cancel preserves the submission

- **WHEN** a logged-in user starts deletion for their own submission but cancels the confirmation step
- **THEN** the system SHALL NOT remove the submission from persisted storage and the class list SHALL still show the entry

#### Scenario: Non-author cannot delete

- **WHEN** a logged-in user views a submission whose `uploaderStudentId` differs from their `studentId`
- **THEN** the system SHALL NOT offer a delete affordance that can successfully delete that submission

#### Scenario: Logged-out user cannot delete

- **WHEN** no user is logged in
- **THEN** the system SHALL NOT expose a delete affordance that can successfully delete any class list submission

#### Scenario: Server rejects mismatched owner

- **WHEN** a client attempts to delete a submission while asserting an `uploaderStudentId` that does not match the submission's persisted `uploaderStudentId`
- **THEN** the server SHALL reject the operation without removing the submission's persisted media or metadata
