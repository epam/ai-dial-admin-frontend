export interface Container {
  id: string;
  imageId: string;
  name: string;
  description?: string;
  url?: string;
  status?: string;
}

export enum DEPLOYMENT_ENTITY {
  images = 'images',
  containers = 'containers',
}
