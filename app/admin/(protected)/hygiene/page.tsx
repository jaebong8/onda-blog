import { prisma } from "@/lib/prisma";
import { SyncButton, GeneratePostButton } from "./_components/hygiene-actions";

export const dynamic = "force-dynamic";

export default async function HygienePage() {
  const [total, gradeStats, siDoStats] = await Promise.all([
    prisma.hygieneGrade.count(),
    prisma.hygieneGrade.groupBy({
      by: ["grade"],
      _count: { grade: true },
      orderBy: { _count: { grade: "desc" } },
    }),
    prisma.hygieneGrade.groupBy({
      by: ["siDo"],
      _count: { siDo: true },
      orderBy: { _count: { siDo: "desc" } },
      take: 17,
    }),
  ]);

  const siDoList = siDoStats.map((s) => s.siDo).filter(Boolean);

  const GRADE_COLOR: Record<string, string> = {
    매우우수: "text-green-600 dark:text-green-400",
    우수: "text-blue-600 dark:text-blue-400",
    좋음: "text-yellow-600 dark:text-yellow-400",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">식품접객업소 위생등급</h1>
        <p className="text-sm text-muted-foreground mt-1">
          식품의약품안전처 공공데이터 · 매주 일요일 새벽 3시 자동 동기화
        </p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">전체 업소</p>
          <p className="text-2xl font-bold">{total.toLocaleString()}</p>
        </div>
        {gradeStats.map((s) => (
          <div key={s.grade} className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{s.grade}</p>
            <p className={`text-2xl font-bold ${GRADE_COLOR[s.grade] ?? ""}`}>
              {s._count.grade.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* 데이터 동기화 */}
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div>
          <h2 className="font-semibold">데이터 동기화</h2>
          <p className="text-sm text-muted-foreground">
            최근 30일 변경 데이터를 가져옵니다. 최초 실행 시 시간이 걸릴 수 있습니다.
          </p>
        </div>
        <SyncButton />
      </div>

      {/* AI 블로그 글 생성 */}
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div>
          <h2 className="font-semibold">AI 블로그 글 생성</h2>
          <p className="text-sm text-muted-foreground">
            지역을 선택하면 Claude가 위생등급 데이터를 분석해 블로그 초안을 생성합니다.
            생성된 글은 비공개 초안으로 저장됩니다.
          </p>
        </div>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            먼저 데이터를 동기화하세요.
          </p>
        ) : (
          <GeneratePostButton siDoList={siDoList} />
        )}
      </div>

      {/* 시도별 현황 */}
      {siDoStats.length > 0 && (
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="font-semibold">시도별 현황</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {siDoStats.map((s) => (
              <div key={s.siDo} className="flex justify-between text-sm px-3 py-2 rounded-md bg-muted/50">
                <span>{s.siDo}</span>
                <span className="font-medium">{s._count.siDo.toLocaleString()}개</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
