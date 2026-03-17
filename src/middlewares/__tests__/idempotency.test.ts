import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import {
  idempotency,
  purgeExpiredKeys
} from '../../middlewares/idempotency.js';
import { KEY_HEADER, TTL_MS } from '../../constants/idempotency.js';
import type { QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import type { IdempotencyKeyEntity } from '../../entity/idempotency.js';

jest.unstable_mockModule('../../utils/response.js', () => ({
  sendErrorResponse: jest.fn()
}));

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ...overrides
  } as unknown as Request;
}

/**
 * Mock Response with proper chaining (res.status().json())
 */
export type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
  end: jest.Mock;
  setHeader: jest.Mock;
  on: jest.Mock;
};

export const mockResponse = (): MockResponse & Response => {
  const res: Partial<MockResponse> = {};

  res.status = jest.fn().mockImplementation(() => res);
  res.json = jest.fn().mockImplementation(() => res);
  res.send = jest.fn().mockImplementation(() => res);
  res.end = jest.fn().mockImplementation(() => res);
  res.setHeader = jest.fn().mockImplementation(() => res);
  res.on = jest.fn().mockImplementation(() => res);

  return res as MockResponse & Response;
};

const mockNext: NextFunction = jest.fn();

type MockRepo = {
  findOne: jest.Mock;
  delete: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
};

function createMockRepo(): MockRepo & Repository<IdempotencyKeyEntity> {
  const repo: Partial<MockRepo> = {};

  repo.findOne = jest.fn().mockImplementation(() => repo);
  repo.delete = jest.fn().mockImplementation(() => repo);
  repo.create = jest.fn().mockImplementation(() => repo);
  repo.save = jest.fn().mockImplementation(() => repo);
  repo.createQueryBuilder = jest.fn().mockImplementation(() => repo);

  return repo as MockRepo & Repository<IdempotencyKeyEntity>;
}

let repo: MockRepo & Repository<IdempotencyKeyEntity>;

beforeEach(() => {
  repo = createMockRepo();
});

describe('idempotency middleware', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should skip when no header', async () => {
    const req = mockRequest();
    const res = mockResponse();

    await idempotency(repo)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('should replay cached response if not expired', async () => {
    const cached = {
      key: validUUID,
      statusCode: 201,
      response: JSON.stringify({ ok: true }),
      createdAt: Date.now()
    };

    repo.findOne.mockResolvedValue(cached as never);

    const req = mockRequest({
      headers: { [KEY_HEADER]: validUUID }
    });
    const res = mockResponse();

    await idempotency(repo)(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.setHeader).toHaveBeenCalledWith('Idempotent-Replayed', 'true');
    expect(res.json).toHaveBeenCalledWith({ ok: true });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should delete expired key and continue', async () => {
    const expired = {
      key: validUUID,
      statusCode: 200,
      response: '{}',
      createdAt: Date.now() - TTL_MS - 1000
    };

    repo.findOne.mockResolvedValue(expired as never);

    const req = mockRequest({
      headers: { [KEY_HEADER]: validUUID }
    });
    const res = mockResponse();

    await idempotency(repo)(req, res, mockNext);

    expect(repo.delete).toHaveBeenCalledWith({ key: validUUID });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should cache response on success (2xx)', async () => {
    repo.findOne.mockResolvedValue(null as never);

    const req = mockRequest({
      headers: { [KEY_HEADER]: validUUID }
    });

    const res = mockResponse();

    repo.create.mockReturnValue({} as any);

    await idempotency(repo)(req, res, mockNext);

    // simulate controller response
    res.statusCode = 200;
    res.json({ success: true });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        key: validUUID,
        statusCode: 200
      })
    );

    expect(repo.save).toHaveBeenCalled();
  });

  it('should NOT cache non-2xx response', async () => {
    repo.findOne.mockResolvedValue(null as never);

    const req = mockRequest({
      headers: { [KEY_HEADER]: validUUID }
    });

    const res = mockResponse();

    await idempotency(repo)(req, res, mockNext);

    res.statusCode = 400;
    res.json({ error: true });

    expect(repo.save).not.toHaveBeenCalled();
  });
});

describe('purgeExpiredKeys', () => {
  it('should delete expired keys and return affected count', async () => {
    const executeMock = jest.fn().mockResolvedValue({ affected: 5 } as never);

    const qb = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: executeMock
    };

    repo.createQueryBuilder = jest
      .fn()
      .mockReturnValue(qb) as unknown as jest.Mock &
      ((
        alias?: string,
        queryRunner?: QueryRunner
      ) => SelectQueryBuilder<IdempotencyKeyEntity>);

    const result = await purgeExpiredKeys(repo);

    expect(repo.createQueryBuilder).toHaveBeenCalled();
    expect(qb.delete).toHaveBeenCalled();
    expect(qb.where).toHaveBeenCalled();
    expect(result).toBe(5);
  });

  it('should return 0 if affected is undefined', async () => {
    const qb = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({} as never)
    };

    const newRepo = {
      ...repo,
      createQueryBuilder: jest.fn().mockReturnValue(qb)
    } as unknown as Repository<IdempotencyKeyEntity>;

    const result = await purgeExpiredKeys(newRepo);

    expect(result).toBe(0);
  });
});
