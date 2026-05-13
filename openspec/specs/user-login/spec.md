# user-login Specification

## Purpose
TBD - created by archiving change user-login-name-student-id. Update Purpose after archive.
## Requirements
### Requirement: Login form collects 姓名 and 学号

The system SHALL provide a login experience where the user MUST enter both 姓名 (display name) and 学号 (student identifier) before the system can transition to a logged-in state.

#### Scenario: Both fields are required

- **WHEN** the user views the login interface
- **THEN** the system SHALL require input for 姓名 and 学号 before login can succeed

### Requirement: Input validation for 姓名 and 学号

The system SHALL validate 姓名 and 学号 before accepting a login attempt. 姓名 MUST be non-empty after trimming leading and trailing whitespace and MUST NOT exceed 32 Unicode code points. 学号 MUST be non-empty after trimming and MUST be a decimal class number from **1** through **50** inclusive with **no leading zeros** (equivalently MUST match the regular expression `^(?:[1-9]|[1-4][0-9]|50)$`).

#### Scenario: Successful validation

- **WHEN** 姓名 is non-empty after trim and its length is at most 32 code points AND 学号 after trim matches `^(?:[1-9]|[1-4][0-9]|50)$`
- **THEN** the system SHALL allow the login action to proceed to authentication success path

#### Scenario: Class numbers 1 through 50 are accepted

- **WHEN** 姓名 is valid AND 学号 after trim is `1`, `9`, `38`, or `50`
- **THEN** the system SHALL allow the login action to proceed to authentication success path

#### Scenario: Rejected login for invalid 姓名

- **WHEN** 姓名 is empty after trim OR exceeds 32 code points
- **THEN** the system SHALL reject login and SHALL NOT enter logged-in state

#### Scenario: Rejected login for invalid 学号

- **WHEN** 学号 is empty after trim OR does not match `^(?:[1-9]|[1-4][0-9]|50)$` (including leading zeros such as `01`, values outside 1–50, or non-digit characters)
- **THEN** the system SHALL reject login and SHALL NOT enter logged-in state

### Requirement: Successful login establishes session

The system SHALL, upon successful login, persist the user's 姓名 and 学号 as the current user identity and SHALL treat the application as being in a logged-in state until the user logs out.

#### Scenario: Identity is available after login

- **WHEN** login succeeds
- **THEN** the system SHALL store 姓名 and 学号 as the active user identity and SHALL make them available to the rest of the application

### Requirement: Logged-in user visibility and logout entry point

When the user is logged in, the system SHALL display the user's 姓名 and SHALL provide an explicit control to log out.

#### Scenario: Shows name and logout when logged in

- **WHEN** the user is in a logged-in state
- **THEN** the system SHALL display the user's 姓名 AND SHALL provide a logout control

### Requirement: Logout clears session

The system SHALL, when the user confirms logout, remove the persisted current user identity and transition to a logged-out state.

#### Scenario: Logout returns to logged-out state

- **WHEN** the user invokes logout
- **THEN** the system SHALL clear stored current user identity AND SHALL treat the user as logged out

#### Scenario: No residual identity after logout

- **WHEN** logout completes
- **THEN** subsequent reads of current user identity MUST yield no logged-in user until login succeeds again

### Requirement: Session survives reload

The system SHALL restore a logged-in state after a full page reload if the user had not logged out before reload.

#### Scenario: Reload preserves logged-in user

- **WHEN** the user was logged in and reloads the application without logging out
- **THEN** the system SHALL restore the same 姓名 and 学号 as the active user identity AND SHALL remain in logged-in state

