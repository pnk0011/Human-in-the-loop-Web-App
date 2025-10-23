import React, { useCallback } from 'react';
import { Button } from './ui/button';
import { Download, FileText } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  fileName?: string;
  className?: string;
}

export function PDFViewer({ url, fileName, className = "" }: PDFViewerProps) {
  const downloadPDF = useCallback(() => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [url, fileName]);

  const openInNewTab = useCallback(() => {
    window.open(url, '_blank');
  }, [url]);

  return (
    <div className={`flex flex-col bg-white rounded-lg border w-full ${className}`}>
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
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <FileText className="w-4 h-4 mr-1" />
            Open
          </Button>
          <Button
            onClick={downloadPDF}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 bg-gray-100 w-full">
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
