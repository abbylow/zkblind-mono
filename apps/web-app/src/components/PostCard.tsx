import { Badge, Card, Text } from '@mantine/core';

interface IPostCard {
  group: string,
  post: string
}

const PostCard: React.FC<IPostCard> = ({
  group = '',
  post = ''
}) => (
  <Card withBorder radius="md" p="xl">
    <Badge size="md" color="blue" radius="md">
      {group}
    </Badge>
    <Text my={8}>
      {post}
    </Text>
  </Card>
)

export default PostCard;