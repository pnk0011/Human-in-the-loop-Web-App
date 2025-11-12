import React, { useCallback, useState, useMemo } from 'react';
import MsgReader from '@kenjiuno/msgreader';
import mammoth from 'mammoth/mammoth.browser';
import { Button } from './ui/button';
import { Download, FileText, AlertCircle } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  fileName?: string;
  className?: string;
}

const DOCX_STYLE_MAP = [
  "p[style-name='Title'] => h1.title",
  "p[style-name='Subtitle'] => h2.subtitle",
  "p[style-name='Heading 1'] => h2.heading-one",
  "p[style-name='Heading 2'] => h3.heading-two",
  "p[style-name='Heading 3'] => h4.heading-three",
  "p[style-name='Heading 4'] => h5.heading-four",
  "p[style-name='Heading 5'] => h6.heading-five",
  "p[style-name='Heading 6'] => h6.heading-six",
  "table => table.docx-table",
  "table > row => tr",
  "table > row > cell => td",
  "p[style-name='Code'] => pre.code",
  "p[style-name='Quote'] => blockquote"
];

const DOCX_DEFAULT_STYLES = `
.docx-viewer-root {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  color: #012F66;
  background-color: #ffffff;
  line-height: 1.6;
  font-size: 0.95rem;
}
.docx-viewer-root p {
  margin: 0 0 0.85rem;
}
.docx-viewer-root h1,
.docx-viewer-root h2,
.docx-viewer-root h3,
.docx-viewer-root h4,
.docx-viewer-root h5,
.docx-viewer-root h6 {
  font-weight: 600;
  color: #012F66;
  margin: 1.4rem 0 0.8rem;
  line-height: 1.3;
}
.docx-viewer-root h1 { font-size: 2rem; }
.docx-viewer-root h2 { font-size: 1.6rem; }
.docx-viewer-root h3 { font-size: 1.3rem; }
.docx-viewer-root h4 { font-size: 1.15rem; }
.docx-viewer-root h5 { font-size: 1rem; }
.docx-viewer-root h6 { font-size: 0.95rem; }
.docx-viewer-root ul, .docx-viewer-root ol {
  margin: 0 0 1rem 1.4rem;
  padding-left: 1rem;
}
.docx-viewer-root li {
  margin-bottom: 0.35rem;
}
.docx-viewer-root strong, .docx-viewer-root b {
  font-weight: 600;
}
.docx-viewer-root em, .docx-viewer-root i {
  font-style: italic;
}
.docx-viewer-root table.docx-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2rem 0;
  font-size: 0.9rem;
}
.docx-viewer-root table.docx-table td,
.docx-viewer-root table.docx-table th {
  border: 1px solid #d0d5dd;
  padding: 0.6rem 0.75rem;
  vertical-align: top;
}
.docx-viewer-root table.docx-table th {
  background-color: #f5f7fa;
  font-weight: 600;
}
.docx-viewer-root blockquote {
  border-left: 4px solid #0292DC;
  padding-left: 1rem;
  color: #4a6073;
  margin: 1.2rem 0;
  font-style: italic;
}
.docx-viewer-root pre.code {
  background-color: #f5f7fa;
  border: 1px solid #d0d5dd;
  padding: 0.75rem;
  border-radius: 6px;
  overflow: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: 0.9rem;
}
.docx-viewer-root hr {
  border: 0;
  border-top: 1px solid #d0d5dd;
  margin: 1.5rem 0;
}
`;

interface ParsedMsgData {
  subject?: string;
  senderName?: string;
  senderEmail?: string;
  toRecipients?: string[];
  ccRecipients?: string[];
  bodyHTML?: string;
  bodyText?: string;
  sentOn?: string;
}

export function PDFViewer({ url, fileName, className = "" }: PDFViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [isLoadingMsg, setIsLoadingMsg] = useState(false);
  const [msgData, setMsgData] = useState<ParsedMsgData | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);

  // Detect file type from URL or fileName
  const fileType = useMemo(() => {
    const fileUrl = url.toLowerCase();
    const name = (fileName || '').toLowerCase();
    
    // Helper function to check if string ends with extension
    const hasExtension = (str: string, ext: string): boolean => {
      return str.endsWith(ext) || str.includes(ext + '?') || str.includes(ext + '&');
    };
    
    // Check extensions in order of specificity (more specific first)
    // Check XLSX before XLS to avoid false positives
    if (hasExtension(fileUrl, '.xlsx') || hasExtension(name, '.xlsx')) {
      return 'xlsx';
    }
    if (hasExtension(fileUrl, '.xls') || hasExtension(name, '.xls')) {
      return 'xls';
    }
    // Check DOCX before DOC to avoid false positives
    if (hasExtension(fileUrl, '.docx') || hasExtension(name, '.docx')) {
      return 'docx';
    }
    if (hasExtension(fileUrl, '.doc') || hasExtension(name, '.doc')) {
      return 'doc';
    }
    if (hasExtension(fileUrl, '.pdf') || hasExtension(name, '.pdf')) {
      return 'pdf';
    }
    if (hasExtension(fileUrl, '.csv') || hasExtension(name, '.csv')) {
      return 'csv';
    }
    if (hasExtension(fileUrl, '.msg') || hasExtension(name, '.msg')) {
      return 'msg';
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
      case 'msg':
        return 'application/vnd.ms-outlook';
      default:
        return 'application/pdf';
    }
  }, [fileType]);

  // Determine if the URL belongs to the API domain (requires auth headers)
  const apiBaseUrl = useMemo(() => {
    const value = (import.meta as any).env?.VITE_API_BASE_URL || 'https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat';
    return value.endsWith('/') ? value : `${value}/`;
  }, []);

  const shouldAttachAuth = useMemo(() => {
    try {
      const normalizedUrl = url || '';
      if (!normalizedUrl) return false;
      return normalizedUrl.startsWith(apiBaseUrl);
    } catch (error) {
      return false;
    }
  }, [url, apiBaseUrl]);

  // Load and parse CSV / MSG files
  React.useEffect(() => {
    let isCancelled = false;
    const resetState = () => {
      if (isCancelled) return;
      setCsvData([]);
      setMsgData(null);
      setIsLoadingCsv(false);
      setIsLoadingMsg(false);
    };

    const tdata = localStorage.getItem('accessToken');
    const apiKey = (import.meta as any).env?.VITE_HEADER_KEY || 'jLGO7tJFHxB0bVc0UmGe6Esns9pkiJR8V3lV8qJ5';

    const baseHeaders: HeadersInit = {
      Accept: fileType === 'csv' ? 'text/csv,text/plain,*/*' : '*/*',
    };

    if (shouldAttachAuth) {
      if (tdata) {
        baseHeaders['Authorization'] = `Bearer ${tdata}`;
      }
      baseHeaders['x-api-key'] = apiKey;
    }

    const fetchWithFallback = async () => {
      try {
        const primaryResponse = await fetch(url, {
          credentials: shouldAttachAuth ? 'include' : 'omit',
          headers: baseHeaders,
        });

        if (!primaryResponse.ok) {
          if (shouldAttachAuth && [401, 403, 415].includes(primaryResponse.status)) {
            return await fetch(url);
          }
          return primaryResponse;
        }

        return primaryResponse;
      } catch (error) {
        if (shouldAttachAuth) {
          return await fetch(url);
        }
        throw error;
      }
    };

    if (fileType === 'csv' || fileType === 'msg') {
      const isMsg = fileType === 'msg';

      if (isMsg) {
        setIsLoadingMsg(true);
      } else {
        setIsLoadingCsv(true);
      }

      setHasError(false);
      setCsvData([]);
      setMsgData(null);

      fetchWithFallback()
        .then(async (response) => {
          if (isCancelled) return;

          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }

          if (isMsg) {
            const buffer = await response.arrayBuffer();
            if (isCancelled) return;

            if (!buffer.byteLength) {
              throw new Error('MSG file is empty');
            }

            const reader = new MsgReader(buffer);
            const fileData: any = reader.getFileData();

            const toRecipients: string[] = [];
            const ccRecipients: string[] = [];

            (fileData.recipients || []).forEach((recipient: any) => {
              const displayName = recipient?.name || recipient?.email || recipient?.displayName;
              if (!displayName) return;
              const typeValue = recipient?.type ?? recipient?.recipientType ?? recipient?.recipType;
              if (typeValue === 2 || `${typeValue}`.toLowerCase() === 'cc') {
                ccRecipients.push(displayName);
              } else {
                toRecipients.push(displayName);
              }
            });

            if (!isCancelled) {
              setMsgData({
                subject: fileData.subject,
                senderName: fileData.senderName,
                senderEmail: fileData.senderEmail,
                toRecipients,
                ccRecipients,
                bodyHTML: fileData.bodyHTML,
                bodyText: fileData.body,
                sentOn: fileData.sentOn || fileData.messageDeliveryTime,
              });
              setIsLoadingMsg(false);
            }
          } else {
            const contentType = response.headers.get('content-type')?.toLowerCase() || '';
            if (contentType && !contentType.includes('text/csv') && !contentType.includes('text/plain')) {
              // Not an expected CSV response, but still attempt to parse as text
            }

            const text = await response.text();
            if (isCancelled) return;

            if (!text || text.trim().length === 0) {
              throw new Error('CSV file is empty');
            }

            const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const lines = normalizedText.split('\n').filter((line) => line.trim() !== '');

            if (lines.length === 0) {
              throw new Error('CSV file has no data');
            }

            const parsed = lines.map((line) => {
              const result: string[] = [];
              let current = '';
              let inQuotes = false;

              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];

                if (char === '"') {
                  if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                  } else {
                    inQuotes = !inQuotes;
                  }
                } else if (char === ',' && !inQuotes) {
                  result.push(current);
                  current = '';
                } else {
                  current += char;
                }
              }

              result.push(current);
              return result;
            });

            if (parsed.length > 0) {
              const maxColumns = parsed[0].length;
              const normalizedParsed = parsed.map((row) => {
                const normalizedRow = [...row];
                while (normalizedRow.length < maxColumns) {
                  normalizedRow.push('');
                }
                return normalizedRow.slice(0, maxColumns);
              });

              if (!isCancelled) {
                setCsvData(normalizedParsed);
                setIsLoadingCsv(false);
              }
            } else {
              throw new Error('CSV file has no data');
            }
          }
        })
        .catch(() => {
          if (isCancelled) return;
          setHasError(true);
          if (fileType === 'msg') {
            setMsgData(null);
            setIsLoadingMsg(false);
          } else {
            setCsvData([]);
            setIsLoadingCsv(false);
          }
        });
    } else {
      resetState();
      setHasError(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [url, fileType, shouldAttachAuth]);

  // Load and render DOCX files as HTML
  React.useEffect(() => {
    if (fileType !== 'docx') {
      setDocxHtml(null);
      setIsLoadingDocx(false);
      return;
    }

    let isCancelled = false;
    setIsLoadingDocx(true);
    setDocxHtml(null);
    setHasError(false);

    const tdata = localStorage.getItem('accessToken');
    const apiKey = (import.meta as any).env?.VITE_HEADER_KEY || 'jLGO7tJFHxB0bVc0UmGe6Esns9pkiJR8V3lV8qJ5';

    const baseHeaders: HeadersInit = {
      Accept: '*/*',
    };

    if (shouldAttachAuth) {
      if (tdata) {
        baseHeaders['Authorization'] = `Bearer ${tdata}`;
      }
      baseHeaders['x-api-key'] = apiKey;
    }

    const fetchWithFallback = async () => {
      try {
        const response = await fetch(url, {
          credentials: shouldAttachAuth ? 'include' : 'omit',
          headers: baseHeaders,
        });

        if (!response.ok) {
          if (shouldAttachAuth && [401, 403, 415].includes(response.status)) {
            const fallback = await fetch(url);
            if (!fallback.ok) {
              throw new Error(`Failed to fetch DOCX: ${fallback.status}`);
            }
            return fallback;
          }
          throw new Error(`Failed to fetch DOCX: ${response.status}`);
        }

        return response;
      } catch (error) {
        if (shouldAttachAuth) {
          const fallback = await fetch(url);
          if (!fallback.ok) {
            throw new Error(`Failed to fetch DOCX: ${fallback.status}`);
          }
          return fallback;
        }
        throw error;
      }
    };

    fetchWithFallback()
      .then(async (response) => {
        if (isCancelled) return;

        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        if (!arrayBuffer.byteLength) {
          throw new Error('DOCX file is empty');
        }

        const { value: html } = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: DOCX_STYLE_MAP,
            includeDefaultStyleMap: true,
          },
        );
        if (!isCancelled) {
          setDocxHtml(html || '<p>No content available.</p>');
          setIsLoadingDocx(false);
        }
      })
      .catch(() => {
        if (isCancelled) return;
        setDocxHtml(null);
        setIsLoadingDocx(false);
        setHasError(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [url, fileType, shouldAttachAuth]);

  // Get viewer URL for Office documents
  const getViewerUrl = useCallback(() => {
    // Use Microsoft Office Online viewer for supported documents
    if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'doc') {
      // Encode the URL for the Office Online viewer
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    return url;
  }, [url, fileType]);

  // Check if embed/iframe failed to load after a timeout
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // For Office documents viewed through Office Online
      if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'doc') {
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
      case 'msg':
        return 'Email';
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
          ) : csvData.length > 0 ? (
            <div className="h-full w-full bg-white overflow-auto" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="flex-1 overflow-auto p-4">
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300" style={{ minWidth: '100%' }}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      {csvData.length > 0 && (
                        <tr>
                          {csvData[0].map((header, index) => (
                            <th
                              key={index}
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 bg-gray-50"
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody className="bg-white">
                      {csvData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                          {csvData[0].map((_, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 text-sm text-gray-700 border border-gray-300"
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {row[cellIndex] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '400px' }}>
              <p className="text-gray-600">No data to display</p>
            </div>
          )
        ) : fileType === 'msg' ? (
          isLoadingMsg ? (
            <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0292DC] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading email...</p>
              </div>
            </div>
          ) : msgData ? (
            <div className="h-full w-full overflow-auto bg-white">
              <div className="max-w-3xl mx-auto p-6 space-y-6">
                <div className="space-y-2 border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-[#012F66]">
                    {msgData.subject || 'No subject'}
                  </h2>
                  <div className="text-sm text-gray-600">
                    <span>{msgData.senderName || msgData.senderEmail || 'Unknown sender'}</span>
                    {msgData.senderEmail && (
                      <span className="ml-2 text-gray-500">&lt;{msgData.senderEmail}&gt;</span>
                    )}
                  </div>
                  {msgData.sentOn && (
                    <div className="text-xs text-gray-500">
                      {new Date(msgData.sentOn).toLocaleString()}
                    </div>
                  )}
                  {msgData.toRecipients?.length ? (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-[#012F66]">To:</span>{' '}
                      {msgData.toRecipients.join(', ')}
                    </div>
                  ) : null}
                  {msgData.ccRecipients?.length ? (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-[#012F66]">Cc:</span>{' '}
                      {msgData.ccRecipients.join(', ')}
                    </div>
                  ) : null}
                </div>

                <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="prose prose-sm max-w-none p-4 text-[#012F66]">
                    {msgData.bodyHTML ? (
                      <div dangerouslySetInnerHTML={{ __html: msgData.bodyHTML }} />
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {msgData.bodyText || 'No message body available.'}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '400px' }}>
              <p className="text-gray-600">No email content available.</p>
            </div>
          )
        ) : fileType === 'docx' ? (
          isLoadingDocx ? (
            <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0292DC] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Word document...</p>
              </div>
            </div>
          ) : docxHtml ? (
            <div className="h-full w-full overflow-auto bg-white">
              <div className="max-w-4xl mx-auto p-8">
                <style>{DOCX_DEFAULT_STYLES}</style>
                <div className="docx-viewer-root" dangerouslySetInnerHTML={{ __html: docxHtml }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '400px' }}>
              <p className="text-gray-600">No content available.</p>
            </div>
          )
        ) : fileType === 'xlsx' || fileType === 'xls' || fileType === 'doc' ? (
          // Use iframe with Microsoft Office Online viewer for Excel and legacy Word documents
          <iframe
            src={getViewerUrl()}
            className="w-full h-full border-0"
            style={{ height: 'calc(100vh - 60px)', minHeight: '900px', width: '100%', maxWidth: '100vw' }}
            title={`${getDocumentTypeName()} Document: ${fileName || 'Document'}`}
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
