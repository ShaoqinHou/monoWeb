import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from '../src/db/test-helpers';
import type { Db } from '../src/db/index';

let db: Db;
let cleanup: () => void;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const t = createTestDb();
  db = t.db;
  cleanup = t.cleanup;
  app = createApp(db);
});

afterEach(() => {
  cleanup();
});

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(path, init);
}

const validAsset = {
  name: 'Office Laptop',
  purchaseDate: '2025-01-15',
  purchasePrice: 2000,
  assetAccountCode: '1-0500',
  depreciationAccountCode: '6-0300',
  depreciationRate: 25,
};

async function createAsset(overrides: Record<string, unknown> = {}): Promise<string> {
  const res = await req('POST', '/api/fixed-assets', { ...validAsset, ...overrides });
  return (await res.json()).data.id;
}

describe('Fixed Assets API', () => {
  describe('GET /api/fixed-assets', () => {
    it('returns empty array when no assets', async () => {
      const res = await req('GET', '/api/fixed-assets');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data).toEqual([]);
    });

    it('returns all assets', async () => {
      await createAsset();
      await createAsset({ name: 'Desk' });
      const res = await req('GET', '/api/fixed-assets');
      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('POST /api/fixed-assets', () => {
    it('creates an asset with valid data', async () => {
      const res = await req('POST', '/api/fixed-assets', validAsset);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.name).toBe('Office Laptop');
      expect(json.data.purchasePrice).toBe(2000);
      expect(json.data.currentValue).toBe(2000);
      expect(json.data.accumulatedDepreciation).toBe(0);
      expect(json.data.status).toBe('registered');
      expect(typeof json.data.id).toBe('string');
    });

    it('auto-generates asset number FA-0001', async () => {
      const res = await req('POST', '/api/fixed-assets', validAsset);
      const json = await res.json();
      expect(json.data.assetNumber).toBe('FA-0001');
    });

    it('auto-increments asset numbers', async () => {
      await createAsset();
      const res = await req('POST', '/api/fixed-assets', { ...validAsset, name: 'Second Asset' });
      const json = await res.json();
      expect(json.data.assetNumber).toBe('FA-0002');
    });

    it('uses purchasePrice as default currentValue', async () => {
      const res = await req('POST', '/api/fixed-assets', validAsset);
      const json = await res.json();
      expect(json.data.currentValue).toBe(validAsset.purchasePrice);
    });

    it('allows custom currentValue', async () => {
      const res = await req('POST', '/api/fixed-assets', { ...validAsset, currentValue: 1800 });
      const json = await res.json();
      expect(json.data.currentValue).toBe(1800);
    });

    it('defaults depreciation method to straight_line', async () => {
      const res = await req('POST', '/api/fixed-assets', validAsset);
      const json = await res.json();
      expect(json.data.depreciationMethod).toBe('straight_line');
    });

    it('accepts diminishing_value depreciation method', async () => {
      const res = await req('POST', '/api/fixed-assets', {
        ...validAsset,
        depreciationMethod: 'diminishing_value',
      });
      const json = await res.json();
      expect(json.data.depreciationMethod).toBe('diminishing_value');
    });

    it('rejects asset with missing name', async () => {
      const { name: _, ...noName } = validAsset;
      const res = await req('POST', '/api/fixed-assets', noName);
      expect(res.status).toBe(400);
    });

    it('rejects asset with missing purchaseDate', async () => {
      const { purchaseDate: _, ...noDate } = validAsset;
      const res = await req('POST', '/api/fixed-assets', noDate);
      expect(res.status).toBe(400);
    });

    it('rejects asset with missing purchasePrice', async () => {
      const { purchasePrice: _, ...noPrice } = validAsset;
      const res = await req('POST', '/api/fixed-assets', noPrice);
      expect(res.status).toBe(400);
    });

    it('rejects asset with missing assetAccountCode', async () => {
      const { assetAccountCode: _, ...noAccount } = validAsset;
      const res = await req('POST', '/api/fixed-assets', noAccount);
      expect(res.status).toBe(400);
    });

    it('rejects asset with missing depreciationAccountCode', async () => {
      const { depreciationAccountCode: _, ...noDepAccount } = validAsset;
      const res = await req('POST', '/api/fixed-assets', noDepAccount);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/fixed-assets/:id', () => {
    it('returns a specific asset', async () => {
      const assetId = await createAsset();
      const res = await req('GET', `/api/fixed-assets/${assetId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Office Laptop');
    });

    it('returns 404 for non-existent asset', async () => {
      const res = await req('GET', '/api/fixed-assets/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('Fixed asset not found');
    });
  });

  describe('PUT /api/fixed-assets/:id', () => {
    it('updates a registered asset', async () => {
      const assetId = await createAsset();
      const res = await req('PUT', `/api/fixed-assets/${assetId}`, { name: 'Updated Laptop' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Updated Laptop');
    });

    it('rejects update on disposed asset', async () => {
      const assetId = await createAsset();
      await req('POST', `/api/fixed-assets/${assetId}/dispose`, { type: 'disposed' });
      const res = await req('PUT', `/api/fixed-assets/${assetId}`, { name: 'Should Fail' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only registered assets can be edited');
    });

    it('rejects update on sold asset', async () => {
      const assetId = await createAsset();
      await req('POST', `/api/fixed-assets/${assetId}/dispose`, { type: 'sold', price: 500 });
      const res = await req('PUT', `/api/fixed-assets/${assetId}`, { name: 'Should Fail' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent asset', async () => {
      const res = await req('PUT', '/api/fixed-assets/00000000-0000-0000-0000-000000000000', { name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/fixed-assets/:id/depreciate', () => {
    it('depreciates with straight_line method', async () => {
      const assetId = await createAsset({
        purchasePrice: 1000,
        depreciationRate: 20,
        depreciationMethod: 'straight_line',
      });

      const res = await req('POST', `/api/fixed-assets/${assetId}/depreciate`, {});
      expect(res.status).toBe(200);
      const json = await res.json();
      // straight_line: purchasePrice * rate / 100 = 1000 * 20 / 100 = 200
      expect(json.data.accumulatedDepreciation).toBe(200);
      expect(json.data.currentValue).toBe(800);
    });

    it('depreciates with diminishing_value method', async () => {
      const assetId = await createAsset({
        purchasePrice: 1000,
        depreciationRate: 20,
        depreciationMethod: 'diminishing_value',
      });

      const res = await req('POST', `/api/fixed-assets/${assetId}/depreciate`, {});
      expect(res.status).toBe(200);
      const json = await res.json();
      // diminishing_value: currentValue * rate / 100 = 1000 * 20 / 100 = 200
      expect(json.data.accumulatedDepreciation).toBe(200);
      expect(json.data.currentValue).toBe(800);
    });

    it('diminishing_value depreciates based on current value', async () => {
      const assetId = await createAsset({
        purchasePrice: 1000,
        depreciationRate: 50,
        depreciationMethod: 'diminishing_value',
      });

      // First depreciation: 1000 * 50% = 500 -> currentValue = 500
      await req('POST', `/api/fixed-assets/${assetId}/depreciate`, {});

      // Second depreciation: 500 * 50% = 250 -> currentValue = 250
      const res = await req('POST', `/api/fixed-assets/${assetId}/depreciate`, {});
      const json = await res.json();
      expect(json.data.currentValue).toBe(250);
      expect(json.data.accumulatedDepreciation).toBe(750);
    });

    it('straight_line depreciates based on purchase price', async () => {
      const assetId = await createAsset({
        purchasePrice: 1000,
        depreciationRate: 25,
        depreciationMethod: 'straight_line',
      });

      // First: 1000 * 25% = 250 -> currentValue = 750
      await req('POST', `/api/fixed-assets/${assetId}/depreciate`, {});

      // Second: 1000 * 25% = 250 again (straight line is constant) -> currentValue = 500
      const res = await req('POST', `/api/fixed-assets/${assetId}/depreciate`, {});
      const json = await res.json();
      expect(json.data.currentValue).toBe(500);
      expect(json.data.accumulatedDepreciation).toBe(500);
    });

    it('current value does not go below 0', async () => {
      const assetId = await createAsset({
        purchasePrice: 100,
        depreciationRate: 100,
        depreciationMethod: 'straight_line',
      });

      await req('POST', `/api/fixed-assets/${assetId}/depreciate`, {});
      const res = await req('POST', `/api/fixed-assets/${assetId}/depreciate`, {});
      const json = await res.json();
      expect(json.data.currentValue).toBe(0);
    });

    it('rejects depreciation on disposed asset', async () => {
      const assetId = await createAsset();
      await req('POST', `/api/fixed-assets/${assetId}/dispose`, { type: 'disposed' });
      const res = await req('POST', `/api/fixed-assets/${assetId}/depreciate`, {});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only registered assets can be depreciated');
    });

    it('returns 404 for non-existent asset', async () => {
      const res = await req('POST', '/api/fixed-assets/00000000-0000-0000-0000-000000000000/depreciate', {});
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/fixed-assets/:id/dispose', () => {
    it('disposes an asset', async () => {
      const assetId = await createAsset();
      const res = await req('POST', `/api/fixed-assets/${assetId}/dispose`, { type: 'disposed' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('disposed');
      expect(json.data.currentValue).toBe(0);
      expect(typeof json.data.disposalDate).toBe('string');
      expect(json.data.disposalPrice).toBe(0);
    });

    it('sells an asset with a price', async () => {
      const assetId = await createAsset({ purchasePrice: 2000 });
      const res = await req('POST', `/api/fixed-assets/${assetId}/dispose`, { type: 'sold', price: 1500 });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('sold');
      expect(json.data.disposalPrice).toBe(1500);
      expect(json.data.currentValue).toBe(0);
    });

    it('rejects disposal of already disposed asset', async () => {
      const assetId = await createAsset();
      await req('POST', `/api/fixed-assets/${assetId}/dispose`, { type: 'disposed' });
      const res = await req('POST', `/api/fixed-assets/${assetId}/dispose`, { type: 'disposed' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Only registered assets can be disposed');
    });

    it('returns 404 for non-existent asset', async () => {
      const res = await req('POST', '/api/fixed-assets/00000000-0000-0000-0000-000000000000/dispose', {
        type: 'disposed',
      });
      expect(res.status).toBe(404);
    });
  });
});
