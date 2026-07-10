/**
 * Time and Business Hours Utilities
 */

/**
 * Calculates time remaining until a specified closing time and returns urgency status.
 * Expects closing time in formats like "6pm", "06:00 PM", or "18:00".
 *
 * Returns null if parsing fails or time is not imminent.
 */
export function getClosingUrgency(businessHours: string): { label: string; isUrgent: boolean } | null {
  if (!businessHours) return null;

  try {
    // Attempt to extract the closing time (usually after the dash or "to")
    // e.g. "9am - 6pm" -> "6pm"
    const parts = businessHours.split(/[-–]| to /i);
    if (parts.length < 2) return null;

    const closeStr = parts[parts.length - 1].trim().toLowerCase();

    // Parse hours and minutes
    let hours = 0;
    let minutes = 0;

    // Handle "pm" / "am"
    const isPM = closeStr.includes('pm');
    const timeMatch = closeStr.match(/(\d+)(?::(\d+))?/);

    if (!timeMatch) return null;

    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2] || '0', 10);

    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    const now = new Date();
    const closingTime = new Date();
    closingTime.setHours(hours, minutes, 0, 0);

    // If closing time has already passed today, assume it's tomorrow (not urgent now)
    if (closingTime.getTime() < now.getTime()) {
      return null;
    }

    const diffMs = closingTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins <= 0) return null;

    // Only show "Closes Soon" if within 60 minutes
    if (diffMins <= 60) {
      return {
        label: `Closes in ${diffMins} mins`,
        isUrgent: diffMins <= 15
      };
    }

    return null;
  } catch (e) {
    return null;
  }
}
