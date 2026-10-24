import colors from "@/constants/colors";

/**
 * Always returns the dark tactical theme tokens for SOS Mulher.
 * Dark graphite (#1c1c1e) background, slate gray (#2c2c2e) cards,
 * and crimson (#dc143c / #e63946) primary — regardless of device setting.
 */
export function useColors() {
  return { ...(colors as { dark: typeof colors.light; light: typeof colors.light }).dark, radius: colors.radius };
}
