import { describe, test, expect } from 'vitest';
import PingId, { PingProfile } from '../ping-identity';

describe('PingId', () => {
  test('returns correct config object', () => {
    const options = { clientId: 'id', clientSecret: 'secret' };
    const config = PingId(options as any) as any;
    expect(config.id).toBe('ping-id');
    expect(config.name).toBe('Ping Identity');
    expect(config.type).toBe('oauth');
    expect(config.options).toBe(options);
    expect(config.style.bg).toBe('#b3282d');
    expect(config.style.text).toBe('#fff');
  });

  test('profile returns correct mapped fields', () => {
    const profile: Partial<PingProfile> = {
      sub: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      picture: 'pic.jpg',
      given_name: 'John',
      family_name: 'Doe',
    };
    const config = PingId({} as any) as any;
    const result = config.profile(profile as any) as any;
    expect(result.id).toBe('user123');
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.image).toBe('pic.jpg');
  });

  test('profile falls back to given_name + family_name if name is missing', () => {
    const profile: Partial<PingProfile> = {
      sub: 'user456',
      given_name: 'Jane',
      family_name: 'Smith',
      email: 'jane@example.com',
      picture: 'pic2.jpg',
    };
    const config = PingId({} as any) as any;
    const result = config.profile(profile as any) as any;
    expect(result.id).toBe('user456');
    expect(result.name).toBe('Jane Smith');
    expect(result.email).toBe('jane@example.com');
    expect(result.image).toBe('pic2.jpg');
  });
});
