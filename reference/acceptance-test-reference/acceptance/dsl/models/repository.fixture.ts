export interface RepositoryDto {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
}

export const REPO_NAME_SHOPPING_CART = 'shopping-cart';
export const REPO_NAME_USER_SERVICE = 'user-service';

export function defaultRepositories(): RepositoryDto[] {
  return [
    {
      id: 1,
      name: REPO_NAME_SHOPPING_CART,
      fullName: REPO_NAME_SHOPPING_CART,
      isPrivate: false,
    },
    {
      id: 2,
      name: REPO_NAME_USER_SERVICE,
      fullName: REPO_NAME_USER_SERVICE,
      isPrivate: true,
    },
  ];
}
