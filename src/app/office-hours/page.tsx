import type { Metadata } from "next";
import OfficeHoursBoard from "@/components/office-hours-board";

export const metadata: Metadata = {
  title: "Office Hours | Chaos Board",
  description: "찬반 투표와 실시간 진영 채팅을 함께 보여주는 토론 게시판",
};

export default function OfficeHoursPage() {
  return <OfficeHoursBoard />;
}
