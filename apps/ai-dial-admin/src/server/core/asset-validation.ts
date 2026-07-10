/**
 * Shared validation for `viewerUrl`/`editorUrl`/`maxInputAttachments` on application-resource
 * payloads, applied to both create and update. Ports the backend's `@Endpoint` annotation
 * (URL-format check) and `@Positive`/`@Max(1000)` (attachment-count range), closing the
 * backend's known gap where only the create DTO validated these fields (design D6).
 */

const URL_CHARSET_RE = /^[a-zA-Z0-9_.:/-]+$/;
const AUTHORITY_RE = /^[a-zA-Z0-9.-]+(:[0-9]{1,5})?$/;

const MAX_INPUT_ATTACHMENTS_LIMIT = 1000;

/**
 * Approximates the backend's `EndpointValidator.isValidUrl` (Apache Commons `UrlValidator`
 * plus a custom authority pattern that permits bare/local hostnames without a TLD). Blank
 * values are valid — required-ness is a separate, field-specific concern.
 */
export const isValidEndpointUrl = (value?: string | null): boolean => {
  if (!value) {
    return true;
  }
  if (!URL_CHARSET_RE.test(value)) {
    return false;
  }
  try {
    const url = new URL(value.includes('://') ? value : `http://${value}`);
    return AUTHORITY_RE.test(url.host);
  } catch {
    return false;
  }
};

export const isValidMaxInputAttachments = (value?: number | null): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  return Number.isInteger(value) && value > 0 && value <= MAX_INPUT_ATTACHMENTS_LIMIT;
};

export interface ApplicationResourceValidationErrors {
  viewerUrl?: string;
  editorUrl?: string;
  maxInputAttachments?: string;
}

export interface ApplicationResourceValidationInput {
  viewerUrl?: string | null;
  editorUrl?: string | null;
  maxInputAttachments?: number | null;
}

/**
 * Validates the fields the backend gapped on update. Returns an empty object when the
 * payload is valid — callers (create and update alike) should reject when any key is present.
 */
export const validateApplicationResourceFields = (
  input: ApplicationResourceValidationInput,
): ApplicationResourceValidationErrors => {
  const errors: ApplicationResourceValidationErrors = {};

  if (!isValidEndpointUrl(input.viewerUrl)) {
    errors.viewerUrl = 'Viewer URL must be a valid endpoint URL';
  }
  if (!isValidEndpointUrl(input.editorUrl)) {
    errors.editorUrl = 'Editor URL must be a valid endpoint URL';
  }
  if (!isValidMaxInputAttachments(input.maxInputAttachments)) {
    errors.maxInputAttachments = 'Attachments max number must be a positive integer up to 1000';
  }

  return errors;
};
