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
  return window.navigator.userAgent.toLocaleLowerCase().includes('mac');
}

export function getFileName(path: string): string {
  // const delimiter = isMac() ? '/' : '\\';
  // let fileName = path.split(delimiter).pop() || '';
  // if (fileName.includes('.')) {
  //   // remove file extension
  //   fileName = fileName.split('.').slice(0, -1).join('.');
  // }
  const delimiter = '/';
  let fileName = path.split(delimiter).pop() || '';
  if (fileName.includes('.')) {
    // remove file extension
    fileName = fileName.split('.').slice(0, -1).join('.');
  }
  return fileName;
}

export function getFolderPath(rootDir: string, filePath: string): string {
  // const delimiter = isMac() ? '/' : '\\';
  // const fileName = filePath.split(delimiter).pop() || '';
  // if (isMac()) {
  //   // rootDir: /path/md
  //   // filePath: /path/md/dir/test/1.md
  //   // return: dir / test
  //   return filePath.replace(rootDir, '').replace(fileName, '').replace(/^\//, '').replace(/\/$/, '').replace(/\//g, ' / ');
  // } else {
  //   // rootDir: C:\\path\\md
  //   // filePath: C:\\path\\md\\dir\\test\\1.md
  //   // return: dir / test
  //   return filePath.replace(rootDir, '').replace(fileName, '').replace(/^\\/, '').replace(/\\$/, '').replace(/\\/g, ' / ');
  // }
  const delimiter = '/';
  const fileName = filePath.split(delimiter).pop() || '';
  return filePath.replace(rootDir, '').replace(fileName, '').replace(/^\//, '').replace(/\/$/, '').replace(/\//g, ' / ');
}

export function getTopBarTitle(rootDir: string, filePath: string): string {
  // if (isMac()) {
  //   // rootDir: /path/md
  //   // filePath: /path/md/dir/test/1.md
  //   // return: dir / test / 1
  //   return filePath.replace(rootDir, '').replace(/^\//, '').replace(/\.md$/, '').replace(/\//g, ' / ');
  // } else {
  //   // rootDir: C:\\path\\md
  //   // filePath: C:\\path\\md\\dir\\test\\1.md
  //   // return: dir / test / 1
  //   return filePath.replace(rootDir, '').replace(/^\\/, '').replace(/\.md$/, '').replace(/\\/g, ' / ');
  // }
  return filePath.replace(rootDir, '').replace(/^\//, '').replace(/\.md$/, '').replace(/\//g, ' / ');
}

export function getFormatDateStr(date: Date): string {
  try {
    const now = new Date();
    const diffInSeconds = Math.abs((now.getTime() - date.getTime()) / 1000);

    // if less than 1 minute
    if (diffInSeconds < 60) {
      return 'just now';
    }

    // if less than 30 minutes
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInSeconds < 30 * 60) {
      return `${diffInMinutes} mins ago`;
    }

    // otherwise, return the formatted date
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${dayName} ${monthName} ${day} ${year} ${hours}:${minutes}:${seconds}`;
  }
  catch (e) {
    console.error("Invalid date:", date);
    return '';
  }
}