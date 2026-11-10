import {
  lstatSync,
  mkdirSync,
  realpathSync,
  openSync,
  writeFileSync,
  fsyncSync,
  closeSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join, resolve, relative, isAbsolute, sep } from 'node:path';

export function validationOutput({ root = process.cwd(), requested = 'artifacts' } = {}) {
  root = realpathSync(resolve(root));
  if (typeof requested !== 'string' || (sep === '/' && requested.includes('\\')))
    throw new Error('Saída de validação inválida: separador de caminho não permitido.');
  const destination = resolve(root, requested);
  const local = relative(join(root, 'artifacts'), destination);
  if (isAbsolute(local) || local === '..' || local.startsWith('../'))
    throw new Error('Saída de validação deve ficar em artifacts/.');
  let directory = root;
  for (const segment of ['artifacts', ...local.split(sep).filter(Boolean)]) {
    if (segment === '.' || segment === '..') throw new Error('Saída de validação inválida.');
    directory = join(directory, segment);
    let stat;
    try {
      stat = lstatSync(directory);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (!stat) mkdirSync(directory);
    else if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error('Saída de validação redirecionada.');
  }
  return directory;
}

export function writeValidationFile(directory, name, data) {
  if (!/^[a-z0-9-]+\.(json|log)$/.test(name)) throw new Error('Nome de evidência inválido.');
  const file = join(directory, name),
    temporary = join(directory, '.' + randomUUID() + '.tmp');
  let stat;
  try {
    stat = lstatSync(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (stat && !stat.isFile()) throw new Error('Arquivo de evidência redirecionado.');
  try {
    const fd = openSync(temporary, 'wx', 0o600);
    try {
      writeFileSync(fd, data);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(temporary, file);
    if (process.platform !== 'win32') {
      const parent = openSync(directory, 'r');
      try {
        fsyncSync(parent);
      } finally {
        closeSync(parent);
      }
    }
  } finally {
    rmSync(temporary, { force: true });
  }
}
