"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const company_repository_1 = require("./company.repository");
const company_service_1 = require("./company.service");
const company_controller_1 = require("./company.controller");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: "http://localhost:3000" }));
// 의존성 주입
const prisma = new client_1.PrismaClient();
const companyRepository = new company_repository_1.CompanyRepository(prisma);
const companyService = new company_service_1.CompanyService(companyRepository);
const companyController = new company_controller_1.CompanyController(companyService);
// ⚠️ 구체적인 경로를 :param 경로보다 먼저 등록해야 한다
app.get("/api/companies/search", companyController.search.bind(companyController));
app.get("/api/companies/by-name/:name", companyController.getByName.bind(companyController));
app.get("/api/companies/:corpCode", companyController.getDetail.bind(companyController));
app.get("/api/companies/:corpCode/similar", companyController.getSimilar.bind(companyController));
app.post("/api/companies/compare", companyController.compare.bind(companyController));
const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
