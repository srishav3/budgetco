import { z } from "zod";

/**
 * Validation schema for user onboarding input.
 * Ensures the starting balance is present, formatted correctly, and strictly positive.
 */
export const onboardingSchema = z.object({
  /**
   * User-submitted initial balance.
   * Handled as a string to accommodate localized input formatting 
   * before converting to a numeric representation.
   */
  startingBalance: z
    .string()
    // Enforce required field constraint (prevents empty submissions)
    .min(1, "Please enter a starting balance.")
    // Custom business logic: ensure the input resolves to a positive number
    .refine((value) => {
      // Strip comma grouping separators (e.g., "1,250.50" -> "1250.50")
      const parsed = parseFloat(value.replace(/,/g, ""));

      // Verify input is a valid finite float and greater than zero
      return !Number.isNaN(parsed) && parsed > 0;
    }, "Please enter a valid starting balance."),
});

/**
 * Inferred static TypeScript type derived from `onboardingSchema`.
 * Keeps runtime validation and compile-time types strictly in sync.
 * eg : type OnboardingFormValues = {startingBalance: string;};
 */
export type OnboardingFormValues = z.infer<typeof onboardingSchema>;