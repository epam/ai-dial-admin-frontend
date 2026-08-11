import { describe, expect, test } from 'vitest';

import { DialExternalService, ToolsetAuthStatus, ToolsetAuthType } from '@/src/models/dial/resource';
import {
  getExternalServiceRowAction,
  isExternalServiceApproved,
  isLoggedInToExternalService,
  isUnrecognisedAuthType,
} from '../external-service-auth-utils';
import { ExternalServiceRowAction } from '../models';

const service = (authSettings?: DialExternalService['auth_settings']): DialExternalService => ({
  auth_settings: authSettings,
});

describe('getExternalServiceRowAction', () => {
  test('returns SignIn for OAUTH', () => {
    expect(getExternalServiceRowAction(service({ authentication_type: ToolsetAuthType.OAUTH }))).toBe(
      ExternalServiceRowAction.SignIn,
    );
  });

  test('returns SignIn for API_KEY', () => {
    expect(getExternalServiceRowAction(service({ authentication_type: ToolsetAuthType.API_KEY }))).toBe(
      ExternalServiceRowAction.SignIn,
    );
  });

  test('returns Consent for DIAL_NATIVE', () => {
    expect(getExternalServiceRowAction(service({ authentication_type: ToolsetAuthType.DIAL_NATIVE }))).toBe(
      ExternalServiceRowAction.Consent,
    );
  });

  test('returns None for NONE', () => {
    expect(getExternalServiceRowAction(service({ authentication_type: ToolsetAuthType.NONE }))).toBe(
      ExternalServiceRowAction.None,
    );
  });

  test('returns None for a type this frontend does not know', () => {
    expect(getExternalServiceRowAction(service({ authentication_type: 'SOME_FUTURE_TYPE' as ToolsetAuthType }))).toBe(
      ExternalServiceRowAction.None,
    );
  });

  test('returns None when the type is absent', () => {
    expect(getExternalServiceRowAction(service({}))).toBe(ExternalServiceRowAction.None);
  });

  test('returns None when auth settings are absent', () => {
    expect(getExternalServiceRowAction(service())).toBe(ExternalServiceRowAction.None);
  });
});

describe('isExternalServiceApproved', () => {
  test('is true when app level is SIGNED_IN', () => {
    expect(
      isExternalServiceApproved(
        service({
          authentication_type: ToolsetAuthType.DIAL_NATIVE,
          app_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
        }),
      ),
    ).toBe(true);
  });

  test('is false when app level is SIGNED_OUT', () => {
    expect(
      isExternalServiceApproved(
        service({
          authentication_type: ToolsetAuthType.DIAL_NATIVE,
          app_level_auth_status: ToolsetAuthStatus.SIGNED_OUT,
        }),
      ),
    ).toBe(false);
  });

  test('is false when the app-level status is absent', () => {
    expect(isExternalServiceApproved(service({ authentication_type: ToolsetAuthType.DIAL_NATIVE }))).toBe(false);
  });

  test('ignores the user-level status, which describes the viewing admin', () => {
    expect(
      isExternalServiceApproved(
        service({
          authentication_type: ToolsetAuthType.DIAL_NATIVE,
          user_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
          app_level_auth_status: ToolsetAuthStatus.SIGNED_OUT,
        }),
      ),
    ).toBe(false);
  });
});

describe('isLoggedInToExternalService', () => {
  test('is true for an OAUTH service signed in at user level', () => {
    expect(
      isLoggedInToExternalService(
        service({ authentication_type: ToolsetAuthType.OAUTH, user_level_auth_status: ToolsetAuthStatus.SIGNED_IN }),
      ),
    ).toBe(true);
  });

  test('is false for DIAL_NATIVE even when the user level is SIGNED_IN', () => {
    expect(
      isLoggedInToExternalService(
        service({
          authentication_type: ToolsetAuthType.DIAL_NATIVE,
          user_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
          app_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
        }),
      ),
    ).toBe(false);
  });
});

describe('isUnrecognisedAuthType', () => {
  test('is true for a type this frontend does not know', () => {
    expect(isUnrecognisedAuthType(service({ authentication_type: 'SOME_FUTURE_TYPE' as ToolsetAuthType }))).toBe(true);
  });

  test('is false for every known type', () => {
    Object.values(ToolsetAuthType).forEach((authenticationType) => {
      expect(isUnrecognisedAuthType(service({ authentication_type: authenticationType }))).toBe(false);
    });
  });

  test('is false when the type is absent', () => {
    expect(isUnrecognisedAuthType(service())).toBe(false);
  });
});
