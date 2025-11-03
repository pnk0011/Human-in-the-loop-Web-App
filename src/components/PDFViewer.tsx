import React, { useCallback, useState } from 'react';
import { Button } from './ui/button';
import { Download, FileText, AlertCircle } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  fileName?: string;
  className?: string;
}

export function PDFViewer({ url, fileName, className = "" }: PDFViewerProps) {
  const [hasError, setHasError] = useState(false);

  const downloadPDF = useCallback(() => {
    const link = window.document.createElement('a');
    link.href = url;
    link.download = fileName || 'document.pdf';
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  }, [url, fileName]);

  const openInNewTab = useCallback(() => {
    window.open(url, '_blank');
  }, [url]);

  // Check if embed failed to load after a timeout
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // If after 3 seconds, check if embed loaded content
      const embedElement = window.document.querySelector(`embed[src="${url}"]`);
      if (embedElement) {
        // Check if embed has dimensions (loaded successfully)
        const hasContent = embedElement.clientHeight > 0 && embedElement.clientWidth > 0;
        if (!hasContent) {
          setHasError(true);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [url]);

  if (hasError) {
    return (
      <div className={`flex flex-col bg-white border w-full min-w-full ${className}`} style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}>
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-900/20 h-full">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            PDF Failed to Load
          </h3>
          <p className="text-red-600 dark:text-red-300 text-center mb-4 max-w-md">
            Unable to load the PDF document. Please try downloading it instead.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={openInNewTab}
              variant="outline"
              className="border-[#0292DC] text-[#0292DC] hover:bg-[#0292DC]/10"
            >
              <FileText className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              onClick={downloadPDF}
              className="bg-[#0292DC] hover:bg-[#012F66] text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Document
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white border w-full min-w-full ${className}`} style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            {fileName || 'PDF Document'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={openInNewTab}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-1" />
            Open
          </Button>
          <Button
            onClick={downloadPDF}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 bg-gray-100 w-full min-w-full" style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}>
        <embed
          src={url}
          type="application/pdf"
          className="w-full h-full border-0"
          style={{ height: 'calc(100vh - 60px)', minHeight: '900px', width: '100%', maxWidth: '100vw' }}
          title={`PDF Document: ${fileName || 'Document'}`}
        />
      </div>
    </div>
  );
}
