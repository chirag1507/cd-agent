import { GetProjectRequest } from '../../application/use-cases/get-project/get-project.types';

export class GetProjectRequestBuilder {
	private request: Partial<GetProjectRequest> = {};

	withUserId(userId: string): GetProjectRequestBuilder {
		this.request.userId = userId;
		return this;
	}

	build(): GetProjectRequest {
		return {
			userId: this.request.userId || 'test-user-id'
		};
	}
}
