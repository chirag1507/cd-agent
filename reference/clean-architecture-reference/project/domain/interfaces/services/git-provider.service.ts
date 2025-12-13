import { GitProviderAccessToken } from "../../../../shared/domain/value-objects/git-provider-access-token";
import { Project } from "../../entities/project.entity";

export interface Repository {
	id: number;
	name: string;
	fullName: string;
	isPrivate: boolean;
}
export interface GitProviderService {
	getRepositories(accessToken: string): Promise<Repository[]>;
	getRepositoryDetails(
		project: Project,
		accessToken: GitProviderAccessToken
	): Promise<{ repoFullName: string; repoBranch: string; repoCommitHash: string }>;
}
