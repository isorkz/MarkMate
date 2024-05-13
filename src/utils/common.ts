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

export function isMac(): boolean {
  // console.log('window.navigator.platform: ', window.navigator.platform);
  // console.log('window.navigator.userAgent: ', window.navigator.userAgent);
  return window.navigator.platform.toLocaleLowerCase() === 'darwin';
}

export function getFileName(path: string): string {
  const delimiter = isMac() ? '/' : '\\';
  let fileName = path.split(delimiter).pop() || '';
  if (fileName.includes('.')) {
    // remove file extension
    fileName = fileName.split('.').slice(0, -1).join('.');
  }
  return fileName;
}

export function getFolderPath(rootDir: string, filePath: string): string {
  
  const delimiter = isMac() ? '/' : '\\';
  const fileName = filePath.split(delimiter).pop() || '';
  if (isMac()){
    // rootDir: /path/md
    // filePath: /path/md/dir/test/1.md
    // return: dir / test
    return filePath.replace(rootDir, '').replace(fileName, '').replace(/^\//, '').replace(/\/$/, '').replace(/\//g, ' / ');
  }else{
    // rootDir: C:\\path\\md
    // filePath: C:\\path\\md\\dir\\test\\1.md
    // return: dir / test
    return filePath.replace(rootDir, '').replace(fileName, '').replace(/^\\/, '').replace(/\\$/, '').replace(/\\/g, ' / ');
  }
}

export function getTopBarTitle(rootDir: string, filePath: string): string {
  if (isMac()){
    // rootDir: /path/md
    // filePath: /path/md/dir/test/1.md
    // return: dir / test / 1
    return filePath.replace(rootDir, '').replace(/^\//, '').replace(/\.md$/, '').replace(/\//g, ' / ');
  }else{
    // rootDir: C:\\path\\md
    // filePath: C:\\path\\md\\dir\\test\\1.md
    // return: dir / test / 1
    return filePath.replace(rootDir, '').replace(/^\\/, '').replace(/\.md$/, '').replace(/\\/g, ' / ');
  }
}