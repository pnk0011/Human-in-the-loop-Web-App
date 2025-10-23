import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Download, Loader2, AlertCircle, FileText } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  fileName?: string;
  className?: string;
}

export function PDFViewer({ url, fileName, className = "" }: PDFViewerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleIframeLoad = useCallback(() => {
    console.log('PDF iframe loaded successfully');
    setLoading(false);
    setError(null);
  }, []);

  const handleIframeError = useCallback(() => {
    console.error('PDF iframe failed to load:', url);
    setError('Failed to display PDF document');
    setLoading(false);
  }, [url]);

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

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading PDF document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 bg-red-50 rounded-lg ${className}`}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-red-700 font-medium">{error}</p>
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={openInNewTab}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            <Button 
              onClick={downloadPDF}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white rounded-lg border ${className}`}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
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
      <div className="flex-1 p-4 overflow-auto bg-gray-100">
        <div className="flex justify-center">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading PDF preview...</p>
              </div>
            </div>
          )}
          
          <iframe
            src={url}
            className="w-full h-full min-h-[600px] border border-gray-300 rounded shadow-lg"
            style={{ maxHeight: '80vh', display: loading ? 'none' : 'block' }}
            title={`PDF Document: ${fileName || 'Document'}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      </div>
    </div>
  );
}
