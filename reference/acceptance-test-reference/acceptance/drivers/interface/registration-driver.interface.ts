import { RegistrationDetails } from '@/acceptance/dsl/models/registration-details.model';

export interface RegistrationDriver {
  validateUserIsNotRegistered(email: string): Promise<void>;
  provideRegistrationDetails(details: RegistrationDetails): Promise<void>;
  completeRegistration(): Promise<void>;
  attemptRegistration(): Promise<void>;
  getErrorMessages(): Promise<string[]>;
  verifyAccountExists(): Promise<boolean>;
  checkAccountDoesNotExist(email: string): Promise<boolean>;
  createTestUser(details: RegistrationDetails): Promise<void>;
}
