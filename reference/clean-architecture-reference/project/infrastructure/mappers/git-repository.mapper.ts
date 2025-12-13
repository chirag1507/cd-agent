import { Repository } from '../../domain/interfaces/services/git-provider.service';
import { GitHubRepository } from '../services/interfaces/github.interface';

export class GitRepositoryMapper {
	static toDto(githubRepos: GitHubRepository[]): Repository[] {
		return githubRepos.map((repo: any) => ({
			id: repo.id,
			name: repo.name,
			fullName: repo.full_name,
			isPrivate: repo.private
		}));
	}
}
