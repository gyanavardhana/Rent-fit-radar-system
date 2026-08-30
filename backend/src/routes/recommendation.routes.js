import express from "express";

export function createRecommendationRoutes(controller) {
  const router = express.Router();
  console.log('[Backend] Recommendation routes loaded');
  // POST /api/recommendations
  router.post("/", controller.getRecommendations);
  router.post("", controller.getRecommendations);
  return router;
}
