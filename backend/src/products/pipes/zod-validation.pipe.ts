import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const detail = error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join(', ');
        console.error('❌ Validation Error:', detail);
        throw new BadRequestException({
          message: `Validation failed: ${detail}`,
          errors: error.issues,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
