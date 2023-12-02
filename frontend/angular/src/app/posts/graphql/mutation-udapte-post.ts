import { gql } from 'apollo-angular';

export const UPDATE_POST = gql`
  mutation updatePost($updatePost: UpdatePostInput!) {
    updatePost(updatePostInput: $updatePost) {
      id
      title
      body
      __typename
    }
  }
`;
