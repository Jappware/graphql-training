import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { Comment, CommentParams, ConnectionInfo, Post, PostParams } from './models';
import { CREATE_COMMENT, CREATE_POST, POST, POSTS, POSTS_PAGINATED, REMOVE_POST, UPDATE_POST } from './graphql';
import { POSTS_COMMENTS } from 'src/app/@shared/components/header/graphql';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  constructor(private apollo: Apollo) {}

  queryPosts(): Observable<Post[]> {
    return this.apollo
      .watchQuery<{ posts: Post[] }>({
        query: POSTS,
      })
      .valueChanges.pipe(map(({ data }) => data?.posts));
  }

  queryPostsPaginated(page = 1, pageSize = 10): Observable<{ data: Post[]; info: ConnectionInfo }> {
    return this.apollo
      .watchQuery<{ postsPaginated: { data: Post[]; info: ConnectionInfo } }>({
        query: POSTS_PAGINATED,
        variables: { page, pageSize },
      })
      .valueChanges.pipe(map(({ data }) => ({ data: data.postsPaginated.data, info: data.postsPaginated.info })));
  }

  queryPost(id: number): Observable<{ post: Post; loading: boolean }> {
    return this.apollo
      .watchQuery<{ post: Post }>({
        query: POST,
        variables: { id },
      })
      .valueChanges.pipe(
        map(({ data, loading }) => ({
          post: data?.post,
          loading,
        }))
      );
  }

  createPost(postParams: PostParams): Observable<Post | undefined> {
    return this.apollo
      .mutate<{ __typename: string; createPost: Post }>({
        mutation: CREATE_POST,
        variables: {
          createPost: { ...postParams },
        },
        // refetchQueries: [POSTS, 'posts'],
        optimisticResponse: {
          __typename: 'Mutation',
          createPost: {
            __typename: 'Post',
            id: Math.round(Math.random() * -1000000),
            ...postParams,
          },
        },
        update: (cache, { data }) => {
          const list = cache.readQuery<{ posts: Post[] }>({ query: POSTS });
          cache.writeQuery({
            query: POSTS,
            data: { posts: [data?.createPost, ...list!.posts] },
          });
        },
      })
      .pipe(map(({ data }) => data?.createPost));
  }

  updatePost(postId: number, postParams: PostParams): Observable<Post | undefined> {
    return this.apollo
      .mutate<{ __typename: string; updatePost: Post }>({
        mutation: UPDATE_POST,
        variables: {
          updatePost: { id: postId, ...postParams },
        },
        // refetchQueries: [POSTS, 'posts'],
        optimisticResponse: {
          __typename: 'Mutation',
          updatePost: {
            __typename: 'Post',
            id: postId,
            ...postParams,
          },
        },
        update: (cache, { data }) => {
          const list = cache.readQuery<{ posts: Post[] }>({ query: POSTS });
          const posts = (list?.posts || []).map(({ id, ...post }) =>
            postId === id ? { id, ...post, ...data?.updatePost } : { id, ...post }
          );

          cache.writeQuery({
            query: POSTS,
            data: { posts },
          });
        },
      })
      .pipe(map(({ data }) => data?.updatePost));
  }

  removePost(id: number): Observable<Post | undefined> {
    return this.apollo
      .mutate<{ removePost: Post }>({
        mutation: REMOVE_POST,
        variables: { id },
        // refetchQueries: [POSTS, 'posts'],
        update: (cache) => {
          const normalizedId = cache.identify({ id, __typename: 'Post' });
          cache.evict({ id: normalizedId });
          cache.gc();
        },
      })
      .pipe(map(({ data }) => data?.removePost));
  }

  createComment(postId: number, commentParams: CommentParams): Observable<Comment | undefined> {
    return this.apollo
      .mutate<{ __typename: string; createComment: Comment }>({
        mutation: CREATE_COMMENT,
        // refetchQueries: [{ query: POST }, { query: POSTS_COMMENTS }],
        variables: {
          postId: postId,
          createComment: { ...commentParams },
        },
        optimisticResponse: {
          __typename: 'Mutation',
          createComment: {
            __typename: 'Comment',
            id: Math.round(Math.random() * -1000000),
            postId,
            ...commentParams,
          },
        },
        update: (cache, { data }) => {
          const newComment = data?.createComment;
          const postCache = cache.readQuery<{ post: Post }>({ query: POST, variables: { id: postId } });
          const postComments = postCache?.post?.comments || [];
          const updatedPostComments = newComment ? [newComment, ...postComments] : [...postComments];

          cache.writeQuery({
            query: POST,
            data: { post: { ...postCache?.post, comments: updatedPostComments } },
          });

          const postsCommentsCache = cache.readQuery<{ posts: Post[]; comments: Comment[] }>({ query: POSTS_COMMENTS });
          const allPosts = postsCommentsCache?.posts || [];
          const allComments = postsCommentsCache?.comments || [];
          const updatedAllComments = newComment ? [newComment, ...allComments] : [...allComments];

          cache.writeQuery({
            query: POSTS_COMMENTS,
            data: { posts: [...allPosts], comments: updatedAllComments },
          });
        },
      })
      .pipe(map(({ data }) => data?.createComment));
  }
}
