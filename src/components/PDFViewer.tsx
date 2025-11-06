import React, { useCallback, useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Download, FileText, AlertCircle } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  fileName?: string;
  className?: string;
}

export function PDFViewer({ url, fileName, className = "" }: PDFViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [csvBlobUrl, setCsvBlobUrl] = useState<string | null>(null);

  // Detect file type from URL or fileName
  const fileType = useMemo(() => {
    const fileUrl = url.toLowerCase();
    const name = (fileName || '').toLowerCase();
    
    if (fileUrl.includes('.csv') || name.includes('.csv')) {
      return 'csv';
    }
    if (fileUrl.includes('.xlsx') || name.includes('.xlsx')) {
      return 'xlsx';
    }
    if (fileUrl.includes('.xls') || name.includes('.xls')) {
      return 'xls';
    }
    if (fileUrl.includes('.docx') || name.includes('.docx')) {
      return 'docx';
    }
    if (fileUrl.includes('.doc') || name.includes('.doc')) {
      return 'doc';
    }
    if (fileUrl.includes('.pdf') || name.includes('.pdf')) {
      return 'pdf';
    }
    return 'pdf'; // Default to PDF
  }, [url, fileName]);

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

  // Get MIME type based on file type
  const getMimeType = useCallback(() => {
    switch (fileType) {
      case 'csv':
        return 'text/csv';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc':
        return 'application/msword';
      default:
        return 'application/pdf';
    }
  }, [fileType]);

  // Helper function to escape HTML
  const escapeHtml = useCallback((text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }, []);

  // Load and parse CSV file, create HTML table in blob URL
  React.useEffect(() => {
    if (fileType === 'csv') {
      setIsLoadingCsv(true);
      setHasError(false);
      
      // Clean up previous blob URL
      const previousBlobUrl = csvBlobUrl;
      if (previousBlobUrl) {
        URL.revokeObjectURL(previousBlobUrl);
        setCsvBlobUrl(null);
      }
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch CSV file');
          }
          return response.text();
        })
        .then(text => {
          // Parse CSV (simple parser - handles basic CSV format)
          const lines = text.split('\n').filter(line => line.trim() !== '');
          const parsed = lines.map(line => {
            // Handle quoted fields and commas
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              const nextChar = line[i + 1];
              
              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  // Escaped quote
                  current += '"';
                  i++; // Skip next quote
                } else {
                  // Toggle quote state
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            // Add last field
            result.push(current.trim());
            return result;
          });
          
          setCsvData(parsed);
          
          // Create HTML table and convert to blob URL for iframe
          if (parsed.length > 0) {
            const headers = parsed[0];
            const rows = parsed.slice(1);
            
            // Escape headers and rows
            const escapedHeaders = headers.map(h => escapeHtml(h));
            const escapedRows = rows.map(row => 
              headers.map((_, index) => escapeHtml(row[index] || ''))
            );
            
            // Create HTML content
            const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 0;
        margin: 0;
        overflow: auto;
      }
      .table-container {
        width: 100%;
        height: 100vh;
        overflow: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background-color: #f9fafb;
      }
      th {
        background-color: #f9fafb;
        padding: 12px;
        text-align: left;
        font-weight: 600;
        border: 1px solid #e5e7eb;
        white-space: nowrap;
      }
      td {
        padding: 12px;
        border: 1px solid #e5e7eb;
        white-space: nowrap;
      }
      tbody tr:nth-child(even) {
        background-color: #f9fafb;
      }
      tbody tr:hover {
        background-color: #f3f4f6;
      }
    </style>
  </head>
  <body>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            ${escapedHeaders.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${escapedRows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </body>
</html>`;
            
            // Create blob and URL
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            setCsvBlobUrl(blobUrl);
          }
          
          setIsLoadingCsv(false);
        })
        .catch(error => {
          setHasError(true);
          setIsLoadingCsv(false);
        });
    }
    
    // Cleanup blob URL on unmount or when URL changes
    return () => {
      // Cleanup will be handled in the next effect run
    };
  }, [url, fileType, escapeHtml, csvBlobUrl]);

  // Get viewer URL for Office documents
  const getViewerUrl = useCallback(() => {
    // Use Microsoft Office Online viewer for Excel files
    if (fileType === 'xlsx' || fileType === 'xls') {
      // Encode the URL for the Office Online viewer
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    return url;
  }, [url, fileType]);

  // Check if embed/iframe failed to load after a timeout
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // For Office documents (XLSX, XLS), check iframe
      if (fileType === 'xlsx' || fileType === 'xls') {
        const iframeElement = window.document.querySelector(`iframe[src*="${url}"]`);
        if (iframeElement) {
          // Check if iframe has dimensions (loaded successfully)
          const hasContent = iframeElement.clientHeight > 0 && iframeElement.clientWidth > 0;
          if (!hasContent) {
            setHasError(true);
          }
        }
      } else {
        // For PDF and other documents, check embed
        const embedElement = window.document.querySelector(`embed[src="${url}"]`);
        if (embedElement) {
          // Check if embed has dimensions (loaded successfully)
          const hasContent = embedElement.clientHeight > 0 && embedElement.clientWidth > 0;
          if (!hasContent) {
            setHasError(true);
          }
        }
      }
    }, 5000); // Increased timeout for Office documents

    return () => clearTimeout(timer);
  }, [url, fileType]);

  const getDocumentTypeName = () => {
    switch (fileType) {
      case 'csv':
        return 'CSV';
      case 'xlsx':
      case 'xls':
        return 'Excel';
      case 'docx':
      case 'doc':
        return 'Word';
      default:
        return 'PDF';
    }
  };

  if (hasError) {
    return (
      <div className={`flex flex-col bg-white border w-full min-w-full ${className}`} style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}>
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-900/20 h-full">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            {getDocumentTypeName()} Document Failed to Load
          </h3>
          <p className="text-red-600 dark:text-red-300 text-center mb-4 max-w-md">
            Unable to load the {getDocumentTypeName().toLowerCase()} document. Please try downloading it instead.
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
    <div className={`flex flex-col bg-white border ${className}`} style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', overflow: 'hidden' }}>
      {/* Document Controls */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            {fileName || `${getDocumentTypeName()} Document`}
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

      {/* Document Content */}
      <div className="flex-1 bg-gray-100" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {fileType === 'csv' ? (
          // Display CSV using iframe (similar to Excel)
          isLoadingCsv ? (
            <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0292DC] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading CSV file...</p>
              </div>
            </div>
          ) : csvBlobUrl ? (
            <iframe
              src={csvBlobUrl}
              className="w-full h-full border-0"
              style={{ height: 'calc(100vh - 60px)', minHeight: '900px', width: '100%', maxWidth: '100vw' }}
              title={`CSV Document: ${fileName || 'Document'}`}
              onError={() => setHasError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '400px' }}>
              <p className="text-gray-600">No data to display</p>
            </div>
          )
        ) : fileType === 'xlsx' || fileType === 'xls' ? (
          // Use iframe with Microsoft Office Online viewer for Excel files
          <iframe
            src={getViewerUrl()}
            className="w-full h-full border-0"
            style={{ height: 'calc(100vh - 60px)', minHeight: '900px', width: '100%', maxWidth: '100vw' }}
            title={`Excel Document: ${fileName || 'Document'}`}
            onError={() => setHasError(true)}
          />
        ) : (
          // Use embed for PDF and Word documents
          <embed
            src={url}
            type={getMimeType()}
            className="w-full h-full border-0"
            style={{ height: 'calc(100vh - 60px)', minHeight: '900px', width: '100%', maxWidth: '100vw' }}
            title={`${getDocumentTypeName()} Document: ${fileName || 'Document'}`}
          />
        )}
      </div>
    </div>
  );
}
