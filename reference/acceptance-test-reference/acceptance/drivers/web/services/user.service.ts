import { Page, APIResponse } from '@playwright/test';
import { CONFIG } from '@/config/test.config';
import { RegistrationDetails } from '@/acceptance/dsl/models/registration-details.model';

export class UserService {
  private token?: string;
  private createdProjectIds: string[] = [];

  constructor(private readonly page: Page) {}

  trackCreatedProjectId(projectId: string): void {
    this.createdProjectIds.push(projectId);
  }

  async cleanupCreatedProjects(): Promise<void> {
    if (this.token) {
      for (const projectId of this.createdProjectIds) {
        try {
          const response = await this.page.request.delete(
            `${CONFIG.apiUrl}/project/${projectId}`,
            {
              headers: {
                Authorization: `Bearer ${this.token}`,
              },
            }
          );

          if (response.status() !== 200 && response.status() !== 404) {
            throw new Error(
              `Failed to cleanup project ${projectId}. Status: ${response.status()}`
            );
          }
        } catch (error) {
          throw new Error(`Failed to cleanup project ${projectId}: ${error}`);
        }
      }
      this.createdProjectIds = [];
    }
  }

  async setUserId(response: APIResponse): Promise<void> {
    const responseBody = await response.json();
    const token = responseBody.token;
    this.token = token;

    await this.setTokenInLocalStorage(token);
  }

  async registerAndTrackUser(details: RegistrationDetails): Promise<void> {
    const response = await this.page.request.post(`${CONFIG.apiUrl}/register`, {
      data: {
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        companyName: details.companyName,
        companyRole: details.companyRole,
        teamSize: details.teamSize,
        providerId: '123',
      },
    });
    if (response.status() !== 201) {
      const responseBody = await response.text();
      throw new Error(
        `Failed to create test user. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/register, Response: ${responseBody}`
      );
    }
    await this.setUserId(response);
  }

  async setTokenInLocalStorage(token: string): Promise<void> {
    if (this.page.url().startsWith('about:')) {
      await this.page.goto(CONFIG.baseUrl ?? '');
    }
    await this.page.evaluate((value) => {
      localStorage.setItem('code-clinic-token', value);
    }, token);
  }

  async deleteUser(): Promise<void> {
    if (!this.token) throw new Error('Failed to cleanup test user.');
    const response = await this.page.request.delete(`${CONFIG.apiUrl}/users/`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (response.status() !== 200 && response.status() !== 404) {
      throw new Error(
        `Failed to cleanup test user. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/users/`
      );
    }
  }

  async cleanupGitConnection(): Promise<void> {
    if (this.token) {
      const response = await this.page.request.delete(
        `${CONFIG.apiUrl}/git-provider`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      if (response.status() !== 200 && response.status() !== 404) {
        throw new Error(
          `Failed to cleanup git connection. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/git-provider`
        );
      }
    }
  }

  async cleanupTracked(): Promise<void> {
    await this.cleanupCreatedProjects();
    if (this.token) {
      try {
        await this.deleteUser();
      } catch {
        throw new Error(`Failed to cleanup user ${this.token}`);
      }
      this.token = undefined;
    }
  }

  async cleanupAllTrackedData(): Promise<void> {
    if (this.token) {
      try {
        await this.cleanupCreatedProjects();
        await this.cleanupGitConnection();
        await this.deleteUser();
      } catch {
        throw new Error(`Failed to cleanup user ${this.token}`);
      } finally {
        this.token = undefined;
      }
    }
  }

  getToken() {
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
  }
}
