import { Badge, Card, Skeleton, Text } from '@mantine/core';
import { useContext, useEffect, useState } from 'react';
import Arweave from 'arweave';

import SemaphoreContext from '@/context/SemaphoreContext';

interface IPostCard {
  group: string,
  arHashedId: string
}

const arweave = Arweave.init({});

const PostCard: React.FC<IPostCard> = ({
  group = '',
  arHashedId = ''
}) => {
  const { _arweaveMap } = useContext(SemaphoreContext);
  const arweaveTxId = _arweaveMap[arHashedId];

  const [postBody, setPostBody] = useState<string>('');
  // const [postTags, setPostTags] = useState<string[]>([]);
  // const [postParentId, setPostParentId] = useState<string>('');

  const getPostInfo = async () => {
    try {
      const res = await arweave.transactions.getData(arweaveTxId, { decode: true, string: true });
      if (typeof res === 'string') {
        const resJson = JSON.parse(res)
        setPostBody(resJson.content)
        // setPostTags(resJson.tags)
        // setPostParentId(resJson.parentId)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (arweaveTxId) getPostInfo()
  }, [arweaveTxId])

  if (!arweaveTxId) return null

  return (
    <Card withBorder radius="md" p="xl">
      <Badge size="md" color="blue" radius="md">
        {group}
      </Badge>
      <Skeleton mt={4} visible={!postBody}>
        <Text my={8} sx={{ overflowWrap: 'break-word' }}>
          {postBody}
        </Text>
      </Skeleton>
    </Card>
  )
}

export default PostCard;