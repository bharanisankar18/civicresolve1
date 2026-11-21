import { prisma } from "../../config/prisma";

export class DepartmentRepository {
  async findAll() {
    return prisma.department.findMany({
      include: {
        _count: {
          select: { complaints: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return prisma.department.findUnique({
      where: { code },
    });
  }

  async updateSla(id: string, slaHours: number) {
    return prisma.department.update({
      where: { id },
      data: { slaHours },
    });
  }
}

export const departmentRepository = new DepartmentRepository();
