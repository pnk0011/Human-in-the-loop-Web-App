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
  CheckCircle2,
  Download,
  X,
} from "lucide-react";
import { LoadingSpinner } from "./LoadingComponents";
import { useLoading } from "../hooks/useLoading";
import { PDFViewer } from "./PDFViewer";
import { documentOperationsAPI } from "../services/documentOperationsAPI";

interface ExtractedField {
  id: string;
  sourceId?: number | string;
  rowId?: number;
  fieldName: string;
  fieldDescription: string;
  extractedValue: string;
  confidence: number;
  pageNo?: string | number | null;
  expectedFormat?: string;
  reviewerComment?: string;
  qcComment?: string;
  corrected?: boolean;
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const FIELD_PRIORITY_MAP: Record<string, Record<string, number>> = {
  account: {
    profit_status: 1,
    primary_excess_both: 2,
    expiration_date: 2,
    pharmacy: 3,
    child_daycare_count: 3,
    adult_daycare_count: 3,
    ebl_employees: 3,
    stop_gap_liability: 3,
    hired_nonowned_auto: 3,
    swimming_pool: 3,
    saunas_hot_tubs: 3,
    exercise_weight_rooms: 3,
    indoor_parking: 3,
    community_center: 3,
    restaurants: 3,
    medical_equipment_rental: 3,
    beauty_shops: 3,
    vacant_buildings: 3,
    vacant_land: 3,
    dwellings: 3,
    storage_garages: 3,
    chapels: 3,
    offices_sq_ft: 3,
    underlying_auto_limit: 3,
    underlying_auto_premium: 3,
    underlying_employer_liability_limit: 3,
    underlying_wc_premium: 3,
    fein_number: 3,
    courts: 3,
  },
  loss: {
    evaluation_date: 1,
    claimant_name: 1,
    claim_no: 1,
    type: 1,
    status: 1,
    loss_date: 1,
    report_date: 1,
    loss_paid: 1,
    loss_reserve: 1,
    alae_paid: 1,
    alae_reserve: 1,
    carrier_name: 1,
    facility: 1,
    state: 1,
    loss_comments: 1,
    close_date: 2,
  },
  exposure: {
    location_name: 1,
    license_number: 1,
    address: 1,
    state: 1,
    county: 1,
    pl_policy_type: 1,
    gl_policy_type: 1,
    pl_retro_date: 1,
    gl_retro_date: 1,
    facility_open_date: 1,
    primary_pl_limit: 1,
    primary_gl_limit: 1,
    excess_gl_limit: 1,
    excess_pl_limit: 1,
    deductible: 1,
    defense_cost_treatment: 1,
    sub_acute: 1,
    skilled: 1,
    intermediate_care: 1,
    assisted_living: 1,
    memory_care: 1,
    independent_living: 1,
    home_health: 1,
    rehab: 1,
    formerly_known_as: 2,
    dba_name: 2,
    cover_age_range: 3,
    '1st_shift_rn_count': 3,
    '1st_shift_lpn_lvn_count': 3,
    '1st_shift_cna_personal_caregiver_count': 3,
    '1st_shift_agency_count': 3,
    '1st_shift_pool_count': 3,
    '2nd_shift_rn_count': 3,
    '2nd_shift_lpn_lvn_count': 3,
    '2nd_shift_cna_personal_caregiver_count': 3,
    '2nd_shift_agency_count': 3,
    '2nd_shift_pool_count': 3,
    '3rd_shift_rn_count': 3,
    '3rd_shift_lpn_lvn_count': 3,
    '3rd_shift_cna_personal_caregiver_count': 3,
    '3rd_shift_agency_count': 3,
    '3rd_shift_pool_count': 3,
    turnover_pct_rn: 3,
    turnover_pct_lpn: 3,
    turnover_cna_personal_caregiver: 3,
  },
};

const toSnakeCase = (value: string) => value.toLowerCase().replace(/\s+/g, '_');

const getFieldPriority = (tabKey: string | undefined, fieldName: string): number => {
  const priorities = FIELD_PRIORITY_MAP[tabKey ?? ''] || FIELD_PRIORITY_MAP.account;
  const snake = toSnakeCase(fieldName);
  return priorities[snake] ?? 3;
};

interface DocumentAttachment {
  doc_handle: string;
  presigned_url: string;
  status?: string | number;
  tabbedFields: {
    key: string;
    label: string;
    fields: ExtractedField[];
    variants?: ExtractedField[][];
    variantMeta?: { qc_status?: string | null; qc_comments?: string | null; qc_comment?: string | null; reviewer_status?: string | null; reviewer_comments?: string | null }[];
  }[];
}

interface QCValidationDocument {
  id: string;
  documentName: string;
  documentType: string;
  priority: "High" | "Medium" | "Low";
  status?: string | number;
  fields: ExtractedField[];
  tabbedFields?: { key: string; label: string; fields: ExtractedField[]; variants?: ExtractedField[][]; variantMeta?: { qc_status?: string | null; qc_comments?: string | null; qc_comment?: string | null; reviewer_status?: string | null; reviewer_comments?: string | null }[] }[];
  documentImage?: string;
  attachments?: DocumentAttachment[];
}

interface FieldValidation {
  fieldId: string;
  action: "accept" | "correct" | "reject" | null;
  correctedValue?: string;
  note?: string;
  rejectReason?: string;
}

interface QCValidationScreenProps {
  document: QCValidationDocument;
  queueCount: number;
  onBack: () => void;
  onSubmit: (validations: FieldValidation[]) => Promise<void>;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export function QCValidationScreen({
  document,
  queueCount,
  onBack,
  onSubmit,
  onLogout,
  theme,
  onToggleTheme,
}: QCValidationScreenProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // State for current attachment
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);
  const [variantNotes, setVariantNotes] = useState<Record<string, string>>({});
  const [datasetDecisions, setDatasetDecisions] = useState<Record<string, 'approve' | 'reject' | null>>({});
  const [isSavingDataset, setIsSavingDataset] = useState(false);
  
  // Get current attachment data
  const currentAttachment = document.attachments && document.attachments.length > 0
    ? document.attachments[selectedAttachmentIndex]
    : null;
  
  const [tabVariantIndex, setTabVariantIndex] = useState<Record<string, number>>({});

  const baseTabs = currentAttachment
    ? currentAttachment.tabbedFields
    : document.tabbedFields && document.tabbedFields.length > 0
    ? document.tabbedFields
    : [{ key: 'default', label: 'Fields', fields: document.fields }];

  // Hide tabs with no data (no fields and no variant with fields)
  const tabbedFields = baseTabs.filter((t) => {
    const variants = t.variants || [];
    const hasVariantData = variants.some((v) => v && v.length > 0);
    const hasFields = t.fields && t.fields.length > 0;
    return hasVariantData || hasFields;
  });

  const effectiveTabs = tabbedFields.length > 0 ? tabbedFields : baseTabs;
  
  const allFields = React.useMemo(() => {
    return effectiveTabs.flatMap((t) => {
      const variantIdx = tabVariantIndex[t.key] ?? 0;
      const variant = t.variants?.[variantIdx];
      return variant && variant.length ? variant : t.fields;
    });
  }, [effectiveTabs, tabVariantIndex]);

  const [activeTab, setActiveTab] = useState(effectiveTabs[0]?.key || 'default');
  const [selectedFieldId, setSelectedFieldId] = useState<string>(allFields[0]?.id || "");
  const [validatedToday] = useState(47);
  const [avgTime] = useState("0:32");
  const [accuracy] = useState(94);

  const currentTab = effectiveTabs.find((t) => t.key === activeTab) || effectiveTabs[0];
  const currentVariantIndex = tabVariantIndex[currentTab.key] ?? 0;
  const currentVariantKey = `${currentTab.key}-${currentVariantIndex}`;
  const currentVariantMeta = currentTab?.variantMeta?.[currentVariantIndex];
  const normalizedQcStatus = currentVariantMeta?.qc_status?.toString().toLowerCase();
  const isVariantFinalized =
    normalizedQcStatus === 'approved' || normalizedQcStatus === 'declined';
  const docStatus = String(
    (document.attachments?.[selectedAttachmentIndex] as any)?.status ??
    (document as any)?.status ??
    '',
  );
  const isDocNotOpen = docStatus !== '3';
  const isAutoApproved =
    currentVariantMeta?.qc_status === 'AutoApproved' &&
    currentVariantMeta?.reviewer_status === 'AutoApproved';
  const rawCurrentFields = currentTab?.variants?.[currentVariantIndex]?.length
    ? currentTab.variants[currentVariantIndex]
    : currentTab?.fields || [];
  
  // Sort fields by ascending confidence (ties by field name)
  const currentFields = React.useMemo(() => {
    return [...rawCurrentFields].sort((a, b) => {
      if (a.confidence !== b.confidence) return a.confidence - b.confidence;
      return a.fieldName.localeCompare(b.fieldName);
    });
  }, [rawCurrentFields]);

  // Track validation state for each field
  const [fieldValidations, setFieldValidations] = useState<Record<string, FieldValidation>>(
    Object.fromEntries(
      allFields.map((field) => [
        field.id,
        { fieldId: field.id, action: null },
      ]),
    ),
  );

  const selectedField = allFields.find((f) => f.id === selectedFieldId);
  const currentValidation = fieldValidations[selectedFieldId] || { fieldId: selectedFieldId, action: null };
  
  // Loading states
  const { loading: validationLoading, withLoading } = useLoading({ delay: 200 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update fieldValidations when allFields changes (e.g., when switching attachments)
  useEffect(() => {
    setFieldValidations((prev) => {
      const newValidations = { ...prev };
      allFields.forEach((field) => {
        if (!newValidations[field.id]) {
          newValidations[field.id] = { fieldId: field.id, action: null };
        }
      });
      return newValidations;
    });
  }, [allFields]);

  // Update activeTab and selectedFieldId when attachment changes
  useEffect(() => {
    if (effectiveTabs.length > 0) {
      const tabExists = effectiveTabs.find(t => t.key === activeTab);
      if (!tabExists) {
        setActiveTab(effectiveTabs[0].key);
      }
    }
  }, [selectedAttachmentIndex]);

  useEffect(() => {
    if (allFields.length > 0) {
      const fieldExists = allFields.find(f => f.id === selectedFieldId);
      if (!fieldExists) {
        setSelectedFieldId(allFields[0].id);
      }
    }
  }, [selectedAttachmentIndex, allFields]);

  // Reset datasetDecisions and variantNotes when switching attachments
  useEffect(() => {
    setDatasetDecisions({});
    setVariantNotes({});
  }, [selectedAttachmentIndex]);

  // Sync QC metadata (status/comments) from API response into UI
  useEffect(() => {
    if (!currentVariantMeta) return;

    const hasFinalStatus =
      currentVariantMeta.qc_status &&
      ['approved', 'declined'].includes(currentVariantMeta.qc_status.toString().toLowerCase());

    setDatasetDecisions((prev) => {
      const existing = prev[currentVariantKey];
      if (existing || !hasFinalStatus) return prev;
      return {
        ...prev,
        [currentVariantKey]:
          currentVariantMeta.qc_status?.toString().toLowerCase() === 'approved'
            ? 'approve'
            : 'reject',
      };
    });

    setVariantNotes((prev) => {
      const existing = prev[currentVariantKey];
      const incoming = currentVariantMeta.qc_comments ?? currentVariantMeta.qc_comment;
      if (existing || !incoming) return prev;
      return {
        ...prev,
        [currentVariantKey]: String(incoming),
      };
    });
  }, [currentVariantKey, currentVariantMeta]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = currentFields.findIndex((f) => f.id === selectedFieldId);
        if (e.key === "ArrowDown" && currentIndex < currentFields.length - 1) {
          setSelectedFieldId(currentFields[currentIndex + 1].id);
        } else if (e.key === "ArrowUp" && currentIndex > 0) {
          setSelectedFieldId(currentFields[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedFieldId, currentFields]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 400));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleDownloadDocument = () => {
    const imageUrl = currentAttachment ? currentAttachment.presigned_url : document.documentImage;
    if (imageUrl) {
      const link = window.document.createElement('a');
      link.href = imageUrl;
      link.download = document.documentName || 'document';
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleAttachmentChange = (index: number) => {
    setSelectedAttachmentIndex(index);
    setDatasetDecisions({});
    setVariantNotes({});
    const newAttachment = document.attachments?.[index];
    if (newAttachment) {
      const newTabbedFields = newAttachment.tabbedFields.filter((t) => t.fields && t.fields.length > 0);
      if (newTabbedFields.length > 0) {
        setActiveTab(newTabbedFields[0].key);
        const firstFields = newTabbedFields[0].fields;
        if (firstFields.length > 0) {
          setSelectedFieldId(firstFields[0].id);
        }
      }
    }
  };

  const handleDatasetDecision = (decision: 'approve' | 'reject') => {
    if (isDocNotOpen) return;
    setDatasetDecisions((prev) => ({
      ...prev,
      [currentVariantKey]: decision,
    }));
  };

  const handleSaveDataset = async () => {
    const currentKey = currentVariantKey;
    if (isDocNotOpen) {
      return;
    }
    const decision = datasetDecisions[currentKey];
    
    if (!decision) {
      alert("Please select Approve or Reject for this data set.");
      return;
    }

    const tableMap: Record<string, string> = {
      loss: "subdata.hil_loss_extraction",
      exposure: "subdata.hil_exposure_extraction",
      account: "subdata.hil_account_extraction",
      default: "subdata.hil_account_extraction",
    };

    const tableName = tableMap[currentTab.key] || tableMap.default;
    setIsSavingDataset(true);
    try {
      const dataPayload: Record<string, any> = {
        qc_status: decision === 'approve' ? 'Approved' : 'Declined',
        qc_comments: variantNotes[currentKey] || "",
      };

      // Get the row ID from the first field in the current dataset
      const targetId = currentFields[0]?.sourceId || currentFields[0]?.rowId || currentFields[0]?.id || currentKey;

      await documentOperationsAPI.qcUpdatePolicyDocuments({
        table_name: tableName,
        action: decision === 'approve' ? 'Approved' : 'Declined',
        id: targetId,
        data: dataPayload,
      });
      alert(`Data set ${decision === 'approve' ? 'approved' : 'rejected'} successfully.`);
      setDatasetDecisions((prev) => ({ ...prev, [currentKey]: null }));
      setVariantNotes((prev) => ({ ...prev, [currentKey]: '' }));
    } catch (error: any) {
      alert(error?.message || "Failed to save data set.");
    } finally {
      setIsSavingDataset(false);
    }
  };

  const handleSubmitAll = async () => {
    const validations = Object.values(fieldValidations);
    setIsSubmitting(true);
    try {
      await onSubmit(validations as FieldValidation[]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return "bg-[#FFC018]";
    if (confidence >= 50) return "bg-[#FFC018]";
    return "bg-[#FF0081]";
  };

  const getFieldStatusIcon = (fieldId: string) => {
    const validation = fieldValidations[fieldId];
    if (!validation || !validation.action) return null;
    return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  };

  if (!selectedField) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex flex-col">
      <ValidationHeader 
        onBack={onBack}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        title="QC Validation Portal"
        subtitle={document.documentType}
      />

      <div className="flex-1 min-h-0 flex flex-row gap-4 p-4 overflow-hidden">
        {/* Document Viewer */}
        <div
          className={`${
            isFullscreen
              ? "fixed inset-0 z-50 p-2 bg-[#F5F7FA] dark:bg-[#1a1a1a]"
              : "min-h-0 flex-none"
          }`}
          style={
            isFullscreen
              ? undefined
              : { width: "calc(100% - 380px)" }
          }
        >
          <div className="bg-[#E5E7EB] dark:bg-[#2a2a2a] rounded-lg h-full flex flex-col min-h-0">
            {/* Document Display */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-1 min-h-0">
              <div
                className="bg-white shadow-lg relative"
                style={{
                  transform: document.documentImage && (document.documentImage.includes('.csv') || (document.documentName && document.documentName.includes('.csv'))) 
                    ? 'none' 
                    : `scale(${zoom / 100})`,
                  transformOrigin: "center",
                  transition: "transform 0.2s",
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  overflow: document.documentImage && (document.documentImage.includes('.csv') || (document.documentName && document.documentName.includes('.csv'))) 
                    ? 'hidden' 
                    : 'auto',
                }}
              >
                {(() => {
                  const documentUrl = currentAttachment ? currentAttachment.presigned_url : document.documentImage;
                  return documentUrl ? (
                    <div className="relative w-full h-full" style={{ maxWidth: '100%', overflow: 'hidden', height: '100%' }}>
                      {documentUrl.includes('.pdf') || 
                       documentUrl.includes('.doc') || 
                       documentUrl.includes('.docx') ||
                       documentUrl.includes('.xls') ||
                       documentUrl.includes('.xlsx') ||
                       documentUrl.includes('.msg') ||
                       documentUrl.includes('.csv') ||
                       (document.documentName && (
                         document.documentName.includes('.pdf') ||
                         document.documentName.includes('.doc') ||
                         document.documentName.includes('.docx') ||
                         document.documentName.includes('.xls') ||
                         document.documentName.includes('.xlsx') ||
                         document.documentName.includes('.msg') ||
                         document.documentName.includes('.csv')
                       )) ? (
                        <PDFViewer 
                          url={documentUrl}
                          fileName={document.documentName}
                          className="h-full w-full"
                        />
                      ) : (
                        <img
                          src={documentUrl}
                          alt={document.documentName}
                          className="max-w-full h-auto border border-gray-300 dark:border-gray-600 rounded"
                          style={{ maxHeight: '80vh' }}
                          crossOrigin="anonymous"
                          onError={(e) => {
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
                          Unable to load the document from the provided URL.
                        </p>
                        <Button
                          onClick={handleDownloadDocument}
                          className="bg-[#0292DC] hover:bg-[#012F66] text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Document
                        </Button>
                      </div>

                    </div>
                  ) : (
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
                        No document URL was provided by the API.
                      </p>
                    </div>
                  );
                })()}
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
        <div className="w-[360px] flex-shrink-0 h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1" style={{ width: '360px' }}>
            {/* Attachments List */}
            {document.attachments && document.attachments.length > 1 && (
              <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-4 border-[#E5E7EB] dark:border-[#3a3a3a]">
                <h4 className="text-[#012F66] dark:text-white mb-3 font-semibold">
                  Documents ({document.attachments.length})
                </h4>
                <div className="space-y-2">
                  {document.attachments.map((attachment, index) => (
                    <div
                      key={attachment.doc_handle}
                      onClick={() => handleAttachmentChange(index)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAttachmentIndex === index
                          ? "border-[#0292DC] bg-[#0292DC]/5"
                          : "border-[#E5E7EB] hover:border-[#0292DC] bg-white dark:bg-[#1a1a1a]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[#012F66] dark:text-white font-medium">
                              Document #{index + 1}
                            </span>
                          </div>
                          <div className="text-xs text-[#80989A] dark:text-[#a0a0a0] mt-1">
                            {attachment.doc_handle}
                          </div>
                        </div>
                        {selectedAttachmentIndex === index && (
                          <div className="flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-[#0292DC]" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fields List */}
            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-4 border-[#E5E7EB] dark:border-[#3a3a3a]" style={{ maxHeight: '450px', overflow: 'scroll' }}>
              {tabbedFields.length > 1 && (
                <div className="flex items-center gap-2 mb-3">
                  {tabbedFields.map((tab) => (
                    <Button
                      key={tab.key}
                      variant={activeTab === tab.key ? "default" : "outline"}
                      size="sm"
                      className={activeTab === tab.key ? "bg-[#0292DC] text-white" : "border-[#D0D5DD] dark:border-[#3a3a3a] text-[#012F66] dark:text-white"}
                      onClick={() => {
                        setActiveTab(tab.key);
                        const variantIdx = tabVariantIndex[tab.key] ?? 0;
                        const nextFields = (tab.variants?.[variantIdx] && tab.variants[variantIdx].length > 0)
                          ? tab.variants[variantIdx]
                          : tab.fields;
                        if (nextFields.length > 0) {
                          setSelectedFieldId(nextFields[0].id);
                        }
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Variant selector for current tab if multiple variants */}
              {currentTab?.variants && currentTab.variants.length > 1 && (
                <div className="mb-3">
                  <Select
                    value={String(currentVariantIndex)}
                    onValueChange={(val) => {
                      const idx = Number(val);
                      setTabVariantIndex((prev) => ({ ...prev, [currentTab.key]: idx }));
                      const variantFields = currentTab.variants?.[idx] || [];
                      if (variantFields.length > 0) {
                        setSelectedFieldId(variantFields[0].id);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full border-[#D0D5DD] dark:border-[#3a3a3a]">
                      <SelectValue placeholder="Select data set" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentTab.variants.map((_, idx) => {
                        const meta = currentTab.variantMeta?.[idx];
                        const isAutoApproved =
                          meta?.qc_status === 'AutoApproved' &&
                          meta?.reviewer_status === 'AutoApproved';
                        return (
                          <SelectItem key={`${currentTab.key}-${idx}`} value={String(idx)}>
                            <span className="flex items-center gap-2">
                              <span>{currentTab.label} Set #{idx + 1}</span>
                              {isAutoApproved && (
                                <span className="text-[11px] px-2 py-0.5 rounded bg-[#0292DC] text-white font-semibold">
                                  Auto Approved
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dataset Decision */}
              {currentTab && (
                <div className="mb-3 space-y-2">
                  {(currentVariantMeta?.qc_status || currentVariantMeta?.qc_comments || currentVariantMeta?.qc_comment) && (
                    <div className="p-3 rounded-lg border border-[#D0D5DD] dark:border-[#3a3a3a] bg-[#f8fafc] dark:bg-[#232323]">
                      {currentVariantMeta?.qc_status && (
                        <div className="flex items-center justify-between text-sm text-[#012F66] dark:text-white font-semibold">
                          <span>Existing QC Status</span>
                          <Badge className="bg-[#0292DC] text-white">
                            {currentVariantMeta.qc_status}
                          </Badge>
                        </div>
                      )}
                      {(currentVariantMeta?.qc_comments || currentVariantMeta?.qc_comment) && (
                        <div className="mt-2 text-sm text-[#012F66] dark:text-white">
                          <p className="font-medium">QC Comment</p>
                          <p className="text-[#475467] dark:text-[#cfcfcf]">
                            {String(currentVariantMeta.qc_comments || currentVariantMeta.qc_comment || '')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <label className="text-[#012F66] dark:text-white font-semibold">QC Decision</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handleDatasetDecision('approve')}
                      disabled={isDocNotOpen || isAutoApproved}
                      className={`flex-1 ${
                        datasetDecisions[currentVariantKey] === 'approve'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-white hover:bg-green-50 text-green-600 border-2 border-green-600 dark:bg-[#2a2a2a] dark:text-green-500'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {datasetDecisions[currentVariantKey] === 'approve' && (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDatasetDecision('reject')}
                      disabled={isDocNotOpen || isAutoApproved}
                      className={`flex-1 ${
                        datasetDecisions[currentVariantKey] === 'reject'
                          ? 'bg-[#0292DC] hover:bg-[#007bb6] text-white border-2 border-[#0292DC]'
                          : 'bg-white hover:bg-[#0292DC]/10 text-[#0292DC] border-2 border-[#0292DC] dark:bg-[#2a2a2a] dark:text-[#61c6ff] dark:border-[#61c6ff] dark:hover:bg-[#61c6ff26]'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {datasetDecisions[currentVariantKey] === 'reject' && (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Notes per data set */}
              {currentTab && (
                <div className="mb-3 space-y-2">
                  <label className="text-[#012F66] dark:text-white">QC Notes (Optional)</label>
                  <Textarea
                    value={variantNotes[currentVariantKey] || ''}
                    disabled={isDocNotOpen}
                    onChange={(e) =>
                      setVariantNotes((prev) => ({
                        ...prev,
                        [currentVariantKey]: e.target.value,
                      }))
                    }
                    placeholder="Add QC notes for this data set..."
                    rows={3}
                    className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:bg-[#3a3a3a] dark:text-white resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              <ScrollArea className="h-[260px]">
                <div className="space-y-2 pr-4">
                  {currentFields.map((field, index) => (
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
                            {(activeTab === 'account' || activeTab === 'loss' || activeTab === 'exposure') && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#FFFFFF',
                                  backgroundColor: getFieldPriority(activeTab, field.fieldName) === 1
                                    ? '#DC2626'
                                    : getFieldPriority(activeTab, field.fieldName) === 2
                                    ? '#F59E0B'
                                    : '#6B7280',
                                  border: `2px solid ${
                                    getFieldPriority(activeTab, field.fieldName) === 1
                                      ? '#991B1B'
                                      : getFieldPriority(activeTab, field.fieldName) === 2
                                      ? '#B45309'
                                      : '#374151'
                                  }`,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                }}
                              >
                                P{getFieldPriority(activeTab, field.fieldName)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge
                              className={`${
                                field.confidence >= 90
                                  ? "bg-[#FFC018]"
                                  : "bg-[#FF0081]"
                              } text-white`}
                            >
                              {field.confidence}%
                            </Badge>
                            <span className="text-[#80989A]">
                              {String(field.extractedValue ?? '') || '—'}
                            </span>
                            {field.corrected && (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-600 text-white">
                                Corrected
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-[#80989A]">
                            <span>Page: {field.pageNo != null ? String(field.pageNo) : '—'}</span>
                            <span className="mx-1">|</span>
                            <span>Confidence: {field.confidence}%</span>
                          </div>
                          {field.reviewerComment && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">Reviewer Note:</p>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{String(field.reviewerComment)}</p>
                            </div>
                          )}
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

            {/* Reviewer Comment (if available) */}
            {selectedField.reviewerComment && (
              <div className="bg-[#FFC018]/10 border border-[#FFC018] rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#FFC018] mt-1.5" />
                  <span className="text-[#80989A] dark:text-[#a0a0a0] font-medium">
                    Reviewer Feedback
                  </span>
                </div>
                <p className="text-[#012F66] dark:text-white pl-4">
                  {String(selectedField.reviewerComment)}
                </p>
              </div>
            )}

          </div>

          {/* Submit QC Decision Button */}
          <Button
            onClick={handleSaveDataset}
            disabled={isSavingDataset || !datasetDecisions[currentVariantKey] || isDocNotOpen}
            className="mt-4 w-full bg-[#0292DC] hover:bg-[#012F66] text-white flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingDataset ? (
              <LoadingSpinner size="sm" text="Submitting..." />
            ) : (
              "Submit QC Decision"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
