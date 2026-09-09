import { useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { mockExchanges } from "@/lib/exchang_data";

// =========================================================================
// COMPONENT: ExchangeReview (หน้าจอสำหรับแสดงรายละเอียดและรีวิวการแลกเปลี่ยนสิ่งของ)
// =========================================================================
export default function ExchangeReview() {

   // ดึงค่ารหัส (id) ของรายการแลกเปลี่ยนจาก URL parameters เพื่อใช้ค้นหาข้อมูล
   const { id } = useParams();

   // ค้นหาข้อมูลการแลกเปลี่ยนจากชุดข้อมูลจำลอง (Mock Data) ที่มีรหัสตรงกับพารามิเตอร์
   const exchange = mockExchanges.find(
      (ex) => ex.id === id
   );

   // ตรวจสอบกรณีไม่พบข้อมูลการแลกเปลี่ยน เพื่อแสดงข้อความแจ้งเตือนผู้ใช้งาน
   if (!exchange) {
      return (
         <AppLayout>
            <p className="p-6">ไม่พบข้อมูล</p>
         </AppLayout>
      );
   }

   return (
      <AppLayout>
         {/* พื้นที่หลักสำหรับจัดวางและแสดงผลเนื้อหารีวิวการแลกเปลี่ยน */}
         <div className="max-w-xl mx-auto p-6 space-y-4">

            <h1 className="text-2xl font-bold">
               รีวิวการแลกเปลี่ยน
            </h1>

            {/* การ์ดสำหรับห่อหุ้มและแสดงข้อมูลรายละเอียดการแลกเปลี่ยนและคะแนนรีวิว */}
            <Card>
               <CardContent className="space-y-3 py-4">

                  {/* แสดงชื่อสิ่งของที่ทำการแลกเปลี่ยนระหว่างกัน */}
                  <p className="font-semibold">
                     {exchange.itemA} ↔ {exchange.itemB}
                  </p>

                  {/* แสดงชื่อของคู่แลกเปลี่ยนในรายการนี้ */}
                  <p className="text-sm text-muted-foreground">
                     แลกกับ {exchange.partnerName}
                  </p>

                  {/* วนลูปสร้างไอคอนรูปดาวตามระดับคะแนนรีวิวที่ได้รับ */}
                  <div className="flex items-center gap-1">
                     {[...Array(exchange.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                     ))}
                  </div>

                  {/* แสดงข้อความความคิดเห็นหรือรีวิวรายละเอียดการแลกเปลี่ยน */}
                  <p className="text-sm">
                     {exchange.review}
                  </p>

               </CardContent>
            </Card>

         </div>
      </AppLayout>
   );
}