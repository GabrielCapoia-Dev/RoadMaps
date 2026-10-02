import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import converter from 'openapi-to-postmanv2';

const source = new URL('../docs/openapi/openapi.json', import.meta.url);
const destination = new URL('../docs/postman/', import.meta.url);
const specification = JSON.parse(await readFile(source, 'utf8'));
// The converter still generates random response values in some schemaFaker=false
// paths. Supply explicit deterministic examples on this in-memory input only.
function exampleFor(schema, seen = new Set()) {
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.$ref) {
    if (seen.has(schema.$ref)) return null;
    const next = new Set(seen).add(schema.$ref);
    const name = schema.$ref.split('/').at(-1);
    return exampleFor(specification.components.schemas[name], next);
  }
  if (schema.enum) return schema.enum[0];
  if (schema.nullable) return null;
  if (schema.type === 'array') return [];
  if (schema.type === 'object' || schema.properties)
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([key, value]) => [key, exampleFor(value, seen)]),
    );
  if (schema.type === 'number' || schema.type === 'integer') return schema.minimum ?? 0;
  if (schema.type === 'boolean') return false;
  if (schema.format === 'uuid') return '11111111-1111-4111-8111-111111111111';
  if (schema.format === 'date-time') return '2026-10-01T12:00:00.000Z';
  if (schema.format === 'password') return 'Change-me-before-use!';
  return 'example'.padEnd(schema.minLength ?? 0, 'x');
}
for (const schema of Object.values(specification.components.schemas))
  schema.example ??= exampleFor(schema);
for (const path of Object.values(specification.paths)) {
  for (const operation of Object.values(path)) {
    const bodies = [operation.requestBody, ...Object.values(operation.responses ?? {})];
    for (const body of bodies) {
      for (const media of Object.values(body?.content ?? {})) {
        if (media.schema) media.example ??= exampleFor(media.schema);
      }
    }
    for (const parameter of operation.parameters ?? []) {
      if (parameter.schema) parameter.example ??= exampleFor(parameter.schema);
    }
  }
}
const result = await new Promise((resolve, reject) => {
  converter.convert(
    { type: 'json', data: specification },
    { folderStrategy: 'Tags', requestParametersResolution: 'Example', schemaFaker: false },
    (error, converted) => (error ? reject(error) : resolve(converted)),
  );
});
if (!result.result) throw new Error(result.reason ?? 'OpenAPI conversion failed');
const collection = result.output.find((entry) => entry.type === 'collection')?.data;
if (!collection) throw new Error('No Postman collection was generated');
// Drop generated UUIDs so an unchanged contract produces a stable artifact.
delete collection.info._postman_id;
function stripGeneratedIds(items = []) {
  for (const item of items) {
    delete item.id;
    for (const response of item.response ?? []) delete response.id;
    stripGeneratedIds(item.item);
  }
}
stripGeneratedIds(collection.item);
collection.variable = [{ key: 'baseUrl', value: 'http://localhost:8080', type: 'string' }];
await mkdir(destination, { recursive: true });
const path = new URL('roadmaps.postman_collection.json', destination);
await writeFile(path, `${JSON.stringify(collection, null, 2)}\n`);
console.log(`Postman collection: ${fileURLToPath(path)}`);
