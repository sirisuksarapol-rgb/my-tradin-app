import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { completeExchange } from "@/api/api";

export default function ReviewExchange() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "กรุณาให้คะแนน", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 🌟 2. เรียกใช้ API เพื่อส่งข้อมูลกลับไปที่ Backend 
      // (ระบบหลังบ้านจะต้องรับค่าไปอัปเดต Status เป็น 'completed' พร้อมบันทึก Score และ Comment)
      const response = await completeExchange(matchId, {
        score: rating,
        comment: review
      });

      if (response.success) {
        toast({ title: "ขอบคุณสำหรับรีวิว!", description: "การแลกเปลี่ยนเสร็จสมบูรณ์แล้ว" });
        // 🌟 3. ส่งกลับไปหน้าประวัติแทน เพื่อให้ผู้ใช้เห็นว่าของไปอยู่ในแท็บ "สำเร็จ" แล้ว
        navigate("/exchange-history"); 
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: response.message, variant: "destructive" });
      }

    } catch (error) {
      console.error("Error submitting review:", error);
      toast({ title: "ระบบขัดข้อง", description: "ไม่สามารถบันทึกรีวิวได้ในขณะนี้", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-4 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-2">
          <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="-ml-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
          <Star className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">ให้คะแนนและรีวิว</h1>
        </div>

        <Card className="glass-card">
          <CardContent className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full eco-gradient mx-auto flex items-center justify-center">
              <Star className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">การแลกเปลี่ยนสำเร็จ!</p>
              <p className="text-xs text-muted-foreground mt-1">ให้คะแนนประสบการณ์ของคุณ</p>
            </div>

            {/* Star rating */}
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      s <= (hovered || rating)
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {rating === 0 ? "แตะดาวเพื่อให้คะแนน" : `${rating} / 5 คะแนน`}
            </p>

            {/* Review text */}
            <Textarea
              placeholder="เขียนรีวิวเกี่ยวกับประสบการณ์การแลกเปลี่ยน (ไม่บังคับ)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />

            <Button 
              className="w-full eco-gradient text-primary-foreground" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4 mr-1" /> 
              {isSubmitting ? "กำลังบันทึกข้อมูล..." : "ส่งรีวิว"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
