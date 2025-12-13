import { AddProjectRequest } from '../../application/use-cases/add-project/add-project.types';

export class AddProjectRequestBuilder {
	private request: Partial<AddProjectRequest> = {};

	withUserId(userId: string): AddProjectRequestBuilder {
		this.request.userId = userId;
		return this;
	}

	withRepoId(repoId: number): AddProjectRequestBuilder {
		this.request.repoId = repoId;
		return this;
	}

	withRepoName(repoName: string): AddProjectRequestBuilder {
		this.request.repoName = repoName;
		return this;
	}

	withName(name: string): AddProjectRequestBuilder {
		this.request.name = name;
		return this;
	}

	withDescription(description: string): AddProjectRequestBuilder {
		this.request.description = description;
		return this;
	}

	build(): Partial<AddProjectRequest> {
		return { ...this.request };
	}

	buildWithAllFields(): AddProjectRequest {
		return {
			userId: this.request.userId || 'test-user-id',
			repoId: this.request.repoId || 1,
			repoName: this.request.repoName || 'test-repository',
			name: this.request.name || 'Test Project',
			description: this.request.description || 'A test project description'
		};
	}
}
