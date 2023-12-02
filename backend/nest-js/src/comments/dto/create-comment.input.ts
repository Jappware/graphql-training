import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateCommentInput {
  @Field()
  email: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  body: string;
}
