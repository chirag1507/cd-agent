import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';
import {
	GitProviderUnAuthorizedError,
	GitProviderUnavailableError,
	GitRepositoryEmptyError
} from '../../domain/errors/git-provider.error';
import {
	GitProviderService,
	Repository
} from '../../domain/interfaces/services/git-provider.service';
import { GitRepositoryMapper } from '../mappers/git-repository.mapper';
import { Project } from '../../domain/entities/project.entity';

export class GitHubService implements GitProviderService {
	async getRepositories(accessToken: string): Promise<Repository[]> {
		try {
			if (!accessToken) {
				throw new Error('Access token is required');
			}
			const response = await fetch(
				'https://api.github.com/user/repos?visibility=all&per_page=100&sort=updated',
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						Accept: 'application/vnd.github.v3+json',
						'User-Agent': 'Code-Clinic-App'
					}
				}
			);

			if (response.ok) {
				const githubRepos = (await response.json()) as any;

				return GitRepositoryMapper.toDto(githubRepos);
			}
			console.log('response-------', response);
			throw new GitProviderUnAuthorizedError('Failed to retrieve user repositories');
		} catch (error) {
			console.error('error', error);
			if (error instanceof GitProviderUnAuthorizedError) {
				throw new GitProviderUnAuthorizedError('Failed to retrieve user repositories');
			}
			throw new GitProviderUnavailableError('Failed to retrieve user repositories');
		}
	}
	async getRepositoryDetails(
		project: Project,
		accessToken: GitProviderAccessToken
	): Promise<{ repoFullName: string; repoBranch: string; repoCommitHash: string }> {
		const response: any = await fetch(`https://api.github.com/repositories/${project.repoId}`, {
			headers: {
				Authorization: `token ${accessToken.getDecryptedValue()}`,
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': 'CodeClinic/1.0'
			}
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
		}

		const { default_branch, full_name } = await response.json();

		const commitHash = await this.getCommitHash(full_name, default_branch, accessToken);

		return { repoBranch: default_branch, repoCommitHash: commitHash, repoFullName: full_name };
	}

	private async getCommitHash(
		repoFullName: string,
		branch: string,
		accessToken: GitProviderAccessToken
	) {
		const url = `https://api.github.com/repos/${repoFullName}/commits?sha=${branch}&per_page=1`;

		const response = await fetch(url, {
			headers: {
				Authorization: `token ${accessToken.getDecryptedValue()}`,
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': 'CodeClinic/1.0'
			}
		});
		if (response.status === 409) {
			throw new GitRepositoryEmptyError();
		}

		if (!response.ok) {
			throw new Error(
				`Failed to fetch latest commit for branch "${branch}": ${response.status} ${response.statusText}`
			);
		}

		const commits = await response.json();

		if (!Array.isArray(commits) || commits.length === 0) {
			throw new Error(`No commits found for branch "${branch}"`);
		}

		return commits[0].sha;
	}
}
