import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorised',
  imports: [RouterLink],
  templateUrl: './unauthorised.html',
  styleUrl: './unauthorised.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Unauthorised {}
