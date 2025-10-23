import React, { useState, useEffect } from "react";
import { ValidationHeader } from "./AppHeader";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit3,
  X,
  ArrowLeft,
  CheckCircle2,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import logo from "figma:asset/d37108ff06015dcbcdb272cec41a1cfc0b3b3dfd.png";
import { LoadingSpinner, LoadingOverlay } from "./LoadingComponents";
import { useLoading } from "../hooks/useLoading";
import { PDFViewer } from "./PDFViewer";

interface ExtractedField {
  id: string;
  fieldName: string;
  fieldDescription: string;
  extractedValue: string;
  confidence: number;
  expectedFormat?: string;
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ValidationDocument {
  id: string;
  documentName: string;
  documentType: string;
  priority: "High" | "Medium" | "Low";
  fields: ExtractedField[];
  documentImage?: string; // URL to the document image
}

interface FieldValidation {
  fieldId: string;
  action: "accept" | "correct" | "reject" | null;
  correctedValue?: string;
  note?: string;
  rejectReason?: string;
}

interface ValidationScreenProps {
  document: ValidationDocument;
  queueCount: number;
  onBack: () => void;
  onSubmit: (validations: FieldValidation[]) => Promise<void>;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  isReadOnly?: boolean;
}

export function ValidationScreen({
  document,
  queueCount,
  onBack,
  onSubmit,
  onLogout,
  theme,
  onToggleTheme,
  isReadOnly = false,
}: ValidationScreenProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] =
    useState<string>(document.fields[0]?.id || "");
  const [validatedToday] = useState(47);
  const [avgTime] = useState("0:32");
  const [accuracy] = useState(94);
  
  // Loading states
  const { loading: validationLoading, withLoading } = useLoading({ delay: 200 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track validation state for each field
  const [fieldValidations, setFieldValidations] = useState<
    Record<string, FieldValidation>
  >(
    Object.fromEntries(
      document.fields.map((field) => [
        field.id,
        { fieldId: field.id, action: null },
      ]),
    ),
  );

  const selectedField = document.fields.find(
    (f) => f.id === selectedFieldId,
  );
  const currentValidation = fieldValidations[selectedFieldId];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "a") {
          e.preventDefault();
          handleActionChange("accept");
        } else if (e.key === "c") {
          e.preventDefault();
          handleActionChange("correct");
        } else if (e.key === "r") {
          e.preventDefault();
          handleActionChange("reject");
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleSubmitAll();
        }
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = document.fields.findIndex(
          (f) => f.id === selectedFieldId,
        );
        if (
          e.key === "ArrowDown" &&
          currentIndex < document.fields.length - 1
        ) {
          setSelectedFieldId(
            document.fields[currentIndex + 1].id,
          );
        } else if (e.key === "ArrowUp" && currentIndex > 0) {
          setSelectedFieldId(
            document.fields[currentIndex - 1].id,
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () =>
      window.removeEventListener("keydown", handleKeyPress);
  }, [selectedFieldId, fieldValidations, document.fields]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 400));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleActionChange = (
    action: "accept" | "correct" | "reject",
  ) => {
    setFieldValidations((prev) => ({
      ...prev,
      [selectedFieldId]: {
        ...prev[selectedFieldId],
        action,
      },
    }));
  };

  const handleCorrectedValueChange = (value: string) => {
    setFieldValidations((prev) => ({
      ...prev,
      [selectedFieldId]: {
        ...prev[selectedFieldId],
        correctedValue: value,
      },
    }));
  };

  const handleNoteChange = (note: string) => {
    setFieldValidations((prev) => ({
      ...prev,
      [selectedFieldId]: {
        ...prev[selectedFieldId],
        note,
      },
    }));
  };

  const handleRejectReasonChange = (reason: string) => {
    setFieldValidations((prev) => ({
      ...prev,
      [selectedFieldId]: {
        ...prev[selectedFieldId],
        rejectReason: reason,
      },
    }));
  };

  const handleSubmitAll = async () => {
    const validations = Object.values(fieldValidations);

    // Check if all fields have been validated
    const unvalidatedFields = validations.filter(
      (v) => !(v as FieldValidation).action,
    );
    if (unvalidatedFields.length > 0) {
      alert(
        `Please validate all fields. ${unvalidatedFields.length} field(s) remaining.`,
      );
      return;
    }

    // Validate corrections and rejections
    for (const validation of validations as FieldValidation[]) {
      if (
        validation.action === "correct" &&
        !validation.correctedValue
      ) {
        const field = document.fields.find(
          (f) => f.id === validation.fieldId,
        );
        alert(
          `Please enter the corrected value for "${field?.fieldName}"`,
        );
        return;
      }
      if (
        validation.action === "reject" &&
        !validation.rejectReason
      ) {
        const field = document.fields.find(
          (f) => f.id === validation.fieldId,
        );
        alert(
          `Please select a reason for rejecting "${field?.fieldName}"`,
        );
        return;
      }
    }

    // Set loading state and submit
    setIsSubmitting(true);
    try {
      await onSubmit(validations as FieldValidation[]);
    } finally {
      // Reset loading state after submission
      setIsSubmitting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return "bg-[#FFC018]";
    if (confidence >= 50) return "bg-[#FFC018]";
    return "bg-[#FF0081]";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) return "Good";
    if (confidence >= 50) return "Medium";
    return "Low";
  };

  const getValidatedFieldsCount = () => {
    return Object.values(fieldValidations).filter(
      (v) => (v as FieldValidation).action,
    ).length;
  };

  const getFieldStatusIcon = (fieldId: string) => {
    const validation = fieldValidations[fieldId];
    if (!validation.action) return null;

    if (validation.action === "accept") {
      return (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      );
    } else if (validation.action === "correct") {
      return <Edit3 className="w-4 h-4 text-[#FFC018]" />;
    } else if (validation.action === "reject") {
      return <X className="w-4 h-4 text-[#FF0081]" />;
    }
  };

  if (!selectedField) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex flex-col">
      <ValidationHeader 
        onBack={onBack}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        title="Validation Portal"
        subtitle={document.documentType}
      />

      <div className="flex-1 flex gap-6 p-6">
        {/* Document Viewer */}
        <div
          className={`${isFullscreen ? "fixed inset-0 z-50 p-6 bg-[#F5F7FA] dark:bg-[#1a1a1a]" : "flex-1"}`}
        >
          <div className="bg-[#E5E7EB] dark:bg-[#2a2a2a] rounded-lg h-full flex flex-col">
            {/* Document Display */}
            <div className="flex-1 relative overflow-auto flex items-center justify-center p-8">
              <div
                className="bg-white shadow-lg relative"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center",
                  transition: "transform 0.2s",
                }}
              >
                {document.documentImage ? (
                  /* Real Document Image from API */
                  <div className="relative">
                    {/* Check if it's a PDF document */}
                    {document.documentImage.includes('.pdf') ? (
                      /* PDF Document - Use PDFViewer component with blob approach */
                      <PDFViewer 
                        url={document.documentImage}
                        fileName={document.documentName}
                        className="h-full"
                      />
                    ) : (
                      /* Image Document - Use img tag */
                      <img
                        src={document.documentImage}
                        alt={document.documentName}
                        className="max-w-full h-auto border border-gray-300 dark:border-gray-600 rounded"
                        style={{ maxHeight: '80vh' }}
                        crossOrigin="anonymous"
                        onLoad={() => {
                          console.log('Document image loaded successfully:', document.documentImage);
                        }}
                        onError={(e) => {
                          console.error('Failed to load document image:', document.documentImage);
                          console.error('Image error event:', e);
                          // Hide the image and show error message
                          e.currentTarget.style.display = 'none';
                          const errorElement = e.currentTarget.nextElementSibling;
                          if (errorElement) {
                            errorElement.classList.remove('hidden');
                          }
                        }}
                      />
                    )}
                    
                    {/* Error Message (hidden by default) */}
                    <div className="hidden flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                        Document Failed to Load
                      </h3>
                      <p className="text-red-600 dark:text-red-300 text-center mb-4 max-w-md">
                        Unable to load the document from the provided URL. This may be due to network issues, access restrictions, or CORS policy limitations.
                      </p>
                      <div className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-800 px-3 py-2 rounded font-mono break-all max-w-md">
                        {document.documentImage}
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Error Message when no image URL provided */
                  <div className="flex flex-col items-center justify-center p-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      No Document Available
                    </h3>
                    <p className="text-yellow-600 dark:text-yellow-300 text-center mb-4 max-w-md">
                      No document URL was provided by the API. The document may not have been processed yet or there may be an issue with the document processing.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Controls */}
            <div className="bg-white dark:bg-[#2a2a2a] border-t border-[#D0D5DD] dark:border-[#3a3a3a] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                  className="border-[#D0D5DD] dark:border-[#4a4a4a]"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-[#012F66] dark:text-white min-w-[60px] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 400}
                  className="border-[#D0D5DD] dark:border-[#4a4a4a]"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="border-[#D0D5DD] dark:border-[#4a4a4a]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-[#012F66] dark:text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(totalPages, p + 1),
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="border-[#D0D5DD] dark:border-[#4a4a4a]"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="mx-2 h-6 w-px bg-[#D0D5DD] dark:bg-[#4a4a4a]" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="border-[#D0D5DD] dark:border-[#4a4a4a]"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[450px] flex flex-col gap-4">
          {/* Fields List */}
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-4 border-[#E5E7EB] dark:border-[#3a3a3a]">
            <h3 className="text-[#012F66] dark:text-white mb-3">
              Fields to Validate ({document.fields.length})
            </h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {document.fields.map((field, index) => (
                  <div
                    key={field.id}
                    onClick={() => setSelectedFieldId(field.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedFieldId === field.id
                        ? "border-[#FF0081] bg-[#FF0081]/5"
                        : "border-[#E5E7EB] hover:border-[#0292DC] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#80989A]">
                            #{index + 1}
                          </span>
                          <span className="text-[#012F66]">
                            {field.fieldName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={`${
                              field.confidence >= 70
                                ? "bg-[#FFC018]"
                                : field.confidence >= 50
                                  ? "bg-[#FFC018]"
                                  : "bg-[#FF0081]"
                            } text-white`}
                          >
                            {field.confidence}%
                          </Badge>
                          <span className="text-[#80989A]">
                            {field.extractedValue}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getFieldStatusIcon(field.id)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Field Information */}
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
            <h3 className="text-[#012F66] dark:text-white mb-2">
              {selectedField.fieldName}
            </h3>
            <p className="text-[#80989A] dark:text-[#a0a0a0] mb-4">
              {selectedField.fieldDescription}
            </p>
            {selectedField.expectedFormat && (
              <p className="text-[#80989A] dark:text-[#a0a0a0]">
                Format: {selectedField.expectedFormat}
              </p>
            )}
          </div>

          {/* AI Extraction */}
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#0292DC]" />
              <span className="text-[#80989A] dark:text-[#a0a0a0]">
                AI Extraction
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#80989A] dark:text-[#a0a0a0]">
                  Confidence
                </span>
                <span className="text-[#012F66] dark:text-white">
                  {selectedField.confidence}%
                </span>
              </div>
              <div className="relative h-2 bg-[#E5E7EB] dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full ${getConfidenceColor(selectedField.confidence)} transition-all`}
                  style={{
                    width: `${selectedField.confidence}%`,
                  }}
                />
              </div>
              <span className="text-[#80989A] dark:text-[#a0a0a0] mt-1 block">
                {getConfidenceLabel(selectedField.confidence)}
              </span>
            </div>

            <div className="bg-[#F5F7FA] dark:bg-[#1a1a1a] p-4 rounded border border-[#D0D5DD] dark:border-[#3a3a3a]">
              <p className="text-[#012F66] dark:text-white">
                {selectedField.extractedValue}
              </p>
            </div>
          </div>

          {/* Validation Actions */}
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
            <h4 className="text-[#012F66] dark:text-white mb-4">
              Your Validation
            </h4>

            <div className="flex gap-2 mb-4">
              <Button
                variant={
                  currentValidation.action === "accept"
                    ? "default"
                    : "outline"
                }
                onClick={() => handleActionChange("accept")}
                className={
                  currentValidation.action === "accept"
                    ? "flex-1 bg-green-600 hover:bg-green-700 text-white"
                    : "flex-1 border-green-600 text-green-600 hover:bg-green-50"
                }
              >
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button
                variant={
                  currentValidation.action === "correct"
                    ? "default"
                    : "outline"
                }
                onClick={() => handleActionChange("correct")}
                className={
                  currentValidation.action === "correct"
                    ? "flex-1 bg-[#FFC018] hover:bg-[#FFC018]/90 text-white"
                    : "flex-1 border-[#FFC018] text-[#FFC018] hover:bg-[#FFC018]/10"
                }
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Correct
              </Button>
              <Button
                variant={
                  currentValidation.action === "reject"
                    ? "default"
                    : "outline"
                }
                onClick={() => handleActionChange("reject")}
                className={
                  currentValidation.action === "reject"
                    ? "flex-1 bg-[#FF0081] hover:bg-[#FF0081]/90 text-white"
                    : "flex-1 border-[#FF0081] text-[#FF0081] hover:bg-[#FF0081]/10"
                }
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>

            {/* Correction Input */}
            {currentValidation.action === "correct" && (
              <div className="mb-4 space-y-2">
                <label className="text-[#012F66] dark:text-white">
                  Corrected Value
                </label>
                <Input
                  value={currentValidation.correctedValue || ""}
                  onChange={(e) =>
                    handleCorrectedValueChange(e.target.value)
                  }
                  placeholder="Enter the correct value"
                  className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:bg-[#3a3a3a] dark:text-white"
                />
              </div>
            )}

            {/* Rejection Reason */}
            {currentValidation.action === "reject" && (
              <div className="mb-4 space-y-2">
                <label className="text-[#012F66] dark:text-white">
                  Rejection Reason
                </label>
                <Select
                  value={currentValidation.rejectReason || ""}
                  onValueChange={handleRejectReasonChange}
                >
                  <SelectTrigger className="bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unreadable">
                      Document Unreadable
                    </SelectItem>
                    <SelectItem value="missing">
                      Field Missing
                    </SelectItem>
                    <SelectItem value="incorrect_format">
                      Incorrect Format
                    </SelectItem>
                    <SelectItem value="duplicate">
                      Duplicate Entry
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[#012F66] dark:text-white">
                Notes (Optional)
              </label>
              <Textarea
                value={currentValidation.note || ""}
                onChange={(e) =>
                  handleNoteChange(e.target.value)
                }
                placeholder="Add any relevant notes about this field..."
                rows={3}
                className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:bg-[#3a3a3a] dark:text-white resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitAll}
            disabled={getValidatedFieldsCount() === 0 || isSubmitting}
            className="w-full bg-[#0292DC] hover:bg-[#012F66] text-white"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" text="Submitting..." />
            ) : (
              <>
                Submit All Validations ({getValidatedFieldsCount()}/
                {document.fields.length})
                <span className="ml-2 text-xs opacity-70">
                  (⌘Enter)
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}