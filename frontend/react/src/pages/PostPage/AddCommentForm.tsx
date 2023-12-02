import { gql } from '__generated__';
import { Comment, Post } from '__generated__/graphql';
import { SaveOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import { Button, Form, Input, Typography } from 'antd';
import { useCallback } from 'react';

import { QUERY_POSTS_COMMENTS } from '../../common/components/MainLayout/MainHeader';
import { QUERY_POST } from './PostPage';

const { Title } = Typography;
const { TextArea } = Input;

const layout = {
  labelCol: { span: 2 },
  wrapperCol: { span: 22 },
};

type Props = {
  postId: string;
};

const CREATE_COMMENT = gql(/* GraphQL */ `
  mutation createComment($postId: ID!, $createComment: CreateCommentInput!) {
    createComment(postId: $postId, createCommentInput: $createComment) {
      postId
      id
      name
      email
      body
      __typename
    }
  }
`);

export default function AddCommentForm({ postId }: Props) {
  const [form] = Form.useForm();
  const clearForm = useCallback(() => {
    form.resetFields();
  }, [form]);

  const [createComment] = useMutation(CREATE_COMMENT, {
    refetchQueries: ['post', 'postsComments'],
    onCompleted: () => {
      // clearForm();
    },
  });
  const submitComment = (comment: Comment) => {
    createComment({
      variables: { postId, createComment: comment },
      optimisticResponse: {
        __typename: 'Mutation',
        createComment: {
          __typename: 'Comment',
          ...comment,
          id: `${Math.round(Math.random() * -1000000)}`,
          postId: postId,
        },
      },
      update(cache, { data }) {
        const newComment = data?.createComment as Comment;
        const postCache = cache.readQuery({ query: QUERY_POST, variables: { id: +postId } });
        const postComments = postCache?.post?.comments || [];
        const updatedPostComments = newComment ? [newComment, ...postComments] : [...postComments];

        cache.writeQuery({
          query: QUERY_POST,
          data: { post: { ...(postCache?.post as Post), comments: updatedPostComments } },
        });

        const postsCommentsCache = cache.readQuery<{ posts: Post[]; comments: Comment[] }>({
          query: QUERY_POSTS_COMMENTS,
        });
        const allPosts = postsCommentsCache?.posts || [];
        const allComments = postsCommentsCache?.comments || [];
        const updatedAllComments = newComment ? [newComment, ...allComments] : [...allComments];

        cache.writeQuery({
          query: QUERY_POSTS_COMMENTS,
          data: { posts: [...allPosts], comments: updatedAllComments },
        });
      },
    });
    clearForm();
  };

  return (
    <>
      <Title level={4}>Add Comment</Title>
      <Form {...layout} form={form} onFinish={submitComment}>
        <Form.Item name="email" label="Email" rules={[{ type: 'email', required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="body" label="Body" rules={[{ required: true }]}>
          <TextArea rows={4} />
        </Form.Item>

        <div className="flex flex-row justify-end gap-4">
          <Button htmlType="button" onClick={clearForm}>
            Clear
          </Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            Add Comment
          </Button>
        </div>
      </Form>
    </>
  );
}
