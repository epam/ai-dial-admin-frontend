# user-profile-picture Specification

## Purpose
Shows the signed-in user's profile picture in the header for every supported auth provider, and falls
back to an initials badge when no usable picture exists.
## Requirements
### Requirement: Header shows the provider's profile picture
The system SHALL show the user's profile picture in the header user control when the identity provider
supplies one, whether as an `http(s)` URL or as an inline base64 `data:` image, and SHALL fall back to
the initials badge when none is available or the image fails to load.

#### Scenario: Provider supplies an http(s) picture
- **WHEN** a user signs in and the profile or ID token carries an `http(s)` picture URL
- **THEN** the header shows that image

#### Scenario: Keycloak supplies the picture only through UserInfo
- **WHEN** a Keycloak user signs in, the ID token has no picture and UserInfo for the same subject carries one
- **THEN** the header shows the UserInfo picture

#### Scenario: No usable picture
- **WHEN** the provider supplies no picture, or one that is not an `http(s)` URL or an allowed inline image
- **THEN** the header shows the initials badge

### Requirement: Inline pictures stay out of the session cookie
The system SHALL NOT store an inline `data:` picture in the session cookie. It SHALL store only a flag
and serve the image from `GET /api/auth/me/picture`, which re-reads it from the provider with the
session's access token. The system SHALL serve only JPEG, PNG, GIF or WebP images of at most 256 KiB,
and SHALL refuse SVG.

#### Scenario: Inline picture at sign-in
- **WHEN** the provider supplies an inline picture
- **THEN** the session token holds no image data and the session image points to `/api/auth/me/picture`

#### Scenario: Picture route without a session or picture
- **WHEN** `/api/auth/me/picture` is requested without a session, or by a session with no inline picture
- **THEN** it answers 401 or 404 respectively

#### Scenario: Provider lookup fails
- **WHEN** the provider lookup throws while serving the picture
- **THEN** the route answers 502 and the header falls back to initials
