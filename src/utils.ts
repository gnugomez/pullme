export function limitStringLen(str: string, limit: number = 70) {
  if (str.length > limit) {
    return `${str.substring(0, limit)}...`
  }
  else {
    return str.padEnd(limit + 3, '.')
  }
}
