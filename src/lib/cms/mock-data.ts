import type { Product, StudioEvent } from "./types";

const img = (id: string) => `https://images.unsplash.com/${id}?w=400&q=70&auto=format&fit=crop`;

export const seedProducts: Product[] = [
  { id: "p1", name: "Handmade Ceramic Mug", slug: "handmade-ceramic-mug", description: "Wheel-thrown stoneware mug glazed in mountain ash.", price: 1000, category: "Ceramics", stock: 12, image: img("photo-1514228742587-6b1558fcca3d"), active: true },
  { id: "p2", name: "Himalayan Silver Necklace", slug: "himalayan-silver-necklace", description: "Hand-hammered sterling silver pendant with turquoise.", price: 3200, category: "Jewellery", stock: 4, image: img("photo-1599643478518-a784e5dc4c8f"), active: true },
  { id: "p3", name: "Handwoven Scarf", slug: "handwoven-scarf", description: "Soft wool scarf woven on a traditional loom.", price: 1800, category: "Textiles", stock: 2, image: img("photo-1601924994987-69e26d50dc26"), active: true },
  { id: "p4", name: "Crochet Dreamcatcher", slug: "crochet-dreamcatcher", description: "Delicate crochet dreamcatcher with feathers.", price: 850, category: "Decor", stock: 0, image: img("photo-1513519245088-0e12902e5a38"), active: false },
  { id: "p5", name: "Clay Incense Holder", slug: "clay-incense-holder", description: "Small hand-pinched holder in terracotta.", price: 450, category: "Ceramics", stock: 20, image: img("photo-1610701596007-11502861dcfa"), active: true },
];

export const seedEvents: StudioEvent[] = [
  { id: "e1", title: "Pottery Workshop", slug: "pottery-workshop", description: "A beginner-friendly afternoon at the wheel.", date: "2026-10-18", startTime: "14:00", endTime: "17:00", location: "Dii Art Studio, Dharamshala", price: 2500, capacity: 10, image: img("photo-1565193566173-7a0ee3dbe261"), active: true },
  { id: "e2", title: "Jewellery Making Session", slug: "jewellery-making-session", description: "Make your own silver ring with guided instruction.", date: "2026-10-25", startTime: "11:00", endTime: "14:00", location: "Dii Art Studio, Dharamshala", price: 3500, capacity: 6, image: img("photo-1611591437281-460bfbe1220a"), active: true },
  { id: "e3", title: "Weaving Workshop", slug: "weaving-workshop", description: "Learn the basics of frame-loom weaving.", date: "2026-11-08", startTime: "10:00", endTime: "13:00", location: "McLeod Ganj Community Hall", price: 2000, capacity: 12, image: img("photo-1528459105426-b9548367069b"), active: true },
  { id: "e4", title: "Himalayan Craft Session", slug: "himalayan-craft-session", description: "An introduction to traditional regional crafts.", date: "2026-09-12", startTime: "15:00", endTime: "18:00", location: "Dii Art Studio, Dharamshala", price: 1500, capacity: 15, image: img("photo-1452860606245-08befc0ff44b"), active: false },
];
