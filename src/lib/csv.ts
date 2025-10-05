import Papa from 'papaparse';
import type { Store } from '@/models/core';

export interface ImportResult<T> {
  success: T[];
  errors: Array<{
    row: number;
    reason: string;
    data: any;
  }>;
  successCount: number;
  errorCount: number;
}

export function parseStoresCsv(file: File): Promise<Store[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${errors.map(e => e.message).join(', ')}`));
          return;
        }
        
        // Cast to Store[] - validation happens separately
        const rows = (data as any[]).filter(Boolean) as Store[];
        resolve(rows);
      },
      error: reject
    });
  });
}

export function validateStoreRow(row: any, index: number): { isValid: boolean; error?: string } {
  const required = ['storeNumber', 'name', 'city', 'state', 'zip', 'status'];
  
  for (const field of required) {
    if (!row[field] || row[field].toString().trim() === '') {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validate status enum
  const validStatuses = ['open', 'closed', 'comingSoon'];
  if (!validStatuses.includes(row.status)) {
    return { isValid: false, error: `Invalid status: ${row.status}. Must be one of: ${validStatuses.join(', ')}` };
  }
  
  // Validate storeType enum
  const validTypes = ['mall', 'street', 'outlet', 'popUp'];
  if (row.storeType && !validTypes.includes(row.storeType)) {
    return { isValid: false, error: `Invalid storeType: ${row.storeType}. Must be one of: ${validTypes.join(', ')}` };
  }
  
  return { isValid: true };
}

export function processStoreImport(rawData: any[]): ImportResult<Store> {
  const result: ImportResult<Store> = {
    success: [],
    errors: [],
    successCount: 0,
    errorCount: 0
  };
  
  rawData.forEach((row, index) => {
    const validation = validateStoreRow(row, index);
    
    if (!validation.isValid) {
      result.errors.push({
        row: index + 1,
        reason: validation.error || 'Unknown validation error',
        data: row
      });
      result.errorCount++;
      return;
    }
    
    // Transform to Store interface
    const store: Store = {
      storeId: `s_${Date.now()}_${index}`, // Generate unique ID
      storeNumber: row.storeNumber.toString(),
      name: row.name,
      address1: row.address1 || '',
      address2: row.address2 || undefined,
      city: row.city,
      state: row.state,
      zip: row.zip,
      status: row.status as 'open' | 'closed' | 'comingSoon',
      storeType: row.storeType || 'street',
      phone: row.phone || undefined,
      website: row.website || undefined,
      managerUid: row.managerUid || undefined,
      notes: row.notes || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    result.success.push(store);
    result.successCount++;
  });
  
  return result;
}

export function generateErrorReport(errors: ImportResult<any>['errors']): string {
  const header = 'Row,Error,Data\n';
  const rows = errors.map(error => 
    `${error.row},"${error.reason}","${JSON.stringify(error.data).replace(/"/g, '""')}"`
  ).join('\n');
  
  return header + rows;
}

export function downloadErrorReport(errors: ImportResult<any>['errors'], filename: string = 'import-errors.csv') {
  const csvContent = generateErrorReport(errors);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}