export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

export function isValidUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

export function getFileName(path: string): string {
  let fileName = path.split('/').pop() || '';
  if (fileName.includes('.')) {
    // remove file extension
    fileName = fileName.split('.').slice(0, -1).join('.');
  }
  return fileName;
}

export function getFolderPath(rootDir: string, filePath: string): string {
  // rootDir: /path/md
  // filePath: /path/md/Work/test/1.md
  // return: Work / test
  const fileName = filePath.split('/').pop() || '';
  return filePath.replace(rootDir, '').replace(fileName, '').replace(/\.md$/, '').replace(/\//g, ' / ');
}

export function getTopBarTitle(rootDir: string, filePath: string): string {
  // rootDir: /path/md
  // filePath: /path/md/Work/test/1.md
  // return: Work / test / 1
  return filePath.replace(rootDir, '').replace(/^\//, '').replace(/\.md$/, '').replace(/\//g, ' / ');
}