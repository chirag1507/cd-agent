import { AdmitForExaminationRequest } from './admit-for-examination.types';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';

export const admitForExaminationExtractor = (
	decoded: SessionData,
	request: HttpRequest
): AdmitForExaminationRequest => {
	return {
		userId: decoded.userId,
		projectId: request.params.id
	};
};
