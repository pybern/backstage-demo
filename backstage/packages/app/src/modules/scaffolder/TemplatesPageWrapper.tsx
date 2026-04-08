import { Routes, Route } from 'react-router-dom';
import { VercelTemplatesPage } from './VercelTemplatesPage';
import { TemplateWizardPage } from './TemplateWizardPage';

export function TemplatesPageWrapper() {
  return (
    <Routes>
      <Route index element={<VercelTemplatesPage />} />
      <Route path=":namespace/:templateName" element={<TemplateWizardPage />} />
    </Routes>
  );
}
