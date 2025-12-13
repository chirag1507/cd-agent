import {
	GitProviderService,
	Repository
} from '../../domain/interfaces/services/git-provider.service';
import { GitProviderUnavailableError } from '../../domain/errors/git-provider.error';
import { Project } from '../../domain/entities/project.entity';
import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';
import { randomUUID } from 'crypto';

export class GitHubServiceStub implements GitProviderService {
	private static getRepositoriesState: {
		success: boolean;
		data?: Repository[];
	} = {
		success: true,
		data: [
			{
				id: 1,
				name: 'Repository 1',
				fullName: 'Repository 1',
				isPrivate: false
			}
		]
	};

	static setGetRepositoriesState(state: { success: boolean; data: Repository[] }): void {
		GitHubServiceStub.getRepositoriesState.success = state.success;

		if (state.data) {
			GitHubServiceStub.getRepositoriesState.data = state.data;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async getRepositories(accessToken: string): Promise<Repository[]> {
		if (!GitHubServiceStub.getRepositoriesState.success) {
			throw new GitProviderUnavailableError('Failed to retrieve user repositories');
		}
		return GitHubServiceStub.getRepositoriesState.data || [];
	}

	private static repositoryDetailsState: {
		success: boolean;
		data?: { commitHash: string };
	} = { success: true, data: { commitHash: 'repoCommitHash' } };

	static setRepositoryDetailsState(state: { success: boolean }) {
		GitHubServiceStub.repositoryDetailsState = state;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getRepositoryDetails(project: Project,accessToken: GitProviderAccessToken):
		 Promise<{ repoFullName: string; repoBranch: string; repoCommitHash: string }> {
		if (GitHubServiceStub.repositoryDetailsState.success) {
			return Promise.resolve({
				repoBranch: 'repoBranch',
				repoCommitHash: randomUUID(),
				repoFullName: 'repoFullName'
			});
		}
		return Promise.resolve({
			repoBranch: 'repoBranch',
			repoCommitHash: project.commitHash || '',
			repoFullName: 'repoFullName'
		});
	}
}
