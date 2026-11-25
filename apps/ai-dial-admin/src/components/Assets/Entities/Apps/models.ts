import { DialApplication } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';

export type ApplicationCreationAsset = DialApplicationResource & Pick<DialApplication, 'mcp'>;
