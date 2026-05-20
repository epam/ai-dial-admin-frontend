import { describe, test, expect } from 'vitest';
import { getAgentLinkForConversation } from '../utils';
import { ApplicationRoute } from '@/src/types/routes';

describe('getAgentLinkForConversation', () => {
  test('returns empty string when deployment is null', () => {
    expect(getAgentLinkForConversation(null, 'en')).toBe('');
  });

  test('returns empty string when deployment is empty object', () => {
    expect(getAgentLinkForConversation({}, 'en')).toBe('');
  });

  test('returns model link when deployment has model', () => {
    const deployment = { model: 'gpt-4' };
    const result = getAgentLinkForConversation(deployment, 'en');
    expect(result).toBe(`/en${ApplicationRoute.Models}/${encodeURIComponent('gpt-4')}`);
  });

  test('encodes special characters in model name', () => {
    const deployment = { model: 'my model/v1' };
    const result = getAgentLinkForConversation(deployment, 'en');
    expect(result).toBe(`/en${ApplicationRoute.Models}/${encodeURIComponent('my model/v1')}`);
  });

  test('returns application link when application equals reference', () => {
    const deployment = { application: 'my-app', reference: 'my-app' };
    const result = getAgentLinkForConversation(deployment, 'en');
    expect(result).toBe(`/en${ApplicationRoute.Applications}/${encodeURIComponent('my-app')}`);
  });

  test('returns assets application link when application differs from reference', () => {
    const deployment = {
      application: 'applications/my-app',
      reference: 'other-ref',
      displayName: 'My App',
    };
    const result = getAgentLinkForConversation(deployment, 'en');
    expect(result).toBe(`/en${ApplicationRoute.AssetsApplications}/${encodeURIComponent('My App')}?path=my-app`);
  });

  test('model takes precedence over application', () => {
    const deployment = { model: 'gpt-4', application: 'my-app', reference: 'my-app' };
    const result = getAgentLinkForConversation(deployment, 'en');
    expect(result).toBe(`/en${ApplicationRoute.Models}/${encodeURIComponent('gpt-4')}`);
  });

  test('uses currentLocale in the path', () => {
    const deployment = { model: 'gpt-4' };
    expect(getAgentLinkForConversation(deployment, 'fr')).toContain('/fr/');
    expect(getAgentLinkForConversation(deployment, 'de')).toContain('/de/');
  });
});
