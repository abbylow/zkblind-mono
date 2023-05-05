import { AppShell } from '@mantine/core';

import AppFooter from '@/components/AppFooter';
import AppHeader from '@/components/AppHeader';

interface IAppLayout {
  children: React.ReactElement;
}

const AppLayout: React.FC<IAppLayout> = ({ children }) => (
  <AppShell
    header={<AppHeader />}
    footer={<AppFooter />}
    padding={0}
    fixed={false}
    styles={{ body: { minHeight: '100vh' } }}
  >
    {children}
  </AppShell>
);

export default AppLayout;
