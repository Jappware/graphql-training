import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { finalize, Observable, Subject, takeUntil } from 'rxjs';
import { FormValidationMessages, getFormErrors, trimValue } from 'src/app/@shared/utils';
import { Post } from 'src/app/posts/models';
import { PostsService } from 'src/app/posts/posts.service';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.scss'],
})
export class PostsComponent implements OnInit, OnDestroy {
  posts$!: Observable<Post[]>;
  editPost!: Post | null;
  isShownCreateModal = false;
  isShownEditModal = false;
  loading = false;

  createForm = new UntypedFormGroup({
    title: new UntypedFormControl(null, Validators.required),
    body: new UntypedFormControl(null, Validators.required),
  });
  createFormErrors = {
    title: [],
    body: [],
  };

  updateForm = new UntypedFormGroup({
    title: new UntypedFormControl(null, Validators.required),
    body: new UntypedFormControl(null, Validators.required),
  });
  updateFormErrors = {
    title: [],
    body: [],
  };

  private validationMessages: FormValidationMessages = {
    title: { required: 'Field is required' },
    body: { required: 'Field is required' },
  };
  private unsubscribe$ = new Subject<void>();

  constructor(private router: Router, private postsService: PostsService) {}

  ngOnInit(): void {
    this.createForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(this.handleCreateFormErrors.bind(this));
    this.updateForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(this.handleUpdateFormErrors.bind(this));
    this.queryPosts();
  }

  queryPosts(): void {
    this.posts$ = this.postsService.queryPosts();
  }

  showDetails(post: Post): void {
    this.router.navigate([`/posts/${post.id}`]);
  }

  createPost(): void {
    if (this.createForm.invalid) {
      this.handleCreateFormErrors();
      return;
    }

    const post = trimValue(this.createForm.value);
    this.startLoading();
    this.postsService
      .createPost(post)
      .pipe(finalize(this.endLoading.bind(this)))
      .subscribe(() => {
        // this.hideCreateModal();
      });
    this.hideCreateModal();
  }

  updatePost(): void {
    if (this.updateForm.invalid) {
      this.handleUpdateFormErrors();
      return;
    }

    const { id } = this.editPost || {};
    const post = trimValue(this.updateForm.value);
    this.startLoading();
    this.postsService
      .updatePost(+id!, post)
      .pipe(finalize(this.endLoading.bind(this)))
      .subscribe(() => {
        // this.hideEditModal();
      });
    this.hideEditModal();
  }

  deletePost({ id }: Post): void {
    this.postsService.removePost(+id).subscribe();
  }

  showCreateModal(): void {
    this.isShownCreateModal = true;
  }

  hideCreateModal(): void {
    this.isShownCreateModal = false;
    this.createForm.reset();
  }

  showEditModal({ title, body, ...rest }: Post): void {
    this.isShownEditModal = true;
    this.editPost = { ...rest, title, body };
    this.updateForm.setValue({ title, body });
  }

  hideEditModal(): void {
    this.isShownEditModal = false;
    this.editPost = null;
    this.updateForm.reset();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private handleCreateFormErrors(): void {
    this.createFormErrors = getFormErrors(this.createForm, this.createFormErrors, this.validationMessages) as any;
  }

  private handleUpdateFormErrors(): void {
    this.updateFormErrors = getFormErrors(this.updateForm, this.updateFormErrors, this.validationMessages) as any;
  }

  private startLoading(): void {
    this.loading = true;
  }

  private endLoading(): void {
    this.loading = false;
  }
}
