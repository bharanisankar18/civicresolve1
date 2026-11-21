import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { useGeolocation } from "../../hooks/useGeolocation";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  ComplaintCategory,
  ComplaintPriority,
  CreateComplaintInput,
  SupportedLanguage,
} from "@civicresolve/shared";
import {
  Camera,
  Mic,
  MicOff,
  MapPin,
  Bot,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Users,
  Loader2,
} from "lucide-react";

interface NearbyDuplicateItem {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  category: string;
  status: string;
  distanceMeters: number;
  supportCount: number;
  imageUrl?: string | null;
  createdAt: string;
}

export const ReportStepper: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<"GEMINI" | "RULE_BASED">("RULE_BASED");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("POTHOLE");
  const [priority, setPriority] = useState<ComplaintPriority>("HIGH");
  const [aiReasoning, setAiReasoning] = useState("");
  const [address, setAddress] = useState("Avinashi Road, Peelamedu, Coimbatore");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  // Geolocation
  const geo = useGeolocation();

  // Voice recognition
  const speech = useSpeechRecognition();

  // Nearby Duplicates
  const [duplicates, setDuplicates] = useState<NearbyDuplicateItem[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Sync speech transcript
  useEffect(() => {
    if (speech.transcript) {
      setDescription(speech.transcript);
      setOriginalText(speech.transcript);
    }
  }, [speech.transcript]);

  // Client-side image compression & base64 conversion (max 1280px)
  const processImageFile = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1280;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolve({
            base64: dataUrl.split(",")[1] || "",
            mimeType: "image/jpeg",
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));

      try {
        setAnalyzing(true);
        const { base64, mimeType } = await processImageFile(file);

        // Execute photo upload and Gemini analysis concurrently to minimize latency
        const [uploadedUrl, res] = await Promise.all([
          api.uploadImage(file),
          api.analyze({
            text: description || undefined,
            language: i18n.language.slice(0, 2),
            imageBase64: base64,
            imageMimeType: mimeType,
          }),
        ]);
        setImageUrl(uploadedUrl);

        if (res?.analysis) {
          setTitle(res.analysis.title);
          setDescription(res.analysis.description);
          setCategory(res.analysis.category as ComplaintCategory);
          setPriority(res.analysis.priority as ComplaintPriority);
          setAiReasoning(res.analysis.reasoning);
          setAiSource(res.source);
        }
      } catch (_err: unknown) {
        // Fallback silently handled
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleVoiceToggle = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening((i18n.language.slice(0, 2) as SupportedLanguage) || "en");
    }
  };

  // Run duplicate check when moving to Step 4
  const proceedToDuplicateCheck = async () => {
    try {
      setCheckingDuplicates(true);
      const matches = await api.getNearby(geo.lat, geo.lng, category);
      setDuplicates(matches || []);
      setStep(4);
    } catch (_err) {
      setDuplicates([]);
      setStep(4);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleSupportExisting = async (duplicateId: string, trackingCode: string) => {
    try {
      setFormError(null);
      await api.supportComplaint(duplicateId);
      navigate(`/track?code=${trackingCode}`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error supporting complaint");
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setFormError(null);
      const payload: CreateComplaintInput = {
        title,
        description,
        originalText: originalText || description,
        language: (i18n.language.slice(0, 2) as SupportedLanguage) || "en",
        category,
        priority,
        lat: geo.lat,
        lng: geo.lng,
        address,
        imageUrl,
        aiReasoning,
        aiSource,
        isAnonymous,
      };

      const res = await api.createComplaint(payload);
      navigate(`/track?code=${res.trackingCode}`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {formError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
        >
          {formError}
        </div>
      )}
      {/* Stepper Progress Bar */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 text-xs sm:text-sm font-semibold">
          {[
            { num: 1, label: t("report.step1") },
            { num: 2, label: t("report.step2") },
            { num: 3, label: t("report.step3") },
            { num: 4, label: t("report.step4") },
          ].map((s) => (
            <li
              key={s.num}
              className={`flex items-center gap-1.5 ${
                step >= s.num
                  ? "text-primary-600 dark:text-primary-400 font-bold"
                  : "text-slate-400 dark:text-slate-600"
              }`}
              aria-current={step === s.num ? "step" : undefined}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step >= s.num ? "bg-primary-600 text-white" : "bg-slate-200 dark:bg-slate-800"
                }`}
              >
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step 1: Photo & Voice */}
      {step === 1 && (
        <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t("report.uploadPhoto")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("report.photoHint")}
            </p>
          </div>

          {/* Photo Dropzone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-primary-500 transition">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Citizen uploaded civic issue"
                  className="max-h-64 mx-auto rounded-lg object-contain shadow-sm"
                />
                <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-200">
                  <Camera className="w-4 h-4" /> Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="sr-only"
                  />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 mb-3">
                  <Camera className="w-8 h-8" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Take a photo or choose from gallery
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, WebP up to 5MB (EXIF GPS stripped for privacy)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {/* Voice Input Section */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <label
              htmlFor="report-voice-desc"
              className="block text-sm font-semibold text-slate-900 dark:text-white mb-2"
            >
              {t("report.voicePrompt")}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`min-h-touch min-w-touch px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  speech.isListening
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                }`}
                aria-pressed={speech.isListening}
                aria-label={speech.isListening ? "Stop listening" : "Start voice input"}
              >
                {speech.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>
                  {speech.isListening ? t("report.listening") : "Voice Input (EN / TA / HI)"}
                </span>
              </button>
            </div>

            {speech.isListening && (
              <div role="status" aria-live="polite" className="sr-only">
                Microphone listening in {i18n.language.toUpperCase()}. Speak your issue now.
              </div>
            )}

            {speech.error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200"
              >
                Microphone access unavailable ({speech.error}). You may type your grievance
                description directly in the text field below.
              </div>
            )}

            <textarea
              id="report-voice-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setOriginalText(e.target.value);
              }}
              rows={3}
              placeholder="Or type the description here..."
              className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              aria-label="Issue description"
            />
          </div>

          {analyzing && (
            <div
              className="p-4 bg-primary-50 dark:bg-primary-950/60 rounded-lg flex items-center gap-3 text-primary-900 dark:text-primary-200 text-sm font-medium animate-pulse"
              role="status"
              aria-live="polite"
            >
              <Bot className="w-6 h-6 text-primary-600 animate-spin" aria-hidden="true" />
              <span>{t("report.analyzing")}</span>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!photoPreview && description.trim().length < 5}
              className="min-h-touch px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span>Next: AI Assessment</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: AI Review & Citizen Overrides */}
      {step === 2 && (
        <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t("report.step2")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review Gemini AI classification. You have full control to edit anything.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
              {aiSource === "GEMINI" ? "Gemini AI Verified" : "Rule-based Classifier"}
            </span>
          </div>

          {aiReasoning && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <Bot className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
              <div>
                <strong>AI Assessment Reasoning:</strong> {aiReasoning}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="report-title" className="block text-sm font-semibold mb-1">
                {t("report.title")}
              </label>
              <input
                id="report-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="report-desc" className="block text-sm font-semibold mb-1">
                {t("report.description")}
              </label>
              <textarea
                id="report-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="report-cat" className="block text-sm font-semibold mb-1">
                  {t("report.category")}
                </label>
                <select
                  id="report-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
                >
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="report-pri" className="block text-sm font-semibold mb-1">
                  {t("report.priority")}
                </label>
                <select
                  id="report-pri"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
                >
                  {COMPLAINT_PRIORITIES.map((pri) => (
                    <option key={pri} value={pri}>
                      {pri}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-touch px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="min-h-touch px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm flex items-center gap-2"
            >
              <span>Next: Set Location</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Location Map Pin */}
      {step === 3 && (
        <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t("report.step3")}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Specify the street location in Coimbatore for accurate municipal crew dispatch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={geo.getCurrentLocation}
              disabled={geo.loading}
              className="min-h-touch px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-primary-600" />
              <span>{geo.loading ? "Detecting GPS..." : t("report.detectLocation")}</span>
            </button>

            <button
              type="button"
              onClick={geo.setDefaultCoimbatore}
              className="min-h-touch px-3 py-2 text-xs font-medium text-slate-500 hover:underline"
            >
              Reset to Coimbatore City Center
            </button>
          </div>

          {/* Simple Coordinates Display & Address input */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3">
            <div className="flex items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-300">
              <span>
                Latitude: <strong>{geo.lat.toFixed(5)}</strong>
              </span>
              <span>
                Longitude: <strong>{geo.lng.toFixed(5)}</strong>
              </span>
            </div>

            <div>
              <label htmlFor="report-address" className="block text-sm font-semibold mb-1">
                Street / Area Landmark Address
              </label>
              <input
                id="report-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("report.addressPlaceholder")}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-touch px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={proceedToDuplicateCheck}
              disabled={checkingDuplicates}
              className="min-h-touch px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2"
            >
              {checkingDuplicates ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning 100m for duplicates...</span>
                </>
              ) : (
                <>
                  <span>Next: Check Duplicates</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Duplicate Check & Final Submit */}
      {step === 4 && (
        <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t("report.step4")}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Checking for open complaints of the same category within 100 meters.
            </p>
          </div>

          {duplicates.length > 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {t("report.duplicateAlert")} ({duplicates.length} found)
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                    {t("report.duplicateExplain")}
                  </p>
                </div>
              </div>

              {/* Duplicate List */}
              <div className="space-y-3 mt-3">
                {duplicates.map((dup) => (
                  <div
                    key={dup.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <span className="text-xs font-mono font-bold text-primary-600">
                        {dup.trackingCode}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {dup.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        ~{dup.distanceMeters}m away • {dup.supportCount} citizen supports
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSupportExisting(dup.id, dup.trackingCode)}
                      className="min-h-touch px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Users className="w-4 h-4" />
                      <span>{t("report.supportExisting")} (+2 Score Boost)</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                No duplicates detected within 100 meters. Your complaint will be registered fresh!
              </span>
            </div>
          )}

          {/* Anonymous checkbox */}
          <div className="flex items-center gap-3 pt-2">
            <input
              id="report-anon"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="report-anon" className="text-sm text-slate-700 dark:text-slate-300">
              {t("report.anonymous")}
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="min-h-touch px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="min-h-touch px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("report.submitting")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {duplicates.length > 0 ? t("report.proceedAnyway") : t("report.submit")}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
