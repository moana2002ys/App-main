import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SupportPanel() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="fixed bottom-4 right-4 text-xs text-muted-foreground underline opacity-60 hover:opacity-100 transition-opacity z-50">
          도움받기
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[320px] rounded-2xl p-6 bg-card border-card-border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-foreground mb-2">
            도움이 필요하신가요?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            조금 더 깊은 이야기가 필요하거나, 전문가의 도움이 필요할 때 언제든 연락할 수 있는 곳들이 있어요.
          </p>
          <div className="bg-secondary/50 p-4 rounded-xl space-y-3">
            <div>
              <p className="font-medium text-foreground">청년 마음건강 센터</p>
              <p className="text-xs text-muted-foreground mt-0.5">평일 09:00 - 18:00</p>
              <p className="font-medium text-primary mt-1">1577-0199</p>
            </div>
            <div className="h-px w-full bg-border" />
            <div>
              <p className="font-medium text-foreground">24시간 위기상담</p>
              <p className="text-xs text-muted-foreground mt-0.5">365일 24시간</p>
              <p className="font-medium text-primary mt-1">1393</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            혼자가 아니에요. 언제든 손을 내밀어주세요.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
