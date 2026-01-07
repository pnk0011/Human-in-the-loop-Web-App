import React, { useState, useEffect, useCallback } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
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
  Plus,
  Trash,
  LogOut,
  Moon,
  Sun,
  Download,
} from "lucide-react";
import { LoadingSpinner, LoadingOverlay } from "./LoadingComponents";
import { useLoading } from "../hooks/useLoading";
import { PDFViewer } from "./PDFViewer";
import { documentOperationsAPI } from "../services/documentOperationsAPI";

interface ExtractedField {
  id: string;
  sourceId?: number | string;
  fieldName: string;
  fieldDescription: string;
  extractedValue: string;
  confidence: number;
  pageNo?: string | number | null;
  expectedFormat?: string;
  qcComment?: string; // QC comment from previous review
  corrected?: boolean;
  priority?: number; // Field priority (1, 2, or 3)
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Field priority mapping per tab
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

interface VariantMeta {
  qc_status?: string | null;
  qc_comments?: string | null;
  reviewer_status?: string | null;
  reviewer_comments?: string | null;
}

interface DocumentAttachment {
  doc_handle: string;
  presigned_url: string;
  readOnly?: boolean;
  status?: string | number;
  qc_status?: string | null;
  qc_comments?: string | null;
  qc_comment?: string | null;
  tabbedFields: { key: string; label: string; fields: ExtractedField[]; variants?: ExtractedField[][]; variantMeta?: VariantMeta[] }[];
}

interface ValidationDocument {
  id: string;
  documentName: string;
  documentType: string;
  priority: "High" | "Medium" | "Low";
  status?: string | number;
  fields: ExtractedField[];
  tabbedFields?: { key: string; label: string; fields: ExtractedField[]; variants?: ExtractedField[][]; variantMeta?: VariantMeta[] }[];
  documentImage?: string; // URL to the document image
  attachments?: DocumentAttachment[]; // Multiple documents for reviewer validation
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
  
  // State for current attachment
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);
  const [variantNotes, setVariantNotes] = useState<Record<string, string>>({});
  const [correctedValues, setCorrectedValues] = useState<Record<string, Record<string, string>>>({});
  const [isSavingDataset, setIsSavingDataset] = useState(false);
  const [isDeletingDataset, setIsDeletingDataset] = useState(false);
  const [isRefetchingDocument, setIsRefetchingDocument] = useState(false);
  const [fieldEdits, setFieldEdits] = useState<Record<string, { correctedValue: string; comments: string; status?: 'idle' | 'saving' | 'saved' | 'error'; error?: string }>>({});
  
  // Get current attachment data
  const currentAttachment = document.attachments && document.attachments.length > 0
    ? document.attachments[selectedAttachmentIndex]
    : null;
  const readOnlyMode = isReadOnly || currentAttachment?.readOnly;
  
  const [tabVariantIndex, setTabVariantIndex] = useState<Record<string, number>>({});
  const [deletedDatasets, setDeletedDatasets] = useState<Set<string>>(new Set());
  const [tabState, setTabState] = useState<Record<number, typeof document.tabbedFields>>({});
  const [newDatasetMeta, setNewDatasetMeta] = useState<Record<string, Record<string, any>>>({});

  const getVariantKey = (tabKey: string, idx: number, variant?: ExtractedField[]) => {
    const first = variant && variant[0];
    const idVal =
      (first as any)?.sourceId ??
      (first as any)?.rowId ??
      (first as any)?.id ??
      idx;
    return `${tabKey}-${idx}-${idVal}`;
  };

  // Initialize per-attachment tab state
  useEffect(() => {
    if (!document.attachments || document.attachments.length === 0) return;
    setTabState((prev) => {
      const next = { ...prev };
      document.attachments!.forEach((att, idx) => {
        if (!next[idx]) {
          next[idx] =
            (att.tabbedFields && att.tabbedFields.length > 0
              ? att.tabbedFields
              : document.tabbedFields && document.tabbedFields.length > 0
                ? document.tabbedFields
                : [{ key: 'default', label: 'Fields', fields: document.fields }]);
        }
      });
      return next;
    });
  }, [document.attachments, document.tabbedFields, document.fields]);

  const baseTabs = currentAttachment
    ? currentAttachment.tabbedFields
    : document.tabbedFields && document.tabbedFields.length > 0
    ? document.tabbedFields
    : [{ key: 'default', label: 'Fields', fields: document.fields }];

  const refetchCurrentDocument = useCallback(async () => {
    setIsRefetchingDocument(true);
    try {
      const resp = await documentOperationsAPI.reviewFile({
        first_named_insured: document.documentName || '',
      });
      if (resp?.documents && resp.documents.length > 0) {
        const nextTabState: Record<number, any> = {};

        const buildFieldsFromObject = (obj: Record<string, any>) => {
          const skipKeys = new Set([
            'document_id','document_name','doc_handle','doc_type_name','extraction_type','create_date_time','processed_flag',
            'input_s3_uri','document_s3_uri','first_named_insured','description','supplemental_description','id',
            'policy_number','effective_date',
            'qc_status','qc_comment','qc_comments','reviewer_status','reviewer_comment','reviewer_comments'
          ]);
          const fields: any[] = [];
          
          // Store metadata for later use when adding/saving new datasets
          const _rowMeta = {
            document_id: obj.document_id ?? null,
            document_name: obj.document_name ?? null,
            document_s3_uri: obj.document_s3_uri ?? obj.input_s3_uri ?? null,
            policy_number: obj.policy_number ?? null,
            effective_date: obj.effective_date ?? null,
            first_named_insured: obj.first_named_insured ?? null,
            description: obj.description ?? null,
            supplemental_description: obj.supplemental_description ?? null,
            doc_handle: obj.doc_handle ?? null,
            doc_type_name: obj.doc_type_name ?? null,
            extraction_type: obj.extraction_type ?? null,
            create_date_time: obj.create_date_time ?? null,
            processed_flag: obj.processed_flag ?? null,
          };
          
          Object.entries(obj || {}).forEach(([key, value]) => {
            if (skipKeys.has(key)) return;
            if (key.endsWith('_confidence') || key.endsWith('_page_no')) return;
            if (key.endsWith('_correction')) return;
            if (value === undefined) return;
            const confidence = obj[`${key}_confidence`];
            const pageNo = obj[`${key}_page_no`];
            fields.push({
              id: `${key}`,
              sourceId: obj.id ?? obj.ID ?? obj.Id ?? undefined,
              fieldName: key.replace(/_/g, ' '),
              fieldDescription: key.replace(/_/g, ' '),
              extractedValue: String(value ?? '').trim(),
              confidence: Math.round(Number(confidence) * 100) || 0,
              pageNo: pageNo ?? null,
              rowId: typeof obj.id === 'number' ? obj.id : Number(obj.id) || undefined,
              expectedFormat: '',
              location: { x: 0, y: 0, width: 0, height: 0 },
              corrected: String(obj[`${key}_correction`] ?? '').toLowerCase() === 'true',
            });
          });
          
          // Attach metadata to first field for later access
          if (fields.length > 0) {
            (fields[0] as any)._rowMeta = _rowMeta;
          }
          
          return fields;
        };

        resp.documents.forEach((docPayload: any, idx: number) => {
          const exposureData = docPayload.exposure_data || [];
          const accountData = docPayload.account_data || [];
          const lossData = docPayload.loss_data || [];
          const exposureVariants = exposureData.map((item: any) => buildFieldsFromObject(item || {}));
          const accountVariants = accountData.map((item: any) => buildFieldsFromObject(item || {}));
          const lossVariants = lossData.map((item: any) => buildFieldsFromObject(item || {}));

          const exposureVariantMeta = exposureData.map((item: any) => ({
            qc_status: item?.qc_status ?? null,
            qc_comments: item?.qc_comments ?? item?.qc_comment ?? null,
            reviewer_status: item?.reviewer_status ?? null,
            reviewer_comments: item?.reviewer_comments ?? item?.reviewer_comment ?? null,
          }));
          const accountVariantMeta = accountData.map((item: any) => ({
            qc_status: item?.qc_status ?? null,
            qc_comments: item?.qc_comments ?? item?.qc_comment ?? null,
            reviewer_status: item?.reviewer_status ?? null,
            reviewer_comments: item?.reviewer_comments ?? item?.reviewer_comment ?? null,
          }));
          const lossVariantMeta = lossData.map((item: any) => ({
            qc_status: item?.qc_status ?? null,
            qc_comments: item?.qc_comments ?? item?.qc_comment ?? null,
            reviewer_status: item?.reviewer_status ?? null,
            reviewer_comments: item?.reviewer_comments ?? item?.reviewer_comment ?? null,
          }));

          nextTabState[idx] = [
            { key: 'loss', label: 'Loss Data', fields: lossVariants[0] || [], variants: lossVariants, variantMeta: lossVariantMeta },
            { key: 'account', label: 'Account Data', fields: accountVariants[0] || [], variants: accountVariants, variantMeta: accountVariantMeta },
            { key: 'exposure', label: 'Exposure Data', fields: exposureVariants[0] || [], variants: exposureVariants, variantMeta: exposureVariantMeta },
          ];
        });

        setTabState(nextTabState);
        setDeletedDatasets(new Set());
        setTabVariantIndex({});
        setSelectedAttachmentIndex(0);
      }
    } catch (e) {
      console.error('Failed to refresh document after delete', e);
    } finally {
      setIsRefetchingDocument(false);
    }
  }, [document.documentName, baseTabs, setSelectedAttachmentIndex]);

  // Sort dataset variants by their underlying source/row/id so the dropdown is ordered asc
  const sortedTabs = React.useMemo(() => {
    const activeTabs =
      tabState[selectedAttachmentIndex] && tabState[selectedAttachmentIndex]?.length
        ? tabState[selectedAttachmentIndex]!
        : baseTabs;

    return (activeTabs || []).map((tab) => {
      if (!tab.variants || tab.variants.length === 0) return tab;

      const combined = tab.variants.map((variant, idx) => ({
        variant,
        meta: tab.variantMeta?.[idx],
        key: getVariantKey(tab.key, idx, variant),
      }));

      combined.sort((a, b) => {
        // Get numeric ID for sorting - newly created datasets (null sourceId) go to end
        const getNumericId = (variant: any) => {
          const first = variant?.[0];
          const sourceId = first?.sourceId;
          const rowId = first?.rowId;
          // If sourceId is null/undefined or not a number, check rowId
          if (sourceId != null && typeof sourceId === 'number') return sourceId;
          if (rowId != null && typeof rowId === 'number') return rowId;
          // For newly created datasets (null sourceId), put at end
          return Number.MAX_SAFE_INTEGER;
        };
        const aId = getNumericId(a.variant);
        const bId = getNumericId(b.variant);
        if (aId === bId) return 0;
        return aId > bId ? 1 : -1;
      });

      const filtered = combined.filter((c) => !deletedDatasets.has(c.key));

      return {
        ...tab,
        variants: filtered.map((c) => c.variant),
        variantMeta: tab.variantMeta ? filtered.map((c) => c.meta) : tab.variantMeta,
      };
    });
  }, [baseTabs, deletedDatasets, tabState, selectedAttachmentIndex]);

  // Hide tabs with no data (no fields and no variant with fields)
  const tabbedFields = sortedTabs.filter((t) => {
    const variants = t.variants || [];
    const hasVariantData = variants.some((v) => v && v.length > 0);
    const hasFields = t.fields && t.fields.length > 0;
    return hasVariantData || hasFields;
  });

  const effectiveTabs = tabbedFields.length > 0 ? tabbedFields : sortedTabs;
  
  const allFields = React.useMemo(() => {
    return effectiveTabs.flatMap((t) => {
      const variantIdx = tabVariantIndex[t.key] ?? 0;
      const variant = t.variants?.[variantIdx];
      return variant && variant.length ? variant : t.fields;
    });
  }, [effectiveTabs, tabVariantIndex]);
  const [activeTab, setActiveTab] = useState(effectiveTabs[0]?.key || 'default');
  const [selectedFieldId, setSelectedFieldId] =
    useState<string>(allFields[0]?.id || "");
  const [validatedToday] = useState(47);
  const [avgTime] = useState("0:32");
  const [accuracy] = useState(94);

  // Log attachment status changes once per distinct status signature to avoid noisy render-time logs
  const attachmentStatusSignature = React.useMemo(
    () =>
      JSON.stringify(
        (document.attachments || []).map(
          (a) => `${a.doc_handle}:${String(a.status ?? '').trim()}`,
        ),
      ),
    [document.attachments],
  );

  useEffect(() => {
    (document.attachments || []).forEach((attachment, index) => {
      const normalized = String(attachment.status ?? '').trim();
    });
  }, [attachmentStatusSignature, document.attachments]);

  const currentTab = effectiveTabs.find((t) => t.key === activeTab) || effectiveTabs[0];
  const currentVariantIndex = tabVariantIndex[currentTab.key] ?? 0;
  const currentVariantKey = `${currentTab.key}-${currentVariantIndex}`;
  const currentVariantMeta = (currentTab as any)?.variantMeta?.[currentVariantIndex];
  const isAutoApproved =
    currentVariantMeta?.qc_status === 'AutoApproved' &&
    currentVariantMeta?.reviewer_status === 'AutoApproved';
  const rawCurrentFields = currentTab?.variants?.[currentVariantIndex]?.length
    ? currentTab.variants[currentVariantIndex]
    : currentTab?.fields || [];
  
  // Sort fields by priority for Account/Loss/Exposure Data tabs
  const currentFields = React.useMemo(() => {
    if (activeTab === 'account' || activeTab === 'loss' || activeTab === 'exposure') {
      return [...rawCurrentFields].sort((a, b) => {
        const priorityA = getFieldPriority(activeTab, a.fieldName);
        const priorityB = getFieldPriority(activeTab, b.fieldName);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.fieldName.localeCompare(b.fieldName);
      });
    }
    return rawCurrentFields;
  }, [rawCurrentFields, activeTab]);

  // Check if there's already an unsaved new dataset in the current tab (sourceId is null)
  const hasUnsavedNewDataset = React.useMemo(() => {
    const variants = currentTab?.variants || [];
    return variants.some((variant) => {
      const firstField = variant?.[0];
      return firstField?.sourceId === null || firstField?.sourceId === undefined;
    });
  }, [currentTab?.variants]);

  // Track validation state for each field
  const [fieldValidations, setFieldValidations] = useState<
    Record<string, FieldValidation>
  >(
    Object.fromEntries(
      allFields.map((field) => [
        field.id,
        { fieldId: field.id, action: null },
      ]),
    ),
  );

  const selectedField = allFields.find(
    (f) => f.id === selectedFieldId,
  );
  const currentValidation = fieldValidations[selectedFieldId] || { fieldId: selectedFieldId, action: null };
  
  // Loading states
  const { loading: validationLoading, withLoading } = useLoading({ delay: 200 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update fieldValidations when allFields changes (e.g., when switching attachments)
  useEffect(() => {
    setFieldValidations((prev) => {
      const newValidations = { ...prev };
      // Add new fields that don't exist in the current validations
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
        // Current tab doesn't exist in new attachment, switch to first tab
        setActiveTab(effectiveTabs[0].key);
      }
    }
  }, [selectedAttachmentIndex]);

  useEffect(() => {
    if (allFields.length > 0) {
      const fieldExists = allFields.find(f => f.id === selectedFieldId);
      if (!fieldExists) {
        // Current field doesn't exist in new attachment, switch to first field
        setSelectedFieldId(allFields[0].id);
      }
    }
  }, [selectedAttachmentIndex, allFields]);

  // Ensure field edit state exists for selected field and variant
  useEffect(() => {
    if (!selectedField) return;
    const editKey = `${currentVariantKey}-${selectedField.id}`;
    setFieldEdits((prev) => {
      if (prev[editKey]) return prev;
      return {
        ...prev,
        [editKey]: {
          correctedValue: selectedField.extractedValue || '',
          comments: '',
          status: 'idle',
        },
      };
    });
  }, [selectedFieldId, currentVariantKey, selectedField]);

  const currentFieldEditKey = `${currentVariantKey}-${selectedFieldId}`;
  const currentFieldEdit = fieldEdits[currentFieldEditKey] || { correctedValue: '', comments: '', status: 'idle' };

  const handleFieldEditChange = (type: 'value' | 'comments', newVal: string) => {
    setFieldEdits((prev) => ({
      ...prev,
      [currentFieldEditKey]: {
        ...currentFieldEdit,
        [type === 'value' ? 'correctedValue' : 'comments']: newVal,
        status: 'idle',
        error: undefined,
      },
    }));
  };

  const handleSaveFieldEdit = async () => {
    if (!selectedField) return;
    if (!selectedField.rowId) {
      setFieldEdits((prev) => ({
        ...prev,
        [currentFieldEditKey]: { ...currentFieldEdit, status: 'error', error: 'Missing field id to update' },
      }));
      return;
    }

    const tableMap: Record<string, string> = {
      loss: 'subdata.hil_loss_extraction',
      account: 'subdata.hil_account_extraction',
      exposure: 'subdata.hil_exposure_extraction',
    };
    const tableName = tableMap[currentTab.key] || '';

    setFieldEdits((prev) => ({
      ...prev,
      [currentFieldEditKey]: { ...currentFieldEdit, status: 'saving', error: undefined },
    }));

    try {
      const { documentOperationsAPI } = await import('../services/documentOperationsAPI');
      const payload = {
        table_name: tableName,
        action: 'Approved',
        id: selectedField.rowId,
        data: {
          reviewer_comments: currentFieldEdit.comments || '',
          corrected_value: currentFieldEdit.correctedValue,
          qc_comments: '',
        },
      };
      const resp = await documentOperationsAPI.reviewerUpdatePolicyDocuments(payload);
      if (resp.status === 'error' || resp.error) {
        throw new Error(resp.message || resp.error || 'Failed to save');
      }
      setFieldEdits((prev) => ({
        ...prev,
        [currentFieldEditKey]: { ...currentFieldEdit, status: 'saved', error: undefined },
      }));
    } catch (err: any) {
      setFieldEdits((prev) => ({
        ...prev,
        [currentFieldEditKey]: { ...currentFieldEdit, status: 'error', error: err?.message || 'Failed to save' },
      }));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (readOnlyMode) return;
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
        const currentIndex = currentFields.findIndex(
          (f) => f.id === selectedFieldId,
        );
        if (
          e.key === "ArrowDown" &&
          currentIndex < currentFields.length - 1
        ) {
          setSelectedFieldId(
            currentFields[currentIndex + 1].id,
          );
        } else if (e.key === "ArrowUp" && currentIndex > 0) {
          setSelectedFieldId(
            currentFields[currentIndex - 1].id,
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () =>
      window.removeEventListener("keydown", handleKeyPress);
  }, [selectedFieldId, fieldValidations, currentFields, readOnlyMode]);

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
    // Clear field edits/notes when switching documents
    setCorrectedValues({});
    setVariantNotes({});
    // Reset to first tab and first field of the new attachment
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

  const handleActionChange = (
    action: "accept" | "correct" | "reject",
  ) => {
    if (readOnlyMode) return;
    setFieldValidations((prev) => ({
      ...prev,
      [selectedFieldId]: {
        ...prev[selectedFieldId],
        action,
      },
    }));
  };

  const handleNoteChange = (note: string) => {
    if (readOnlyMode) return;
    setFieldValidations((prev) => ({
      ...prev,
      [selectedFieldId]: {
        ...prev[selectedFieldId],
        note,
      },
    }));
  };

  const handleCorrectedValueChange = (fieldId: string, value: string) => {
    if (readOnlyMode) return;
    setCorrectedValues((prev) => ({
      ...prev,
      [currentVariantKey]: {
        ...(prev[currentVariantKey] || {}),
        [fieldId]: value,
      },
    }));
  };



  const handleSubmitAll = async () => {
    if (readOnlyMode) return;
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
        const field = allFields.find(
          (f) => f.id === validation.fieldId,
        );
        alert(
          `Please enter the corrected value for "${field?.fieldName}"`,
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

  const handleSaveDataset = async () => {
    if (readOnlyMode) return;
    const currentKey = currentVariantKey;
    const changes = correctedValues[currentKey] || {};
    const fieldsToSave = currentFields.filter((f) => changes[f.id] !== undefined);

    // Check if this is a newly created dataset (sourceId is null)
    const firstField = currentFields[0];
    const isNewDataset = firstField?.sourceId === null || firstField?.sourceId === undefined;

    // Table maps - existing datasets use subdata prefix, new datasets don't
    const existingTableMap: Record<string, string> = {
      loss: "subdata.hil_loss_extraction",
      exposure: "subdata.hil_exposure_extraction",
      account: "subdata.hil_account_extraction",
      default: "subdata.hil_account_extraction",
    };

    const newTableMap: Record<string, string> = {
      loss: "hil_loss_extraction",
      exposure: "hil_exposure_extraction",
      account: "hil_account_extraction",
      default: "hil_account_extraction",
    };

    const tableName = isNewDataset 
      ? (newTableMap[currentTab.key] || newTableMap.default)
      : (existingTableMap[currentTab.key] || existingTableMap.default);

    setIsSavingDataset(true);
    try {
      if (isNewDataset) {
        // Get metadata from first field's _rowMeta (copied from source variant)
        const rowMeta = (firstField as any)?._rowMeta || {};
        
        // Generate current timestamp in required format
        const now = new Date();
        const createDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(6, '0')}`;

        // For newly created datasets, use POST to add endpoint
        const newDataPayload: Record<string, any> = {
          table_name: tableName,
          // Use metadata from source variant, with fallbacks
          document_id: rowMeta.document_id || currentAttachment?.doc_handle || '',
          document_name: rowMeta.document_name || `${currentAttachment?.doc_handle || ''}_COMBINED.pdf`,
          policy_number: rowMeta.policy_number || '',
          effective_date: rowMeta.effective_date || '',
          first_named_insured: rowMeta.first_named_insured || document.documentName || '',
          description: rowMeta.description || '',
          supplemental_description: rowMeta.supplemental_description || '',
          doc_handle: rowMeta.doc_handle || currentAttachment?.doc_handle || '',
          doc_type_name: rowMeta.doc_type_name || '',
          create_date_time: createDateTime,
          processed_flag: "0",
          reviewer_status: "Approved",
        };

        // Only add field values that user has modified (from changes object)
        // Strip _new_timestamp_index suffix from field IDs to get original field names
        fieldsToSave.forEach((field) => {
          const originalFieldName = field.id.replace(/_new_\d+_\d+$/, '');
          newDataPayload[originalFieldName] = changes[field.id];
          newDataPayload[`${originalFieldName}_confidence`] = field.confidence || null;
          newDataPayload[`${originalFieldName}_page_no`] = field.pageNo || null;
        });

        // Add reviewer comments
        newDataPayload.reviewer_comments = variantNotes[currentKey] || "";

        const addResp = await documentOperationsAPI.addReviewerDataset(newDataPayload as any);

        if (addResp.status === 'error' || addResp.error) {
          throw new Error(addResp.message || addResp.error || 'Failed to add data set');
        }

        alert("New data set saved successfully.");
        // Refresh to get the new ID from backend
        await refetchCurrentDocument();
      } else {
        // For existing datasets, use PUT to update endpoint
        const dataPayload: Record<string, any> = {};
        fieldsToSave.forEach((field) => {
          dataPayload[field.id] = changes[field.id];
          dataPayload[`${field.id}_correction`] = "true";
        });
        dataPayload.reviewer_comments = variantNotes[currentKey] || "";
        dataPayload.qc_comments = "";

        const targetField = fieldsToSave[0] || currentFields[0];
        const targetId =
          targetField?.sourceId ??
          (targetField as any)?.rowId ??
          targetField?.id ??
          currentKey;

        await documentOperationsAPI.reviewerUpdatePolicyDocuments({
          table_name: tableName,
          action: "Approved",
          id: targetId,
          data: dataPayload,
        });
        alert("Data set saved successfully.");

        // Reflect changes on UI for current dataset
        fieldsToSave.forEach((field) => {
          const newVal = changes[field.id];
          if (newVal !== undefined) {
            field.extractedValue = newVal;
            (field as any).corrected = true;
          }
        });

        // clear inputs for this data set after save
        setCorrectedValues((prev) => ({ ...prev, [currentKey]: {} }));
      }
    } catch (error: any) {
      alert(error?.message || "Failed to save data set.");
    } finally {
      setIsSavingDataset(false);
    }
  };

  const handleDeleteDataset = async () => {
    if (readOnlyMode) return;
    const variants = currentTab?.variants || [];
    if (!variants.length) return;
    const key = getVariantKey(currentTab.key, currentVariantIndex, variants[currentVariantIndex]);

    // Get document_id from metadata
    const targetField = variants[currentVariantIndex]?.[0] || currentFields[0];
    const metadata = (targetField as any)?._rowMeta || {};
    const documentId = metadata.document_id;

    if (!documentId) {
      alert("Document ID not found. Cannot delete data set.");
      return;
    }

    const tableMap: Record<string, string> = {
      loss: "hil_loss_extraction",
      exposure: "hil_exposure_extraction",
      account: "hil_account_extraction",
      default: "hil_account_extraction",
    };
    const tableName = tableMap[currentTab.key] || tableMap.default;

    setIsDeletingDataset(true);
    try {
      const resp = await documentOperationsAPI.deleteReviewerDataset({
        table_name: tableName,
        document_id: documentId,
      });
      if (resp.status === 'error' || resp.error) {
        throw new Error(resp.message || resp.error || 'Failed to delete data set');
      }
      setDeletedDatasets((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      setTabVariantIndex((prev) => ({ ...prev, [currentTab.key]: 0 }));
      alert("Data set deleted successfully.");
      await refetchCurrentDocument();
    } catch (error: any) {
      alert(error?.message || "Failed to delete data set.");
    } finally {
      setIsDeletingDataset(false);
    }
  };

  const handleAddDataset = () => {
    // Use sortedTabs which is the source of truth for the dropdown
    const currentTabs = sortedTabs;

    if (!currentTabs || currentTabs.length === 0) return;

    // Find the current tab
    const tabIndex = currentTabs.findIndex((t) => t.key === currentTab.key);
    if (tabIndex === -1) return;

    const targetTab = currentTabs[tabIndex];
    
    // Get the source variants - use variants if available, otherwise wrap fields in array
    const sourceVariants = (targetTab.variants && targetTab.variants.length > 0) 
      ? targetTab.variants 
      : (targetTab.fields && targetTab.fields.length > 0) 
        ? [targetTab.fields] 
        : [];
    
    const lastVariant = sourceVariants[sourceVariants.length - 1] || [];

    if (lastVariant.length === 0) {
      alert("No data set to copy from.");
      return;
    }

    // Get metadata from source variant's first field
    const sourceMetadata = (lastVariant[0] as any)?._rowMeta || {};

    // Clone the last variant with null values for data fields
    const timestamp = Date.now();
    const newVariant: ExtractedField[] = lastVariant.map((field, idx) => {
      const newField: any = {
        ...field,
        id: `${field.id ?? 'field'}_new_${timestamp}_${idx}`,
        sourceId: null, // New dataset has no ID yet - will be assigned by backend
        rowId: undefined,
        extractedValue: '',
        confidence: 0,
        pageNo: null,
        corrected: undefined,
      };
      // Copy metadata to first field of new variant
      if (idx === 0) {
        newField._rowMeta = { ...sourceMetadata };
      }
      return newField;
    });

    // Create new variantMeta entry (empty)
    const newMeta: VariantMeta = {
      qc_status: null,
      qc_comments: null,
      reviewer_status: null,
      reviewer_comments: null,
    };

    // Build updated tabs - update ALL tabs but only add variant to current tab
    const updatedTabs = currentTabs.map((tab, idx) => {
      if (idx !== tabIndex) return tab;
      
      // Get existing variants or create from fields
      const existingVariants = (tab.variants && tab.variants.length > 0) 
        ? tab.variants 
        : (tab.fields && tab.fields.length > 0) 
          ? [tab.fields] 
          : [];
      const existingMeta = tab.variantMeta || [];
      
      return {
        ...tab,
        variants: [...existingVariants, newVariant],
        variantMeta: [...existingMeta, newMeta],
      };
    });

    // Update tabState - this will trigger sortedTabs to recompute
    setTabState((prev) => ({
      ...prev,
      [selectedAttachmentIndex]: updatedTabs,
    }));

    // Calculate the new variant index (it will be at the end)
    const existingVariantsCount = (targetTab.variants && targetTab.variants.length > 0) 
      ? targetTab.variants.length 
      : (targetTab.fields && targetTab.fields.length > 0) 
        ? 1 
        : 0;
    const newVariantIdx = existingVariantsCount;

    // Select the newly added variant
    setTabVariantIndex((prev) => ({
      ...prev,
      [currentTab.key]: newVariantIdx,
    }));

    // Initialize corrected values for new variant
    setCorrectedValues((prev) => ({
      ...prev,
      [`${currentTab.key}-${newVariantIdx}`]: {},
    }));

    // Select first field of new variant
    if (newVariant.length > 0) {
      setSelectedFieldId(newVariant[0].id);
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
    if (!validation || !validation.action) return null;

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
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex flex-col relative">
      {/* Loading overlay when refetching document data */}
      {isRefetchingDocument && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-[#012F66] dark:text-white font-medium">Loading document data...</span>
          </div>
        </div>
      )}
      <ValidationHeader 
        onBack={onBack}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        title="Validation Portal"
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
              : { width: "calc(100% - 380px)" } // keep left panel width stable beside 360px right panel + padding
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
                    /* Real Document Image from API */
                    <div className="relative w-full h-full" style={{ maxWidth: '100%', overflow: 'hidden', height: '100%' }}>
                      {/* Check if it's a PDF, Word, Excel, or CSV document */}
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
                        /* PDF/Word/Excel/CSV Document - Use PDFViewer component */
                        <PDFViewer 
                          url={documentUrl}
                          fileName={document.documentName}
                          className="h-full w-full"
                        />
                      ) : (
                        /* Image Document - Use img tag */
                        <img
                          src={documentUrl}
                          alt={document.documentName}
                          className="max-w-full h-auto border border-gray-300 dark:border-gray-600 rounded"
                          style={{ maxHeight: '80vh' }}
                          crossOrigin="anonymous"
                          onLoad={() => {
                            // Document image loaded successfully
                          }}
                          onError={(e) => {
                            // Failed to load document image
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
                        {/* <div className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-800 px-3 py-2 rounded font-mono break-all max-w-md mb-4">
                          {documentUrl}
                        </div> */}
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
            {document.attachments && document.attachments.length > 0 && (
              <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-4 border-[#E5E7EB] dark:border-[#3a3a3a]">
                <h4 className="text-[#012F66] dark:text-white mb-3 font-semibold">
                  Documents ({document.attachments.length})
                </h4>
                <div className="space-y-2">
                  {document.attachments.map((attachment, index) => {
                    const status = String(attachment.status ?? document.status ?? '').trim();
                    let statusBadge = null;
                    const commonChip = "px-2 py-1 rounded text-xs font-semibold text-white";
                    if (status == '1') {
                      statusBadge = (
                        <span className={`${commonChip} bg-green-600`}>
                          Completed
                        </span>
                      );
                    } else if (status == '3') {
                      statusBadge = (
                        <span className={`${commonChip}`} style={{ backgroundColor: '#fcba03' }}>
                          QC Pending
                        </span>
                      );
                    } else if (status == '4') {
                      statusBadge = (
                        <span className={`${commonChip}`} style={{ backgroundColor: '#ff0081' }}>
                          Re-assigned
                        </span>
                      );
                    }
                    
                    return (
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
                            {statusBadge}
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
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fields List */}
            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-4 border-[#E5E7EB] dark:border-[#3a3a3a]" style={{ maxHeight: '450px' , overflow: 'scroll' }}>
              {tabbedFields.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  {tabbedFields.map((tab) => (
                    <Button
                      key={tab.key}
                      variant={activeTab === tab.key ? "default" : "outline"}
                      size="sm"
                      className={activeTab === tab.key ? "bg-[#0292DC] text-white" : "border-[#D0D5DD] dark:border-[#3a3a3a] text-[#012F66] dark:text-white"}
                      onClick={() => {
                        setActiveTab(tab.key);
                        // clear inputs for new tab/variant
                        setCorrectedValues((prev) => ({ ...prev, [`${tab.key}-${tabVariantIndex[tab.key] ?? 0}`]: {} }));
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
              {currentTab?.variants && currentTab.variants.length > 0 && (
                <div className="mb-3 flex flex-col gap-2">
                  {currentTab.variants.length > 1 && (
                    <Select
                      value={String(currentVariantIndex)}
                      onValueChange={(val) => {
                        const idx = Number(val);
                        setTabVariantIndex((prev) => ({ ...prev, [currentTab.key]: idx }));
                        // clear inputs for new variant selection
                        setCorrectedValues((prev) => ({ ...prev, [`${currentTab.key}-${idx}`]: {} }));
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
                        {currentTab.variants.map((_, idx) => (
                          <SelectItem key={`${currentTab.key}-${idx}`} value={String(idx)}>
                            {currentTab.label} Set #{idx + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={readOnlyMode || isDeletingDataset}
                        className="whitespace-nowrap bg-red-600 text-white border border-red-700 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#a80c0c' }}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete Data Set
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete whole data set?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all data sets of selected tab from this policy. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          disabled={isDeletingDataset}
                          className="cursor-pointer disabled:cursor-not-allowed"
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteDataset}
                          disabled={isDeletingDataset}
                          className="bg-red-600 hover:bg-red-700 text-white border border-red-700 shadow-sm dark:bg-red-700 dark:hover:bg-red-800 cursor-pointer disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#a80c0c' }}
                        >
                          {isDeletingDataset ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    type="button"
                    onClick={handleAddDataset}
                    disabled={readOnlyMode || hasUnsavedNewDataset}
                    title={hasUnsavedNewDataset ? "Save the current new data set before adding another" : ""}
                    className="whitespace-nowrap bg-[#0292DC] hover:bg-[#012F66] text-white border border-[#0292DC] shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Data Set
                  </Button>
                </div>
              )}

                {/* QC metadata if available (fallback to attachment-level qc status/comments) */}
                {(() => {
                  const qcMeta =
                    currentVariantMeta ||
                    (currentAttachment
                      ? {
                          qc_status: currentAttachment.qc_status,
                          qc_comments: currentAttachment.qc_comments ?? currentAttachment.qc_comment,
                        }
                      : null);

                  if (!qcMeta || (!qcMeta.qc_status && !qcMeta.qc_comments && !(qcMeta as any).qc_comment)) {
                    return null;
                  }

                  return (
                  <div className="mb-3 p-3 rounded-lg border border-[#D0D5DD] dark:border-[#3a3a3a] bg-[#f8fafc] dark:bg-[#232323]">
                    {qcMeta.qc_status && (
                      <div className="flex items-center justify-between text-sm text-[#012F66] dark:text-white font-semibold">
                        <span>QC Status</span>
                        <span className="text-[#5b21b6] dark:text-[#c4b5fd]">{qcMeta.qc_status}</span>
                      </div>
                    )}
                    {(qcMeta.qc_comments || (qcMeta as any).qc_comment) && (
                      <div className="mt-2 text-sm text-[#012F66] dark:text-white">
                        <p className="font-medium">QC Comment</p>
                        <p className="text-[#475467] dark:text-[#cfcfcf]">
                          {qcMeta.qc_comments || (qcMeta as any).qc_comment}
                        </p>
                      </div>
                    )}
                  </div>
                  );
                })()}

                {/* Reviewer metadata if available */}
                {currentVariantMeta && (currentVariantMeta.reviewer_status || currentVariantMeta.reviewer_comments) && (
                  <div className="mb-3 p-3 rounded-lg border border-[#D0D5DD] dark:border-[#3a3a3a] bg-[#f8fafc] dark:bg-[#232323]">
                    {currentVariantMeta.reviewer_status && (
                      <div className="flex items-center justify-between text-sm text-[#012F66] dark:text-white font-semibold">
                        <span>Reviewer Status</span>
                        <Badge className="bg-[#0292DC] text-white">
                          {currentVariantMeta.reviewer_status}
                        </Badge>
                      </div>
                    )}
                    {currentVariantMeta.reviewer_comments && (
                      <div className="mt-2 text-sm text-[#012F66] dark:text-white">
                        <p className="font-medium">Reviewer Comment</p>
                        <p className="text-[#475467] dark:text-[#cfcfcf]">
                          {currentVariantMeta.reviewer_comments}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes per data set */}
                {currentTab && (
                  <div className="mb-3 space-y-2">
                    <label className="text-[#012F66] dark:text-white">Notes for this data set</label>
                    <Textarea
                      value={variantNotes[currentVariantKey] || ''}
                      onChange={(e) =>
                        setVariantNotes((prev) => ({
                          ...prev,
                          [currentVariantKey]: e.target.value,
                        }))
                      }
                      placeholder="Add notes specific to this data set..."
                      rows={3}
                      readOnly={readOnlyMode}
                      disabled={readOnlyMode}
                      className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:bg-[#3a3a3a] dark:text-white resize-none"
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
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-[#80989A]">Original: {String(field.extractedValue ?? '') || '—'}</p>
                            <Input
                              value={(correctedValues[currentVariantKey]?.[field.id]) ?? ''}
                              onChange={(e) => handleCorrectedValueChange(field.id, e.target.value)}
                              placeholder="Enter corrected value"
                              readOnly={readOnlyMode}
                              disabled={readOnlyMode}
                              className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:bg-[#3a3a3a] dark:text-white"
                            />
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
            {/* <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
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
            </div> */}

            {/* QC Comment (if available) */}
            {selectedField.qcComment && (
              <div className="bg-[#FFC018]/10 border border-[#FFC018] rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#FFC018] mt-1.5" />
                  <span className="text-[#80989A] dark:text-[#a0a0a0] font-medium">
                    QC Feedback
                  </span>
                </div>
                <p className="text-[#012F66] dark:text-white pl-4">
                  {selectedField.qcComment}
                </p>
              </div>
            )}

          </div>

          {/* Save Dataset Button */}
          <Button
            onClick={handleSaveDataset}
            disabled={isSavingDataset || readOnlyMode || isAutoApproved}
            className="mt-4 w-full bg-[#0292DC] hover:bg-[#012F66] text-white flex-shrink-0"
          >
            {isSavingDataset ? (
              <LoadingSpinner size="sm" text="Saving..." />
            ) : (
              "Save Data Set"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}