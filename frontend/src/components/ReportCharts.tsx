import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import type { CategoryReport, AccountReport } from '@/api/client';
import { formatCurrency } from '@/utils/currency';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const DEFAULT_COLOURS = ['#6D8EF6', '#F67171', '#4ADE80', '#FACC15', '#A78BFA', '#F472B6', '#22D3EE', '#A3E635'];

interface CategoryChartProps {
  data: CategoryReport[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.map((d, i) => ({
    key: `item-${d.category_id ?? 'none'}`,
    name: d.category_name ?? 'Uncategorized',
    value: Math.abs(d.total),
    fill: `var(--color-item-${d.category_id ?? 'none'})`,
    colour: d.colour ?? DEFAULT_COLOURS[i % DEFAULT_COLOURS.length],
  }));

  const chartConfig: ChartConfig = Object.fromEntries(
    chartData.map((d) => [
      d.key,
      { label: d.name, color: d.colour },
    ]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No data</p>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            <ChartContainer config={chartConfig} className="flex-1 min-h-[300px]">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={100}
                  tickLine={false}
                  axisLine={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => formatCurrency(v)}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="key"
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Bar dataKey="value" radius={4} animationDuration={800}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <ChartContainer config={chartConfig} className="flex-1 min-h-[300px]">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="key"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
                  animationDuration={800}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="key"
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent nameKey="key" />} />
              </PieChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AccountChartProps {
  data: AccountReport[];
}

export function AccountChart({ data }: AccountChartProps) {
  const chartData = data.map((d, i) => ({
    key: `item-${d.account_id}`,
    name: d.account_name,
    value: Math.abs(d.total),
    fill: `var(--color-item-${d.account_id})`,
    colour: DEFAULT_COLOURS[i % DEFAULT_COLOURS.length],
  }));

  const chartConfig: ChartConfig = Object.fromEntries(
    chartData.map((d) => [
      d.key,
      { label: d.name, color: d.colour },
    ]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Account</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No data</p>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => formatCurrency(v)}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="key"
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Bar dataKey="value" radius={4} animationDuration={800}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
