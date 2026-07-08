import "dotenv/config";
import fs from "fs";
import path from "path";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { ValidateError } from "@tsoa/runtime";
import type { Request, Response, NextFunction } from "express";

import { RegisterRoutes } from "./generated/routes";

const app = express();

app.use(express.json());
const ALLOWED_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:3000";
app.use(cors({ origin: ALLOWED_ORIGIN }));

// tsoa가 생성한 스펙(build/swagger.json)을 그대로 Swagger UI에 서빙한다.
// 컨트롤러(company.controller.ts)를 고치면 `npm run tsoa`로 스펙도 함께 갱신되므로
// 스펙과 실제 라우팅이 어긋날 일이 없다.
const swaggerSpecPath = path.join(__dirname, "../build/swagger.json");
const loadSwaggerSpec = () => JSON.parse(fs.readFileSync(swaggerSpecPath, "utf8"));

app.use("/docs", swaggerUi.serve, (_req: Request, res: Response) => {
  res.send(swaggerUi.generateHTML(loadSwaggerSpec()));
});
app.get("/openapi.json", (_req, res) => res.json(loadSwaggerSpec()));

// tsoa가 company.controller.ts의 @Route/@Get/@Post 데코레이터로부터 생성한 라우트
RegisterRoutes(app);

// tsoa 자체 검증(파라미터 타입/범위) 실패 시 공통 에러 포맷으로 응답
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ValidateError) {
    res.status(400).json({ success: false, errors: err.fields });
    return;
  }
  next(err);
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
