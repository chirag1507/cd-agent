import { RegistrationDriver } from '../drivers/interface/registration-driver.interface';
import { RegistrationDetails } from './models/registration-details.model';

export class RegistrationDSL {
  constructor(private readonly driver: RegistrationDriver) {}

  async validateUserIsNotRegistered(email: string): Promise<void> {
    try {
      await this.driver.validateUserIsNotRegistered(email);
    } catch (error) {
      throw new Error(`Failed to ensure user exists: ${error}`);
    }
  }

  async fillRegistrationForm(details: RegistrationDetails): Promise<void> {
    await this.driver.provideRegistrationDetails(details);
  }

  async submitRegistration(): Promise<void> {
    await this.driver.completeRegistration();
  }

  async trySubmitRegistration(): Promise<void> {
    await this.driver.attemptRegistration();
  }

  async getErrorMessages(): Promise<string[]> {
    return await this.driver.getErrorMessages();
  }

  async expectAccountExists(): Promise<void> {
    const accountExists = await this.driver.verifyAccountExists();
    if (!accountExists) {
      throw new Error(`Expected account to exist, but it was not found.`);
    }
  }

  async expectAccountDoesNotExist(email: string): Promise<boolean> {
    return await this.driver.checkAccountDoesNotExist(email);
  }

  async registerUser(details: RegistrationDetails): Promise<void> {
    await this.driver.createTestUser(details);
  }
}
