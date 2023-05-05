import Image from 'next/image';
import { useConnect } from 'wagmi';
import { useDidUpdate, useMediaQuery } from '@mantine/hooks';
import { Alert, Button, Grid, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

import { CONNECTOR_ID_TO_IMAGE_MAP } from '@/constants/connectors';

interface IConnectorModal {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ConnectorModal: React.FC<IConnectorModal> = ({ opened = false, onClose, onSuccess }) => {
  const { connect, connectors, error, isLoading, pendingConnector, isSuccess } = useConnect();

  const isMobile = useMediaQuery("(max-width: 768px)");

  useDidUpdate(() => {
    if (isSuccess) {
      onClose()
      onSuccess?.()
    }
  }, [isSuccess]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={'Connect a wallet'}
      fullScreen={isMobile}
    >
      <Grid>
        {connectors.map((connector) => {
          const { id, name, ready } = connector;
          return (
            <Grid.Col
              span={6}
              key={id}
            >
              <Button
                onClick={() => connect({ connector })}
                disabled={!ready || isLoading}
                variant="light"
                h="100%"
                w="100%"
                p="xs"
              >
                <Stack spacing="xs" align="center" justify="center">
                  <Image
                    src={`/assets/wallet/${CONNECTOR_ID_TO_IMAGE_MAP[id]}`}
                    height={48}
                    width={48}
                    alt={name}
                  />

                  <Group position="center" spacing="0.25rem">
                    {isLoading && connector.id === pendingConnector?.id &&
                      <Loader size="xs" />
                    }
                    <Text size="sm" c="black" align='center'>
                      {name}
                    </Text>
                  </Group>

                </Stack>
              </Button>
            </Grid.Col>
          );
        })}
      </Grid>
      {error &&
        <Alert icon={<IconAlertCircle size="1rem" />} color="red" mt="xs">
          <Text c="red">{error.message}</Text>
        </Alert>
      }
    </Modal>
  );
};

export default ConnectorModal;