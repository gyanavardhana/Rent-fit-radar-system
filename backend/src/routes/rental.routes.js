import express from "express";

export function createRentalRoutes(controller) {
  const router = express.Router();
  
  router.post(
    "/search",
    controller.search
  );
  
  return router;
}
