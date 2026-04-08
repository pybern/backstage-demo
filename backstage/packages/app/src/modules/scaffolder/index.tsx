import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SubPageBlueprint } from '@backstage/frontend-plugin-api';

const customTemplatesSubPage = SubPageBlueprint.makeWithOverrides({
  name: 'templates',
  factory(originalFactory) {
    return originalFactory({
      path: 'templates',
      title: 'Templates',
      loader: async () => {
        const { TemplatesPageWrapper } = await import(
          './TemplatesPageWrapper'
        );
        return <TemplatesPageWrapper />;
      },
    });
  },
});

export const scaffolderTemplatesModule = createFrontendModule({
  pluginId: 'scaffolder',
  extensions: [customTemplatesSubPage],
});
