import { GetProjectByIdRequest } from '../../application/use-cases/get-project-by-id/get-project-by-id.types';

export class GetProjectByIdRequestBuilder {
	private props: Partial<GetProjectByIdRequest> = {};

	withProjectId(projectId: string): GetProjectByIdRequestBuilder {
		this.props.projectId = projectId;
		return this;
	}

	build(): GetProjectByIdRequest {
		return {
			projectId: this.props.projectId || 'test-project-id'
		};
	}
}
