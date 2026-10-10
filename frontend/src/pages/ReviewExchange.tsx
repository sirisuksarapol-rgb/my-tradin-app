
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
    if (!matchId) {
      toast({
        title: "ไม่พบข้อมูลการแลกเปลี่ยน",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "กรุณาให้คะแนน",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await completeExchange(matchId, {
        score: rating,
        comment: review,
      });

      if (!response.success) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: response.message || "ไม่สามารถบันทึกรีวิวได้",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "ขอบคุณสำหรับรีวิว!",
        description: "การแลกเปลี่ยนเสร็จสมบูรณ์แล้ว",
      });

      navigate(`/exchange-tracking/${matchId}`);
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
      <div className="mx-auto max-w-lg space-y-5 px-4 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="-ml-2 text-foreground transition-all hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <h1 className="text-xl font-bold">ให้คะแนนและรีวิว</h1>
        </div>

        <Card className="glass-card">
          <CardContent className="space-y-5 p-6 text-center">
            <div>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full">
                <span className="text-5xl">🎉</span>
              </div>

              <p className="mt-3 text-sm font-semibold">
                การแลกเปลี่ยนสำเร็จ!
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                ให้คะแนนประสบการณ์ของคุณ
              </p>
            </div>

            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} คะแนน`}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hovered || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {rating === 0 ? "แตะดาวเพื่อให้คะแนน" : `${rating} / 5 คะแนน`}
            </p>

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
              <Send className="mr-1 h-4 w-4" />
              {isSubmitting ? "กำลังบันทึกข้อมูล..." : "ส่งรีวิว"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}