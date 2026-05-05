import { NgModule } from '@angular/core';
import { ResolveImageUrlPipe } from './pipes/resolve-image-url.pipe';

@NgModule({
  declarations: [ResolveImageUrlPipe],
  exports: [ResolveImageUrlPipe]
})
export class ResolveImageUrlModule {}
