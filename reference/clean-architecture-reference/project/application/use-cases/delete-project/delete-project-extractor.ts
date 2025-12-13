import { SessionData } from "../../../../shared/application/decorators/session-decorator";
import { DeleteProjectRequest } from "./delete-project.types";
import { HttpRequest } from "../../../../shared/presentation/http/http-request";

export function deleteProjectExtractor(decoded: SessionData, request: HttpRequest): DeleteProjectRequest {
	return {
		projectId: request.params.id as string
	};
}