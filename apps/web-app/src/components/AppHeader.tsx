import { Burger, Button, Container, Drawer, Group, Header, Loader, MediaQuery, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import dynamic from 'next/dynamic'

const DynamicLoginBtn = dynamic(() => import('@/components/LoginBtn'), {
  loading: () => <Loader variant="dots" />,
  ssr: false,
});

const AppHeader = () => {
  const [burgerOpened, burgerHandlers] = useDisclosure(false);

  return (
    <>
      <Header height={{ base: 70 }} p={0} fixed={true}>
        <Container size="lg" p="md">
          <Group position="apart">
            <Title order={2}>
              🙈{' '}
              <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
                <Text span>ZkBlind</Text>
              </MediaQuery>
            </Title>

            <Group spacing="xs">
              <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
                <Button
                  href="https://docs.zkblind.com/" target="_blank"
                  component="a" variant="unstyled" size="md"
                >
                  Docs
                </Button>
              </MediaQuery>

              <DynamicLoginBtn />

              <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                <Burger opened={burgerOpened} onClick={burgerHandlers.toggle} size="sm" />
              </MediaQuery>
            </Group>
          </Group>
        </Container>
      </Header>

      <Drawer opened={burgerOpened} onClose={burgerHandlers.close} title="🙈 ZkBlind">
        <Button
          href="https://docs.zkblind.com/" target="_blank"
          component="a" variant="unstyled" size="md"
        >
          Docs
        </Button>
      </Drawer>
    </>
  )
}
export default AppHeader;
