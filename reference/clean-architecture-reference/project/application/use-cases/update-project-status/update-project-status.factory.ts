import { PrismaProjectRepository } from "../../../../project/infrastructure/repositories/project.repository";
import { UpdateProjectStatusUseCase } from "./update-project-status.use-case";

export class UpdateProjectStatusUseCaseFactory {
	create() {
		const projectRepository = new PrismaProjectRepository();
		return new UpdateProjectStatusUseCase(projectRepository);
	}
}
