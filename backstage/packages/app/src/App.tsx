import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { navModule } from './modules/nav';
import { scaffolderTemplatesModule } from './modules/scaffolder';

export default createApp({
  features: [catalogPlugin, navModule, scaffolderTemplatesModule],
});
