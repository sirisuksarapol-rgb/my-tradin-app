import { mockPosts } from "@/lib/post_data";
import { MatchItem } from "@/lib/match_data";
import { ExchangeItem } from "@/lib/exchang_data";
import { PostItem } from "@/lib/post_data";   
export interface IncomingRequest {
  id: string;
  requesterName: string;
  theirItem: { postId: string; title: string; image: string };
  myItem: { postId: string; title: string; image: string };
  time: string;
}

export const mockIncomingRequests: IncomingRequest[] = [
  {
    id: "ir1",
    requesterName: "มานะ",
    theirItem: {
      postId: mockPosts[1]?.id || "2",
      title: "Macbook Air M1",
      image: mockPosts[1]?.images[0] || "https://placehold.co/400",
    },
    myItem: {
      postId: mockPosts[0]?.id || "1",
      title: "กล้อง Canon EOS M50",
      image: mockPosts[0]?.images[0] || "https://placehold.co/400",
    },
    time: "10 นาทีที่แล้ว",
  }
];

export interface IncomingRequest {
  id: string;
  requesterName: string;
  theirItem: { postId: string; title: string; image: string };
  myItem: { postId: string; title: string; image: string };
  time: string;
}
