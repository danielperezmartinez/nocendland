import {Component, computed, input, ChangeDetectionStrategy} from '@angular/core';
import {DEFAULT_IMAGE_PATH} from '@shared/ui/image/image.constants';

@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  readonly image = input<string | null>(null)
  readonly defaultImage = input(DEFAULT_IMAGE_PATH)
  readonly loading = input(false)
  readonly imageSource = computed(() => this.image() || this.defaultImage() || DEFAULT_IMAGE_PATH)
}
