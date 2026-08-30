import express from "express";
import cors from "cors";
import { AnakinAdapter } from "./adapters/anakin.adapter.js";
import { RentalService } from "./services/rental.service.js";
import { createRentalController } from "./controllers/rental.controller.js";
import { createRentalRoutes } from "./routes/rental.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

const anakin = new AnakinAdapter();
const rentalService = new RentalService(anakin);
const rentalController = createRentalController(rentalService);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "rent-fit-radar-api",
    status: "healthy",
  });
});

app.use(
  "/api/rentals",
  createRentalRoutes(rentalController)
);

import { createRecommendationController } from "./controllers/recommendation.controller.js";
import { createRecommendationRoutes } from "./routes/recommendation.routes.js";
const recommendationController = createRecommendationController(anakin);

app.use(
  "/api/recommendations",
  createRecommendationRoutes(recommendationController)
);

app.use((error, req, res, next) => {
  console.error(error);
  if (error.name === "ZodError") {
    return res.status(400).json({
      success: false,
      error: "Invalid request",
      details: error.issues,
    });
  }
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

export default app;
