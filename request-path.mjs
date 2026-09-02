export function decodeRequestPath(url = '/') {
  try {
    return decodeURIComponent(url.split('?')[0])
  } catch {
    return null
  }
}
