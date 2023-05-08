import { useContext, useState } from "react";
import getNextConfig from "next/config";
import { Box, Button, Container, Skeleton, Stack, TextInput, Title } from '@mantine/core';
import { Group as SemaphoreGroup } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { BigNumber, utils } from "ethers";
import { useAccount } from "wagmi";
import { useMediaQuery } from "@mantine/hooks";
import { defaultAbiCoder } from "ethers/lib/utils.js";

import SemaphoreContext from "@/context/SemaphoreContext";
import trustedSetupArtifacts from "@/constants/artifacts";
import { useIdentityContext } from "@/context/IdentityContext";
import { notifyError, notifySuccess } from "@/utils/notification";
import PostCard from "@/components/PostCard";
import Post from "../../contract-artifacts/Post.json";

const { publicRuntimeConfig: env } = getNextConfig();

// TODO: refresh the feedback at certain period of time to ensure users can see new stuff? 
export default function Homepage() {
  const { isConnected } = useAccount();
  const { identity, inGlobalGroup } = useIdentityContext();
  const { _users, addFeedback, _feedback } = useContext(SemaphoreContext);

  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [textFieldError, setTextFieldError] = useState<string>('');

  const sendFeedback = async () => {
    if (!isConnected || !identity || !feedbackInput || !_users) return;

    setTextFieldError('');
    setIsPosting(true);

    try {
      const group = new SemaphoreGroup(env.GROUP_ID);
      group.addMembers(_users);

      const uploadResponse = await fetch("api/uploadToArweave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postBody: feedbackInput,
          postTags: [],
          postParentId: null
        })
      });
      const uploadResponseJson = await uploadResponse.json()

      const arTxIdBytes32 = utils.keccak256(defaultAbiCoder.encode(['string'], [uploadResponseJson.arTxId]))
      const signal = BigNumber.from(arTxIdBytes32).toString()

      const { proof, merkleTreeRoot, nullifierHash } = await generateProof(
        identity,
        group,
        signal, // external nullifier
        signal, // signal
        trustedSetupArtifacts
      );

      let response: any

      if (env.OPENZEPPELIN_AUTOTASK_WEBHOOK) {
        response = await fetch(env.OPENZEPPELIN_AUTOTASK_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            abi: Post.abi,
            address: env.POST_CONTRACT_ADDRESS,
            functionName: "sendPost",
            functionParameters: [merkleTreeRoot, nullifierHash, proof, uploadResponseJson.arTxId]
          })
        })
        const resJson = await response.json();
        if (resJson.status === "error") throw Error('Autotask failed');
      } else {
        response = await fetch("api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merkleTreeRoot,
            nullifierHash,
            proof,
            arweaveId: uploadResponseJson.arTxId,
          })
        });
      }

      if (response.status === 200) {
        // addFeedback(feedbackSignal); // TODO: display
        notifySuccess({ title: "Success", message: "Posted successfully" });
      } else {
        setTextFieldError("Fail to post");
        notifyError({ title: "Failure", message: "Fail to post" });
      }
    } catch (error) {
      console.error(error)
      notifyError({ message: "Something went wrong" });
      setTextFieldError("Something went wrong");
    } finally {
      setIsPosting(false);
      setFeedbackInput('');
    }
  }

  const largeScreen = useMediaQuery('(min-width: 768px)');

  return (
    <Container p="xl">
      <Stack spacing="xl">
        <Title order={2}>Home</Title>
        <Title order={4}>Text input only accepts 20 characters now. Work in progress to extend the length</Title>
        <Box display="flex" sx={{ gap: '0.5rem', flexDirection: largeScreen ? 'row' : 'column' }}>
          <TextInput
            placeholder="Post something anonymously"
            size="md"
            sx={{ flex: 1 }}
            disabled={!isConnected || !identity || isPosting}
            value={feedbackInput}
            onChange={(event) => setFeedbackInput(event.currentTarget.value)}
            error={textFieldError}
          />
          <Button
            size="md"
            loading={isPosting}
            onClick={sendFeedback}
            disabled={!isConnected || !identity || !feedbackInput || !inGlobalGroup}
          >
            {(identity && feedbackInput && !inGlobalGroup) ? 'Joining Group' : 'Post'}
          </Button>
        </Box>

        {
          _feedback?.length < 1 && (
            <>
              <Skeleton visible={_feedback.length < 1} height={120}>
              </Skeleton>
              <Skeleton visible={_feedback.length < 1} height={120}>
              </Skeleton>
            </>
          )
        }

        {
          _feedback.map(f => {
            const feedback = JSON.parse(f);
            return (
              // TODO: show different groups accordingly
              <PostCard key={feedback.post} group="Global" post={feedback.post} />
            )
          })
        }
      </Stack>

    </Container >
  );
}
