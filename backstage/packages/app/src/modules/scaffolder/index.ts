import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { jsx } from 'react/jsx-runtime';
import scaffolderPlugin from '@backstage/plugin-scaffolder/alpha';
import { rootRouteRef } from '@backstage/plugin-scaffolder';

export const scaffolderModule = createFrontendModule({
  pluginId: 'scaffolder',
  extensions: [
    scaffolderPlugin.getExtension('page:scaffolder').override({
      params: {
        routeRef: rootRouteRef,
        path: '/create',
        title: 'Create',
        loader: () => import('./CustomCreatePage').then(m => jsx(m.CustomCreatePage, {})),
      },
    }),
  ],
});
