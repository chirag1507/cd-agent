import { Page } from '@playwright/test';
import { CONFIG } from '@/config/test.config';
import { defaultRepositories } from '@acceptance/dsl/models/repository.fixture';

export class StubService {
  constructor(private readonly page: Page) {}

  async simulateGitHubAuthProviderSuccess(email: string): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/github-auth-provider-service`,
      {
        data: {
          state: {
            success: true,
            data: {
              email: email,
            },
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to setup GitHub auth provider stub. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/external-system-stub-control/github-auth-provider-service`
      );
    }
  }

  async simulateGitHubAuthProviderFailure(): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/github-auth-provider-service`,
      {
        data: {
          state: {
            success: false,
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to fail GitHub authentication. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/external-system-stub-control/github-auth-provider-service`
      );
    }
  }

  async simulateGitProviderAuthUrlSuccess(): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/connect-git-provider-auth-service`,
      {
        data: {
          state: {
            success: true,
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to configure successful GitHub auth URL stub. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/external-system-stub-control/connect-git-provider-auth-service`
      );
    }
  }

  async simulateGitProviderAuthUrlFailure(): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/connect-git-provider-auth-service`,
      {
        data: {
          state: {
            success: false,
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to configure failed GitHub auth URL stub. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/external-system-stub-control/connect-git-provider-auth-service`
      );
    }
  }

  async simulateGitHubRepositoryListSuccess(): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/github-repository-service`,
      {
        data: {
          state: {
            success: true,
            data: defaultRepositories(),
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to configure successful GitHub repository stub. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/external-system-stub-control/github-repository-service`
      );
    }
  }

  async simulateGitHubRepositoryListEmpty(): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/github-repository-service`,
      {
        data: {
          state: {
            success: true,
            data: [],
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to configure empty GitHub repository stub. Status: ${response.status()}`
      );
    }
  }

  async simulateGitHubRepositoryListFailure(): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/github-repository-service`,
      {
        data: {
          state: {
            success: false,
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to configure failed GitHub repository stub. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/external-system-stub-control/github-repository-service`
      );
    }
  }

  async simulateAdmitExaminationAccept(): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/event-bus-service`,
      {
        data: {
          state: {
            success: true,
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to setup STUB FOR ACCEPT ADMIT EXAMINATION, Status: ${response.status()}, URL: ${CONFIG.apiUrl}/external-system-stub-control/event-bus-service`
      );
    }
  }

  async simulateAdmitExaminationReject(): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/event-bus-service`,
      {
        data: {
          state: {
            success: false,
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to setup STUB FOR REJECT ADMIT EXAMINATION, Status: ${response.status()}, URL: ${CONFIG.apiUrl}/external-system-stub-control/event-bus-service`
      );
    }
  }
}
