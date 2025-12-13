import { RegistrationDetails } from '../../../../dsl/models/registration-details.model';

export class RegistrationDetailsBuilder {
  private firstName: string = 'Test';
  private lastName: string = 'User';
  private companyName: string = 'Test Company';
  private companyRole: string = 'Developer';
  private teamSize: string = '1-10';
  private email: string = `test.user+${Date.now()}@example.com`;

  static aRegistration(): RegistrationDetailsBuilder {
    return new RegistrationDetailsBuilder();
  }

  withEmail(email: string): RegistrationDetailsBuilder {
    this.email = email;
    return this;
  }

  build(): RegistrationDetails {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      companyName: this.companyName,
      companyRole: this.companyRole,
      teamSize: this.teamSize,
      email: this.email,
    };
  }
}
