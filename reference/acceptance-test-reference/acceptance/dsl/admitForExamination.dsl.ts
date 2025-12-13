import { AdmitForExaminationDriver } from '../drivers/interface/admit-for-examination-driver.interface';

export class AdmitForExaminationDSL {
  constructor(private readonly driver: AdmitForExaminationDriver) {}

  async admitProjectForExamination(projectName: string): Promise<void> {
    await this.driver.admitProjectForExamination(projectName);
  }

  async verifyProjectUnderExamination(projectName: string): Promise<void> {
    await this.driver.verifyProjectUnderExamination(projectName);
  }

  async createSecondTabAndAdmitInFirstTab(projectName: string): Promise<void> {
    await this.driver.createSecondTabAndAdmitInFirstTab(projectName);
  }

  async attemptToAdmitInSecondTab(): Promise<void> {
    await this.driver.attemptToAdmitInSecondTab();
  }

  async verifyNotification(message: string): Promise<void> {
    return await this.driver.verifyNotification(message);
  }

  async admitExaminationServiceUnavailable(): Promise<void> {
    await this.driver.rejectAdmitExaminationStub();
  }

  async admitExaminationServiceAvailable(): Promise<void> {
    await this.driver.acceptAdmitExaminationStub();
  }
}
