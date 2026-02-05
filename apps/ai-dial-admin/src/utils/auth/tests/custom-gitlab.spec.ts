import { describe, test, expect } from 'vitest';
import { GitLab } from '../custom-gitlab';

describe('GitLab', () => {
  test('returns correct config object with default host', () => {
    const options = { clientId: 'id', clientSecret: 'secret' };
    const config = GitLab(options as any) as any;
    expect(config.id).toBe('gitlab');
    expect(config.name).toBe('GitLab');
    expect(config.type).toBe('oauth');
    expect(config.authorization.url).toBe('https://gitlab.com/oauth/authorize');
    expect(config.token).toBe('https://gitlab.com/oauth/token');
    expect(config.userinfo).toBe('https://gitlab.com/api/v4/user');
    expect(config.options).toBe(options);
    expect(config.style.logo).toBe('/gitlab.svg');
    expect(config.style.text).toBe('#FC6D26');
  });

  test('returns correct config object with custom host', () => {
    const options = { clientId: 'id', clientSecret: 'secret', gitlabHost: 'https://custom.gitlab' };
    const config = GitLab(options as any) as any;
    expect(config.token).toBe('https://custom.gitlab/oauth/token');
    expect(config.userinfo).toBe('https://custom.gitlab/api/v4/user');
  });

  test('profile returns correct mapped fields', () => {
    const profile = {
      id: 123,
      name: 'Alice',
      username: 'aliceuser',
      email: 'alice@example.com',
      avatar_url: 'avatar.png',
    };
    const config = GitLab({} as any) as any;
    const result = config.profile(profile as any);
    expect(result.id).toBe('alice@example.com');
    expect(result.name).toBe('Alice');
    expect(result.email).toBe('alice@example.com');
    expect(result.image).toBe('avatar.png');
  });

  test('profile falls back to username if name is missing', () => {
    const profile = {
      id: 456,
      username: 'bobuser',
      email: 'bob@example.com',
      avatar_url: 'bob.png',
    };
    const config = GitLab({} as any) as any;
    const result = config.profile(profile as any);
    expect(result.id).toBe('bob@example.com');
    expect(result.name).toBe('bobuser');
    expect(result.email).toBe('bob@example.com');
    expect(result.image).toBe('bob.png');
  });
});
