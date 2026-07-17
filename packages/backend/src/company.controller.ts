// src/company.controller.ts
//
// tsoa 데코레이터로 라우팅+검증+OpenAPI 스펙을 이 파일 하나에서 함께 생성한다
// (build/routes.ts, build/swagger.json은 `npm run tsoa`로 생성되는 산출물).
// 라우트 등록 순서 = 클래스 메서드 선언 순서이므로, 더 구체적인 경로
// (search)를 :param 경로(getDetail)보다 먼저 선언해야 한다.

import { Body, Controller, Get, Path, Post, Query, Queries, Route, Tags } from "tsoa";
import { CompanyService } from "./company.service";
import type {
  ApiError,
  CompanyCompareResponse,
  CompanyDetailResponse,
  CompanyFrontendResponse,
  CompareCompaniesRequestBody,
  PaginatedCompaniesResponse,
  SearchCompanyQuery,
  SimilarCompanyResponse,
} from "./company.dto";

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

@Route("api/companies")
@Tags("companies")
export class CompanyController extends Controller {
  constructor(private readonly companyService: CompanyService) {
    super();
  }

  // 컨트롤러 4개 엔드포인트가 공유하는 try/catch → setStatus → ApiError 패턴
  private async wrap<T>(
    errorStatus: number,
    fn: () => Promise<T>,
  ): Promise<{ success: true; data: T } | ApiError> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (err) {
      this.setStatus(errorStatus);
      return { success: false, error: toErrorMessage(err) };
    }
  }

  /**
   * 기업 검색 (페이징). corpName 또는 stockCode에 부분 일치.
   */
  @Get("search")
  public async search(
    @Queries() query: SearchCompanyQuery,
  ): Promise<{ success: true } & PaginatedCompaniesResponse> {
    const data = await this.companyService.search({
      ...query,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    });
    return { success: true, ...data };
  }

  /**
   * 기업명으로 프론트엔드용 상세 조회 (성장성 점수 포함).
   * DB에 저장된 값을 그대로 읽어 응답한다 — 점수는 packages/data 배치 잡이 미리 계산한다.
   */
  @Get("by-name/{name}")
  public async getByName(
    @Path() name: string,
  ): Promise<{ success: true; data: CompanyFrontendResponse } | ApiError> {
    return this.wrap(404, () => this.companyService.getByName(name));
  }

  /**
   * DART 고유번호(corpCode)로 기업 상세 조회 (원본 재무/주가 데이터).
   * @minLength corpCode 8 corpCode는 8자리여야 합니다
   * @maxLength corpCode 8 corpCode는 8자리여야 합니다
   */
  @Get("{corpCode}")
  public async getDetail(
    @Path() corpCode: string,
  ): Promise<{ success: true; data: CompanyDetailResponse } | ApiError> {
    return this.wrap(404, () => this.companyService.getDetail(corpCode));
  }

  /**
   * 같은 업종(indutyCode 앞 2자리) 유사 기업 조회.
   * @minLength corpCode 8 corpCode는 8자리여야 합니다
   * @maxLength corpCode 8 corpCode는 8자리여야 합니다
   * @minimum limit 1
   * @maximum limit 10
   */
  @Get("{corpCode}/similar")
  public async getSimilar(
    @Path() corpCode: string,
    @Query() limit = 5,
  ): Promise<{ success: true; data: SimilarCompanyResponse[] } | ApiError> {
    return this.wrap(404, () => this.companyService.getSimilar({ corpCode, limit }));
  }

  /**
   * 여러 기업 비교 (재무/주가 + 업종 평균).
   */
  @Post("compare")
  public async compare(
    @Body() body: CompareCompaniesRequestBody,
  ): Promise<{ success: true; data: CompanyCompareResponse } | ApiError> {
    return this.wrap(500, () => this.companyService.compare(body.corpCodes));
  }
}
