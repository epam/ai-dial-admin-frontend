import { BlobReader, BlobWriter, TextReader, TextWriter, ZipReader, ZipWriter } from '@zip.js/zip.js';

/** Builds a zip archive from in-memory text entries. */
export class ZipFixture {
  private readonly entries: [string, string][] = [];

  file(name: string, content: string): this {
    this.entries.push([name, content]);
    return this;
  }

  async toBlob(): Promise<Blob> {
    const writer = new ZipWriter(new BlobWriter('application/zip'));
    for (const [name, content] of this.entries) {
      await writer.add(name, new TextReader(content));
    }
    return writer.close();
  }

  async toArrayBuffer(): Promise<ArrayBuffer> {
    return (await this.toBlob()).arrayBuffer();
  }
}

/** Reads every file entry of an archive into a `{ name: text }` map. */
export const readZipEntries = async (blob: Blob): Promise<Record<string, string>> => {
  const reader = new ZipReader(new BlobReader(blob));
  const result: Record<string, string> = {};
  for (const entry of await reader.getEntries()) {
    if (!entry.directory) {
      result[entry.filename] = await entry.getData(new TextWriter());
    }
  }
  await reader.close();
  return result;
};
