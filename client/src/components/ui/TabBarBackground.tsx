// This is a shim for web and Android where the tab bar is generally opaque.
export default undefined;

// Returns 0 for platforms without tab bar overflow
export function useBottomTabOverflow() {
  return 0;
}
