import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { completeExchange } from "@/api/api";

const ratingLabels: Record<number, string> = {
  1: "ต้องปรับปรุงอย่างยิ่ง",
  2: "พอใช้",
  3: "ปานกลาง",
  4: "ดีมาก ประทับใจ",
  5: "ยอดเยี่ยม ไร้ที่ติ!",
};

// =========================================================================
// COMPONENT: ReviewExchange (หน้าจอให้คะแนนและรีวิวระดับพรีเมียม)
// =========================================================================
export default function ReviewExchange() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * ฟังก์ชัน: handleSubmit
   * มีไว้สำหรับ: ตรวจสอบคะแนน จัดเตรียมข้อมูล และยิง API บันทึกรีวิวลงฐานข้อมูล
   */
  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "กรุณาให้คะแนนดาวก่อนส่งรีวิวครับ",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await completeExchange(matchId, {
        score: rating,
        comment: review,
      });

      if (response.success) {
        toast({
          title: "ขอบคุณสำหรับรีวิว!",
          description: "บันทึกข้อมูลการแลกเปลี่ยนสำเร็จ",
        });
        navigate("/exchange-history");
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "ระบบขัดข้อง",
        description: "ไม่สามารถบันทึกรีวิวได้ในขณะนี้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Header & Back Button (คงโครงสร้างเดิมตามบรีฟ) */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="-ml-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              ให้คะแนนความพึงพอใจ
            </h1>
            <p className="text-xs text-muted-foreground">
              แบ่งปันประสบการณ์การแลกเปลี่ยนของคุณเพื่อสร้างความน่าเชื่อถือ
            </p>
          </div>
        </div>

        <Card className="border bg-card shadow-sm rounded-2xl overflow-hidden backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8 space-y-6 text-center">
            {/* แบดจ์แสดงสถานะสำเร็จและพร้อมรีวิว */}
            <div className="text-4xl">🎉</div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold">ให้คะแนนประสบการณ์ของคุณ</h2>
              <p className="text-xs text-muted-foreground">
                รีวิวของคุณจะช่วยพัฒนาคอมมูนิตี้การแลกเปลี่ยนให้ดียิ่งขึ้น
              </p>
            </div>

            {/* Interactive Star Rating */}
            <div className="space-y-3 py-2">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(s)}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-9 w-9 transition-colors ${
                        s <= (hovered || rating)
                          ? "fill-amber-400 text-amber-500 drop-shadow-xs"
                          : "text-muted-foreground/30 hover:text-muted-foreground/60"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="h-6 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary transition-all">
                  {hovered || rating
                    ? ratingLabels[hovered || rating]
                    : "แตะดาวเพื่อให้คะแนน"}
                </span>
              </div>
            </div>

            {/* Textarea สำหรับเขียนรีวิว */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold text-muted-foreground ml-1">
                ความคิดเห็นเพิ่มเติม (ไม่บังคับ)
              </label>
              <Textarea
                placeholder="เช่น สินค้าตรงปก บริการดี นัดรับตรงเวลา สุภาพเรียบร้อย..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                className="resize-none rounded-xl bg-muted/30 focus-visible:ring-primary/40 text-sm"
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full eco-gradient text-primary-foreground font-semibold rounded-xl h-11 shadow-md transition-all active:scale-95"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "กำลังบันทึกข้อมูล..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> ส่งรีวิว
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
