import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Image } from '@/src/models/deployments/images';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import SourceType from '@/src/components/Deployments/Fields/ImageSource/SourceType';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialSelectField: ({ id, options, onChange, value, disabled }: any) => (
      <select
        aria-label={id}
        data-testid={`select-${id}`}
        value={value ?? ''}
        disabled={!!disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options?.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

const buildImage = (overrides: Partial<Image> = {}): Image => ({
  id: 'test-image',
  $type: IMAGE_TYPE.ADAPTER,
  name: 'test-image',
  version: '1.0.0',
  description: '',
  buildStatus: IMAGE_STATUS.NOT_BUILT,
  source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: '' },
  ...overrides,
});

describe('SourceType — onImageTypeChange preservation', () => {
  test('Adapter → Interceptor preserves code-source fields', () => {
    const setImage = vi.fn();
    const image = buildImage({
      $type: IMAGE_TYPE.ADAPTER,
      source: {
        $type: IMAGE_SOURCE_TYPE.CODE,
        url: 'https://github.com/x/y',
        branchName: 'main',
        sha: 'abc',
        baseDirectory: 'sub',
      },
    });

    render(<SourceType image={image} setImage={setImage} verifyVersion={vi.fn()} isModal />);
    fireEvent.change(screen.getByTestId('select-imagesType'), { target: { value: IMAGE_TYPE.INTERCEPTOR } });

    const updated = setImage.mock.calls.at(-1)?.[0];
    expect(updated.$type).toBe(IMAGE_TYPE.INTERCEPTOR);
    expect(updated.source).toMatchObject({
      $type: IMAGE_SOURCE_TYPE.CODE,
      url: 'https://github.com/x/y',
      branchName: 'main',
      sha: 'abc',
      baseDirectory: 'sub',
    });
    expect(updated.transportType).toBeUndefined();
  });

  test('Adapter → Application preserves docker source', () => {
    const setImage = vi.fn();
    const image = buildImage({
      $type: IMAGE_TYPE.ADAPTER,
      source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: 'registry.example.com/img:tag' },
    });

    render(<SourceType image={image} setImage={setImage} verifyVersion={vi.fn()} isModal />);
    fireEvent.change(screen.getByTestId('select-imagesType'), { target: { value: IMAGE_TYPE.APPLICATION } });

    const updated = setImage.mock.calls.at(-1)?.[0];
    expect(updated.$type).toBe(IMAGE_TYPE.APPLICATION);
    expect(updated.source).toMatchObject({
      $type: IMAGE_SOURCE_TYPE.DOCKER,
      imageUri: 'registry.example.com/img:tag',
    });
  });

  test('MCP → Adapter clears transportType (registry-less MCP image)', () => {
    const setImage = vi.fn();
    const image = buildImage({
      $type: IMAGE_TYPE.MCP,
      source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: 'x' },
      transportType: IMAGE_TRANSPORT_TYPE.LOCAL,
    });

    render(<SourceType image={image} setImage={setImage} verifyVersion={vi.fn()} isModal />);
    fireEvent.change(screen.getByTestId('select-imagesType'), { target: { value: IMAGE_TYPE.ADAPTER } });

    const updated = setImage.mock.calls.at(-1)?.[0];
    expect(updated.$type).toBe(IMAGE_TYPE.ADAPTER);
    expect(updated.source).toMatchObject({ $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: 'x' });
    expect(updated.transportType).toBeUndefined();
  });

  test('image-type dropdown is suppressed when externalRegistryRef is set', () => {
    const image = buildImage({
      $type: IMAGE_TYPE.MCP,
      source: {
        $type: IMAGE_SOURCE_TYPE.DOCKER,
        imageUri: 'x',
        externalRegistryRef: { $type: SOURCE_TYPE.MCP_REGISTRY, packageName: 'org/server', version: '1.0.0' },
      },
    });

    render(<SourceType image={image} setImage={vi.fn()} verifyVersion={vi.fn()} isModal />);

    expect(screen.queryByTestId('select-imagesType')).toBeNull();
  });

  test('Application → MCP preserves source and sets LOCAL transport', () => {
    const setImage = vi.fn();
    const image = buildImage({
      $type: IMAGE_TYPE.APPLICATION,
      source: { $type: IMAGE_SOURCE_TYPE.CODE, url: 'https://github.com/x/y' },
    });

    render(<SourceType image={image} setImage={setImage} verifyVersion={vi.fn()} isModal />);
    fireEvent.change(screen.getByTestId('select-imagesType'), { target: { value: IMAGE_TYPE.MCP } });

    const updated = setImage.mock.calls.at(-1)?.[0];
    expect(updated.$type).toBe(IMAGE_TYPE.MCP);
    expect(updated.source).toMatchObject({ $type: IMAGE_SOURCE_TYPE.CODE, url: 'https://github.com/x/y' });
    expect(updated.transportType).toBe(IMAGE_TRANSPORT_TYPE.LOCAL);
  });
});

describe('SourceType — onSourceTypeChange clean cut', () => {
  test('DOCKER → CODE drops imageUri', () => {
    const setImage = vi.fn();
    const image = buildImage({
      source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: 'registry.example.com/img:tag' },
    });

    render(<SourceType image={image} setImage={setImage} verifyVersion={vi.fn()} isModal />);
    fireEvent.change(screen.getByTestId('select-sourceType'), { target: { value: IMAGE_SOURCE_TYPE.CODE } });

    const updated = setImage.mock.calls.at(-1)?.[0];
    expect(updated.source).toEqual({ $type: IMAGE_SOURCE_TYPE.CODE });
  });

  test('CODE → DOCKER drops url, branchName, sha, baseDirectory', () => {
    const setImage = vi.fn();
    const image = buildImage({
      source: {
        $type: IMAGE_SOURCE_TYPE.CODE,
        url: 'https://github.com/x/y',
        branchName: 'main',
        sha: 'abc',
        baseDirectory: 'sub',
      },
    });

    render(<SourceType image={image} setImage={setImage} verifyVersion={vi.fn()} isModal />);
    fireEvent.change(screen.getByTestId('select-sourceType'), { target: { value: IMAGE_SOURCE_TYPE.DOCKER } });

    const updated = setImage.mock.calls.at(-1)?.[0];
    expect(updated.source).toEqual({ $type: IMAGE_SOURCE_TYPE.DOCKER });
  });
});

describe('SourceType — dropdown visibility', () => {
  test('source-type dropdown rendered for Adapter (modal)', () => {
    const image = buildImage({ $type: IMAGE_TYPE.ADAPTER });
    render(<SourceType image={image} setImage={vi.fn()} verifyVersion={vi.fn()} isModal />);
    expect(screen.getByTestId('select-sourceType')).toBeTruthy();
  });

  test('source-type dropdown rendered for Application (view)', () => {
    const image = buildImage({ $type: IMAGE_TYPE.APPLICATION });
    render(<SourceType image={image} setImage={vi.fn()} verifyVersion={vi.fn()} />);
    expect(screen.getByTestId('select-sourceType')).toBeTruthy();
  });

  test('source-type dropdown rendered for Interceptor (view)', () => {
    const image = buildImage({ $type: IMAGE_TYPE.INTERCEPTOR });
    render(<SourceType image={image} setImage={vi.fn()} verifyVersion={vi.fn()} />);
    expect(screen.getByTestId('select-sourceType')).toBeTruthy();
  });

  test('source-type dropdown rendered for MCP (modal)', () => {
    const image = buildImage({ $type: IMAGE_TYPE.MCP });
    render(<SourceType image={image} setImage={vi.fn()} verifyVersion={vi.fn()} isModal />);
    expect(screen.getByTestId('select-sourceType')).toBeTruthy();
  });
});
