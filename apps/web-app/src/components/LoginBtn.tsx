import { Badge, Button } from "@mantine/core";
import { useAccount, useSignMessage } from "wagmi";
import { useDisclosure } from "@mantine/hooks";
import { useCallback } from "react";
import { Identity } from "@semaphore-protocol/identity";

import ConnectorModal from "@/components/ConnectorModal";
import { notifyError, notifySuccess } from "@/utils/notification";
import { useIdentityContext } from "@/context/IdentityContext";

const LoginBtn: React.FC = () => {
  const { isConnected } = useAccount();
  const [modalOpened, modalHandlers] = useDisclosure(false);

  const { identity, onIdentityCreated } = useIdentityContext();
  const createIdentity = async (signature: `0x${string}`) => {
    const newIdentity = new Identity(signature);
    onIdentityCreated(newIdentity);
    notifySuccess({
      title: 'Logged in',
      message: 'Successfully logged in',
    });
  };

  const { isLoading: isSigning, signMessage } = useSignMessage({
    message: 'join zkblind global group', // TODO: change the msg to be signed according to group
    async onSuccess(data) {
      createIdentity(data)
    },
    async onError(error) {
      notifyError({
        title: 'Fail to sign',
        message: error.message,
      });
    }
  })

  const signMsg = useCallback(() => signMessage(), [signMessage]);

  return (
    <>
      {!isConnected && (
        <Button loading={modalOpened} onClick={modalHandlers.open} size="md">
          Connect Wallet
        </Button>
      )}

      {isConnected && !identity && (
        <Button loading={isSigning} onClick={signMsg} size="md">
          Login
        </Button>
      )}

      {isConnected && identity && (
        <Badge color="teal" size="lg" radius="md" variant="dot">Logged in</Badge>
      )}

      <ConnectorModal
        opened={modalOpened}
        onClose={modalHandlers.close}
      />
    </>
  )
};

export default LoginBtn;
