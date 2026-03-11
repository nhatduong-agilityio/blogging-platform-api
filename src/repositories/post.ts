// Types
import type { CreatePostSchema, UpdatePostSchema } from '../schemas/post.js';
import type { IPostRepository, Post } from '../types/post.js';
import type { PostEntity } from '../entity/post.js';
import type { Repository } from 'typeorm';

// Repositories
import { BaseRepository } from './base.js';

export class PostRepository
  extends BaseRepository<PostEntity, Post, CreatePostSchema, UpdatePostSchema>
  implements IPostRepository
{
  /**
   * Initializes a new instance of the PostRepository class.
   * @param {Repository<PostEntity>} repo - The TypeORM repository to interact with the database.
   */
  constructor(repo: Repository<PostEntity>) {
    super(repo);
  }

  /**
   * Converts a PostEntity to a Post.
   * @param {PostEntity} entity - The PostEntity to convert.
   * @returns {Post} The converted Post.
   */
  protected override toDomain(entity: PostEntity): Post {
    return {
      id: entity.id,
      title: entity.title,
      content: entity.content,
      category: entity.category,
      tags: entity.tags, // already string[] via transformer
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Finds all posts that match the given term in title, content, or category.
   * If no term is given, returns all posts.
   * @param {string} [term] - Optional search term to filter the posts by.
   * @returns {Promise<Post[]>} A promise that resolves to an array of posts that match the given term, or all posts if no term is given.
   */
  override async findAll(term?: string): Promise<Post[]> {
    const qb = this.repo
      .createQueryBuilder('post')
      .orderBy('post.createdAt', 'DESC');

    if (term) {
      qb.where(
        'post.title    LIKE :term OR ' +
          'post.content  LIKE :term OR ' +
          'post.category LIKE :term',
        { term: `%${term}%` }
      );
    }

    const entities = await qb.getMany();
    return entities.map(e => this.toDomain(e));
  }

  /**
   * Creates a new post with the given payload and returns the created post.
   * @param {CreatePostSchema} input - The payload to create the post with.
   * @returns {Promise<Post>} A promise that resolves to the created post if successful.
   */
  override async create(input: CreatePostSchema): Promise<Post> {
    const entity = this.repo.create({
      title: input.title,
      content: input.content,
      category: input.category,
      tags: input.tags
    });

    const saved = await this.repo.save(entity);

    return this.toDomain(saved);
  }
  /**
   * Updates a post by its ID with the given payload and returns the updated post.
   * If the post with the given ID does not exist, returns undefined.
   * @param {number} id - The ID of the post to update.
   * @param {UpdatePostSchema} input - The payload to update the post with.
   * @returns {Promise<Post | undefined>} A promise that resolves to the updated post if successful, or undefined if the post does not exist.
   */
  override async update(
    id: number,
    input: UpdatePostSchema
  ): Promise<Post | undefined> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return undefined;

    this.repo.merge(entity, {
      title: input.title,
      content: input.content,
      category: input.category,
      tags: input.tags
    });

    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }
}
