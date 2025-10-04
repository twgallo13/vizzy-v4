import * as XLSX from 'xlsx';
import type { Activity, DayCard } from '@/models/planner';
import type { User } from '@/models/core';

export interface WrikeExportRow {
  'Task Title': string;
  'Assignee (wrikeName)': string;
  'Start': string;
  'Due': string;
  'Channel': string;
}

export interface WrikeExportResult {
  success: boolean;
  rows?: WrikeExportRow[];
  errors?: string[];
  invalidUsers?: string[];
}

/**
 * Validates that all users have proper wrikeName format
 * wrikeName must exactly equal firstName + " " + lastName
 */
export function validateWrikeNames(users: User[]): { valid: User[]; invalid: User[] } {
  const valid: User[] = [];
  const invalid: User[] = [];
  
  users.forEach(user => {
    const expectedWrikeName = `${user.firstName} ${user.lastName}`;
    if (user.wrikeName === expectedWrikeName) {
      valid.push(user);
    } else {
      invalid.push(user);
    }
  });
  
  return { valid, invalid };
}

/**
 * Exports a single day's activities to Wrike XLSX format
 * Validates wrikeName for each assigned user and blocks export if any are invalid
 */
export function exportDayToWrike(
  dayName: string, 
  day: DayCard, 
  usersById: Record<string, User>
): WrikeExportResult {
  const errors: string[] = [];
  const invalidUsers: string[] = [];
  const rows: WrikeExportRow[] = [];
  
  // Filter to approved activities only
  const approvedActivities = day.activities.filter(a => a.status === 'approved');
  
  if (approvedActivities.length === 0) {
    return {
      success: false,
      errors: ['No approved activities to export']
    };
  }
  
  // Process each activity
  approvedActivities.forEach(activity => {
    const user = usersById[activity.ownerUid];
    
    if (!user) {
      errors.push(`User not found for activity ${activity.activityId}: ${activity.ownerUid}`);
      return;
    }
    
    // Strict wrikeName validation
    const expectedWrikeName = `${user.firstName} ${user.lastName}`;
    if (user.wrikeName !== expectedWrikeName) {
      invalidUsers.push(`${user.displayName} (${user.email}): expected "${expectedWrikeName}", got "${user.wrikeName}"`);
      return;
    }
    
    // Create export row
    const title = activity.contentPacket.subjectLine || `${activity.channel} Activity`;
    const dateStr = day.date instanceof Date ? 
      day.date.toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0];
    
    rows.push({
      'Task Title': title,
      'Assignee (wrikeName)': user.wrikeName,
      'Start': dateStr,
      'Due': dateStr,
      'Channel': activity.channel
    });
  });
  
  // Block export if there are invalid users
  if (invalidUsers.length > 0) {
    return {
      success: false,
      errors: [`Invalid wrikeName format for ${invalidUsers.length} user(s)`],
      invalidUsers
    };
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      errors
    };
  }
  
  if (rows.length === 0) {
    return {
      success: false,
      errors: ['No valid activities to export after validation']
    };
  }
  
  return {
    success: true,
    rows
  };
}

/**
 * Generates and downloads XLSX file for Wrike export
 */
export function downloadWrikeExport(dayName: string, rows: WrikeExportRow[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, dayName);
  
  // Set column widths for better readability
  const colWidths = [
    { wch: 30 }, // Task Title
    { wch: 20 }, // Assignee
    { wch: 12 }, // Start
    { wch: 12 }, // Due
    { wch: 10 }  // Channel
  ];
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, `${dayName}_wrike_export.xlsx`);
}

/**
 * Export multiple days to a single XLSX file with multiple sheets
 */
export function exportWeekToWrike(
  weekData: Record<string, DayCard>,
  usersById: Record<string, User>
): WrikeExportResult {
  const wb = XLSX.utils.book_new();
  const allErrors: string[] = [];
  const allInvalidUsers: string[] = [];
  let totalRows = 0;
  
  // Process each day
  Object.entries(weekData).forEach(([dayName, dayCard]) => {
    const result = exportDayToWrike(dayName, dayCard, usersById);
    
    if (!result.success) {
      if (result.errors) allErrors.push(...result.errors);
      if (result.invalidUsers) allInvalidUsers.push(...result.invalidUsers);
      return;
    }
    
    if (result.rows && result.rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(result.rows);
      
      // Set column widths
      const colWidths = [
        { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, dayName);
      totalRows += result.rows.length;
    }
  });
  
  // Block export if there are any invalid users across all days
  if (allInvalidUsers.length > 0) {
    return {
      success: false,
      errors: [`Invalid wrikeName format for ${allInvalidUsers.length} user(s) across the week`],
      invalidUsers: Array.from(new Set(allInvalidUsers)) // Remove duplicates
    };
  }
  
  if (allErrors.length > 0) {
    return {
      success: false,
      errors: allErrors
    };
  }
  
  if (totalRows === 0) {
    return {
      success: false,
      errors: ['No approved activities found for the week']
    };
  }
  
  // Download the file
  XLSX.writeFile(wb, `week_wrike_export.xlsx`);
  
  return {
    success: true,
    rows: [] // Not applicable for multi-day export
  };
}

/**
 * Preview what would be exported without actually generating the file
 */
export function previewWrikeExport(
  dayName: string,
  day: DayCard,
  usersById: Record<string, User>
): { preview: WrikeExportRow[]; warnings: string[] } {
  const result = exportDayToWrike(dayName, day, usersById);
  
  return {
    preview: result.rows || [],
    warnings: result.errors || []
  };
}