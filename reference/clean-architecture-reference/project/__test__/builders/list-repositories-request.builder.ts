import { ListRepositoriesRequest } from '../../application/use-cases/list-repositories/list-repositories.types';

export class ListRepositoriesRequestBuilder {
	private request: ListRepositoriesRequest = {
		userId: 'default-user-id'
	};

	withUserId(userId: string): ListRepositoriesRequestBuilder {
		this.request.userId = userId;
		return this;
	}

	build(): ListRepositoriesRequest {
		return { ...this.request };
	}
}
