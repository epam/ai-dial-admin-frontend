import { describe, it, expect } from 'vitest';
import { parseUrlsInText, buildContentParts } from './utils';

describe('content-with-links utils', () => {
  describe('parseUrlsInText', () => {
    it('should return text part with empty content for empty string', () => {
      const result = parseUrlsInText('');
      expect(result).toEqual([{ type: 'text', content: '' }]);
    });

    it('should return text part for string without URLs', () => {
      const result = parseUrlsInText('Hello world');
      expect(result).toEqual([{ type: 'text', content: 'Hello world' }]);
    });

    it('should parse single HTTP URL', () => {
      const result = parseUrlsInText('Visit https://example.com for more');
      expect(result).toEqual([
        { type: 'text', content: 'Visit ' },
        { type: 'link', content: 'https://example.com', url: 'https://example.com' },
        { type: 'text', content: ' for more' },
      ]);
    });

    it('should parse single HTTPS URL', () => {
      const result = parseUrlsInText('Check https://secure.example.com');
      expect(result).toEqual([
        { type: 'text', content: 'Check ' },
        { type: 'link', content: 'https://secure.example.com', url: 'https://secure.example.com' },
      ]);
    });

    it('should parse multiple URLs in text', () => {
      const result = parseUrlsInText('Visit https://example.com or https://other.com');
      expect(result).toEqual([
        { type: 'text', content: 'Visit ' },
        { type: 'link', content: 'https://example.com', url: 'https://example.com' },
        { type: 'text', content: ' or ' },
        { type: 'link', content: 'https://other.com', url: 'https://other.com' },
      ]);
    });

    it('should handle URL at the beginning', () => {
      const result = parseUrlsInText('https://example.com is here');
      expect(result).toEqual([
        { type: 'link', content: 'https://example.com', url: 'https://example.com' },
        { type: 'text', content: ' is here' },
      ]);
    });

    it('should handle URL at the end', () => {
      const result = parseUrlsInText('Find it at https://example.com');
      expect(result).toEqual([
        { type: 'text', content: 'Find it at ' },
        { type: 'link', content: 'https://example.com', url: 'https://example.com' },
      ]);
    });

    it('should handle consecutive URLs', () => {
      const result = parseUrlsInText('https://example.com https://other.com');
      expect(result).toEqual([
        { type: 'link', content: 'https://example.com', url: 'https://example.com' },
        { type: 'text', content: ' ' },
        { type: 'link', content: 'https://other.com', url: 'https://other.com' },
      ]);
    });

    it('should preserve only text when no URLs match', () => {
      const result = parseUrlsInText('Just plain text with no links');
      expect(result).toEqual([{ type: 'text', content: 'Just plain text with no links' }]);
    });
  });

  describe('buildContentParts', () => {
    it('should return empty array for empty string', () => {
      const result = buildContentParts('');
      expect(result).toEqual([]);
    });

    it('should return plain text part for string without URLs or markdown links', () => {
      const result = buildContentParts('Just plain text');
      expect(result).toEqual([{ type: 'text', content: 'Just plain text' }]);
    });

    it('should parse single markdown link', () => {
      const result = buildContentParts('Check [this link](https://example.com)');
      expect(result).toEqual([
        { type: 'text', content: 'Check ' },
        { type: 'link', content: 'this link', url: 'https://example.com' },
      ]);
    });

    it('should parse markdown link at the beginning', () => {
      const result = buildContentParts('[example](https://example.com) is here');
      expect(result).toEqual([
        { type: 'link', content: 'example', url: 'https://example.com' },
        { type: 'text', content: ' is here' },
      ]);
    });

    it('should parse markdown link at the end', () => {
      const result = buildContentParts('Find more at [link](https://example.com)');
      expect(result).toEqual([
        { type: 'text', content: 'Find more at ' },
        { type: 'link', content: 'link', url: 'https://example.com' },
      ]);
    });

    it('should parse multiple markdown links', () => {
      const result = buildContentParts('Visit [site1](https://example.com) or [site2](https://other.com)');
      expect(result).toEqual([
        { type: 'text', content: 'Visit ' },
        { type: 'link', content: 'site1', url: 'https://example.com' },
        { type: 'text', content: ' or ' },
        { type: 'link', content: 'site2', url: 'https://other.com' },
      ]);
    });

    it('should parse plain URLs in text', () => {
      const result = buildContentParts('Visit https://example.com for info');
      expect(result).toEqual([
        { type: 'text', content: 'Visit ' },
        { type: 'link', content: 'https://example.com', url: 'https://example.com' },
        { type: 'text', content: ' for info' },
      ]);
    });

    it('should mix markdown links and plain URLs', () => {
      const result = buildContentParts('Check [docs](https://docs.com) and https://example.com');
      expect(result).toEqual([
        { type: 'text', content: 'Check ' },
        { type: 'link', content: 'docs', url: 'https://docs.com' },
        { type: 'text', content: ' and ' },
        { type: 'link', content: 'https://example.com', url: 'https://example.com' },
      ]);
    });

    it('should handle plain URL inside markdown text before link', () => {
      const result = buildContentParts('See https://info.com and [link](https://example.com)');
      expect(result).toEqual([
        { type: 'text', content: 'See ' },
        { type: 'link', content: 'https://info.com', url: 'https://info.com' },
        { type: 'text', content: ' and ' },
        { type: 'link', content: 'link', url: 'https://example.com' },
      ]);
    });

    it('should handle plain URL after markdown link', () => {
      const result = buildContentParts('[link](https://example.com) and https://info.com');
      expect(result).toEqual([
        { type: 'link', content: 'link', url: 'https://example.com' },
        { type: 'text', content: ' and ' },
        { type: 'link', content: 'https://info.com', url: 'https://info.com' },
      ]);
    });

    it('should handle text with special characters', () => {
      const result = buildContentParts('Use [API v1.0](https://api.example.com) for details!');
      expect(result).toEqual([
        { type: 'text', content: 'Use ' },
        { type: 'link', content: 'API v1.0', url: 'https://api.example.com' },
        { type: 'text', content: ' for details!' },
      ]);
    });

    it('should handle URLs with query parameters', () => {
      const result = buildContentParts('Visit https://example.com?param=value');
      expect(result).toEqual([
        { type: 'text', content: 'Visit ' },
        { type: 'link', content: 'https://example.com?param=value', url: 'https://example.com?param=value' },
      ]);
    });

    it('should handle URLs with hash fragments', () => {
      const result = buildContentParts('Go to https://example.com/page#section');
      expect(result).toEqual([
        { type: 'text', content: 'Go to ' },
        { type: 'link', content: 'https://example.com/page#section', url: 'https://example.com/page#section' },
      ]);
    });

    it('should parse plain URLs in incomplete markdown-like syntax', () => {
      const result = buildContentParts('This [incomplete link](https://example.com');
      expect(result).toEqual([
        { type: 'text', content: 'This [incomplete link](' },
        { type: 'link', content: 'https://example.com', url: 'https://example.com' },
      ]);
    });

    it('should preserve whitespace', () => {
      const result = buildContentParts('Text  with   multiple   spaces');
      expect(result).toEqual([
        { type: 'text', content: 'Text  with   multiple   spaces' },
      ]);
    });

    it('should handle newlines in text', () => {
      const result = buildContentParts('Line 1\nLine 2');
      expect(result).toEqual([
        { type: 'text', content: 'Line 1\nLine 2' },
      ]);
    });
  });
});
