import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { parseStoresCsv, processStoreImport, downloadErrorReport, type ImportResult } from '@/lib/csv';
import type { Store } from '@/models/core';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (stores: Store[]) => void;
}

type ImportStep = 'upload' | 'preview' | 'mapping' | 'processing' | 'complete';

export function CsvImportDialog({ open, onOpenChange, onImport }: CsvImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult<Store> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Required and optional store fields for mapping
  const REQUIRED_FIELDS = ['storeNumber', 'name', 'city', 'state', 'zip', 'status'];
  const OPTIONAL_FIELDS = ['address1', 'address2', 'storeType', 'phone', 'website', 'managerUid', 'notes'];
  const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const data = await parseStoresCsv(selectedFile);
      setRawData(data);
      
      // Detect headers from the first row
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      setDetectedHeaders(headers);
      
      // Auto-map headers that match exactly
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        if (ALL_FIELDS.includes(header)) {
          autoMapping[header] = header;
        }
      });
      setHeaderMapping(autoMapping);
      
      setStep('mapping');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessImport = () => {
    setIsProcessing(true);
    setStep('processing');

    // Simulate async processing with mapping
    setTimeout(() => {
      // Apply header mapping to raw data
      const mappedData = rawData.map(row => {
        const mappedRow: any = {};
        Object.entries(headerMapping).forEach(([csvHeader, storeField]) => {
          if (storeField && row[csvHeader] !== undefined) {
            mappedRow[storeField] = row[csvHeader];
          }
        });
        return mappedRow;
      });
      
      const result = processStoreImport(mappedData);
      setImportResult(result);
      setIsProcessing(false);
      setStep('complete');
    }, 1000);
  };

  const handleConfirmImport = () => {
    if (importResult?.success) {
      onImport(importResult.success);
    }
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setRawData([]);
    setHeaderMapping({});
    setDetectedHeaders([]);
    setImportResult(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Upload CSV File</p>
              <p className="text-muted-foreground mb-4">
                Select a CSV file with store data to import
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="max-w-xs mx-auto"
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Required CSV Format</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="mb-2">Required headers:</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {['storeNumber', 'name', 'city', 'state', 'zip', 'status'].map(header => (
                    <Badge key={header} variant="outline" className="text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
                <p className="mb-2">Optional headers:</p>
                <div className="flex flex-wrap gap-1">
                  {['address1', 'address2', 'storeType', 'phone', 'website', 'managerUid', 'notes'].map(header => (
                    <Badge key={header} variant="secondary" className="text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Preview Data</h3>
                <p className="text-sm text-muted-foreground">
                  {rawData.length} rows detected in {file?.name}
                </p>
              </div>
              <Button variant="outline" onClick={handleReset}>
                Select Different File
              </Button>
            </div>
            
            <div className="border rounded-lg max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {rawData.length > 0 && Object.keys(rawData[0]).map(header => (
                      <th key={header} className="text-left p-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t">
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="p-2">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {rawData.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                Showing first 5 rows of {rawData.length} total
              </p>
            )}
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Map CSV Headers to Store Fields</h3>
                <p className="text-sm text-muted-foreground">
                  Match your CSV headers to the required store data fields
                </p>
              </div>
              <Button variant="outline" onClick={handleReset}>
                Select Different File
              </Button>
            </div>
            
            {/* Mapping Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Header Mapping</CardTitle>
                <CardDescription>
                  Select which store field each CSV column should map to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detectedHeaders.map(csvHeader => (
                    <div key={csvHeader} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {csvHeader}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="flex-1">
                        <Select
                          value={headerMapping[csvHeader] || ''}
                          onValueChange={(value) => 
                            setHeaderMapping(prev => ({ ...prev, [csvHeader]: value }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select store field..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">
                              <span className="text-muted-foreground">Skip this column</span>
                            </SelectItem>
                            {REQUIRED_FIELDS.map(field => (
                              <SelectItem key={field} value={field}>
                                <div className="flex items-center gap-2">
                                  <span>{field}</span>
                                  <Badge variant="destructive" className="text-xs">required</Badge>
                                </div>
                              </SelectItem>
                            ))}
                            {OPTIONAL_FIELDS.map(field => (
                              <SelectItem key={field} value={field}>
                                <div className="flex items-center gap-2">
                                  <span>{field}</span>
                                  <Badge variant="secondary" className="text-xs">optional</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Validation Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {REQUIRED_FIELDS.map(field => {
                    const isMapped = Object.values(headerMapping).includes(field);
                    return (
                      <div key={field} className="flex items-center justify-between">
                        <span className="text-sm">{field}</span>
                        {isMapped ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mapped
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Required
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Sample Data Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sample Data Preview</CardTitle>
                <CardDescription>Preview of how your data will be imported</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg max-h-32 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {REQUIRED_FIELDS.concat(OPTIONAL_FIELDS.filter(f => Object.values(headerMapping).includes(f))).map(field => (
                          <th key={field} className="text-left p-2 font-medium">
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.slice(0, 3).map((row, index) => (
                        <tr key={index} className="border-t">
                          {REQUIRED_FIELDS.concat(OPTIONAL_FIELDS.filter(f => Object.values(headerMapping).includes(f))).map(field => {
                            const csvHeader = Object.entries(headerMapping).find(([, storeField]) => storeField === field)?.[0];
                            return (
                              <td key={field} className="p-2">
                                {csvHeader ? String(row[csvHeader] || '') : ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-medium">Processing import...</p>
            <p className="text-sm text-muted-foreground">Validating {rawData.length} rows</p>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4">
            <div className="text-center">
              {importResult?.errorCount === 0 ? (
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              ) : (
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              )}
              <h3 className="font-medium text-lg mb-2">Import Complete</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult?.successCount || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Successful</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResult?.errorCount || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {importResult?.errors && importResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Import Errors
                  </CardTitle>
                  <CardDescription>
                    The following rows had errors and were skipped
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-32 overflow-auto">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                        <span className="font-medium">Row {error.row}:</span> {error.reason}
                      </div>
                    ))}
                  </div>
                  
                  {importResult.errors.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      And {importResult.errors.length - 5} more errors...
                    </p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => downloadErrorReport(importResult.errors, `${file?.name}_errors.csv`)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                </CardContent>
              </Card>
            )}

            {importResult?.successCount === 0 && (
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 font-medium">No valid rows to import</p>
                <p className="text-red-600 text-sm">Please fix the errors and try again</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'upload': return 'Upload CSV File';
      case 'preview': return 'Preview & Confirm';
      case 'mapping': return 'Map Headers to Fields';
      case 'processing': return 'Processing Import';
      case 'complete': return 'Import Results';
      default: return 'Import Stores';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Select and upload a CSV file containing store data'}
            {step === 'preview' && 'Review the data before importing'}
            {step === 'mapping' && 'Configure how CSV headers map to store fields'}
            {step === 'processing' && 'Please wait while we process your import'}
            {step === 'complete' && 'Review the import results'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            <div className="flex gap-2">
              {step === 'preview' && (
                <Button onClick={() => setStep('mapping')} disabled={isProcessing}>
                  Configure Mapping
                </Button>
              )}
              
              {step === 'mapping' && (
                <Button 
                  onClick={handleProcessImport} 
                  disabled={isProcessing || !REQUIRED_FIELDS.every(field => Object.values(headerMapping).includes(field))}
                >
                  {REQUIRED_FIELDS.every(field => Object.values(headerMapping).includes(field)) 
                    ? 'Process Import' 
                    : 'Map Required Fields First'}
                </Button>
              )}
              
              {step === 'complete' && importResult && importResult.successCount > 0 && (
                <Button onClick={handleConfirmImport}>
                  Import {importResult.successCount} Store{importResult.successCount !== 1 ? 's' : ''}
                </Button>
              )}
              
              {step === 'complete' && importResult && importResult.successCount === 0 && (
                <Button variant="outline" onClick={handleReset}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}