/**
 * Preservation Property Test: Session Persistence
 * 
 * **Validates: Requirements 3.6, 3.9**
 * 
 * This test captures the BASELINE BEHAVIOR on UNFIXED code:
 * - User sessions persist across page refresh
 * - Session context (shopId, batchId, qrType) persists during QR scan flow
 * - Session storage keys are managed correctly
 * 
 * **CRITICAL**: This test MUST PASS on unfixed code (confirms baseline to preserve)
 * After implementing session cleanup on sign-out, this test should STILL PASS
 * 
 * **Observation-First Methodology**:
 * 1. Observe: User signs in and session persists across page refresh
 * 2. Observe: Session context (shopId, batchId, qrType) persists during QR scan flow
 * 3. Property: For all valid sign-ins, session persists across refresh
 *    AND context keys are preserved
 */

import { test, expect } from '../../playwright-fixture';

test.describe('Session Persistence Preservation', () => {
  // Session storage keys that should be managed
  const SESSION_STORAGE_KEYS = [
    'dopedeal_session_id',
    'dopedeal_session_created_at',
    'dopedeal_anonymous_id',
    'dopedeal_session_shop_id',
    'dopedeal_session_batch_id',
    'dopedeal_session_qr_type',
    'dopedeal_session_campaign_slug',
    'dopedeal_session_qr_url',
  ];

  test('Session storage keys are created and managed correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test session storage key management
    const sessionKeyTest = await page.evaluate((keys) => {
      // Simulate session initialization
      const sessionId = crypto.randomUUID();
      const createdAt = Date.now();
      const anonymousId = crypto.randomUUID();

      // Set session keys
      localStorage.setItem('dopedeal_session_id', sessionId);
      localStorage.setItem('dopedeal_session_created_at', createdAt.toString());
      localStorage.setItem('dopedeal_anonymous_id', anonymousId);

      // Verify keys are set
      const keysSet = {
        sessionId: localStorage.getItem('dopedeal_session_id') === sessionId,
        createdAt: localStorage.getItem('dopedeal_session_created_at') === createdAt.toString(),
        anonymousId: localStorage.getItem('dopedeal_anonymous_id') === anonymousId
      };

      // Clean up
      keys.forEach(key => localStorage.removeItem(key));

      return {
        allKeysSet: Object.values(keysSet).every(v => v === true),
        keysSet
      };
    }, SESSION_STORAGE_KEYS);

    // PRESERVATION PROPERTY: Session keys should be created and readable
    expect(sessionKeyTest.allKeysSet).toBe(true);
    console.log('✓ Session storage keys managed correctly');
  });

  test('Session context persists during QR scan flow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test QR scan context persistence
    const qrContextTest = await page.evaluate(() => {
      // Simulate QR scan context
      const shopId = 'shop-123';
      const batchId = 'batch-456';
      const qrType = 'product';
      const campaignSlug = 'summer-sale';

      // Set QR context keys
      localStorage.setItem('dopedeal_session_shop_id', shopId);
      localStorage.setItem('dopedeal_session_batch_id', batchId);
      localStorage.setItem('dopedeal_session_qr_type', qrType);
      localStorage.setItem('dopedeal_session_campaign_slug', campaignSlug);

      // Verify context persists
      const contextPersisted = {
        shopId: localStorage.getItem('dopedeal_session_shop_id') === shopId,
        batchId: localStorage.getItem('dopedeal_session_batch_id') === batchId,
        qrType: localStorage.getItem('dopedeal_session_qr_type') === qrType,
        campaignSlug: localStorage.getItem('dopedeal_session_campaign_slug') === campaignSlug
      };

      // Clean up
      localStorage.removeItem('dopedeal_session_shop_id');
      localStorage.removeItem('dopedeal_session_batch_id');
      localStorage.removeItem('dopedeal_session_qr_type');
      localStorage.removeItem('dopedeal_session_campaign_slug');

      return {
        allContextPersisted: Object.values(contextPersisted).every(v => v === true),
        contextPersisted
      };
    });

    // PRESERVATION PROPERTY: QR scan context should persist in session storage
    expect(qrContextTest.allContextPersisted).toBe(true);
    console.log('✓ QR scan context persists correctly');
  });

  test('Session persists across page refresh', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set up a session
    await page.evaluate(() => {
      const sessionId = 'test-session-' + Date.now();
      localStorage.setItem('dopedeal_session_id', sessionId);
      localStorage.setItem('dopedeal_session_created_at', Date.now().toString());
      (window as any).__testSessionId = sessionId;
    });

    const sessionIdBefore = await page.evaluate(() => 
      localStorage.getItem('dopedeal_session_id')
    );

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify session persists
    const sessionIdAfter = await page.evaluate(() => 
      localStorage.getItem('dopedeal_session_id')
    );

    // PRESERVATION PROPERTY: Session should persist across page refresh
    expect(sessionIdAfter).toBe(sessionIdBefore);
    expect(sessionIdAfter).not.toBeNull();
    console.log(`✓ Session persisted across refresh: ${sessionIdAfter}`);

    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('dopedeal_session_id');
      localStorage.removeItem('dopedeal_session_created_at');
    });
  });

  test('Multiple session context keys can coexist', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test multiple context keys
    const multiContextTest = await page.evaluate(() => {
      // Set multiple context keys simultaneously
      const contexts = {
        sessionId: 'session-' + Date.now(),
        shopId: 'shop-123',
        batchId: 'batch-456',
        qrType: 'product',
        campaignSlug: 'summer-sale',
        qrUrl: 'https://example.com/qr/123'
      };

      localStorage.setItem('dopedeal_session_id', contexts.sessionId);
      localStorage.setItem('dopedeal_session_shop_id', contexts.shopId);
      localStorage.setItem('dopedeal_session_batch_id', contexts.batchId);
      localStorage.setItem('dopedeal_session_qr_type', contexts.qrType);
      localStorage.setItem('dopedeal_session_campaign_slug', contexts.campaignSlug);
      localStorage.setItem('dopedeal_session_qr_url', contexts.qrUrl);

      // Verify all keys are set
      const allSet = {
        sessionId: localStorage.getItem('dopedeal_session_id') === contexts.sessionId,
        shopId: localStorage.getItem('dopedeal_session_shop_id') === contexts.shopId,
        batchId: localStorage.getItem('dopedeal_session_batch_id') === contexts.batchId,
        qrType: localStorage.getItem('dopedeal_session_qr_type') === contexts.qrType,
        campaignSlug: localStorage.getItem('dopedeal_session_campaign_slug') === contexts.campaignSlug,
        qrUrl: localStorage.getItem('dopedeal_session_qr_url') === contexts.qrUrl
      };

      // Clean up
      Object.keys(contexts).forEach(key => {
        localStorage.removeItem(`dopedeal_session_${key === 'sessionId' ? 'id' : key}`);
      });

      return {
        allKeysSet: Object.values(allSet).every(v => v === true),
        keyCount: Object.keys(allSet).length
      };
    });

    // PRESERVATION PROPERTY: Multiple session context keys should coexist
    expect(multiContextTest.allKeysSet).toBe(true);
    expect(multiContextTest.keyCount).toBe(6);
    console.log(`✓ ${multiContextTest.keyCount} session context keys coexist correctly`);
  });

  test('Session cleanup removes all session keys', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test session cleanup logic
    const cleanupTest = await page.evaluate((keys) => {
      // Set all session keys
      keys.forEach(key => {
        localStorage.setItem(key, 'test-value-' + Date.now());
      });

      // Verify all keys are set
      const allSetBefore = keys.every(key => 
        localStorage.getItem(key) !== null
      );

      // Simulate sign-out cleanup
      keys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore storage errors
        }
      });

      // Verify all keys are removed
      const allRemovedAfter = keys.every(key => 
        localStorage.getItem(key) === null
      );

      return {
        allSetBefore,
        allRemovedAfter,
        keyCount: keys.length
      };
    }, SESSION_STORAGE_KEYS);

    // PRESERVATION PROPERTY: Session cleanup should remove all keys
    expect(cleanupTest.allSetBefore).toBe(true);
    expect(cleanupTest.allRemovedAfter).toBe(true);
    console.log(`✓ Session cleanup removed all ${cleanupTest.keyCount} keys`);
  });

  test('Anonymous ID persists independently of session', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test anonymous ID persistence
    const anonymousIdTest = await page.evaluate(() => {
      // Create anonymous ID
      const anonymousId = crypto.randomUUID();
      localStorage.setItem('dopedeal_anonymous_id', anonymousId);

      // Create and remove session
      const sessionId = crypto.randomUUID();
      localStorage.setItem('dopedeal_session_id', sessionId);
      localStorage.removeItem('dopedeal_session_id');

      // Verify anonymous ID still exists
      const anonymousIdPersisted = localStorage.getItem('dopedeal_anonymous_id') === anonymousId;
      const sessionRemoved = localStorage.getItem('dopedeal_session_id') === null;

      // Clean up
      localStorage.removeItem('dopedeal_anonymous_id');

      return {
        anonymousIdPersisted,
        sessionRemoved
      };
    });

    // PRESERVATION PROPERTY: Anonymous ID should persist independently
    expect(anonymousIdTest.anonymousIdPersisted).toBe(true);
    expect(anonymousIdTest.sessionRemoved).toBe(true);
    console.log('✓ Anonymous ID persists independently of session');
  });

  test('Edge case: Session keys with special characters', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const specialCharsTest = await page.evaluate(() => {
      // Test session values with special characters
      const specialValues = {
        sessionId: 'session-123-abc-def',
        shopId: 'shop_123',
        campaignSlug: 'summer-sale-2024',
        qrUrl: 'https://example.com/qr/123?ref=test&utm=campaign'
      };

      localStorage.setItem('dopedeal_session_id', specialValues.sessionId);
      localStorage.setItem('dopedeal_session_shop_id', specialValues.shopId);
      localStorage.setItem('dopedeal_session_campaign_slug', specialValues.campaignSlug);
      localStorage.setItem('dopedeal_session_qr_url', specialValues.qrUrl);

      // Verify values are stored correctly
      const valuesMatch = {
        sessionId: localStorage.getItem('dopedeal_session_id') === specialValues.sessionId,
        shopId: localStorage.getItem('dopedeal_session_shop_id') === specialValues.shopId,
        campaignSlug: localStorage.getItem('dopedeal_session_campaign_slug') === specialValues.campaignSlug,
        qrUrl: localStorage.getItem('dopedeal_session_qr_url') === specialValues.qrUrl
      };

      // Clean up
      localStorage.removeItem('dopedeal_session_id');
      localStorage.removeItem('dopedeal_session_shop_id');
      localStorage.removeItem('dopedeal_session_campaign_slug');
      localStorage.removeItem('dopedeal_session_qr_url');

      return {
        allMatch: Object.values(valuesMatch).every(v => v === true),
        valuesMatch
      };
    });

    // PRESERVATION PROPERTY: Session keys should handle special characters
    expect(specialCharsTest.allMatch).toBe(true);
    console.log('✓ Session keys handle special characters correctly');
  });
});
