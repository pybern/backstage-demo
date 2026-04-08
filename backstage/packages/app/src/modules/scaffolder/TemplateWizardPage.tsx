import { useParams, useNavigate } from 'react-router-dom';
import { Content, Header, Page } from '@backstage/core-components';
import { Workflow } from '@backstage/plugin-scaffolder-react/alpha';
import {
  SecretsContextProvider,
  scaffolderApiRef,
} from '@backstage/plugin-scaffolder-react';
import { useApi } from '@backstage/core-plugin-api';
import { useCallback } from 'react';
import { JsonValue } from '@backstage/types';

export function TemplateWizardPage() {
  const { namespace, templateName } = useParams<{
    namespace: string;
    templateName: string;
  }>();
  const scaffolderApi = useApi(scaffolderApiRef);
  const navigate = useNavigate();

  const onCreate = useCallback(
    async (values: Record<string, JsonValue>) => {
      const { taskId } = await scaffolderApi.scaffold({
        templateRef: `template:${namespace}/${templateName}`,
        values,
      });
      navigate(`../../tasks/${taskId}`);
    },
    [scaffolderApi, namespace, templateName, navigate],
  );

  if (!namespace || !templateName) {
    return null;
  }

  return (
    <SecretsContextProvider>
      <Page themeId="home">
        <Header
          title={templateName.replace(/-/g, ' ')}
          type="Scaffolder"
          typeLink="../"
        />
        <Content>
          <Workflow
            namespace={namespace}
            templateName={templateName}
            extensions={[]}
            onCreate={onCreate}
            onError={error => (
              <div>Error: {error?.message ?? 'Something went wrong'}</div>
            )}
          />
        </Content>
      </Page>
    </SecretsContextProvider>
  );
}
