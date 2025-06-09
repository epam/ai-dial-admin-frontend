import { updateEndPoint, getFormatterAdapter, getModelAdapter } from '../adapter';
import { adaptersMock } from './mock/models.mock';
import { DialModelType } from '@/src/models/dial/model';

describe('Utils :: adapter :: getModelAdapter', () => {
  it('Should return empty adapter', () => {
    const res = getModelAdapter({ name: 'name', endpoint: 'endpoint' }, adaptersMock);

    expect(res).toBeUndefined();
  });

  it('Should return adapter', () => {
    const res = getModelAdapter(
      { name: 'name', endpoint: 'http://bedrock.dial-development/openai/deployments/name' },
      adaptersMock,
    );

    expect(res).toEqual(adaptersMock[1]);
  });
});

describe('Utils :: adapter :: updateEndPoint', () => {
  it('Should update name in endpoint', () => {
    const res = updateEndPoint(
      { name: 'name1', endpoint: 'http://bedrock.dial-development/openai/deployments/name/chat/completions' },
      adaptersMock,
    );

    expect(res).toBe('http://bedrock.dial-development/openai/deployments/name1/chat/completions');
  });

  it('Should update name in endpoint without adapter url', () => {
    const res = updateEndPoint(
      {
        name: 'name1',
        endpoint: 'http://bedrock1.dial-development/openai/deployments/name/embeddings',
        type: DialModelType.Embedding,
      },
      adaptersMock,
    );

    expect(res).toBe('');
  });
  it('Should update name in endpoint without adapter url', () => {
    const res = updateEndPoint(
      {
        name: 'name1',
        endpoint: '',
        type: DialModelType.Embedding,
      },
      adaptersMock,
    );

    expect(res).toBe('');
  });
});

describe('Utils :: adapter :: getFormatterAdapter ', () => {
  it('Should set bedrock', () => {
    const res = getFormatterAdapter(
      { name: 'name1', endpoint: 'http://bedrock.dial-development/openai/deployments/name/chat/completions' },
      adaptersMock,
    );

    expect(res).toBe('Bedrock');
  });

  it('Should return full endpoint', () => {
    const res = getFormatterAdapter(
      { name: 'name1', endpoint: 'http://bedrock1.dial-development/openai/deployments/name/chat/completions' },
      adaptersMock,
    );

    expect(res).toBe('http://bedrock1.dial-development/openai/deployments/name/chat/completions');
  });

  it('Should return empty string', () => {
    const res = getFormatterAdapter({ name: 'name1' }, adaptersMock);

    expect(res).toBe('');
  });
});
