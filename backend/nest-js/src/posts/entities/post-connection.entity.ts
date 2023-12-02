import { ObjectType, Field } from '@nestjs/graphql';

import { ConnectionInfo } from './connection-info.entity';
import { Post } from './post.entity';

@ObjectType('PostConnection')
export class PostConnection {
  @Field(() => [Post])
  data: Post[];

  @Field(() => ConnectionInfo)
  info: ConnectionInfo;
}
