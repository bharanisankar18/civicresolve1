import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { DepartmentDto } from "@civicresolve/shared";
import { Clock, Save, CheckCircle2 } from "lucide-react";

export const DepartmentSlaSettings: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [slaValues, setSlaValues] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.listDepartments().then((data) => {
      setDepartments(data);
      const map: Record<string, number> = {};
      data.forEach((d: DepartmentDto) => {
        map[d.id] = d.slaHours;
      });
      setSlaValues(map);
    });
  }, []);

  const handleUpdate = async (deptId: string) => {
    const hours = slaValues[deptId];
    if (!hours || hours < 1) return;

    try {
      setSavingId(deptId);
      setErrorMsg(null);
      await api.updateDepartmentSla(deptId, hours);
      setSuccessMsg("SLA target hours updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update SLA");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <span>Municipal Department SLA Configuration</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Complaints breaching these target hours are automatically elevated to ESCALATED status
            by the node-cron daemon.
          </p>
        </div>
      </div>

      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-300 text-red-800 dark:text-red-200 rounded-lg text-xs font-semibold flex items-center gap-2"
        >
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{dept.name}</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {dept.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{dept.description}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <label htmlFor={`sla-${dept.id}`} className="text-xs font-semibold">
                  SLA Target (Hours):
                </label>
                <input
                  id={`sla-${dept.id}`}
                  type="number"
                  min="1"
                  max="720"
                  value={slaValues[dept.id] || dept.slaHours}
                  onChange={(e) =>
                    setSlaValues({
                      ...slaValues,
                      [dept.id]: Number(e.target.value),
                    })
                  }
                  className="w-20 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-center font-bold"
                />
              </div>

              <button
                type="button"
                onClick={() => handleUpdate(dept.id)}
                disabled={savingId === dept.id}
                className="min-h-touch px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingId === dept.id ? "Saving..." : "Update SLA"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
