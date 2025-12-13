import {
  After,
  Before,
  BeforeAll,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import { CustomWorld } from './world';

setDefaultTimeout(30000);

BeforeAll(async function () {
  console.log('🚀 Starting acceptance test suite...');
});

Before(async function (this: CustomWorld, scenario) {
  this.scenario = scenario;
  await this.init();
});

After(async function (this: CustomWorld) {
  // Skip cleanup when debugging (HEADLESS=false means we're debugging)
  if (process.env.SKIP_CLEANUP_ON_DEBUG === 'true') {
    console.log(
      '🐛 Debug mode detected - skipping cleanup to preserve browser state'
    );
    return;
  }
  await this.cleanup();
});
