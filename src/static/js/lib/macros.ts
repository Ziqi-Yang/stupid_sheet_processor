import * as fs from 'node:fs';

function readFile(file_path: string): string {
  return fs.readFileSync(file_path, 'utf8');
}

export default readFile;
