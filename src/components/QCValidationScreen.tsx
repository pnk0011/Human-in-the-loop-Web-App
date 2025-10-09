import { useState, useEffect } from 'react';
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
  onSubmit: (decisions: QCDecision[]) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isReadOnly?: boolean;
}

export function QCValidationScreen({ document, queueCount, onBack, onSubmit, theme, onToggleTheme, isReadOnly = false }: QCValidationScreenProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(document.fields[0]?.id || '');
  const [highlightOpacity, setHighlightOpacity] = useState(0.3);

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

  const handleSubmitAll = () => {
    const decisions = Object.values(qcDecisions);
    
    // Check if all fields have been reviewed
    const unreviewed = decisions.filter((d) => !d.decision);
    if (unreviewed.length > 0) {
      alert(`Please review all fields. ${unreviewed.length} field(s) remaining.`);
      return;
    }

    onSubmit(decisions);
  };

  const getReviewedFieldsCount = () => {
    return Object.values(qcDecisions).filter((d) => d.decision).length;
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
      {/* Header */}
      <header className="bg-[#012F66] text-white py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logo} alt="MedPro" className="h-8" />
            <span className="text-white/80">QC Portal - {document.documentType}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FFC018] rounded-full flex items-center justify-center">
                <span className="text-[#012F66]">QC</span>
              </div>
              <div>
                <div className="text-white">QC User</div>
                <div className="text-white/60">Quality Control</div>
              </div>
            </div>
            {onToggleTheme && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                className="text-white hover:bg-white/10"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-6 p-6">
        {/* Document Viewer */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 p-6 bg-[#F5F7FA]' : 'flex-1'}`}>
          <div className="bg-[#E5E7EB] rounded-lg h-full flex flex-col">
            {/* Document Display */}
            <div className="flex-1 relative overflow-auto flex items-center justify-center p-8">
              <div 
                className="bg-white shadow-lg relative"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.2s'
                }}
              >
                {/* Sample Invoice Document */}
                <div className="w-[600px] p-12 relative">
                  <div className="text-center mb-8">
                    <h2 className="text-[#012F66] mb-4">INVOICE</h2>
                  </div>
                  
                  <div className="mb-8">
                    <p className="text-[#012F66]">Acme Corporation</p>
                    <p className="text-[#012F66]">Invoice #: INV-2024-0947</p>
                    <p className="text-[#012F66]">Policy #: POL-2024-5678</p>
                    <p className="text-[#012F66]">123 Business Street</p>
                    <p className="text-[#012F66]">New York, NY 10001</p>
                    <p className="text-[#012F66] mt-2">Date: March 15, 2024</p>
                    <p className="text-[#012F66]">Due Date: April 15, 2024</p>
                    <p className="text-[#012F66]">Effective Date: January 1, 2025</p>
                  </div>

                  <div className="mb-8">
                    <p className="text-[#012F66]">Bill To:</p>
                    <p className="text-[#012F66]">ABC Company Ltd</p>
                    <p className="text-[#012F66]">456 Client Avenue</p>
                    <p className="text-[#012F66]">Los Angeles, CA 90001</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-[#012F66]">Total Amount Due: $12,847.50</p>
                  </div>

                  {/* AI Extraction Highlight Boxes */}
                  {document.fields.map((field) => (
                    <div
                      key={field.id}
                      className={`absolute border-2 rounded transition-all ${
                        selectedFieldId === field.id
                          ? 'border-[#FF0081] bg-[#FF0081]'
                          : 'border-[#0292DC] bg-[#0292DC]'
                      }`}
                      style={{
                        left: `${field.location.x}px`,
                        top: `${field.location.y}px`,
                        width: `${field.location.width}px`,
                        height: `${field.location.height}px`,
                        opacity: selectedFieldId === field.id ? highlightOpacity : highlightOpacity * 0.4,
                        pointerEvents: 'none'
                      }}
                    />
                  ))}
                  
                  {/* Label for selected field */}
                  {selectedField && (
                    <div 
                      className="absolute bg-[#FF0081] text-white px-2 py-1 rounded text-xs"
                      style={{
                        left: `${selectedField.location.x}px`,
                        top: `${selectedField.location.y - 20}px`,
                        fontSize: '11px'
                      }}
                    >
                      {selectedField.fieldName}
                    </div>
                  )}
                </div>
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
                <div className="mx-4 h-6 w-px bg-[#D0D5DD]" />
                <span className="text-[#80989A]">Highlight Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={highlightOpacity}
                  onChange={(e) => setHighlightOpacity(parseFloat(e.target.value))}
                  className="w-24 cursor-pointer"
                />
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
        <div className="w-[450px] flex flex-col gap-4">
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
            disabled={getReviewedFieldsCount() === 0}
            className="w-full bg-[#0292DC] hover:bg-[#012F66] text-white"
          >
            Submit QC Review ({getReviewedFieldsCount()}/{document.fields.length})
            <span className="ml-2 text-xs opacity-70">(⌘Enter)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}