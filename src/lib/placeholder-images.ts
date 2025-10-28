import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  // Add properties from Firestore images to make types compatible
  originalName?: string;
  directUrl?: string;
  userId?: string;
  likeCount?: number;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
