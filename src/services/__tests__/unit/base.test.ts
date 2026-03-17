import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { BaseService } from '../../base.js';
import { AppError } from '../../../utils/app-error.js';
import { ERROR_MESSAGES } from '../../../constants/messages.js';
import type { IRepository } from '../../../types/common.js';

type TestEntity = { id: number; name: string };
type CreateDto = { name: string };
type UpdateDto = { name: string };

class TestService extends BaseService<TestEntity, CreateDto, UpdateDto> {
  protected get resourceName(): string {
    return 'TestEntity';
  }

  async getAll(): Promise<TestEntity[]> {
    return this.repository.findAll();
  }

  async create(input: CreateDto): Promise<TestEntity> {
    return this.repository.create(input);
  }

  async update(id: number, input: UpdateDto): Promise<TestEntity> {
    return this.repository.update(id, input) as Promise<TestEntity>;
  }
}

const mockFindAll = jest.fn<() => Promise<TestEntity[]>>();
const mockFindById = jest.fn<(id: number) => Promise<TestEntity | undefined>>();
const mockCreate = jest.fn<() => Promise<TestEntity>>();
const mockUpdate = jest.fn<() => Promise<TestEntity | undefined>>();
const mockDelete = jest.fn<(id: number) => Promise<boolean>>();

const mockRepository: IRepository<TestEntity, CreateDto, UpdateDto> = {
  findAll: mockFindAll,
  findById: mockFindById,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete
};

let service: TestService;

beforeEach(() => {
  service = new TestService(mockRepository);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('BaseService', () => {
  describe('getById', () => {
    it('should return entity when found', async () => {
      const entity: TestEntity = { id: 1, name: 'test' };
      mockFindById.mockResolvedValue(entity);

      const result = await service.getById(1);

      expect(result).toEqual(entity);
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockFindById).toHaveBeenCalledTimes(1);
    });

    it('should throw AppError 404 when entity not found', async () => {
      mockFindById.mockResolvedValue(undefined);

      await expect(service.getById(999)).rejects.toThrow(AppError);

      await expect(service.getById(999)).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_MESSAGES.NOT_FOUND('TestEntity')
      });
    });

    it('should include resourceName in the error message', async () => {
      mockFindById.mockResolvedValue(undefined);

      await expect(service.getById(1)).rejects.toMatchObject({
        message: expect.stringContaining('TestEntity')
      });
    });
  });

  describe('delete', () => {
    it('should resolve void when entity is deleted', async () => {
      mockDelete.mockResolvedValue(true);

      await expect(service.delete(1)).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it('should throw AppError 404 when entity does not exist', async () => {
      mockDelete.mockResolvedValue(false);

      await expect(service.delete(999)).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_MESSAGES.NOT_FOUND('TestEntity')
      });
    });
  });
});
