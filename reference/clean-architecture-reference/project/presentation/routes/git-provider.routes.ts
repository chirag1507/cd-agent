import { Router } from 'express';
import { GitProviderAuthUrlController } from '../controllers/git-provider/git-provider-auth-url.controller';
import { GetGitProviderAuthUrlFactory } from '../../application/use-cases/get-git-provider-auth-url/get-git-provider-auth-url.factory';
import { ControllerFactory } from '../../../shared/presentation/http/controllerFactory';
import { ConnectGitProviderUseCaseFactory } from '../../../project/application/use-cases/connect-git-provider/connect-git-provider.factory';
import { ConnectGitProviderController } from '../controllers/git-provider/connect-git-provider.controller';
import { DeleteGitProviderUseCaseFactory } from '../../application/use-cases/delete-git-provider/delete-git-provider.factory';
import { DeleteGitProviderController } from '../controllers/git-provider/delete-git-provider.controller';
import { CheckGitProviderConnectionFactory } from '../../application/use-cases/check-git-provider-connection/check-git-provider-connection.factory';
import { CheckGitProviderConnectionController } from '../controllers/git-provider/check-git-provider-connection.controller';
import { ListRepositoriesUseCaseFactory } from '../../application/use-cases/list-repositories/list-repositories.factory';
import { ListRepositoriesController } from '../controllers/git-provider/list-repositories.controller';

interface GitProviderRoutesDependencies {
	getGitProviderAuthUrlFactory: GetGitProviderAuthUrlFactory;
	connectGitProviderUseCaseFactory: ConnectGitProviderUseCaseFactory;
	deleteGitProviderUseCaseFactory: DeleteGitProviderUseCaseFactory;
	checkGitProviderConnectionFactory: CheckGitProviderConnectionFactory;
	listRepositoriesUseCaseFactory: ListRepositoriesUseCaseFactory;
}

export const setupGitProviderRoutes = (dependencies: GitProviderRoutesDependencies) => {
	const gitProviderRouter = Router();

	const gitProviderAuthUrlController = new GitProviderAuthUrlController(
		dependencies.getGitProviderAuthUrlFactory
	);
	const connectGitProviderController = new ConnectGitProviderController(
		dependencies.connectGitProviderUseCaseFactory
	);
	const deleteGitProviderController = new DeleteGitProviderController(
		dependencies.deleteGitProviderUseCaseFactory
	);
	const checkGitProviderConnectionController = new CheckGitProviderConnectionController(
		dependencies.checkGitProviderConnectionFactory
	);
	const listRepositoriesController = new ListRepositoriesController(
		dependencies.listRepositoriesUseCaseFactory
	);

	gitProviderRouter.get('/auth-url', ControllerFactory.create(gitProviderAuthUrlController));
	gitProviderRouter.get(
		'/oauth/callback',
		ControllerFactory.create(connectGitProviderController)
	);
	gitProviderRouter.delete('/', ControllerFactory.create(deleteGitProviderController));
	gitProviderRouter.get(
		'/check-connection',
		ControllerFactory.create(checkGitProviderConnectionController)
	);
	gitProviderRouter.get(
		'/user-repositories',
		ControllerFactory.create(listRepositoriesController)
	);

	return gitProviderRouter;
};
