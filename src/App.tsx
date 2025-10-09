import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { ValidationScreen } from "./components/ValidationScreen";
import { AdminDashboard } from "./components/AdminDashboard";
import { QCDashboard } from "./components/QCDashboard";
import { QCValidationScreen } from "./components/QCValidationScreen";

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

type UserRole = "Admin" | "Reviewer" | "QC";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] =
    useState<UserRole>("Reviewer");
  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "validation"
    | "qc-validation"
    | "history-view"
    | "qc-history-view"
  >("dashboard");
  const [selectedDocument, setSelectedDocument] =
    useState<ValidationDocument | null>(null);
  const [selectedQCDocument, setSelectedQCDocument] =
    useState<QCValidationDocument | null>(null);
  const [queueCount, setQueueCount] = useState(24);
  const [qcQueueCount, setQcQueueCount] = useState(5);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleValidateClick = (item: any) => {
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
  };

  const handleQCValidateClick = (item: any) => {
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
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedDocument(null);
    setSelectedQCDocument(null);
    setIsReadOnlyView(false);
  };

  const handleViewHistory = (doc: any) => {
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
  };

  const handleViewQCHistory = (doc: any) => {
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
  };

  const handleSubmitValidation = (
    validations: FieldValidation[],
  ) => {
    console.log("All validations submitted:", validations);
    // Decrease queue count
    setQueueCount((prev) => Math.max(0, prev - 1));
    // Return to dashboard
    setCurrentView("dashboard");
    setSelectedDocument(null);
  };

  const handleSubmitQCReview = (decisions: QCDecision[]) => {
    console.log("QC review submitted:", decisions);
    // Decrease QC queue count
    setQcQueueCount((prev) => Math.max(0, prev - 1));
    // Return to dashboard
    setCurrentView("dashboard");
    setSelectedQCDocument(null);
  };

  const handleLogin = (role: UserRole = "Reviewer") => {
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole("Reviewer");
    setCurrentView("dashboard");
    setSelectedDocument(null);
  };

  return (
    <div className="size-full">
      {!isLoggedIn ? (
        <LoginPage
          onLogin={handleLogin}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : userRole === "Admin" ? (
        <AdminDashboard
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : userRole === "QC" ? (
        currentView === "dashboard" ? (
          <QCDashboard
            onValidateClick={handleQCValidateClick}
            onViewHistoryClick={handleViewQCHistory}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        ) : currentView === "qc-history-view" &&
          selectedQCDocument ? (
          <QCValidationScreen
            document={selectedQCDocument}
            queueCount={qcQueueCount}
            onBack={handleBackToDashboard}
            onSubmit={handleSubmitQCReview}
            theme={theme}
            onToggleTheme={toggleTheme}
            isReadOnly={isReadOnlyView}
          />
        ) : currentView === "qc-validation" &&
          selectedQCDocument ? (
          <QCValidationScreen
            document={selectedQCDocument}
            queueCount={qcQueueCount}
            onBack={handleBackToDashboard}
            onSubmit={handleSubmitQCReview}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        ) : null
      ) : currentView === "dashboard" ? (
        <Dashboard
          onValidateClick={handleValidateClick}
          onViewHistoryClick={handleViewHistory}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : currentView === "history-view" && selectedDocument ? (
        <ValidationScreen
          document={selectedDocument}
          queueCount={queueCount}
          onBack={handleBackToDashboard}
          onSubmit={handleSubmitValidation}
          theme={theme}
          onToggleTheme={toggleTheme}
          isReadOnly={isReadOnlyView}
        />
      ) : selectedDocument ? (
        <ValidationScreen
          document={selectedDocument}
          queueCount={queueCount}
          onBack={handleBackToDashboard}
          onSubmit={handleSubmitValidation}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : null}
    </div>
  );
}