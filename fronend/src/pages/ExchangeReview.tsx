import { useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

import { mockExchanges } from "@/lib/exchang_data";

export default function ExchangeReview() {

   const { id } = useParams();

   const exchange = mockExchanges.find(
      (ex) => ex.id === id
   );

   if (!exchange) {
      return (
         <AppLayout>
            <p className="p-6">ไม่พบข้อมูล</p>
         </AppLayout>
      );
   }

   return (
      <AppLayout>
         <div className="max-w-xl mx-auto p-6 space-y-4">

            <h1 className="text-2xl font-bold">
               รีวิวการแลกเปลี่ยน
            </h1>

            <Card>
               <CardContent className="space-y-3 py-4">

                  <p className="font-semibold">
                     {exchange.itemA} ↔ {exchange.itemB}
                  </p>

                  <p className="text-sm text-muted-foreground">
                     แลกกับ {exchange.partnerName}
                  </p>

                  <div className="flex items-center gap-1">
                     {[...Array(exchange.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                     ))}
                  </div>

                  <p className="text-sm">
                     {exchange.review}
                  </p>

               </CardContent>
            </Card>

         </div>
      </AppLayout>
   );
}