import { AdmitForExaminationRequest } from '../../application/use-cases/admit-for-examination/admit-for-examination.types';

export class AdmitForExaminationRequestBuilder {
	private props: Partial<AdmitForExaminationRequest> = {};

	withUserId(userId: string): AdmitForExaminationRequestBuilder {
		this.props.userId = userId;
		return this;
	}

	withProjectId(projectId: string): AdmitForExaminationRequestBuilder {
		this.props.projectId = projectId;
		return this;
	}

	build(): AdmitForExaminationRequest {
		return {
			userId: this.props.userId || 'test-user-id',
			projectId: this.props.projectId || 'test-project-id'
		};
	}
}
