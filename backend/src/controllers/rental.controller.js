import { rentalSearchSchema } from "../schemas/rental.schema.js";

export function createRentalController(rentalService) {
  return {
    search: async (req, res, next) => {
      try {
        const input = rentalSearchSchema.parse(req.body);
        const result = await rentalService.search(input);
        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
