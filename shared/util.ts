import { marshall } from "@aws-sdk/util-dynamodb";
import { MovieReview, Playlist, PlaylistEntry } from "./types";

export const generateMovieReviewItem = (movieReview: MovieReview) => {
  return {
    PutRequest: {
      Item: marshall(movieReview),
    },
  };
};

export const generateBatch = (data: MovieReview[]) => {
  return data.map((e) => {
    return generateMovieReviewItem(e);
  });
};

export const generatePlaylistItem = (playlist: Playlist) => {
  return {
    PutRequest: {
      Item: marshall(playlist),
    },
  };
};

export const generatePlaylistBatch = (data: Playlist[]) => {
  return data.map((e) => {
    return generatePlaylistItem(e);
  });
};
export const generatePlaylistEntryItem = (playlistEntry: PlaylistEntry) => {
  return {
    PutRequest: {
      Item: marshall(playlistEntry),
    },
  };
};

export const generatePlaylistEntryBatch = (data: PlaylistEntry[]) => {
  return data.map((e) => {
    return generatePlaylistEntryItem(e);
  });
};
