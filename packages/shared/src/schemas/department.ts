import { z } from "zod";

export const UpdateDepartmentSlaSchema = z.object({
  slaHours: z.number().int().min(1, "SLA must be at least 1 hour").max(720),
});

export type UpdateDepartmentSlaInput = z.infer<typeof UpdateDepartmentSlaSchema>;
