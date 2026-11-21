import React, { useState } from "react";
import { api } from "../../lib/api";
import { AccessibleModal } from "../../components/AccessibleModal";
import { Upload, CheckCircle2, Bot, Loader2 } from "lucide-react";
import { AIVerificationOutput } from "@civicresolve/shared";

interface VerifyResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  trackingCode: string;
  category: string;
  beforeImageUrl?: string | null;
  onResolved: () => void;
}

export const VerifyResolutionModal: React.FC<VerifyResolutionModalProps> = ({
  isOpen,
  onClose,
  complaintId,
  trackingCode,
  beforeImageUrl,
  onResolved,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<AIVerificationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please attach an after-resolution photo");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Upload after image
      const afterImageUrl = await api.uploadImage(file);

      // 2. Call resolve endpoint (triggers Gemini multimodal verification)
      const res = await api.resolveComplaint(complaintId, {
        afterImageUrl,
        remarks,
      });

      setVerificationResult(res.verificationResult || null);
      onResolved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Resolution failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Resolve Complaint: ${trackingCode}`}
      description="Upload official field completion photo for automated Gemini AI verification."
    >
      <form onSubmit={handleResolve} className="space-y-4">
        {/* Before and After Image Comparison Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Reported "Before" Image
            </span>
            {beforeImageUrl ? (
              <img
                src={beforeImageUrl}
                alt="Original citizen grievance before repair"
                className="w-full h-40 object-cover rounded-md border"
              />
            ) : (
              <div className="w-full h-40 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 rounded-md">
                No before image provided
              </div>
            )}
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Completed "After" Image
            </span>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Field completion proof"
                className="w-full h-40 object-cover rounded-md border"
              />
            ) : (
              <label className="w-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-md cursor-pointer hover:border-primary-500 transition">
                <Upload className="w-8 h-8 text-slate-400 mb-1" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Upload Resolution Photo
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                  required
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="officer-remarks"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Officer Remarks & Work Notes
          </label>
          <textarea
            id="officer-remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="e.g. Bitumen patched and compacted, traffic lane restored."
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 rounded text-sm"
          >
            {error}
          </div>
        )}

        {/* Verification result feedback */}
        {verificationResult && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800"
          >
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200 mb-1">
              <Bot className="w-5 h-5 text-emerald-600" />
              <span>Gemini AI Verification Result: Verified!</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {verificationResult.reason}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-touch px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="min-h-touch px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying with Gemini...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Resolve</span>
              </>
            )}
          </button>
        </div>
      </form>
    </AccessibleModal>
  );
};
