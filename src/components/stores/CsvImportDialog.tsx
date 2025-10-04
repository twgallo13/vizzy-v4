import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import type { Store } from '@/models/core';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (stores: Store[]) => void;
}

type ImportStep = 'upload' | 'mapping' | 'processing' | 'complete';

interface ImportResult {
  success: Store[];
  errors: { row: number; message: string; }[];
}

const REQUIRED_FIELDS = ['storeNumber', 'name', 'city', 'state', 'zip', 'status'];
const OPTIONAL_FIELDS = ['address1', 'address2', 'storeType', 'phone', 'website', 'managerUid', 'notes'];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export function CsvImportDialog({ open, onOpenChange, onImport }: CsvImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row');
        handleReset();
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setRawData(dataRows);
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
    } catch (error) {
      alert('Error parsing CSV file. Please check the format and try again.');
      handleReset();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessImport = async () => {
    if (!rawData.length) return;
    
    setIsProcessing(true);
    setStep('processing');

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

      // Process and validate the mapped data
      const result = processStoreImport(mappedData);
      setImportResult(result);
      
      if (result.success.length > 0) {
        onImport(result.success);
      }
      
      setStep('complete');
    } catch (error) {
      alert('Error processing import. Please try again.');
      setStep('mapping');
    } finally {
      setIsProcessing(false);
    }
  };

  const processStoreImport = (data: any[]): ImportResult => {
    const success: Store[] = [];
    const errors: { row: number; message: string; }[] = [];

    data.forEach((row, index) => {
      try {
        // Validate required fields
        const missingFields = REQUIRED_FIELDS.filter(field => !row[field] || row[field].toString().trim() === '');
        if (missingFields.length > 0) {
          errors.push({
            row: index + 2, // +2 because index is 0-based and we skip header row
            message: `Missing required fields: ${missingFields.join(', ')}`
          });
          return;
        }

        // Create store object
        const now = new Date();
        const store: Store = {
          storeId: `store_${Date.now()}_${index}`,
          storeNumber: row.storeNumber,
          name: row.name,
          address1: row.address1 || '',
          address2: row.address2 || '',
          city: row.city,
          state: row.state,
          zip: row.zip,
          storeType: row.storeType || 'street',
          status: row.status as 'open' | 'closed' | 'comingSoon',
          phone: row.phone || '',
          website: row.website || '',
          managerUid: row.managerUid || '',
          notes: row.notes || '',
          createdAt: now,
          updatedAt: now
        };

        success.push(store);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: 'Invalid data format'
        });
      }
    });

    return { success, errors };
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setRawData([]);
    setDetectedHeaders([]);
    setHeaderMapping({});
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
          <div className="space-y-4 text-center">
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Upload CSV File</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select a CSV file containing store data
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="max-w-xs mx-auto"
              />
            </div>
            
            <div className="text-left">
              <h4 className="font-medium mb-2">Required Fields:</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {REQUIRED_FIELDS.map(field => (
                  <Badge key={field} variant="destructive" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
              
              <h4 className="font-medium mb-2">Optional Fields:</h4>
              <div className="flex flex-wrap gap-2">
                {OPTIONAL_FIELDS.map(field => (
                  <Badge key={field} variant="secondary" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-4">
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
                              <div className="flex items-center gap-2">
                                {field}
                                {REQUIRED_FIELDS.includes(field) && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
                <CardDescription>First 5 rows of your data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        {detectedHeaders.map(header => (
                          <th key={header} className="border border-border p-2 bg-muted text-left font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          {detectedHeaders.map(header => (
                            <td key={header} className="border border-border p-2">
                              {String(row[header] || '')}
                            </td>
                          ))}
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
          <div className="space-y-4 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <h3 className="font-medium">Processing Import</h3>
            <p className="text-sm text-muted-foreground">Please wait while we process your data...</p>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4">
            {importResult && (
              <>
                {importResult.success.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Success
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Successfully imported {importResult.success.length} stores
                      </p>
                    </CardContent>
                  </Card>
                )}

                {importResult.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Errors ({importResult.errors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                            <span className="font-medium">Row {error.row}:</span> {error.message}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'upload': return 'Import Store Data';
      case 'mapping': return 'Map Headers';
      case 'processing': return 'Processing Import';
      case 'complete': return 'Import Results';
    }
  };

  const canProceedFromMapping = () => {
    // Check if all required fields are mapped
    const mappedFields = Object.values(headerMapping).filter(Boolean);
    return REQUIRED_FIELDS.every(field => mappedFields.includes(field));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file containing your store data'}
            {step === 'mapping' && 'Map your CSV headers to the correct store fields'}
            {step === 'processing' && 'Processing your import...'}
            {step === 'complete' && 'Review the import results'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={handleReset}>
              {step === 'complete' ? 'Import Another File' : 'Cancel'}
            </Button>
            
            {step === 'mapping' && (
              <Button 
                onClick={handleProcessImport} 
                disabled={isProcessing || !canProceedFromMapping()}
              >
                Process Import ({rawData.length} rows)
              </Button>
            )}

            {step === 'complete' && importResult && importResult.success.length > 0 && (
              <Button onClick={() => onOpenChange(false)}>
                Done
              </Button>
            )}

            {step === 'complete' && importResult && importResult.errors.length > 0 && (
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Try Again
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}