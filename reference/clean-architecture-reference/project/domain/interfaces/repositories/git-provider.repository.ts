import { GitProviderAuth } from '../../entities/git-provider';

export interface GitProviderRepository {
	save(gitProviderAuth: GitProviderAuth): Promise<void>;
	delete(userId: string): Promise<void>;
	findByUserId(userId: string): Promise<GitProviderAuth | null>;
}