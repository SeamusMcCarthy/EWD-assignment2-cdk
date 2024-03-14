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
