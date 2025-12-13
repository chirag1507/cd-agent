import { DeleteProjectRequest } from '../../application/use-cases/delete-project/delete-project.types';

export class DeleteProjectRequestBuilder {
	private request: Partial<DeleteProjectRequest> = {};

	withProjectId(projectId: string): DeleteProjectRequestBuilder {
		this.request.projectId = projectId;
		return this;
	}

	build(): DeleteProjectRequest {
		return {
			projectId: this.request.projectId || 'test-project-id'
		};
	}
}
