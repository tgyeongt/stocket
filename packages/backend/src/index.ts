import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";

import { CompanyRepository } from "./company.repository";
import { CompanyService } from "./company.service";
import { CompanyController } from "./company.controller";

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

// 의존성 주입
const prisma = new PrismaClient();
const companyRepository = new CompanyRepository(prisma);
const companyService = new CompanyService(companyRepository);
const companyController = new CompanyController(companyService);

// ⚠️ 구체적인 경로를 :param 경로보다 먼저 등록해야 한다
app.get(
  "/api/companies/search",
  companyController.search.bind(companyController),
);

app.get(
  "/api/companies/by-name/:name",
  companyController.getByName.bind(companyController),
);

app.get(
  "/api/companies/:corpCode",
  companyController.getDetail.bind(companyController),
);

app.get(
  "/api/companies/:corpCode/similar",
  companyController.getSimilar.bind(companyController),
);

app.post(
  "/api/companies/compare",
  companyController.compare.bind(companyController),
);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
