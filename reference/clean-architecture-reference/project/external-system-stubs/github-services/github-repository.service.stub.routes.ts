import { Router, Request, Response } from 'express';
import { GitHubServiceStub } from './github-repository.service.stub';

const routes = Router();

routes.post('/github-repository-service', (req: Request, res: Response) => {
	const { state } = req.body;
	GitHubServiceStub.setGetRepositoriesState(state);
	res.send();
});

routes.post('/github-repository-details-service', (req: Request, res: Response) => {
	const { state } = req.body;
	GitHubServiceStub.setRepositoryDetailsState(state);
	res.send();
});

export default routes;
