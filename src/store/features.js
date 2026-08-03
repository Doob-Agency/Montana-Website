import { useSelector } from "react-redux";

/**
 * Feature switches. The backend owns them: they live in the `settings` table
 * and arrive with the rest of the settings from /get-settings, so the admin
 * toggles a feature once at /admin/features and the site follows.
 *
 * A feature counts as ON unless the setting explicitly says "false" — that way
 * the site keeps working while settings are still loading, and against a
 * backend that has not been updated yet.
 */
export const FEATURES = {
  jobs: "enableJobs",
};

export function useFeature(name) {
  const data = useSelector((e) => e.settings.data);
  const key = FEATURES[name];

  if (!key) return true;

  return !data || data[key] !== "false";
}
