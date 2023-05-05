import {
  ActionIcon,
  Center,
  Container,
  Group,
  Footer,
  Text,
} from '@mantine/core';
import { IconBrandLinkedin, IconBrandTwitter, IconCup } from '@tabler/icons-react';

// TODO: update social media to company profiles and add product hunt links
const AppFooter: React.FC = () => (
  <Footer height={{ base: 110, xs: 70 }} p={0}>
    <Container size="lg" p="md">
      <Group position="apart" spacing="xs">
        <Text>© 2023 ZkBlind. All rights reserved.</Text>
        <Center>
          {/* <a href="https://www.producthunt.com/posts/soundbetter-2?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-soundbetter&#0045;2" target="_blank" className={classes.productHuntLink}>
              <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=374076&theme=light" alt="SoundBetter - A&#0032;tool&#0032;to&#0032;turn&#0032;your&#0032;thoughts&#0032;to&#0032;professional&#0032;messages | Product Hunt" style={{ width: '143px', height: '32px' }} />
            </a> */}
          <ActionIcon variant='transparent' color="dark" m={4} component="a" href="https://twitter.com/abbyotwtofire" target="_blank">
            <IconBrandTwitter />
          </ActionIcon>
          <ActionIcon variant='transparent' color="dark" m={4} component="a" href="https://www.linkedin.com/in/abbylow0713/" target="_blank">
            <IconBrandLinkedin />
          </ActionIcon>
          <ActionIcon variant='transparent' color="dark" m={4} component="a" href="https://www.buymeacoffee.com/abbylow" target="_blank">
            <IconCup />
          </ActionIcon>
        </Center>
      </Group>
    </Container>
  </Footer>
);

export default AppFooter;
