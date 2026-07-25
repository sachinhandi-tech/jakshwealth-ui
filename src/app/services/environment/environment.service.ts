import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment.model';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  private readonly env: Environment = environment;

  getEnvironment(): Environment {
    return this.env;
  }
}
