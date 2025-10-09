import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingPage, LoadingOverlay } from "./components/LoadingComponents";
import { useLoading } from "./hooks/useLoading";
import { LazyComponents } from "./components/LazyComponents";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RoleGuard } from "./components/RoleGuard";

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

  const handleValidateClick = useCallback((item: any) => {
    withLoading(async () => {
      // Simulate loading document data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a document with multiple fields based on the queue item
      const document: ValidationDocument = {
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

      setSelectedDocument(document);
      setCurrentView("validation");
    });
  }, [withLoading]);

  const handleQCValidateClick = useCallback((item: any) => {
    withLoading(async () => {
      // Simulate loading QC document data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a QC document with reviewer validations
      const qcDocument: QCValidationDocument = {
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

  const handleSubmitValidation = useCallback((
    validations: FieldValidation[],
  ) => {
    withLoading(async () => {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log("All validations submitted:", validations);
      // Decrease queue count
      setQueueCount((prev) => Math.max(0, prev - 1));
      // Return to dashboard
      setCurrentView("dashboard");
      setSelectedDocument(null);
    });
  }, [withLoading]);

  const handleSubmitQCReview = useCallback((decisions: QCDecision[]) => {
    withLoading(async () => {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log("QC review submitted:", decisions);
      // Decrease QC queue count
      setQcQueueCount((prev) => Math.max(0, prev - 1));
      // Return to dashboard
      setCurrentView("dashboard");
      setSelectedQCDocument(null);
    });
  }, [withLoading]);

  const handleLogout = useCallback(() => {
    logout();
    setCurrentView("dashboard");
    setSelectedDocument(null);
    setSelectedQCDocument(null);
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
              theme={currentTheme}
              onToggleTheme={toggleTheme}
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
            theme={currentTheme}
            onToggleTheme={toggleTheme}
          />
        ) : null}
        
        {isLoading && <LoadingOverlay />}
      </div>
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