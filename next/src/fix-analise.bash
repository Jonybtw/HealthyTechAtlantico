sed -i 's/Activity, LineChart as ChartIcon, Link2, Users/Activity, CheckCircle2, LineChart as ChartIcon, Link2, Users/g' next/src/app/\(app\)/analise/page.tsx
sed -i 's/{ value: "bmi", label: t("chartBmi") }/{ value: "bmi", label: t("chartBmi"), icon: <Activity className="size-4" \/> }/g' next/src/app/\(app\)/analise/page.tsx
sed -i 's/{ value: "tests", label: t("chartTests") }/{ value: "tests", label: t("chartTests"), icon: <CheckCircle2 className="size-4" \/> }/g' next/src/app/\(app\)/analise/page.tsx
sed -i 's/{ value: "class", label: t("chartClass") }/{ value: "class", label: t("chartClass"), icon: <Users className="size-4" \/> }/g' next/src/app/\(app\)/analise/page.tsx
sed -i 's/<PageSection tone="utility" layout="list">/<PageSection tone="secondary" layout="list">/g' next/src/app/\(app\)/analise/page.tsx
sed -i 's/<PillSelect/<PillSelect size="lg"/g' next/src/app/\(app\)/analise/page.tsx
