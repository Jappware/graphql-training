import { gql } from '__generated__';
import { Post } from '__generated__/graphql';
import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Card, Form, Input, Layout, Modal, Typography } from 'antd';
import { Loader } from 'common/components/Loader';
import { EmptyImageUrl } from 'common/EmptyImage';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title } = Typography;
const { TextArea } = Input;

const formLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

const QUERY_POSTS = gql(/* GraphQL */ `
  query posts {
    posts {
      id
      title
      body
    }
  }
`);

const ADD_POST = gql(/* GraphQL */ `
  mutation createPost($createPost: CreatePostInput!) {
    createPost(createPostInput: $createPost) {
      id
      title
      body
      __typename
    }
  }
`);

const UPDATE_POST = gql(/* GraphQL */ `
  mutation updatePost($updatePost: UpdatePostInput!) {
    updatePost(updatePostInput: $updatePost) {
      id
      title
      body
    }
  }
`);

const REMOVE_POST = gql(/* GraphQL */ `
  mutation removePost($id: Int!) {
    removePost(id: $id) {
      title
    }
  }
`);

export default function PostsPage() {
  const navigate = useNavigate();
  const { loading, data } = useQuery(QUERY_POSTS);
  const { posts } = data || {};

  const [createForm] = Form.useForm();
  const [openCreate, setOpenCreate] = useState(false);
  const showCreateModal = () => {
    setOpenCreate(true);
  };
  const closeCreateModal = useCallback(() => {
    setOpenCreate(false);
    createForm.resetFields();
  }, [createForm]);
  const [createPost, { loading: creating }] = useMutation(ADD_POST, {
    // refetchQueries: ['posts'],
    onCompleted: () => {
      closeCreateModal();
    },
  });

  const submitCreateModal = (post: Post) => {
    createPost({
      variables: { createPost: post },
      refetchQueries: [QUERY_POSTS, 'posts'],
      optimisticResponse: {
        __typename: 'Mutation',
        createPost: {
          __typename: 'Post',
          ...post,
          id: `${Math.round(Math.random() * -1000000)}`,
        },
      },
      update(cache, { data }) {
        const list: any = cache.readQuery({ query: QUERY_POSTS });
        cache.writeQuery({
          query: QUERY_POSTS,
          data: { posts: [data?.createPost, ...list!.posts] },
        });
      },
    });
    closeCreateModal();
  };

  const [editForm] = Form.useForm();
  const [openEdit, setOpenEdit] = useState(false);
  const showEditModal = ({ id, title, body }: { id: string; title: string; body?: string | null }) => {
    setOpenEdit(true);
    editForm.setFieldsValue({ id, title, body });
  };
  const closeEditModal = useCallback(() => {
    setOpenEdit(false);
    editForm.resetFields();
  }, [editForm]);
  const [updatePost, { loading: editing }] = useMutation(UPDATE_POST, {
    onCompleted: () => {
      closeEditModal();
    },
  });

  const submitEditModal = (post: Post) => {
    updatePost({ variables: { updatePost: { ...post, id: +post.id! } } });
  };

  const [removePost] = useMutation(REMOVE_POST);
  const handleDeletePost = (postId: string) => {
    removePost({
      variables: { id: +postId },
      update: (cache, _, { variables }) => {
        const normalizedId = cache.identify({ id: variables!.id, __typename: 'Post' });
        cache.evict({ id: normalizedId });
        cache.gc();
      },
    });
  };

  const navigateToPost = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  return (
    <>
      <Content className="my-auto mx-3 flex flex-col items-center">
        <Title className="text-center">Posts</Title>

        <section className="w-800-px">
          <Button className="mb-5" type="primary" size="large" icon={<PlusOutlined />} onClick={showCreateModal}>
            Add Post
          </Button>

          {posts?.length ? (
            posts.map(({ id, title, body }) => (
              <Card key={id} title={title} className="w-full mb-10">
                <div className="mb-4 flex">
                  <img
                    className="shadow-xl border-solid border-gray-200 rounded-lg"
                    width={200}
                    src={EmptyImageUrl}
                    alt={title}
                  />
                  <div className="ml-6">
                    <span>{body}</span>
                    <span className="ml-2 underline cursor-pointer" onClick={() => navigateToPost(id)}>
                      Show details
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal({ id, title, body })}>
                    Edit
                  </Button>
                  <Button type="primary" danger icon={<DeleteOutlined />} onClick={() => handleDeletePost(id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          ) : loading ? (
            <Loader />
          ) : (
            <Title level={4} className="text-center">
              There are no posts
            </Title>
          )}
        </section>
      </Content>

      <Modal
        open={openCreate}
        title="Add Post"
        onOk={createForm.submit}
        onCancel={closeCreateModal}
        footer={[
          <Button key="back" onClick={closeCreateModal}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={creating}
            onClick={createForm.submit}
          >
            Add Post
          </Button>,
        ]}
      >
        <Form {...formLayout} form={createForm} onFinish={submitCreateModal}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={openEdit}
        title="Edit Post"
        onOk={editForm.submit}
        onCancel={closeEditModal}
        footer={[
          <Button key="back" onClick={closeEditModal}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" icon={<SaveOutlined />} loading={editing} onClick={editForm.submit}>
            Update Post
          </Button>,
        ]}
      >
        <Form {...formLayout} form={editForm} onFinish={submitEditModal}>
          <Form.Item name="id" noStyle>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
