import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCommentInput, UpdateCommentInput } from './dto';
import { Comment } from './entities';

@Injectable()
export class CommentsService {
  constructor(@InjectRepository(Comment) private commentRepository: Repository<Comment>) {}

  async findAll(): Promise<Comment[]> {
    return this.commentRepository.find({ order: { id: 'DESC' } });
  }

  async findAllByPostId(postId): Promise<Comment[]> {
    return this.commentRepository.find({ where: { postId }, order: { id: 'DESC' } });
  }

  async findOne(id): Promise<Comment> {
    return this.commentRepository.findOneOrFail({ where: { id } });
  }

  async create(postId, createCommentInput: CreateCommentInput): Promise<Comment> {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 2000);
    });
    return this.commentRepository.save({ postId, ...createCommentInput });
  }

  async update(id, updateCommentInput: UpdateCommentInput): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    return this.commentRepository.save({ ...comment, ...updateCommentInput });
  }

  async remove(id): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    await this.commentRepository.remove(comment);
    return Promise.resolve({ ...comment, id });
  }

  async removeAllByPostId(postId): Promise<Comment[]> {
    const comments = await this.findAllByPostId(postId);
    return this.commentRepository.remove(comments);
  }
}
