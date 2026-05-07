// src/routes/company.routes.ts
import { Router } from "express";
import { companyController } from "./company.controller";

const router = Router();

// 순서 중요: /search가 /:corpCode보다 먼저 와야 함
router.get("/search", (req, res) => companyController.search(req, res));
router.get("/:corpCode", (req, res) => companyController.getDetail(req, res));
router.get("/:corpCode/similar", (req, res) =>
  companyController.getSimilar(req, res),
);
router.post("/compare", (req, res) => companyController.compare(req, res));

export default router;
