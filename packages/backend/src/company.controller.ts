import { Request, Response } from "express";
import { CompanyService } from "./company.service";
import {
  GetCompanyRequestDto,
  SearchCompanyRequestDto,
  GetSimilarCompaniesRequestDto,
  CompareCompaniesRequestDto,
} from "./company.dto";

export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // GET /api/companies/:corpCode
  async getDetail(req: Request, res: Response): Promise<void> {
    const parsed = GetCompanyRequestDto.safeParse(req.params);
    if (!parsed.success) {
      res
        .status(400)
        .json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    try {
      const data = await this.companyService.getDetail(parsed.data.corpCode);
      res.json({ success: true, data });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(404).json({ success: false, error: message });
    }
  }

  // GET /api/companies/search?query=삼성&market=코스피&page=1&limit=10
  async search(req: Request, res: Response): Promise<void> {
    const parsed = SearchCompanyRequestDto.safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const data = await this.companyService.search(parsed.data); // ✅ this. 추가
    res.json({ success: true, ...data });
  }

  // GET /api/companies/:corpCode/similar?limit=5
  async getSimilar(req: Request, res: Response): Promise<void> {
    const parsed = GetSimilarCompaniesRequestDto.safeParse({
      corpCode: req.params.corpCode,
      limit: req.query.limit,
    });
    if (!parsed.success) {
      res
        .status(400)
        .json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    try {
      const data = await this.companyService.getSimilar(parsed.data); // ✅ this. 추가
      res.json({ success: true, data });
    } catch (err) {
      res.status(404).json({ success: false, error: String(err) });
    }
  }

  // POST /api/companies/compare
  async compare(req: Request, res: Response): Promise<void> {
    const parsed = CompareCompaniesRequestDto.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    try {
      const data = await this.companyService.compare(parsed.data.corpCodes);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  }
}
