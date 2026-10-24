import { z } from 'zod';

const storedSettingsSchema = z.object({
  api_key: z.string(),
  model: z.string().nullable(),
});

export const settingsStatusSchema = z.array(storedSettingsSchema).max(1).transform(rows => {
  const saved = rows[0];
  if (!saved) {
    return { hasKey: false as const, model: null };
  }

  // Never carry the credential or unknown persistence fields beyond this boundary.
  return { hasKey: true as const, model: saved.model };
});

export const settingsReadConfigSchema = z.object({
  url: z.url({ protocol: /^https?$/ }),
  key: z.string().min(1),
});
