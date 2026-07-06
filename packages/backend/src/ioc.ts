// src/ioc.ts
//
// tsoa가 생성한 라우트가 컨트롤러 인스턴스를 얻어올 때 사용하는 IoC 컨테이너.
// 요청마다 새로 만들 필요가 없는 의존성(Prisma, Repository, Service)이므로
// 모듈 로드 시 한 번만 조립해 싱글턴으로 보관한다.

import { PrismaClient } from "@prisma/client";
import type { IocContainer, ServiceIdentifier } from "@tsoa/runtime";
import { CompanyRepository } from "./company.repository";
import { CompanyService } from "./company.service";
import { CompanyController } from "./company.controller";

const prisma = new PrismaClient();
const companyRepository = new CompanyRepository(prisma);
const companyService = new CompanyService(companyRepository);

const instances = new Map<unknown, unknown>([
  [CompanyController, new CompanyController(companyService)],
]);

export const iocContainer: IocContainer = {
  get<T>(controller: ServiceIdentifier<T>): T {
    const instance = instances.get(controller);
    if (instance === undefined) {
      throw new Error(`No IoC registration found for ${String((controller as { name?: string }).name)}`);
    }
    return instance as T;
  },
};
