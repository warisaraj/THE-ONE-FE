import { Pipe, PipeTransform } from '@angular/core';
import { resolveImageUrl } from '../utils/resolve-image-url';

@Pipe({ name: 'resolveImageUrl' })
export class ResolveImageUrlPipe implements PipeTransform {
  transform(value: string | null | undefined, apiBase?: string): string {
    return resolveImageUrl(value, apiBase);
  }
}
