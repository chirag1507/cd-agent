export interface AdmitForExaminationDriver {
  admitProjectForExamination(projectName: string): Promise<void>;
  verifyProjectUnderExamination(projectName: string): Promise<void>;
  createSecondTabAndAdmitInFirstTab(projectName: string): Promise<void>;
  attemptToAdmitInSecondTab(): Promise<void>;
  verifyNotification(message: string): Promise<void>;
  acceptAdmitExaminationStub(): Promise<void>;
  rejectAdmitExaminationStub(): Promise<void>;
}
