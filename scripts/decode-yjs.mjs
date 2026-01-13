import * as Y from 'yjs';
import fs from 'fs';

const data = fs.readFileSync('/tmp/fresh-ydoc.bin');
const doc = new Y.Doc();
Y.applyUpdate(doc, data);

const root = doc.get('root', Y.XmlText);
console.log('Root type:', root.constructor.name);
console.log('Root attributes:', JSON.stringify(root.getAttributes()));
console.log('Root length:', root.length);

const delta = root.toDelta();
console.log('\nDelta items:', delta.length);
for (let i = 0; i < delta.length; i++) {
  const item = delta[i];
  console.log(`\n--- Item ${i} ---`);
  if (typeof item.insert === 'string') {
    console.log('Type: string');
    console.log('Value:', JSON.stringify(item.insert));
  } else if (item.insert) {
    const embedded = item.insert;
    console.log('Type:', embedded.constructor.name);
    if (embedded.getAttributes) {
      console.log('Attributes:', JSON.stringify(embedded.getAttributes()));
    }
    if (embedded.get) {
      console.log('__type:', embedded.get('__type'));
    }
    if (embedded.toDelta) {
      const childDelta = embedded.toDelta();
      console.log('Child delta:', JSON.stringify(childDelta.map(d => {
        if (typeof d.insert === 'string') return { insert: d.insert };
        if (d.insert?.getAttributes) return { insert: { type: d.insert.constructor.name, attrs: d.insert.getAttributes?.() } };
        if (d.insert?.get) return { insert: { type: d.insert.constructor.name, __type: d.insert.get('__type') } };
        return d;
      }), null, 2));
    }
  }
}
