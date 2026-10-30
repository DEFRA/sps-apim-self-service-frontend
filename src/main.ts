import { bootstrapApplication } from '@angular/platform-browser';
import { RUNTIME_CONFIG, loadRuntimeConfig } from './app/core/runtime-config';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

loadRuntimeConfig()
  .then(runtimeConfig =>
    bootstrapApplication(AppComponent, {
      ...appConfig,
      providers: [
        ...appConfig.providers,
        {
          provide: RUNTIME_CONFIG,
          useValue: runtimeConfig
        }
      ]
    })
  )
  .catch(error =>
    console.error(
      'Failed to load runtime configuration or bootstrap the application.',
      error
    )
  );
