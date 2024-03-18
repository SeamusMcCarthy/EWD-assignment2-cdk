export type MovieReview = {
  movieId: number;
  reviewerName: string;
  reviewDate: string;
  content: string;
  rating: number;
};

export type MovieReviewQueryParameters = {
  minRating?: number;
};

export type MovieReviewUpdateParameters = {
  movieId: number;
  reviewerName: string;
  content: string;
};

export type SignUpBody = {
  username: string;
  password: string;
  email: string;
};

export type ConfirmSignUpBody = {
  username: string;
  code: string;
};

export type SignInBody = {
  username: string;
  password: string;
};
