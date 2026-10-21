
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  images: string[];
  active: boolean;
}

export interface EventScheduleItem {
  time: string;
  title: string;
}

export interface StudioEvent {
  id: string;
  title: string;
  slug: string;
  description: string;

  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  duration: string;

  location: string;
  price: number;
  capacity: number;

  image: string;
  secondaryImage: string;
  active: boolean;

  hostName: string;
  hostCraft: string;
  hostBio: string;

  level: string;
  language: string;
  about: string;
  whatYouMake: string;

  schedule: EventScheduleItem[];
  amenities: string[];
  whatToBring: string[];

  cancellationPolicy: string;
}

export type ProductInput = Omit<Product, "id">;
export type EventInput = Omit<StudioEvent, "id">;
