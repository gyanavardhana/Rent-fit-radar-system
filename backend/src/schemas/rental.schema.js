import { z } from "zod";

export const rentalSearchSchema = z.object({
  location: z.object({
    city: z.string().min(2),
    locality: z.string().min(2),
    radiusKm: z.number().min(1).max(30).optional().default(5),
  }),
  budget: z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().positive(),
  }),
  property: z.object({
    type: z.enum([
      "1RK", "1BHK", "2BHK", "3BHK", "4BHK", "HOUSE", "PG", "ANY",
    ]).default("ANY"),
  }),
  preferences: z.object({
    noBrokerage: z.boolean().optional().default(false),
    furnished: z.enum([
      "any", "furnished", "semi-furnished", "unfurnished",
    ]).optional().default("any"),
    parking: z.boolean().optional().default(false),
    petFriendly: z.boolean().optional().default(false),
  }).optional().default({}),
  limit: z.number().int().min(1).max(20).optional().default(10),
});
