import { HttpRequest } from "../../../../shared/presentation/http/http-request";
import { SessionData } from "../../../../shared/application/decorators/session-decorator";
import { AddProjectRequest } from "./add-project.types";

export function addProjectExtractor(decoded: SessionData, request: HttpRequest): AddProjectRequest {
	return {
		userId: decoded.userId,
		repoId: request.body.repoId,
		repoName: request.body.repoName,
		name: request.body.name,
		description: request.body.description
	};
}