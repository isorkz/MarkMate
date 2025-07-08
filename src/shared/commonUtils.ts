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

/**
 * Formats a date for display
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return 'Unknown'
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  } catch (error) {
    return 'Unknown'
  }
}