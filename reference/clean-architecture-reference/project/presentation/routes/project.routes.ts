import { GetProjectUseCaseFactory } from '../../../project/application/use-cases/get-project/get-project.factory';
import { AddProjectUseCaseFactory } from '../../../project/application/use-cases/add-project/add-project.factory';
import { DeleteProjectUseCaseFactory } from '../../../project/application/use-cases/delete-project/delete-project.factory';
import { AdmitForExaminationUseCaseFactory } from '../../application/use-cases/admit-for-examination/admit-for-examination.factory';
import { Router } from 'express';
import { GetProjectController } from '../controllers/project/get-project.controller';
import { AddProjectController } from '../controllers/project/add-project.controller';
import { DeleteProjectController } from '../controllers/project/delete-project.controller';
import { AdmitForExaminationController } from '../controllers/project/admit-for-examination.controller';
import { ControllerFactory } from '../../../shared/presentation/http/controllerFactory';
import { GetProjectByIdController } from '../controllers/project/get-project-by-id.controller';
import { GetProjectByIdUseCaseFactory } from '../../../project/application/use-cases/get-project-by-id/get-project-by-id.factory';
import { GetProjectStatusController } from '../controllers/project/get-projects-status.controller';
import { GetProjectByIdsUseCaseFactory } from '../../../project/application/use-cases/get-project-by-ids/get-project-by-ids.factory';
import { UpdateProjectStatusUseCaseFactory } from '../../../project/application/use-cases/update-project-status/update-project-status.factory';
import { UpdateProjectStatusContoller } from '../controllers/project/update-project-status.controller';

interface ProjectRoutesDependencies {
	getProjectUseCaseFactory: GetProjectUseCaseFactory;
	getProjectByIdUseCaseFactory: GetProjectByIdUseCaseFactory;
	getProjectIdsUseCaseFactory: GetProjectByIdsUseCaseFactory;
	addProjectUseCaseFactory: AddProjectUseCaseFactory;
	deleteProjectUseCaseFactory: DeleteProjectUseCaseFactory;
	admitForExaminationUseCaseFactory: AdmitForExaminationUseCaseFactory;
	updateProjectStatusUseCaseFactory: UpdateProjectStatusUseCaseFactory;
}

export const setupProjectRoutes = (dependencies: ProjectRoutesDependencies) => {
	const projectRouter = Router();

	const getProjectController = new GetProjectController(dependencies.getProjectUseCaseFactory);
	const addProjectController = new AddProjectController(dependencies.addProjectUseCaseFactory);
	const deleteProjectController = new DeleteProjectController(
		dependencies.deleteProjectUseCaseFactory
	);
	const admitForExaminationController = new AdmitForExaminationController(
		dependencies.admitForExaminationUseCaseFactory
	);

	const getProjectByIdController = new GetProjectByIdController(
		dependencies.getProjectByIdUseCaseFactory
	);

	const getProjectStatus = new GetProjectStatusController(
		dependencies.getProjectIdsUseCaseFactory
	);
	const updateProjectStatusController = new UpdateProjectStatusContoller(
		dependencies.updateProjectStatusUseCaseFactory
	);

	projectRouter.get('/', ControllerFactory.create(getProjectController));
	projectRouter.put('/status/callback', ControllerFactory.create(updateProjectStatusController));
	projectRouter.get('/status', ControllerFactory.create(getProjectStatus));
	projectRouter.get('/:id', ControllerFactory.create(getProjectByIdController));
	projectRouter.post('/', ControllerFactory.create(addProjectController));
	projectRouter.delete('/:id', ControllerFactory.create(deleteProjectController));
	projectRouter.post('/:id/admit', ControllerFactory.create(admitForExaminationController));

	return projectRouter;
};
