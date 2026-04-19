/**
 * Content Migration Utilities
 * 
 * Handles migration and categorization of legacy content types:
 * - Referral earning types → Offer categories
 * - Online earning apps → Offers or Deals sections
 * - Super deals → Modernized structure
 * - Offer cards → Updated categorization
 */

export type LegacyReferralType = 
  | "direct_referral"
  | "tier_commission"
  | "lifetime_earnings"
  | "bonus_rewards"
  | "contest_prizes";

export type OfferCategory = 
  | "money_making"
  | "viral_deals"
  | "health"
  | "education"
  | "finance";

export type ContentSection = "offers" | "deals" | "super_deals";

export interface LegacyEarningApp {
  id: string;
  name: string;
  type: string;
  payout: number;
  engagement: "high" | "medium" | "low";
  category?: string;
}

export interface MigrationResult {
  success: boolean;
  itemId: string;
  fromType: string;
  toCategory: string;
  timestamp: number;
  error?: string;
}

export interface MigrationReport {
  totalItems: number;
  successful: number;
  failed: number;
  distribution: Record<string, number>;
  errors: string[];
}

/**
 * Categorize legacy referral earning types into modern offer categories
 */
export function categorizeReferralType(type: LegacyReferralType): OfferCategory {
  const mapping: Record<LegacyReferralType, OfferCategory> = {
    direct_referral: "money_making",
    tier_commission: "money_making",
    lifetime_earnings: "money_making",
    bonus_rewards: "money_making",
    contest_prizes: "money_making",
  };

  return mapping[type] || "money_making";
}

/**
 * Determine section for online earning apps based on characteristics
 */
export function categorizeEarningApp(app: LegacyEarningApp): ContentSection {
  // High payout apps go to super deals
  if (app.payout >= 100) {
    return "super_deals";
  }

  // High engagement apps go to offers
  if (app.engagement === "high") {
    return "offers";
  }

  // Medium/low engagement apps go to deals
  return "deals";
}

/**
 * Map legacy app to modern offer category
 */
export function mapAppToCategory(app: LegacyEarningApp): OfferCategory {
  const categoryMap: Record<string, OfferCategory> = {
    "cashback": "money_making",
    "survey": "money_making",
    "task": "money_making",
    "shopping": "viral_deals",
    "deals": "viral_deals",
    "health": "health",
    "fitness": "health",
    "education": "education",
    "learning": "education",
    "finance": "finance",
    "investment": "finance",
  };

  const appType = app.type?.toLowerCase() || "";
  const appCategory = app.category?.toLowerCase() || "";

  // Check type first, then category
  if (categoryMap[appType]) {
    return categoryMap[appType];
  }

  if (categoryMap[appCategory]) {
    return categoryMap[appCategory];
  }

  // Default to money_making for earning apps
  return "money_making";
}

/**
 * Create audit log entry for content migration
 */
export function createMigrationAuditLog(result: MigrationResult): void {
  const logEntry = {
    timestamp: result.timestamp,
    action: "content_migration",
    itemId: result.itemId,
    fromType: result.fromType,
    toCategory: result.toCategory,
    success: result.success,
    error: result.error,
  };

  // Log to console (in production, this would go to a logging service)
  console.log("[Migration Audit]", logEntry);

  // Store in localStorage for admin review
  try {
    const existingLogs = localStorage.getItem("migration_audit_logs");
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    logs.push(logEntry);
    
    // Keep only last 1000 entries
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    localStorage.setItem("migration_audit_logs", JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to store migration audit log:", error);
  }
}

/**
 * Generate migration report from results
 */
export function generateMigrationReport(results: MigrationResult[]): MigrationReport {
  const report: MigrationReport = {
    totalItems: results.length,
    successful: 0,
    failed: 0,
    distribution: {},
    errors: [],
  };

  results.forEach((result) => {
    if (result.success) {
      report.successful++;
      
      // Count distribution
      if (!report.distribution[result.toCategory]) {
        report.distribution[result.toCategory] = 0;
      }
      report.distribution[result.toCategory]++;
    } else {
      report.failed++;
      if (result.error) {
        report.errors.push(`${result.itemId}: ${result.error}`);
      }
    }
  });

  return report;
}

/**
 * Validate content data integrity (round-trip check)
 */
export function validateContentIntegrity<T extends Record<string, any>>(
  original: T,
  migrated: T,
  fieldsToCheck: (keyof T)[]
): boolean {
  for (const field of fieldsToCheck) {
    if (original[field] !== migrated[field]) {
      console.error(`Data integrity check failed for field: ${String(field)}`);
      console.error(`Original: ${original[field]}, Migrated: ${migrated[field]}`);
      return false;
    }
  }
  return true;
}

/**
 * Get migration audit logs
 */
export function getMigrationAuditLogs(): any[] {
  try {
    const logs = localStorage.getItem("migration_audit_logs");
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error("Failed to retrieve migration audit logs:", error);
    return [];
  }
}

/**
 * Clear migration audit logs
 */
export function clearMigrationAuditLogs(): void {
  try {
    localStorage.removeItem("migration_audit_logs");
  } catch (error) {
    console.error("Failed to clear migration audit logs:", error);
  }
}
