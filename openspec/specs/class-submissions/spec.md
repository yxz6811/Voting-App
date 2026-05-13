# class-submissions Specification

## Purpose
TBD - created by archiving change upload-work-class-list. Update Purpose after archive.
## Requirements
### Requirement: Upload is available only when logged in

The system SHALL NOT allow starting a media submission workflow unless a logged-in user session exists (as defined by the existing user login capability).

#### Scenario: Logged-out user cannot upload

- **WHEN** no user is logged in
- **THEN** the system SHALL NOT present an enabled upload control that can successfully persist a new class submission

#### Scenario: Logged-in user sees upload entry

- **WHEN** a user is logged in
- **THEN** the system SHALL provide a visible path to submit a new work to the class list (e.g., an upload action or page section)

### Requirement: Accepted submission media types

The system SHALL accept user-selected files whose detected media kind is either **image** or **video**, constrained to the following MIME types when `File.type` is non-empty: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `video/webm`. When `File.type` is empty, the system SHALL infer acceptability using the file name extension mapped to the same allowed set (`.jpg`/`.jpeg`, `.png`, `.webp`, `.gif`, `.mp4`, `.webm`, case-insensitive); if inference fails, the file MUST be rejected.

#### Scenario: Accept allowed image

- **WHEN** a logged-in user selects a file with MIME `image/png` (or empty MIME and extension `.png`) within the size limit
- **THEN** the system SHALL treat the file as a valid submission candidate of kind **image**

#### Scenario: Accept allowed video

- **WHEN** a logged-in user selects a file with MIME `video/mp4` (or empty MIME and extension `.mp4`) within the size limit
- **THEN** the system SHALL treat the file as a valid submission candidate of kind **video**

#### Scenario: Reject disallowed type

- **WHEN** a logged-in user selects a file that is not classified as an allowed image or allowed video per the rules above
- **THEN** the system SHALL reject the submission and SHALL NOT add a new class list entry for that file

### Requirement: Submission file size limit

The system SHALL reject any submission whose selected file byte size exceeds **160 MiB** (`160 * 1024 * 1024` bytes).

#### Scenario: Oversized file is rejected

- **WHEN** a logged-in user selects a file larger than 160 MiB
- **THEN** the system SHALL reject the submission with a clear error message and SHALL NOT persist a new class list entry for that file

### Requirement: Successful submission persists and appears in class list

Upon a successful submission, the system SHALL persist the media binary and metadata such that the work appears as a new item in the class list after the operation completes without reload, and remains available after a full page reload on the same browser profile.

#### Metadata fields (minimum)

Each persisted submission MUST include: a unique `submissionId`, `createdAt` (ISO-8601 timestamp string or equivalent sortable representation), `uploaderDisplayName`, `uploaderStudentId` (snapshot values taken from the logged-in user at submit time), `mimeType`, `originalFileName`, `byteSize`, and a media kind of either **image** or **video** consistent with the accepted type rules.

#### Scenario: Item appears after submit

- **WHEN** a logged-in user successfully submits an allowed file within the size limit
- **THEN** the system SHALL add exactly one new class list entry for that submission and SHALL persist it for later reloads

#### Scenario: Author snapshot is stored

- **WHEN** a logged-in user successfully submits a file while their session display name is `N` and student id is `S`
- **THEN** the persisted submission metadata MUST include `uploaderDisplayName` equal to `N` and `uploaderStudentId` equal to `S` as captured at submit time

### Requirement: Class list ordering

The system SHALL display class list submissions sorted by `createdAt` descending (newest first).

#### Scenario: New submission appears at top

- **WHEN** the user submits a new work after other submissions already exist
- **THEN** the new submission entry MUST appear before older entries in the default class list view

### Requirement: Class list entry shows author and supports preview

For each class list entry, the system SHALL display at least the uploader's `uploaderDisplayName` and a clear indication of media kind (**image** vs **video**). The system SHALL provide an inline preview: for **image** entries using an `<img>` (or equivalent) bound to the stored image bytes; for **video** entries using a `<video>` element (or equivalent) bound to the stored video bytes. If the browser cannot decode/play the stored video, the system SHALL still show the entry and MUST show a non-empty failure state (e.g., a visible error message or placeholder) instead of a silent blank preview.

#### Scenario: Image preview renders

- **WHEN** a class list entry represents an image submission
- **THEN** the system SHALL render a visible image preview derived from the persisted image bytes

#### Scenario: Video preview attempts playback

- **WHEN** a class list entry represents a video submission
- **THEN** the system SHALL render a `<video>` preview control sourced from the persisted video bytes

#### Scenario: Video decode failure is visible

- **WHEN** a video entry cannot be decoded/played by the browser
- **THEN** the user MUST still see the list entry with author metadata AND a visible error/placeholder state for preview

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

