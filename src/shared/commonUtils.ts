/**
 * Checks if a image path is already resolved (absolute, URL, or data URI)
 * @param src - The image source path
 * @returns true if the path is already resolved
 */
export const isImagePathResolved = (src: string): boolean => {
  return src.startsWith('/') ||
         src.startsWith('data:') ||
         src.startsWith('http://') ||
         src.startsWith('https://') ||
         src.startsWith('file://')
}