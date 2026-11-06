import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from './entities/tag.entity.js';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findAll(): Promise<string[]> {
    const tags = await this.tagRepository.find({
      order: { name: 'ASC' },
    });
    return tags.map((t) => t.name);
  }

  async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) {
      return [];
    }

    const uniqueNames = Array.from(
      new Set(tagNames.map((name) => name.trim().toLowerCase())),
    ).filter(Boolean);

    const existingTags = await this.tagRepository.find({
      where: { name: In(uniqueNames) },
    });

    const existingNames = new Set(existingTags.map((t) => t.name));
    const newNames = uniqueNames.filter((name) => !existingNames.has(name));

    const newTags = this.tagRepository.create(
      newNames.map((name) => ({ name })),
    );

    const savedNewTags = await this.tagRepository.save(newTags);
    return [...existingTags, ...savedNewTags];
  }
}
