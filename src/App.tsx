import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingPage, LoadingOverlay } from "./components/LoadingComponents";
import { useLoading } from "./hooks/useLoading";
import { LazyComponents } from "./components/LazyComponents";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RoleGuard } from "./components/RoleGuard";
import { Toaster } from "./components/ui/sonner";

interface ExtractedField {
  id: string;
  sourceId?: number | string;
  fieldName: string;
  fieldDescription: string;
  extractedValue: string;
  confidence: number;
  pageNo?: string | number | null;
  rowId?: number;
  expectedFormat?: string;
  qcComment?: string; // QC comment from previous review
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface VariantMeta {
  qc_status?: string | null;
  qc_comments?: string | null;
  qc_comment?: string | null;
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
  tabbedFields: {
    key: string;
    label: string;
    fields: ExtractedField[];
    variants?: ExtractedField[][];
    variantMeta?: VariantMeta[];
  }[];
}

interface ValidationDocument {
  id: string;
  documentName: string;
  documentType: string;
  priority: "High" | "Medium" | "Low";
  status?: string | number;
  fields: ExtractedField[];
  documentImage?: string; // URL to the document image
  allFields?: any[]; // Store all fields from API for submission (including those with qc_action not null)
  attachments?: DocumentAttachment[]; // Multiple documents for reviewer validation
  tabbedFields?: { key: string; label: string; fields: ExtractedField[]; variants?: ExtractedField[][]; variantMeta?: VariantMeta[] }[];
}

// QC validation document is now the same as reviewer validation document
type QCValidationDocument = ValidationDocument;

interface FieldValidation {
  fieldId: string;
  action: "accept" | "correct" | "reject" | null;
  correctedValue?: string;
  note?: string;
  rejectReason?: string;
}

interface QCDecision {
  fieldId: string;
  decision: "approve" | "sendback" | null;
  qcNote?: string;
}

const AppContent = function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "validation"
    | "qc-validation"
    | "history-view"
    | "qc-history-view"
  >("dashboard");
  const [selectedDocument, setSelectedDocument] = useState<ValidationDocument | null>(null);
  const [selectedQCDocument, setSelectedQCDocument] = useState<QCValidationDocument | null>(null);
  const [queueCount, setQueueCount] = useState(24);
  const [qcQueueCount, setQcQueueCount] = useState(5);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);
  
  // Loading states
  const { loading: appLoading, withLoading } = useLoading({ delay: 200 });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      // Simulate app initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsInitializing(false);

      // Resume validation if requested (after dataset delete reload)
      const resume = sessionStorage.getItem('resumeValidation');
      if (resume) {
        try {
          const parsed = JSON.parse(resume);
          if (parsed?.first_named_insured) {
            await handleValidateClick({
              accountName: parsed.first_named_insured,
              document: parsed.first_named_insured,
            });
            if (typeof parsed.selectedAttachmentIndex === 'number') {
              setTimeout(() => {
                // select attachment index if available
                setSelectedDocument((prev) =>
                  prev
                    ? {
                        ...prev,
                        attachments:
                          prev.attachments && prev.attachments.length > parsed.selectedAttachmentIndex
                            ? prev.attachments
                            : prev.attachments,
                      }
                    : prev,
                );
              }, 0);
            }
          }
        } catch (e) {
          // ignore resume errors
        } finally {
          sessionStorage.removeItem('resumeValidation');
        }
      }
    };
    
    initializeApp();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

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
      if (value === undefined) return; // include null/empty so users can validate missing data
      const correctionFlag = obj[`${key}_correction`];
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
        corrected: String(correctionFlag ?? '').toLowerCase() === 'true',
      });
    });
    
    // Attach metadata to first field for later access
    if (fields.length > 0) {
      (fields[0] as any)._rowMeta = _rowMeta;
    }
    
    return fields;
  };

  const handleValidateClick = useCallback(async (item: any) => {
    return withLoading(async () => {
      // Try to load real API data first, fallback to mock data
      let document: ValidationDocument;
    
      try {
        // Import the API service
        const { documentOperationsAPI } = await import('./services/documentOperationsAPI');
        
        // Try to fetch real document data from API
        const response = await documentOperationsAPI.reviewFile({ first_named_insured: item.accountName || item.document });
        
        if (response?.documents && response.documents.length === 0) {
          setSelectedDocument(null);
          setIsReadOnlyView(false);
          setCurrentView("dashboard");
          return;
        }

        if (response?.documents && response.documents.length > 0) {
          // Build attachments array from all documents
          const attachments: DocumentAttachment[] = response.documents.map((docPayload: any) => {
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

            const firstExposure = exposureVariants[0] || [];
            const firstAccount = accountVariants[0] || [];
            const firstLoss = lossVariants[0] || [];

            const readOnlyFlag =
              ["1", "3"].includes(String(docPayload?.status)) ||
              !!docPayload?.reviewer_status;

            return {
              doc_handle: docPayload.doc_handle,
              presigned_url: docPayload.presigned_url,
              readOnly: readOnlyFlag,
              status: docPayload.status,
              qc_status: docPayload.qc_status ?? null,
              qc_comments: docPayload.qc_comments ?? docPayload.qc_comment ?? null,
              qc_comment: docPayload.qc_comment ?? null,
              tabbedFields: [
                { key: 'loss', label: 'Loss Data', fields: firstLoss, variants: lossVariants, variantMeta: lossVariantMeta },
                { key: 'account', label: 'Account Data', fields: firstAccount, variants: accountVariants, variantMeta: accountVariantMeta },
                { key: 'exposure', label: 'Exposure Data', fields: firstExposure, variants: exposureVariants, variantMeta: exposureVariantMeta },
              ],
            };
          });

          // Use first document as default
          const firstDoc = attachments[0];
          const firstDocFields = firstDoc.tabbedFields.find(t => {
            const variant = (t.variants && t.variants[0]) || t.fields;
            return variant && variant.length > 0;
          });
          const defaultFields = firstDocFields
            ? (firstDocFields.variants && firstDocFields.variants[0] && firstDocFields.variants[0].length
                ? firstDocFields.variants[0]
                : firstDocFields.fields || [])
            : [];

          document = {
            id: response.first_named_insured || item.id,
            documentName: response.first_named_insured || item.accountName || item.document,
            documentType: 'Account',
            priority: 'High',
            documentImage: firstDoc.presigned_url,
            tabbedFields: firstDoc.tabbedFields,
            fields: defaultFields,
            attachments: attachments,
          };
          setIsReadOnlyView(false);
        } else {
          throw new Error('API response failed');
        }
      } catch (error) {
        // Using fallback mock data for validation
        
        // Fallback to mock data with original look and feel
        document = {
          id: item.id,
          documentName: item.accountName || item.document,
          documentType: 'Account',
          priority: 'High',
          tabbedFields: [
            { key: 'loss', label: 'Loss Data', fields: [] },
            { key: 'account', label: 'Policy Data', fields: [] },
            { key: 'exposure', label: 'Exposure Data', fields: [] },
          ],
          fields: [],
        };
      }

      setSelectedDocument(document);
      setCurrentView("validation");
    });
  }, [withLoading]);

  const handleQCValidateClick = useCallback(async (item: any) => {
    return withLoading(async () => {
      // Try to load real QC API data first, fallback to mock data
      let qcDocument: QCValidationDocument;
    
      try {
        // Import the API service
        const { documentOperationsAPI } = await import('./services/documentOperationsAPI');
        
        // Try to fetch real QC document data from API
        const response = await documentOperationsAPI.qcOpenFile({ first_named_insured: item.accountName || item.document });
        
        if (response?.documents && response.documents.length === 0) {
          setSelectedQCDocument(null);
          setCurrentView("dashboard");
          return;
        }

        if (response?.documents && response.documents.length > 0) {
          // Build attachments array from all documents (same structure as reviewer)
          const attachments: DocumentAttachment[] = response.documents.map((docPayload: any) => {
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

            const firstExposure = exposureVariants[0] || [];
            const firstAccount = accountVariants[0] || [];
            const firstLoss = lossVariants[0] || [];

            return {
              doc_handle: docPayload.doc_handle,
              presigned_url: docPayload.presigned_url,
              status: docPayload.status,
              tabbedFields: [
                { key: 'loss', label: 'Loss Data', fields: firstLoss, variants: lossVariants, variantMeta: lossVariantMeta },
                { key: 'account', label: 'Account Data', fields: firstAccount, variants: accountVariants, variantMeta: accountVariantMeta },
                { key: 'exposure', label: 'Exposure Data', fields: firstExposure, variants: exposureVariants, variantMeta: exposureVariantMeta },
              ],
            };
          });

          // Use first document as default
          const firstDoc = attachments[0];
          const firstDocFields = firstDoc.tabbedFields.find(t => {
            const variant = (t.variants && t.variants[0]) || t.fields;
            return variant && variant.length > 0;
          });
          const defaultFields = firstDocFields
            ? (firstDocFields.variants && firstDocFields.variants[0] && firstDocFields.variants[0].length
                ? firstDocFields.variants[0]
                : firstDocFields.fields || [])
            : [];

          qcDocument = {
            id: response.first_named_insured || item.id,
            documentName: response.first_named_insured || item.accountName || item.document,
            documentType: 'Account',
            priority: 'High',
            documentImage: firstDoc.presigned_url,
            tabbedFields: firstDoc.tabbedFields,
            fields: defaultFields,
            attachments: attachments,
            status: response.documents?.[0]?.status,
          };
        } else {
          throw new Error('QC API response failed');
        }
      } catch (error) {
        // Using fallback mock data for QC validation
        
        // Fallback to mock data with original look and feel
        qcDocument = {
          id: item.id,
          documentName: item.accountName || item.document,
          documentType: 'Account',
          priority: 'High',
          tabbedFields: [
            { key: 'loss', label: 'Loss Data', fields: [] },
            { key: 'account', label: 'Policy Data', fields: [] },
            { key: 'exposure', label: 'Exposure Data', fields: [] },
          ],
          fields: [],
        };
      }

      setSelectedQCDocument(qcDocument);
      setCurrentView("qc-validation");
    });
  }, [withLoading]);

  const handleBackToDashboard = useCallback(() => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentView("dashboard");
      setSelectedDocument(null);
      setSelectedQCDocument(null);
      setIsReadOnlyView(false);
      setIsNavigating(false);
    }, 200);
  }, []);

  const handleViewHistory = useCallback((doc: any) => {
    withLoading(async () => {
      // Simulate loading history data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create a document for history view (read-only)
      const historyDocument: ValidationDocument = {
        id: doc.id,
        documentName: doc.documentName,
        documentType: doc.documentType,
        priority: "Medium",
        fields: [
          {
            id: "field-1",
            fieldName: "Total Amount Due",
            fieldDescription:
              "The total amount to be paid for this invoice",
            extractedValue: "$12,847.50",
            confidence: 67,
            expectedFormat: "$X,XXX.XX",
            location: { x: 48, y: 415, width: 220, height: 28 },
          },
          {
            id: "field-2",
            fieldName: "Policy Number",
            fieldDescription: "The unique policy identifier",
            extractedValue: "POL-2024-5678",
            confidence: 85,
            expectedFormat: "POL-YYYY-XXXX",
            location: { x: 48, y: 175, width: 180, height: 24 },
          },
          {
            id: "field-3",
            fieldName: "Effective Date",
            fieldDescription:
              "The date when the policy becomes effective",
            extractedValue: "January 1, 2025",
            confidence: 92,
            expectedFormat: "Month DD, YYYY",
            location: { x: 48, y: 265, width: 160, height: 24 },
          },
        ],
      };

      setSelectedDocument(historyDocument);
      setIsReadOnlyView(true);
      setCurrentView("history-view");
    });
  }, [withLoading]);

  const handleViewQCHistory = useCallback((doc: any) => {
    withLoading(async () => {
      // Simulate loading QC history data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create a QC document for history view (read-only)
      const historyQCDocument: QCValidationDocument = {
        id: doc.id,
        documentName: doc.documentName,
        documentType: doc.documentType,
        priority: "Medium",
        tabbedFields: [
          { key: 'loss', label: 'Loss Data', fields: [] },
          { key: 'account', label: 'Policy Data', fields: [] },
          { key: 'exposure', label: 'Exposure Data', fields: [] },
        ],
        fields: [],
      };

      setSelectedQCDocument(historyQCDocument);
      setIsReadOnlyView(true);
      setCurrentView("qc-history-view");
    });
  }, [withLoading]);

  const handleSubmitValidation = useCallback(async (
    validations: FieldValidation[],
  ) => {
    return withLoading(async () => {
      try {
        // Try to submit to API if we have a selected document
        if (selectedDocument) {
          const { documentOperationsAPI } = await import('./services/documentOperationsAPI');
          
          // Create a map of validations by field ID for quick lookup
          const validationMap = new Map<string, FieldValidation>();
          validations.forEach(validation => {
            validationMap.set(validation.fieldId, validation);
          });
          
          // Include ALL fields from API response in the payload
          // For visible fields, use the validation from the form
          // For hidden fields (qc_action not null and not "sendback"), use existing values from API
          const allFields = selectedDocument.allFields || [];
          
          const apiValidations = allFields.map((apiField: any) => {
            // Find if this field was visible (has a validation from the form)
            const visibleField = selectedDocument.fields.find(f => f.fieldName === apiField.entity_type);
            const validation = visibleField ? validationMap.get(visibleField.id) : null;
            
            if (validation) {
              // Field was visible and validated by user
              return {
                entity_type: apiField.entity_type,
                reviewer_action: validation.action || 'accept',
                updated_entity_text: validation.correctedValue || null,
                reviewer_comment: validation.note || null,
              };
            } else {
              // Field was hidden (qc_action not null and not "sendback")
              // Include it with existing values from API
              return {
                entity_type: apiField.entity_type,
                reviewer_action: apiField.reviewer_action || 'accept',
                updated_entity_text: apiField.updated_entity_value || apiField.entity_value || null,
                reviewer_comment: null,
              };
            }
          });

          const response = await documentOperationsAPI.updateFile({
            file_name: selectedDocument.documentName,
            validations: apiValidations,
          });

          if (response.message) {
            // API submission successful
          } else {
            // API submission failed, using fallback
          }
        }
      } catch (error) {
        // API submission failed, using fallback
      }
      
      // Always update UI regardless of API success/failure
      // Decrease queue count
      setQueueCount((prev) => Math.max(0, prev - 1));
      // Return to dashboard
      setCurrentView("dashboard");
      setSelectedDocument(null);
    });
  }, [withLoading, selectedDocument]);

  // Function to refresh QC document data from backend
  const handleRefreshQCDocument = useCallback(async () => {
    if (!selectedQCDocument) return;
    
    try {
      const { documentOperationsAPI } = await import('./services/documentOperationsAPI');
      const refreshed = await documentOperationsAPI.qcOpenFile({
        first_named_insured: selectedQCDocument.documentName,
      });

      if (refreshed?.documents && refreshed.documents.length === 0) {
        setSelectedQCDocument(null);
        setCurrentView("dashboard");
        return;
      }

      if (refreshed?.documents && refreshed.documents.length > 0) {
        const attachments: DocumentAttachment[] = refreshed.documents.map((docPayload: any) => {
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

          const firstExposure = exposureVariants[0] || [];
          const firstAccount = accountVariants[0] || [];
          const firstLoss = lossVariants[0] || [];

          return {
            doc_handle: docPayload.doc_handle,
            presigned_url: docPayload.presigned_url,
            status: docPayload.status,
            tabbedFields: [
              { key: 'loss', label: 'Loss Data', fields: firstLoss, variants: lossVariants, variantMeta: lossVariantMeta },
              { key: 'account', label: 'Account Data', fields: firstAccount, variants: accountVariants, variantMeta: accountVariantMeta },
              { key: 'exposure', label: 'Exposure Data', fields: firstExposure, variants: exposureVariants, variantMeta: exposureVariantMeta },
            ],
          } as DocumentAttachment;
        });

        const firstDoc = attachments[0];
        const firstDocFields = firstDoc.tabbedFields.find(t => {
          const variant = (t.variants && t.variants[0]) || t.fields;
          return variant && variant.length > 0;
        });
        const defaultFields = firstDocFields
          ? (firstDocFields.variants && firstDocFields.variants[0] && firstDocFields.variants[0].length
              ? firstDocFields.variants[0]
              : firstDocFields.fields || [])
          : [];

        const qcDocument: QCValidationDocument = {
          id: refreshed.first_named_insured || selectedQCDocument.id,
          documentName: refreshed.first_named_insured || selectedQCDocument.documentName,
          documentType: 'Account',
          priority: 'High',
          documentImage: firstDoc.presigned_url,
          tabbedFields: firstDoc.tabbedFields,
          fields: defaultFields,
          attachments: attachments,
          status: refreshed.documents?.[0]?.status,
        };

        setSelectedQCDocument(qcDocument);
      }
    } catch (error) {
      console.error('Failed to refresh QC document:', error);
    }
  }, [selectedQCDocument]);

  const handleSubmitQCReview = useCallback(async (decisions: QCDecision[]) => {
    return withLoading(async () => {
      let didRefresh = false;
      try {
        // Try to submit to QC API if we have a selected QC document
        if (selectedQCDocument) {
          const { documentOperationsAPI } = await import('./services/documentOperationsAPI');
          
          // Create a map of QC decisions by field ID for quick lookup
          const decisionMap = new Map<string, QCDecision>();
          decisions.forEach(decision => {
            decisionMap.set(decision.fieldId, decision);
          });
          
          // Include ALL fields from API response in the payload
          // For visible fields (qc_action !== 'approve'), use the decision from the form
          // For hidden fields (qc_action === 'approve'), keep existing values from API
          const allFields = selectedQCDocument.allFields || [];
          
          const qcValidations = allFields.map((apiField: any) => {
            // Find if this field was visible (has a decision from the form)
            const visibleField = selectedQCDocument.fields.find(f => f.fieldName === apiField.entity_type);
            const decision = visibleField ? decisionMap.get(visibleField.id) : null;
            
            if (decision) {
              // Field was visible and QC made a decision
              return {
                entity_type: apiField.entity_type,
                qc_action: decision.decision === 'approve' ? 'approve' as const : 
                          decision.decision === 'sendback' ? 'sendback' as const : 'reject' as const,
                qc_comment: decision.qcNote || null,
              };
            } else {
              // Field was hidden (qc_action === 'approve')
              // Include it with existing values from API
              return {
                entity_type: apiField.entity_type,
                qc_action: apiField.qc_action || 'approve' as const,
                qc_comment: apiField.qc_comment || null,
              };
            }
          });

          const response = await documentOperationsAPI.qcUpdateFile({
            file_name: selectedQCDocument.documentName,
            validations: qcValidations,
          });

          // Check if submission was successful
          if (response && response.message && response.total_rows_updated !== undefined) {
            // QC API submission successful - reload latest policy details from backend
            try {
              const refreshed = await documentOperationsAPI.qcOpenFile({
                first_named_insured: selectedQCDocument.documentName,
              });

              if (refreshed?.documents && refreshed.documents.length === 0) {
                setQcQueueCount((prev) => Math.max(0, prev - 1));
                setSelectedQCDocument(null);
                setCurrentView("dashboard");
                didRefresh = true;
                return;
              }

              if (refreshed?.documents && refreshed.documents.length > 0) {
                const attachments: DocumentAttachment[] = refreshed.documents.map((docPayload: any) => {
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

                  const firstExposure = exposureVariants[0] || [];
                  const firstAccount = accountVariants[0] || [];
                  const firstLoss = lossVariants[0] || [];

                  return {
                    doc_handle: docPayload.doc_handle,
                    presigned_url: docPayload.presigned_url,
                    status: docPayload.status,
                    tabbedFields: [
                      { key: 'loss', label: 'Loss Data', fields: firstLoss, variants: lossVariants, variantMeta: lossVariantMeta },
                      { key: 'account', label: 'Account Data', fields: firstAccount, variants: accountVariants, variantMeta: accountVariantMeta },
                      { key: 'exposure', label: 'Exposure Data', fields: firstExposure, variants: exposureVariants, variantMeta: exposureVariantMeta },
                    ],
                  } as DocumentAttachment;
                });

                const firstDoc = attachments[0];
                const firstDocFields = firstDoc.tabbedFields.find(t => {
                  const variant = (t.variants && t.variants[0]) || t.fields;
                  return variant && variant.length > 0;
                });
                const defaultFields = firstDocFields
                  ? (firstDocFields.variants && firstDocFields.variants[0] && firstDocFields.variants[0].length
                      ? firstDocFields.variants[0]
                      : firstDocFields.fields || [])
                  : [];

                const qcDocument: QCValidationDocument = {
                  id: refreshed.first_named_insured || selectedQCDocument.id,
                  documentName: refreshed.first_named_insured || selectedQCDocument.documentName,
                  documentType: 'Account',
                  priority: 'High',
                  documentImage: firstDoc.presigned_url,
                  tabbedFields: firstDoc.tabbedFields,
                  fields: defaultFields,
                  attachments: attachments,
                  status: refreshed.documents?.[0]?.status,
                };

                // Update the document state to trigger re-render with fresh data
                setSelectedQCDocument(qcDocument);
                // Ensure we stay on QC validation view
                setCurrentView("qc-validation");
                didRefresh = true;
                return; // Exit early since we successfully refreshed
              }
            } catch (refreshError) {
              // If refresh fails, log error but don't fall back to dashboard
              console.error('Failed to refresh QC document after submission:', refreshError);
            }
          }
        }
      } catch (error) {
        // QC API submission failed, using fallback
      }
      
      // If we could not refresh the policy data, fall back to old behavior
      if (!didRefresh) {
        // Decrease QC queue count
        setQcQueueCount((prev) => Math.max(0, prev - 1));
        // Return to dashboard
        setCurrentView("dashboard");
        setSelectedQCDocument(null);
      }
    });
  }, [withLoading, selectedQCDocument]);

  const handleLogout = useCallback(() => {
    logout();
    // Reset all view states to ensure clean state after logout
    setCurrentView("dashboard");
    setSelectedDocument(null);
    setSelectedQCDocument(null);
    setIsReadOnlyView(false);
  }, [logout]);

  // Memoized values for performance
  const currentUserRole = useMemo(() => user?.role, [user]);
  const isLoggedInState = useMemo(() => isAuthenticated, [isAuthenticated]);
  const currentTheme = useMemo(() => theme, [theme]);
  const isLoading = useMemo(() => appLoading || isNavigating, [appLoading, isNavigating]);

  const body = (
    <div className="size-full">
      {isInitializing ? (
        <LoadingPage text="Initializing application..." />
      ) : !isLoggedInState ? (
        <LazyComponents.LoginPage
          theme={currentTheme}
          onToggleTheme={toggleTheme}
        />
      ) : currentUserRole === "Admin" ? (
        <LazyComponents.AdminDashboard
          onLogout={handleLogout}
          theme={currentTheme}
          onToggleTheme={toggleTheme}
        />
      ) : currentUserRole === "QC" ? (
        currentView === "dashboard" ? (
          <LazyComponents.QCDashboard
            onValidateClick={handleQCValidateClick}
            onViewHistoryClick={handleViewQCHistory}
            onLogout={handleLogout}
            theme={currentTheme}
            onToggleTheme={toggleTheme}
          />
        ) : currentView === "qc-history-view" && selectedQCDocument ? (
          <LazyComponents.QCValidationScreen
            document={selectedQCDocument}
            queueCount={qcQueueCount}
            onBack={handleBackToDashboard}
            onSubmit={handleSubmitQCReview}
            onLogout={handleLogout}
            theme={currentTheme}
            onToggleTheme={toggleTheme}
            isReadOnly={isReadOnlyView}
            onDocumentRefresh={handleRefreshQCDocument}
          />
        ) : currentView === "qc-validation" && selectedQCDocument ? (
          <LazyComponents.QCValidationScreen
            document={selectedQCDocument}
            queueCount={qcQueueCount}
            onBack={handleBackToDashboard}
            onSubmit={handleSubmitQCReview}
            onLogout={handleLogout}
            theme={currentTheme}
            onToggleTheme={toggleTheme}
            onDocumentRefresh={handleRefreshQCDocument}
          />
        ) : null
      ) : currentUserRole === "Reviewer" ? (
        currentView === "dashboard" ? (
          <LazyComponents.ReviewerDashboard
            onValidateClick={handleValidateClick}
            onViewHistoryClick={handleViewHistory}
            onLogout={handleLogout}
            theme={currentTheme}
            onToggleTheme={toggleTheme}
          />
        ) : currentView === "validation" && selectedDocument ? (
          <LazyComponents.ValidationScreen
            document={selectedDocument}
            queueCount={queueCount}
            onBack={handleBackToDashboard}
            onSubmit={handleSubmitValidation}
            onLogout={handleLogout}
            theme={currentTheme}
            onToggleTheme={toggleTheme}
            isReadOnly={isReadOnlyView}
          />
        ) : currentView === "history-view" && selectedDocument ? (
          <LazyComponents.ValidationScreen
            document={selectedDocument}
            queueCount={queueCount}
            onBack={handleBackToDashboard}
            onSubmit={handleSubmitValidation}
            onLogout={handleLogout}
            theme={currentTheme}
            onToggleTheme={toggleTheme}
            isReadOnly={isReadOnlyView}
          />
        ) : null
      ) : currentView === "dashboard" ? (
        <LazyComponents.Dashboard
          onValidateClick={handleValidateClick}
          onViewHistoryClick={handleViewHistory}
          onLogout={handleLogout}
          theme={currentTheme}
          onToggleTheme={toggleTheme}
        />
      ) : currentView === "history-view" && selectedDocument ? (
        <LazyComponents.ValidationScreen
          document={selectedDocument}
          queueCount={queueCount}
          onBack={handleBackToDashboard}
          onSubmit={handleSubmitValidation}
          onLogout={handleLogout}
          theme={currentTheme}
          onToggleTheme={toggleTheme}
          isReadOnly={isReadOnlyView}
        />
      ) : selectedDocument ? (
        <LazyComponents.ValidationScreen
          document={selectedDocument}
          queueCount={queueCount}
          onBack={handleBackToDashboard}
          onSubmit={handleSubmitValidation}
          onLogout={handleLogout}
          theme={currentTheme}
          onToggleTheme={toggleTheme}
        />
      ) : null}
      
      {isLoading && <LoadingOverlay />}
    </div>
  );

  return (
    <ErrorBoundary
      children={
        <>
          {body}
          <Toaster />
        </>
      }
    />
  );
};

function App() {
  return (
    <AuthProvider children={<AppContent />} />
  );
}

export default App;