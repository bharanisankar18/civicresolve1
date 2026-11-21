import { departmentRepository } from "./departmentRepository";
import { NotFoundError } from "../../utils/errors";
import { DepartmentDto } from "@civicresolve/shared";

let cachedDepartments: { data: DepartmentDto[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000;

export class DepartmentService {
  /**
   * Clears in-memory department cache on administrative updates
   */
  invalidateCache(): void {
    cachedDepartments = null;
  }

  /**
   * Retrieves all municipal departments (with 60-second in-memory caching)
   */
  async list(): Promise<DepartmentDto[]> {
    const now = Date.now();
    if (cachedDepartments && now - cachedDepartments.timestamp < CACHE_TTL_MS) {
      return cachedDepartments.data;
    }

    const departments = await departmentRepository.findAll();
    const data: DepartmentDto[] = departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      slaHours: d.slaHours,
      description: d.description,
      complaintCount: d._count.complaints,
    }));

    cachedDepartments = { data, timestamp: now };
    return data;
  }

  /**
   * Updates department SLA target hours
   */
  async updateSla(id: string, slaHours: number): Promise<DepartmentDto> {
    const existing = await departmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Department not found");
    }
    const updated = await departmentRepository.updateSla(id, slaHours);
    this.invalidateCache();
    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      slaHours: updated.slaHours,
      description: updated.description,
    };
  }
}

export const departmentService = new DepartmentService();
