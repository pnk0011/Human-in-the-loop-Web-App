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
  allFields?: any[]; // Store all fields from API for submission (including those with qc_action not null)
}

interface QCValidationDocument extends ValidationDocument {
  reviewer: string;
  reviewedDate: string;
  reviewerValidations: ReviewerValidation[];
}

interface ReviewerValidation {
  fieldId: string;
  action: "accept" | "correct" | "reject";
  correctedValue?: string;
  note?: string;
  rejectReason?: string;
}

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

const AppContent = React.memo(function AppContent() {
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
    };
    
    initializeApp();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const handleValidateClick = useCallback(async (item: any) => {
    return withLoading(async () => {
      // Try to load real API data first, fallback to mock data
      let document: ValidationDocument;
    
      try {
        // Import the API service
        const { documentOperationsAPI } = await import('./services/documentOperationsAPI');
        
        // Try to fetch real document data from API
        const response = await documentOperationsAPI.reviewFile({ file_name: item.document });
        
        if (response.success && response.data?.document) {
          const apiDoc = response.data.document;
          
          // Filter fields to show only those where qc_action is null or "sendback"
          const visibleFields = apiDoc.fields.filter(field => 
            !field.qc_action || field.qc_action === 'sendback'
          );
          
          // Store all fields for submission (including those with qc_action not null)
          const allFields = apiDoc.fields;
          
          // Transform API response to component format
          // Only show fields where qc_action is null or "sendback"
          document = {
            id: apiDoc.id || item.id,
            documentName: apiDoc.documentName || item.document,
            documentType: apiDoc.documentType || item.type,
            priority: item.priority,
            documentImage: apiDoc.documentImage, // Include document image URL from API
            allFields: allFields, // Store all fields for submission
            fields: visibleFields.map((field, index) => ({
              id: `field-${index + 1}`,
              fieldName: field.entity_type,
              fieldDescription: `AI extracted ${field.entity_type.toLowerCase()} from document`,
              extractedValue: field.updated_entity_value || field.entity_value,
              confidence: field.confidence,
              expectedFormat: 'Text',
              location: { x: 48, y: 175 + (index * 40), width: 180, height: 24 },
            })),
          };
        } else {
          throw new Error('API response failed');
        }
      } catch (error) {
        // Using fallback mock data for validation
        
        // Fallback to mock data with original look and feel
        document = {
          id: item.id,
          documentName: item.document,
          documentType: item.type,
          priority: item.priority,
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
            {
              id: "field-4",
              fieldName: "Invoice Number",
              fieldDescription: "The unique invoice identifier",
              extractedValue: "INV-2024-0947",
              confidence: 78,
              expectedFormat: "INV-YYYY-XXXX",
              location: { x: 48, y: 155, width: 180, height: 24 },
            },
            {
              id: "field-5",
              fieldName: "Due Date",
              fieldDescription: "The date when payment is due",
              extractedValue: "April 15, 2024",
              confidence: 88,
              expectedFormat: "Month DD, YYYY",
              location: { x: 48, y: 245, width: 160, height: 24 },
            },
          ],
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
        const response = await documentOperationsAPI.qcOpenFile({ file_name: item.document });
        
        if (response.success && response.data?.document) {
          const apiDoc = response.data.document;
          
          // Transform API response to component format
          qcDocument = {
            id: apiDoc.id || item.id,
            documentName: apiDoc.documentName || item.document,
            documentType: apiDoc.documentType || item.type,
            priority: item.priority,
            reviewer: apiDoc.reviewer || item.reviewer,
            reviewedDate: apiDoc.qc_updated_dt?.split(' ')[0] || item.reviewedDate,
            documentImage: apiDoc.documentImage, // Include document image URL from API
            fields: apiDoc.fields.map((field, index) => ({
              id: `field-${index + 1}`,
              fieldName: field.entity_type,
              fieldDescription: `AI extracted ${field.entity_type.toLowerCase()} from document`,
              extractedValue: field.entity_value,
              confidence: field.confidence,
              expectedFormat: 'Text',
              location: { x: 48, y: 175 + (index * 40), width: 180, height: 24 },
            })),
            reviewerValidations: apiDoc.fields.map(field => ({
              fieldId: `field-${apiDoc.fields.indexOf(field) + 1}`,
              action: field.reviewer_action,
              correctedValue: field.updated_entity_text || undefined,
              note: field.reviewer_comment || undefined,
            })),
          };
        } else {
          throw new Error('QC API response failed');
        }
      } catch (error) {
        // Using fallback mock data for QC validation
        
        // Fallback to mock data with original look and feel
        qcDocument = {
          id: item.id,
          documentName: item.document,
          documentType: item.type,
          priority: item.priority,
          reviewer: item.reviewer,
          reviewedDate: item.reviewedDate,
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
            {
              id: "field-4",
              fieldName: "Invoice Number",
              fieldDescription: "The unique invoice identifier",
              extractedValue: "INV-2024-0947",
              confidence: 78,
              expectedFormat: "INV-YYYY-XXXX",
              location: { x: 48, y: 155, width: 180, height: 24 },
            },
            {
              id: "field-5",
              fieldName: "Due Date",
              fieldDescription: "The date when payment is due",
              extractedValue: "April 15, 2024",
              confidence: 88,
              expectedFormat: "Month DD, YYYY",
              location: { x: 48, y: 245, width: 160, height: 24 },
            },
          ],
          reviewerValidations: [
            {
              fieldId: "field-1",
              action: "correct",
              correctedValue: "$12,850.00",
              note: "Small discrepancy found in total calculation",
            },
            {
              fieldId: "field-2",
              action: "accept",
            },
            {
              fieldId: "field-3",
              action: "accept",
              note: "Verified with policy document",
            },
            {
              fieldId: "field-4",
              action: "accept",
            },
            {
              fieldId: "field-5",
              action: "correct",
              correctedValue: "April 14, 2024",
              note: "Date was incorrectly extracted",
            },
          ],
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
        reviewer: doc.reviewer,
        reviewedDate: doc.reviewedDate,
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
        ],
        reviewerValidations: [
          {
            fieldId: "field-1",
            action: "correct",
            correctedValue: "$12,850.00",
            note: "Small discrepancy found in total calculation",
          },
          {
            fieldId: "field-2",
            action: "accept",
          },
        ],
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

  const handleSubmitQCReview = useCallback(async (decisions: QCDecision[]) => {
    return withLoading(async () => {
      try {
        // Try to submit to QC API if we have a selected QC document
        if (selectedQCDocument) {
          const { documentOperationsAPI } = await import('./services/documentOperationsAPI');
          
          // Transform QC decisions to API format
          const qcValidations = decisions.map(decision => ({
            entity_type: selectedQCDocument.fields.find(f => f.id === decision.fieldId)?.fieldName || '',
            qc_action: decision.decision === 'approve' ? 'approve' as const : 
                      decision.decision === 'sendback' ? 'sendback' as const : 'reject' as const,
            qc_comment: decision.qcNote || null,
          }));

          const response = await documentOperationsAPI.qcUpdateFile({
            file_name: selectedQCDocument.documentName,
            validations: qcValidations,
          });

          if (response.message) {
            // QC API submission successful
          } else {
            // QC API submission failed, using fallback
          }
        }
      } catch (error) {
        // QC API submission failed, using fallback
      }
      
      // Always update UI regardless of API success/failure
      // Decrease QC queue count
      setQcQueueCount((prev) => Math.max(0, prev - 1));
      // Return to dashboard
      setCurrentView("dashboard");
      setSelectedQCDocument(null);
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

  return (
    <ErrorBoundary>
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
      <Toaster />
    </ErrorBoundary>
  );
});

const App = React.memo(function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
});

export default App;