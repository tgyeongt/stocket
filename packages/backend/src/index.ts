import express from "express";
import { PrismaClient } from "@prisma/client";

import { CompanyRepository } from "./company.repository";
import { CompanyService } from "./company.service";
import { CompanyController } from "./company.controller";

const app = express();

app.use(express.json());

// Prisma 생성
const prisma = new PrismaClient();

// 의존성 주입
const companyRepository = new CompanyRepository(prisma);

const companyService = new CompanyService(companyRepository);

const companyController = new CompanyController(companyService);

// routes
app.get(
  "/api/companies/:corpCode",
  companyController.getDetail.bind(companyController),
);

app.get(
  "/api/companies/search",
  companyController.search.bind(companyController),
);

app.get(
  "/api/companies/:corpCode/similar",
  companyController.getSimilar.bind(companyController),
);

app.post(
  "/api/companies/compare",
  companyController.compare.bind(companyController),
);

app.listen(3000, () => {
  console.log("Server running on 3000");
});
