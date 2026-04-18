import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowRightLeft, MapPin, Phone, ShieldCheck, Sparkles, ArrowLeft, Box, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { mockPosts } from "@/lib/post_data";
import { mockMatches } from "@/lib/match_data";
import { useToast } from "@/hooks/use-toast";

export default function ExchangePreview() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const myInventory = useMemo(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      return mockPosts.filter(post => post.author.id === user.id);
    }
    return mockPosts.slice(0, 3);
  }, []);

  const [selectedMyPostId, setSelectedMyPostId] = useState(
    myInventory.length > 0 ? myInventory[0].id : ""
  );

  const isInitiating = matchId?.startsWith("post-");

  const match = useMemo(() => {
    if (location.state?.matchData) {
      return location.state.matchData;
    }

    if (isInitiating) {
      const postId = matchId!.replace("post-", "");
      const theirPost = mockPosts.find((p) => p.id === postId) || mockPosts[1];
      const mySelectedPost = myInventory.find((p) => p.id === selectedMyPostId) || myInventory[0];

      return {
        id: matchId,
        myPost: mySelectedPost,
        theirPost,
        score: null,
        status: "pending",
      };
    }

    return mockMatches.find((m) => m.id === matchId) || mockMatches[0];
  }, [matchId, selectedMyPostId, isInitiating, location.state, myInventory]);

  const handleConfirm = () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "กรุณากรอกเบอร์โทรศัพท์",
        description: "ต้องกรอกให้ครบ 10 หลัก",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      toast({
        title: "ส่งคำขอแลกเปลี่ยนสำเร็จ!",
        description: `ระบบได้แจ้งเสนอ ${match.myPost.title} ไปยัง ${match.theirPost.author.name} แล้ว`,
      });

      navigate(`/exchange-tracking/${match.id}`, {
        state: { matchData: match }
      });
    }, 800);
  };

  return (
    <AppLayout>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">ยืนยันการแลกเปลี่ยน</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Item selection + Match comparison */}
            <div className="lg:col-span-2 space-y-6">
              {/* Select item */}
              {isInitiating && (
                <Card className="glass-card border-primary/20 shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Box className="h-4 w-4 text-primary" />
                        เลือกสิ่งของที่คุณต้องการเสนอแลก
                      </h2>
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        มี {myInventory.length} ชิ้น
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {myInventory.map((post) => {
                        const isSelected = selectedMyPostId === post.id;
                        return (
                          <div
                            key={post.id}
                            onClick={() => setSelectedMyPostId(post.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none
                              ${isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-transparent bg-secondary/30 hover:bg-secondary/60"
                              }`}
                          >
                            <img src={post.images[0]} alt={post.title} className="w-14 h-14 rounded-lg object-cover shadow-sm shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                                {post.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{post.category}</p>
                            </div>
                            <div className="shrink-0 pl-2">
                              {isSelected ? (
                                <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground/30" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Match comparison */}
              <Card className="glass-card overflow-hidden">
                {!isInitiating && match.score && (
                  <div className="eco-gradient px-4 py-3 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                    <span className="text-sm font-semibold text-primary-foreground">
                      คะแนนความเหมาะสม {match.score}%
                    </span>
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4 sm:gap-8 justify-center">
                    <div className="flex-1 text-center space-y-3">
                      <img
                        src={match.myPost.images[0]}
                        alt={match.myPost.title}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover mx-auto border-2 border-primary/20"
                      />
                      <p className="text-sm font-semibold truncate">{match.myPost.title}</p>
                      <Badge variant="secondary" className="text-[10px]">{match.myPost.category}</Badge>
                      <p className="text-[10px] text-muted-foreground">ของคุณ</p>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <ArrowRightLeft className="h-6 w-6 text-primary" />
                      <span className="text-[10px] text-muted-foreground">แลก</span>
                    </div>

                    <div className="flex-1 text-center space-y-3">
                      <img
                        src={match.theirPost.images[0]}
                        alt={match.theirPost.title}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover mx-auto border-2 border-accent/20"
                      />
                      <p className="text-sm font-semibold truncate">{match.theirPost.title}</p>
                      <Badge variant="secondary" className="text-[10px]">{match.theirPost.category}</Badge>
                      <p className="text-[10px] text-muted-foreground">{match.theirPost.author.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Location + Phone + Actions */}
            <div className="space-y-6">
              {/* Location */}
              <Card className="glass-card">
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    สถานที่นัดรับ
                  </h2>
                  <div className="space-y-3">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">ของคุณ</p>
                      <p className="text-xs font-medium">{match.myPost.location}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{match.theirPost.author.name}</p>
                      <p className="text-xs font-medium">{match.theirPost.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phone */}
              <Card className="glass-card">
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    หมายเลขโทรศัพท์ของคุณ
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    เบอร์นี้จะแสดงให้คู่แลกเห็นเมื่อยืนยันรหัสความปลอดภัยเท่านั้น
                  </p>
                  <Input
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ""))}
                    maxLength={12}
                    className="h-11"
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  className="w-full eco-gradient text-primary-foreground h-12"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? "กำลังส่ง..." : "ยืนยันส่งคำขอแลกเปลี่ยน"}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full hover:bg-orange-500/85 hover:text-white transition-colors"
                  onClick={() => navigate(-1)}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
