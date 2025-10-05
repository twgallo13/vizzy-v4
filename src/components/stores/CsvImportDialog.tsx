import * as React from "react";
import { useState, useRef } from "react";

// UI
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";

// Data/types
import type { Store } from "@/models/core";
import {
  parseStoresCsv,
  processStoreImport,
  downloadErrorReport,
  type ImportResult,
} from "@/lib/csv";

// === Field contracts (must match SPS) ===
const REQUIRED_FIELDS = [
  "storeNumber",
  "name",
  "city",
  "state",
  "zip",
  "status",
] as const;
const OPTIONAL_FIELDS = [
  "address1",
  "address2",
  "storeType",
  "phone",
  "website",
  "managerUid",
  "notes",
] as const;
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as readonly string[];

// Steps
type ImportStep = "upload" | "mapping" | "processing" | "complete";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (stores: Store[]) => void; // returns successfully-imported rows
}

export function CsvImportDialog({ open, onOpenChange, onImport }: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [isProcessing, setIsProcessing] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]); // rows as parsed
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult<Store> | null>(null);

  // Derive a default mapping when we know headers
  function buildInitialMapping(headers: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const h of headers) {
      // try exact match first
      const exact = ALL_FIELDS.find((f) => f.toLowerCase() === h.toLowerCase());
      if (exact) {
        map[h] = exact;
        continue;
      }
      // simple heuristics
      const normalized = h.replace(/\s+/g, "").toLowerCase();
      const guess = ALL_FIELDS.find((f) => normalized.includes(f.toLowerCase()));
      map[h] = guess ?? ""; // empty means skipped
    }
    return map;
  }

  const handleReset = () => {
    setStep("upload");
    setIsProcessing(false);
    setFile(null);
    setRawData([]);
    setDetectedHeaders([]);
    setHeaderMapping({});
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsProcessing(true);
    try {
      // Parse CSV -> array of objects (keys = CSV headers)
      const rows = (await parseStoresCsv(selected)) as any[];
      if (!rows || rows.length === 0) {
        throw new Error("CSV appears to be empty.");
      }
      setRawData(rows);

      const headers = Object.keys(rows[0]);
      setDetectedHeaders(headers);
      setHeaderMapping(buildInitialMapping(headers));
      setStep("mapping");
    } catch (err) {
      alert("Error parsing CSV. Please check the file and try again.");
      handleReset();
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceedFromMapping = React.useMemo(() => {
    const mapped = Object.values(headerMapping).filter(Boolean);
    return REQUIRED_FIELDS.every((f) => mapped.includes(f));
  }, [headerMapping]);

  const handleProcessImport = async () => {
    if (!rawData.length) return;
    setIsProcessing(true);
    setStep("processing");
    try {
      // Map raw rows -> Store-shaped keys (partial), based on headerMapping
      const mappedData = rawData.map((row) => {
        const dest: any = {};
        for (const [csvHeader, field] of Object.entries(headerMapping)) {
          if (!field) continue; // skipped
          if (row[csvHeader] !== undefined) dest[field] = row[csvHeader];
        }
        return dest;
      });

      const result = processStoreImport(mappedData);
      setImportResult(result);
      const success = (result?.success ?? []) as Store[];
      if (success.length) onImport(success);
      setStep("complete");
    } catch (err) {
      alert("Error processing import. Please review mapping and try again.");
      setStep("mapping");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "upload":
        return "Upload CSV";
      case "mapping":
        return "Map Headers";
      case "processing":
        return "Processing Import";
      case "complete":
        return "Import Results";
      default:
        return "CSV Import";
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "upload":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upload CSV</CardTitle>
                <CardDescription>
                  Choose a .csv with store data. You’ll map the headers next.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="csvFile">CSV File</Label>
                  <Input
                    id="csvFile"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    disabled={isProcessing}
                    onChange={handleFileChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "mapping":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Header Mapping</CardTitle>
                <CardDescription>
                  Match each CSV column to a store field. Required fields are marked.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {detectedHeaders.map((header) => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="flex-1">
                      <Badge variant="outline" className="text-xs">
                        {header}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={headerMapping[header] ?? ""}
                        onValueChange={(value) =>
                          setHeaderMapping((prev) => ({
                            ...prev,
                            [header]: value === "none" ? "" : value,
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
                          {ALL_FIELDS.map((field) => (
                            <SelectItem key={field} value={field}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">{field}</span>
                                {REQUIRED_FIELDS.includes(field as any) && (
                                  <Badge className="text-[10px]" variant="secondary">
                                    required
                                  </Badge>
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
          </div>
        );

      case "processing":
        return (
          <div className="space-y-6 text-center py-8">
            <AlertCircle className="mx-auto h-6 w-6" />
            <p className="text-sm">Processing import…</p>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-4">
            {importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Import Summary</CardTitle>
                  <CardDescription>Review results below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Success: {importResult.success?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Errors: {importResult.errors?.length ?? 0}
                    </span>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadErrorReport(importResult.errors!)}
                      >
                        <Download className="mr-2 h-4 w-4" /> Error report
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV of stores to import."}
            {step === "mapping" && "Map your CSV headers to the correct store fields."}
            {step === "processing" && "Processing rows…"}
            {step === "complete" && "Review the results and download the error report if needed."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">{renderStepContent()}</div>

        <DialogFooter className="gap-2">
          {step === "upload" && (
            <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
              <Upload className="mr-2 h-4 w-4" /> Choose file
            </Button>
          )}
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleProcessImport} disabled={isProcessing || !canProceedFromMapping}>
                Process Import
              </Button>
            </>
          )}
          {step === "complete" && (
            <>
              <Button variant="outline" onClick={handleReset}>Import Another</Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CsvImportDialog;
