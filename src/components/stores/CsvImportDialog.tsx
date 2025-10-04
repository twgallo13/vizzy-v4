import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { parseStoresCsv, processStoreImport, downloadErrorReport, type ImportResult } from '@/lib/csv';
import type { Store } from '@/models/core';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (stores: Store[]) => void;
}

type ImportStep = 'upload' | 'preview' | 'mapping' | 'processing' | 'complete';

const REQUIRED_FIELDS = ['storeNumber', 'name', 'city', 'state', 'zip', 'status'];
const OPTIONAL_FIELDS = ['address1', 'address2', 'storeType', 'phone', 'website', 'managerUid', 'notes'];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export function CsvImportDialog({ open, onOpenChange, onImport }: CsvImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult<Store> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const data = await parseStoresCsv(selectedFile);
      setRawData(data);
      
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        setDetectedHeaders(headers);
        
        // Auto-map headers that match exactly
        const initialMapping: Record<string, string> = {};
        headers.forEach(header => {
          const normalizedHeader = header.toLowerCase().trim();
          const matchingField = ALL_FIELDS.find(field => 
            field.toLowerCase() === normalizedHeader
          );
          if (matchingField) {
            initialMapping[header] = matchingField;
          }
        });
        setHeaderMapping(initialMapping);
        
        setStep('mapping');
      }
    } catch (error) {
      alert('Error parsing CSV file. Please check the format and try again.');
      handleReset();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessImport = async () => {
    if (!rawData.length) return;
    
    setStep('processing');
    setIsProcessing(true);

    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Map the raw data using header mapping
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
      setStep('complete');
    } catch (error) {
      alert('Error processing import. Please try again.');
      setStep('mapping');
    } finally {
      setIsProcessing(false);
    }
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
                disabled={isProcessing}
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Required CSV Format</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="mb-2">Required headers:</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {REQUIRED_FIELDS.map(header => (
                    <Badge key={header} variant="outline" className="text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
                <p className="mb-2">Optional headers:</p>
                <div className="flex flex-wrap gap-1">
                  {OPTIONAL_FIELDS.map(header => (
                    <Badge key={header} variant="secondary" className="text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Map CSV Headers</h3>
                <p className="text-sm text-muted-foreground">
                  Map your CSV headers to store fields
                </p>
              </div>
              <Button variant="outline" onClick={handleReset}>
                Select Different File
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Header Mapping</CardTitle>
                <CardDescription>
                  Match your CSV columns to the correct store fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {detectedHeaders.map(header => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="flex-1">
                      <Badge variant="outline" className="text-xs">
                        {header}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <Select 
                        value={headerMapping[header] || ''} 
                        onValueChange={(value) => 
                          setHeaderMapping(prev => ({
                            ...prev,
                            [header]: value === 'none' ? '' : value
                          }))
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">Skip this column</span>
                          </SelectItem>
                          {ALL_FIELDS.map(field => (
                            <SelectItem key={field} value={field}>
                              {field}
                              {REQUIRED_FIELDS.includes(field) && (
                                <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="border rounded-lg max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {detectedHeaders.map(header => (
                      <th key={header} className="text-left p-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t">
                      {detectedHeaders.map(header => (
                        <td key={header} className="p-2">
                          {String(row[header] || '')}
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

      case 'processing':
        return (
          <div className="space-y-4 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="font-medium">Processing Import</h3>
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
                <CardHeader>
                  <CardTitle className="text-sm text-green-600">Success</CardTitle>
                </CardHeader>
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
                <CardHeader>
                  <CardTitle className="text-sm text-red-600">Errors</CardTitle>
                </CardHeader>
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
        return <div>Unknown step</div>;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'upload': return 'Upload CSV File';
      case 'mapping': return 'Map Headers';
      case 'processing': return 'Processing Import';
      case 'complete': return 'Import Results';
      default: return 'Import Stores';
    }
  };

  const canProceedFromMapping = () => {
    // Check if all required fields are mapped
    const mappedFields = Object.values(headerMapping).filter(Boolean);
    return REQUIRED_FIELDS.every(field => mappedFields.includes(field));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Select and upload a CSV file containing store data'}
            {step === 'mapping' && 'Map your CSV headers to the correct store fields'}
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
              {step === 'mapping' && (
                <Button 
                  onClick={handleProcessImport} 
                  disabled={isProcessing || !canProceedFromMapping()}
                >
                  Process Import
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