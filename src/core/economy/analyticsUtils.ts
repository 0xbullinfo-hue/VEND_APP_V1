/**
 * Advanced Analytics & Reporting Utilities
 * Provides business intelligence, KPI tracking, data aggregation, and export functionality
 */

export interface BusinessMetric {
  name: string;
  value: number;
  previousValue?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent?: number;
}

export interface Report {
  reportId: string;
  title: string;
  generatedAt: number;
  period: { start: number; end: number };
  metrics: BusinessMetric[];
  summary: string;
}

export interface KPITracker {
  kpiId: string;
  name: string;
  currentValue: number;
  targetValue: number;
  status: 'on-track' | 'at-risk' | 'critical';
  progress: number; // 0-100
  lastUpdated: number;
}

export interface DataExport {
  format: 'csv' | 'json' | 'pdf';
  records: number;
  generatedAt: number;
  filename: string;
}

/**
 * Calculate business metrics from raw data
 */
export function calculateBusinessMetrics(data: {
  revenue: number;
  previousRevenue: number;
  ordersCount: number;
  previousOrdersCount: number;
  customerCount: number;
  retentionRate: number;
  conversionRate: number;
}): BusinessMetric[] {
  const metrics: BusinessMetric[] = [];

  // Revenue metric
  const revenueTrend = data.revenue >= data.previousRevenue ? 'up' : 'down';
  const revenueChange = data.previousRevenue > 0 ? ((data.revenue - data.previousRevenue) / data.previousRevenue) * 100 : 0;
  metrics.push({
    name: 'Total Revenue',
    value: data.revenue,
    previousValue: data.previousRevenue,
    unit: 'NGN',
    trend: revenueTrend,
    changePercent: Math.round(revenueChange * 10) / 10,
  });

  // Orders metric
  const ordersTrend = data.ordersCount >= data.previousOrdersCount ? 'up' : 'down';
  const ordersChange = data.previousOrdersCount > 0 ? ((data.ordersCount - data.previousOrdersCount) / data.previousOrdersCount) * 100 : 0;
  metrics.push({
    name: 'Order Volume',
    value: data.ordersCount,
    previousValue: data.previousOrdersCount,
    unit: 'orders',
    trend: ordersTrend,
    changePercent: Math.round(ordersChange * 10) / 10,
  });

  // Customers metric
  metrics.push({
    name: 'Total Customers',
    value: data.customerCount,
    unit: 'customers',
    trend: 'stable',
  });

  // Retention metric
  metrics.push({
    name: 'Customer Retention',
    value: Math.round(data.retentionRate * 100),
    unit: '%',
    trend: data.retentionRate > 0.5 ? 'up' : 'down',
  });

  // Conversion metric
  metrics.push({
    name: 'Conversion Rate',
    value: Math.round(data.conversionRate * 100),
    unit: '%',
    trend: data.conversionRate > 0.1 ? 'up' : 'stable',
  });

  return metrics;
}

/**
 * Generate comprehensive report from metrics
 */
export function generateReport(
  reportId: string,
  title: string,
  startDate: number,
  endDate: number,
  metrics: BusinessMetric[]
): Report {
  const summaryParts: string[] = [];

  for (const metric of metrics) {
    if (metric.changePercent !== undefined && metric.changePercent !== 0) {
      const direction = metric.trend === 'up' ? 'increased' : metric.trend === 'down' ? 'decreased' : 'remained';
      summaryParts.push(
        `${metric.name} ${direction} by ${Math.abs(metric.changePercent)}% to ${metric.value}${metric.unit}`
      );
    }
  }

  const summary = summaryParts.length > 0
    ? `Report Summary: ${summaryParts.join('. ')}.`
    : 'No significant changes in metrics.';

  return {
    reportId,
    title,
    generatedAt: Date.now(),
    period: { start: startDate, end: endDate },
    metrics,
    summary,
  };
}

/**
 * Calculate KPI status and progress
 */
export function calculateKPIProgress(
  kpiId: string,
  name: string,
  currentValue: number,
  targetValue: number
): KPITracker {
  const progress = Math.min((currentValue / targetValue) * 100, 100);
  let status: 'on-track' | 'at-risk' | 'critical' = 'on-track';

  if (progress < 50) {
    status = 'critical';
  } else if (progress < 80) {
    status = 'at-risk';
  }

  return {
    kpiId,
    name,
    currentValue,
    targetValue,
    status,
    progress: Math.round(progress),
    lastUpdated: Date.now(),
  };
}

/**
 * Track multiple KPIs
 */
export function trackKPIs(kpiData: Array<{ id: string; name: string; current: number; target: number }>): KPITracker[] {
  return kpiData.map((kpi) => calculateKPIProgress(kpi.id, kpi.name, kpi.current, kpi.target));
}

/**
 * Identify critical KPIs needing attention
 */
export function identifyCriticalKPIs(kpis: KPITracker[]): KPITracker[] {
  return kpis.filter((kpi) => kpi.status === 'critical').sort((a, b) => a.progress - b.progress);
}

/**
 * Format report for export
 */
export function formatReportAsCSV(report: Report): string {
  const lines: string[] = [];

  lines.push(`Report: ${report.title}`);
  lines.push(`Generated: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}`);
  lines.push('');
  lines.push('Metric,Value,Previous,Trend,Change %');

  for (const metric of report.metrics) {
    const prev = metric.previousValue || '-';
    const change = metric.changePercent ? `${metric.changePercent}%` : '-';
    lines.push(
      `"${metric.name}","${metric.value}${metric.unit}","${prev}","${metric.trend}","${change}"`
    );
  }

  lines.push('');
  lines.push(`Summary: ${report.summary}`);

  return lines.join('\n');
}

/**
 * Format report as JSON
 */
export function formatReportAsJSON(report: Report): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Analyze trends across periods
 */
export function analyzeTrendData(
  periods: Array<{ label: string; value: number; timestamp: number }>
): {
  trend: 'increasing' | 'decreasing' | 'stable';
  momentum: number;
  forecast: number;
  volatility: number;
} {
  if (periods.length < 2) {
    return { trend: 'stable', momentum: 0, forecast: periods[0]?.value || 0, volatility: 0 };
  }

  // Calculate average value
  const avg = periods.reduce((sum, p) => sum + p.value, 0) / periods.length;

  // Calculate trend
  const firstHalf = periods.slice(0, Math.floor(periods.length / 2));
  const secondHalf = periods.slice(Math.floor(periods.length / 2));
  const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (secondAvg > firstAvg * 1.1) {
    trend = 'increasing';
  } else if (secondAvg < firstAvg * 0.9) {
    trend = 'decreasing';
  }

  // Calculate momentum (rate of change)
  const momentum = ((secondAvg - firstAvg) / firstAvg) * 100;

  // Calculate forecast (extrapolate trend)
  const lastValue = periods[periods.length - 1].value;
  const forecast = trend === 'increasing' ? lastValue * 1.15 : trend === 'decreasing' ? lastValue * 0.85 : lastValue;

  // Calculate volatility (standard deviation)
  const variance = periods.reduce((sum, p) => sum + Math.pow(p.value - avg, 2), 0) / periods.length;
  const volatility = Math.sqrt(variance);

  return {
    trend,
    momentum: Math.round(momentum * 10) / 10,
    forecast: Math.round(forecast),
    volatility: Math.round(volatility * 10) / 10,
  };
}

/**
 * Generate business insights from metrics and KPIs
 */
export function generateBusinessInsights(
  metrics: BusinessMetric[],
  kpis: KPITracker[],
  previousMetrics?: BusinessMetric[]
): string[] {
  const insights: string[] = [];

  // Revenue insights
  const revenueMetric = metrics.find((m) => m.name === 'Total Revenue');
  if (revenueMetric) {
    if (revenueMetric.changePercent && revenueMetric.changePercent > 20) {
      insights.push('Strong revenue growth detected. Consider investing in marketing to capitalize on momentum.');
    } else if (revenueMetric.changePercent && revenueMetric.changePercent < -10) {
      insights.push('Revenue declining. Review pricing, product offerings, or marketing strategy.');
    }
  }

  // Customer insights
  const retentionMetric = metrics.find((m) => m.name === 'Customer Retention');
  if (retentionMetric && retentionMetric.value < 40) {
    insights.push('Low retention rate. Implement customer loyalty programs or improve service quality.');
  }

  // Conversion insights
  const conversionMetric = metrics.find((m) => m.name === 'Conversion Rate');
  if (conversionMetric && conversionMetric.value > 15) {
    insights.push('Excellent conversion rate. Scale up advertising to reach more potential customers.');
  } else if (conversionMetric && conversionMetric.value < 5) {
    insights.push('Low conversion rate. Optimize product pages and checkout process.');
  }

  // KPI insights
  const criticalKPIs = kpis.filter((k) => k.status === 'critical');
  if (criticalKPIs.length > 0) {
    insights.push(`${criticalKPIs.length} KPI(s) are critical: ${criticalKPIs.map((k) => k.name).join(', ')}`);
  }

  // Overall health
  const onTrackKPIs = kpis.filter((k) => k.status === 'on-track').length;
  const totalKPIs = kpis.length;
  if (totalKPIs > 0) {
    const healthPercent = (onTrackKPIs / totalKPIs) * 100;
    const healthStatus = healthPercent >= 80 ? 'Excellent' : healthPercent >= 60 ? 'Good' : 'Needs Attention';
    insights.push(`Business health status: ${healthStatus} (${onTrackKPIs}/${totalKPIs} KPIs on track).`);
  }

  return insights.length > 0
    ? insights
    : ['No significant insights at this time. Keep monitoring metrics.'];
}

/**
 * Create data export metadata
 */
export function createDataExport(
  format: 'csv' | 'json' | 'pdf',
  recordCount: number,
  reportTitle: string
): DataExport {
  const timestamp = Date.now();
  const filename = `${reportTitle.replace(/\s+/g, '_')}_${new Date(timestamp).toISOString().split('T')[0]}.${format}`;

  return {
    format,
    records: recordCount,
    generatedAt: timestamp,
    filename,
  };
}

/**
 * Calculate performance score (0-100) based on metrics
 */
export function calculatePerformanceScore(metrics: BusinessMetric[]): number {
  let score = 50; // Base score

  for (const metric of metrics) {
    switch (metric.name) {
      case 'Total Revenue':
        if (metric.changePercent && metric.changePercent > 0) {
          score += Math.min(metric.changePercent * 0.5, 15);
        }
        break;
      case 'Customer Retention':
        if (metric.value >= 60) {
          score += 10;
        }
        break;
      case 'Conversion Rate':
        if (metric.value >= 10) {
          score += 10;
        }
        break;
      case 'Order Volume':
        if (metric.changePercent && metric.changePercent > 10) {
          score += 5;
        }
        break;
    }
  }

  return Math.min(Math.round(score), 100);
}
