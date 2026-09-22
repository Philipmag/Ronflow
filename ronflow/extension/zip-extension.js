import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const output = createWriteStream(resolve(__dirname, 'ronflow-extension.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Extension packaged: ${archive.pointer()} total bytes`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(resolve(__dirname, 'dist'), false);
archive.finalize();
