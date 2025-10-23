import React, { useState, useEffect } from 'react';
import { ValidationHeader } from './AppHeader';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
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
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Moon,
  Sun
} from 'lucide-react';
import logo from 'figma:asset/d37108ff06015dcbcdb272cec41a1cfc0b3b3dfd.png';
import { LoadingSpinner } from './LoadingComponents';
import { PDFViewer } from './PDFViewer';

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

interface ReviewerValidation {
  fieldId: string;
  action: 'accept' | 'correct' | 'reject';
  correctedValue?: string;
  note?: string;
  rejectReason?: string;
}

interface ValidationDocument {
  id: string;
  documentName: string;
  documentType: string;
  priority: 'High' | 'Medium' | 'Low';
  reviewer: string;
  reviewedDate: string;
  fields: ExtractedField[];
  reviewerValidations: ReviewerValidation[];
  documentImage?: string; // URL to the document image
}

interface QCDecision {
  fieldId: string;
  decision: 'approve' | 'sendback' | null;
  qcNote?: string;
}

interface QCValidationScreenProps {
  document: ValidationDocument;
  queueCount: number;
  onBack: () => void;
  onSubmit: (decisions: QCDecision[]) => Promise<void>;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isReadOnly?: boolean;
}

export function QCValidationScreen({ document, queueCount, onBack, onSubmit, onLogout, theme, onToggleTheme, isReadOnly = false }: QCValidationScreenProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(document.fields[0]?.id || '');

  // Track QC decisions for each field
  const [qcDecisions, setQcDecisions] = useState<Record<string, QCDecision>>(
    Object.fromEntries(
      document.fields.map((field) => [
        field.id,
        { fieldId: field.id, decision: null }
      ])
    )
  );

  const selectedField = document.fields.find((f) => f.id === selectedFieldId);
  const reviewerValidation = document.reviewerValidations.find((v) => v.fieldId === selectedFieldId);
  const currentDecision = qcDecisions[selectedFieldId];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault();
          handleDecisionChange('approve');
        } else if (e.key === 's') {
          e.preventDefault();
          handleDecisionChange('sendback');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmitAll();
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = document.fields.findIndex((f) => f.id === selectedFieldId);
        if (e.key === 'ArrowDown' && currentIndex < document.fields.length - 1) {
          setSelectedFieldId(document.fields[currentIndex + 1].id);
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          setSelectedFieldId(document.fields[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedFieldId, qcDecisions, document.fields]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 400));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleDecisionChange = (decision: 'approve' | 'sendback') => {
    setQcDecisions((prev) => ({
      ...prev,
      [selectedFieldId]: {
        ...prev[selectedFieldId],
        decision,
      },
    }));
  };

  const handleQcNoteChange = (note: string) => {
    setQcDecisions((prev) => ({
      ...prev,
      [selectedFieldId]: {
        ...prev[selectedFieldId],
        qcNote: note,
      },
    }));
  };

  const handleSubmitAll = async () => {
    const decisions = Object.values(qcDecisions);
    
    // Check if all fields have been reviewed
    const unreviewed = decisions.filter((d) => !(d as QCDecision).decision);
    if (unreviewed.length > 0) {
      alert(`Please review all fields. ${unreviewed.length} field(s) remaining.`);
      return;
    }

    // Set loading state and submit
    setIsSubmitting(true);
    try {
      await onSubmit(decisions as QCDecision[]);
    } finally {
      // Reset loading state after submission
      setIsSubmitting(false);
    }
  };

  const getReviewedFieldsCount = () => {
    return Object.values(qcDecisions).filter((d) => (d as QCDecision).decision).length;
  };

  const getFieldStatusIcon = (fieldId: string) => {
    const decision = qcDecisions[fieldId];
    if (!decision.decision) return null;
    
    if (decision.decision === 'approve') {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    } else if (decision.decision === 'sendback') {
      return <AlertCircle className="w-4 h-4 text-[#FF0081]" />;
    }
  };

  const getReviewerActionBadge = (action: string) => {
    switch (action) {
      case 'accept':
        return <Badge className="bg-green-600 text-white">Accepted</Badge>;
      case 'correct':
        return <Badge className="bg-[#FFC018] text-white">Corrected</Badge>;
      case 'reject':
        return <Badge className="bg-[#FF0081] text-white">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (!selectedField || !reviewerValidation) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex flex-col">
      <ValidationHeader 
        onBack={onBack}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        title="QC Portal"
        subtitle={document.documentType}
        customUser={{
          name: "QC User",
          role: "QC",
          initials: "QC"
        }}
      />

      <div className="flex-1 flex gap-1 p-2">
        {/* Document Viewer */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 p-2 bg-[#F5F7FA]' : 'flex-1'}`}>
          <div className="bg-[#E5E7EB] rounded-lg h-full flex flex-col">
            {/* Document Display */}
            <div className="flex-1 relative overflow-auto flex items-center justify-center p-1">
              <div 
                className="bg-white shadow-lg relative"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.2s'
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
                        className="h-full w-full"
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
                          console.log('QC Document image loaded successfully:', document.documentImage);
                        }}
                        onError={(e) => {
                          console.error('Failed to load QC document image:', document.documentImage);
                          console.error('QC Image error event:', e);
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
            <div className="bg-white border-t border-[#D0D5DD] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                  className="border-[#D0D5DD]"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-[#012F66] min-w-[60px] text-center">{zoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 400}
                  className="border-[#D0D5DD]"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-[#D0D5DD]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-[#012F66]">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[#D0D5DD]"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="mx-2 h-6 w-px bg-[#D0D5DD]" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="border-[#D0D5DD]"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[350px] flex flex-col gap-4">
          {/* Reviewer Info */}
          <div className="bg-[#0292DC]/10 border border-[#0292DC] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#80989A]">Reviewed by</p>
                <p className="text-[#012F66]">{document.reviewer}</p>
              </div>
              <div className="text-right">
                <p className="text-[#80989A]">Date</p>
                <p className="text-[#012F66]">{document.reviewedDate}</p>
              </div>
            </div>
          </div>

          {/* Fields List */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-[#012F66] mb-3">Fields to Review ({document.fields.length})</h3>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2 pr-4">
                {document.fields.map((field, index) => {
                  const validation = document.reviewerValidations.find(v => v.fieldId === field.id);
                  return (
                    <div
                      key={field.id}
                      onClick={() => setSelectedFieldId(field.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedFieldId === field.id
                          ? 'border-[#FF0081] bg-[#FF0081]/5'
                          : 'border-[#E5E7EB] hover:border-[#0292DC] bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[#80989A]">#{index + 1}</span>
                            <span className="text-[#012F66]">{field.fieldName}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {validation && getReviewerActionBadge(validation.action)}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getFieldStatusIcon(field.id)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Field Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-[#012F66] mb-2">{selectedField.fieldName}</h3>
            <p className="text-[#80989A] mb-4">{selectedField.fieldDescription}</p>
          </div>

          {/* AI Extraction */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#0292DC]" />
              <span className="text-[#80989A]">Original AI Extraction</span>
            </div>
            
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <span className="text-[#80989A]">Confidence</span>
                <span className="text-[#012F66]">{selectedField.confidence}%</span>
              </div>
            </div>

            <div className="bg-[#F5F7FA] p-4 rounded border border-[#D0D5DD] mb-4">
              <p className="text-[#012F66]">{selectedField.extractedValue}</p>
            </div>

            {/* Reviewer's Decision */}
            <div className="border-t border-[#D0D5DD] pt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#FFC018]" />
                <span className="text-[#80989A]">Reviewer's Validation</span>
              </div>

              <div className="mb-3">
                {getReviewerActionBadge(reviewerValidation.action)}
              </div>

              {reviewerValidation.action === 'correct' && reviewerValidation.correctedValue && (
                <div className="mb-3">
                  <p className="text-[#80989A] mb-1">Corrected Value:</p>
                  <div className="bg-[#FFC018]/10 p-3 rounded border border-[#FFC018]">
                    <p className="text-[#012F66]">{reviewerValidation.correctedValue}</p>
                  </div>
                </div>
              )}

              {reviewerValidation.action === 'reject' && reviewerValidation.rejectReason && (
                <div className="mb-3">
                  <p className="text-[#80989A] mb-1">Rejection Reason:</p>
                  <div className="bg-[#FF0081]/10 p-3 rounded border border-[#FF0081]">
                    <p className="text-[#012F66]">{reviewerValidation.rejectReason}</p>
                  </div>
                </div>
              )}

              {reviewerValidation.note && (
                <div>
                  <p className="text-[#80989A] mb-1">Reviewer Notes:</p>
                  <div className="bg-[#F5F7FA] p-3 rounded border border-[#D0D5DD]">
                    <p className="text-[#012F66]">{reviewerValidation.note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QC Decision */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-[#012F66] mb-4">Your QC Decision</h4>
            
            <div className="flex gap-2 mb-4">
              <Button
                variant={currentDecision.decision === 'approve' ? 'default' : 'outline'}
                onClick={() => handleDecisionChange('approve')}
                className={
                  currentDecision.decision === 'approve'
                    ? 'flex-1 bg-green-600 hover:bg-green-700 text-white'
                    : 'flex-1 border-green-600 text-green-600 hover:bg-green-50'
                }
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant={currentDecision.decision === 'sendback' ? 'default' : 'outline'}
                onClick={() => handleDecisionChange('sendback')}
                className={
                  currentDecision.decision === 'sendback'
                    ? 'flex-1 bg-[#FF0081] hover:bg-[#FF0081]/90 text-white'
                    : 'flex-1 border-[#FF0081] text-[#FF0081] hover:bg-[#FF0081]/10'
                }
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Send Back
              </Button>
            </div>

            {/* QC Notes */}
            <div className="space-y-2">
              <label className="text-[#012F66]">QC Notes (Optional)</label>
              <Textarea
                value={currentDecision.qcNote || ''}
                onChange={(e) => handleQcNoteChange(e.target.value)}
                placeholder="Add notes about this field review..."
                rows={3}
                className="border-[#D0D5DD] resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitAll}
            disabled={getReviewedFieldsCount() === 0 || isSubmitting}
            className="w-full bg-[#0292DC] hover:bg-[#012F66] text-white"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" text="Submitting..." />
            ) : (
              <>
                Submit QC Review ({getReviewedFieldsCount()}/{document.fields.length})
                <span className="ml-2 text-xs opacity-70">(⌘Enter)</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}