## ADDED Requirements

### Requirement: Upload workflow includes a display title field

The system SHALL provide a visible text input for the user to enter a **display title** (作品名) for the work as part of the upload workflow when a logged-in user submits a class submission.

The system SHALL NOT start a successful submission to the server when the trimmed display title is empty.

The system SHALL enforce a maximum length on the trimmed display title; the limit MUST be **80 Unicode code units** (JavaScript string length as used in the implementation), with a minimum of **1** non-whitespace character after trim.

#### Scenario: Empty title blocks submit

- **WHEN** a logged-in user has selected a valid file but the display title field contains only whitespace or is empty
- **THEN** the system SHALL NOT send a submission that persists a new class list entry until the user provides a non-empty trimmed display title

#### Scenario: Non-empty title allows submit

- **WHEN** a logged-in user has selected a valid file and entered a non-empty trimmed display title within the maximum length
- **THEN** the system SHALL include that title in the submission request to the server

### Requirement: Persisted metadata includes display title

Each new successful submission MUST persist a UTF-8 string field `displayTitle` (trimmed) alongside existing metadata, representing the user-chosen work name for display.

The persisted `originalFileName` MUST continue to reflect the uploaded file's original name as today (for diagnostics and storage), independent of `displayTitle`.

#### Scenario: Server stores display title

- **WHEN** a logged-in user successfully submits with `displayTitle` equal to `T` (after trim) and original file name `F`
- **THEN** the persisted metadata for that submission MUST include `displayTitle` equal to `T` and `originalFileName` consistent with `F`

### Requirement: Class list primary title uses display title

In the class list entry line that indicates media kind and the work's human-readable name (the location previously used for showing only the file name to end users), the system SHALL show `displayTitle` when present in persisted metadata.

When `displayTitle` is absent for a submission (e.g., legacy entries), the system SHALL fall back to showing `originalFileName` in that same position.

#### Scenario: New submission shows custom title

- **WHEN** a submission's metadata includes `displayTitle` equal to `我的作品`
- **THEN** the class list entry for that submission MUST show `我的作品` in the primary title position described above

#### Scenario: Legacy submission falls back to file name

- **WHEN** a submission's metadata does not include `displayTitle`
- **THEN** the class list entry MUST show `originalFileName` in that primary title position
