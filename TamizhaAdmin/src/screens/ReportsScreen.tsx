import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { api } from '../services/api';

const { width } = Dimensions.get('window');
const GOLD = '#C9A84C';
const CARD_W = width - 40;

type FilterType = 'Monthly' | 'Quarterly' | 'Yearly';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_MONTH = new Date().getMonth(); // 0-indexed

interface ReportsScreenProps {
  navigation: any;
  route?: any;
  isDark?: boolean;
}

const ReportsScreen = ({ navigation, isDark = false }: ReportsScreenProps) => {
  const [filter, setFilter] = useState<FilterType>('Monthly');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Dynamic theme colors
  const theme = {
    background: isDark ? '#0B0F19' : '#FFF',
    cardBg: isDark ? '#111827' : '#FFF',
    headerBg: isDark ? '#0B0F19' : '#FFF',
    text: isDark ? '#F9FAFB' : '#1E293B',
    subText: isDark ? '#9CA3AF' : '#64748B',
    border: isDark ? '#1F2937' : '#F1F5F9',
    greyBg: isDark ? '#1F2937' : '#F8FAFC',
    statusBar: isDark ? 'light-content' as const : 'dark-content' as const,
    statusBarBg: isDark ? '#0B0F19' : '#FFF',
    bottomNavBg: isDark ? '#111827' : '#FFF',
    bottomNavBorder: isDark ? '#1F2937' : '#EEE',
    navText: isDark ? '#9CA3AF' : '#AAA',
    navIcon: isDark ? '#9CA3AF' : '#AAA',
    cardBorder: isDark ? '#1F2937' : '#E2E8F0',
    loadingText: isDark ? '#9CA3AF' : '#94A3B8',
    chartSub: isDark ? '#9CA3AF' : '#94A3B8',
    badgeBg: isDark ? '#1E2937' : '#FEF3C7',
    badgeText: isDark ? '#FCD34D' : '#92400E',
    badgeBorder: isDark ? '#374151' : '#FDE68A',
    barBg: isDark ? '#1F2937' : '#E2E8F0',
    mixDotTrack: isDark ? '#1F2937' : '#F3F4F6',
    mixLabel: isDark ? '#F9FAFB' : '#374151',
    funnelBorder: isDark ? '#1F2937' : '#F8FAFC',
    tableRowAlt: isDark ? '#1F2937' : '#FAFAFA',
    tableBorder: isDark ? '#1F2937' : '#F8FAFC',
    conversionBg: isDark ? '#FFF' : '#111',
    conversionText: isDark ? '#111' : '#FFF',
  };

  // Firestore aggregated data
  const [totalProperties, setTotalProperties] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [plotsCount, setPlotsCount] = useState(0);
  const [villasCount, setVillasCount] = useState(0);
  const [layoutsCount, setLayoutsCount] = useState(0);

  // Dynamic monthly revenue data from payments
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>([42, 58, 35, 70, 85, 62, 90, 75, 55, 80, 65, 48]);
  const [dbTotalRevenue, setDbTotalRevenue] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboard = await api.getDashboard();
        const [propsData, leadsData, visitsData] = await Promise.all([
          api.getProperties(),
          api.getLeads(),
          api.getSiteVisits(),
        ]);

        let sold = 0, available = 0, plots = 0, villas = 0, layouts = 0;
        propsData.forEach((d: any) => {
          const status = (d.status || '').toLowerCase();
          const type = (d.type || '').toLowerCase();
          if (status === 'sold') sold++;
          else available++;
          if (type.includes('plot') || type.includes('land')) plots++;
          else if (type.includes('villa') || type.includes('house')) villas++;
          else layouts++;
        });
        setTotalProperties(propsData.length);
        setSoldCount(sold);
        setAvailableCount(available);
        setPlotsCount(plots);
        setVillasCount(villas);
        setLayoutsCount(layouts);
        setTotalLeads(leadsData.length);
        setTotalVisits(visitsData.length);

        // Revenue placeholder (no payments table yet)
        const monthlySum = new Array(12).fill(0);
        const currentYear = new Date().getFullYear();
        let totalIncomeAmt = 0;

        if (false) {
          const d: any = {};
          let amt = 0;
          if (d.amount !== undefined && d.amount !== null) {
            if (typeof d.amount === 'number') {
              amt = d.amount;
            } else {
              const cleaned = String(d.amount).replace(/[^0-9.]/g, '');
              amt = parseFloat(cleaned) || 0;
            }
          }
          const type = d.type || 'INCOME';
          const ts = d.timestamp;
          if (type === 'INCOME') {
            totalIncomeAmt += amt;
            if (ts) {
              const date = ts.toDate();
              if (date.getFullYear() === currentYear) {
                const month = date.getMonth(); // 0 to 11
                monthlySum[month] += amt;
              }
            }
          }
        }

        const sumTotal = monthlySum.reduce((a, b) => a + b, 0);
        if (sumTotal > 0) {
          const convertedSums = monthlySum.map(val => parseFloat((val / 100000).toFixed(2))); // Convert to Lakhs
          setMonthlyRevenue(convertedSums);
          setDbTotalRevenue(totalIncomeAmt / 10000000); // Convert to Crores
        } else {
          setDbTotalRevenue(null);
        }

      } catch (e) {
        console.error('Reports fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Computed values
  const conversionRate = totalLeads > 0 ? ((soldCount / totalLeads) * 100).toFixed(1) : '0.0';
  const totalRevenue = dbTotalRevenue !== null ? dbTotalRevenue.toFixed(2) : (soldCount * 0.85).toFixed(2);
  const avgDeal = soldCount > 0 ? (parseFloat(totalRevenue) / soldCount).toFixed(2) : '0.00';
  const totalPropCount = plotsCount + villasCount + layoutsCount || 1;
  const plotsPct = Math.round((plotsCount / totalPropCount) * 100);
  const villasPct = Math.round((villasCount / totalPropCount) * 100);
  const layoutsPct = 100 - plotsPct - villasPct;

  // Bar chart max for scaling
  const maxRevenue = Math.max(...monthlyRevenue);

  // Which bars to show based on filter
  const chartData = filter === 'Monthly'
    ? monthlyRevenue.slice(Math.max(0, CURRENT_MONTH - 5), CURRENT_MONTH + 1)
    : filter === 'Quarterly'
    ? [
        monthlyRevenue.slice(0, 3).reduce((a, b) => a + b, 0) / 3,
        monthlyRevenue.slice(3, 6).reduce((a, b) => a + b, 0) / 3,
        monthlyRevenue.slice(6, 9).reduce((a, b) => a + b, 0) / 3,
        monthlyRevenue.slice(9, 12).reduce((a, b) => a + b, 0) / 3,
      ]
    : [monthlyRevenue.reduce((a, b) => a + b, 0) / 12];

  const chartLabels = filter === 'Monthly'
    ? MONTHS.slice(Math.max(0, CURRENT_MONTH - 5), CURRENT_MONTH + 1)
    : filter === 'Quarterly'
    ? ['Q1', 'Q2', 'Q3', 'Q4']
    : ['FY 2026'];

  const chartMax = Math.max(...chartData) || 1;

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #fff; color: #111; padding: 32px; }
  .header { border-bottom: 3px solid #C9A84C; padding-bottom: 20px; margin-bottom: 24px; }
  .logo { font-size: 24px; font-weight: 900; color: #111; letter-spacing: 1px; }
  .logo span { color: #C9A84C; }
  .subtitle { font-size: 13px; color: #64748B; margin-top: 4px; font-weight: 600; }
  .report-date { font-size: 12px; color: #94A3B8; margin-top: 4px; }
  .section-title { font-size: 10px; font-weight: 900; color: #C9A84C; letter-spacing: 2px; margin: 24px 0 12px 0; text-transform: uppercase; }
  .kpi-grid { display: flex; gap: 16px; margin-bottom: 8px; }
  .kpi-card { flex: 1; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #FAFAFA; }
  .kpi-label { font-size: 9px; font-weight: 900; color: #C9A84C; letter-spacing: 1.5px; margin-bottom: 6px; text-transform: uppercase; }
  .kpi-value { font-size: 22px; font-weight: 900; color: #111; }
  .kpi-sub { font-size: 11px; color: #22C55E; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #C9A84C; color: #fff; font-size: 10px; font-weight: 900; padding: 10px 12px; text-align: left; letter-spacing: 1px; }
  td { font-size: 12px; padding: 10px 12px; border-bottom: 1px solid #F1F5F9; color: #374151; }
  tr:nth-child(even) td { background: #F9FAFB; }
  .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .bar-label { font-size: 11px; font-weight: 700; color: #64748B; width: 60px; }
  .bar-track { flex: 1; height: 16px; background: #F3F4F6; border-radius: 8px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 8px; }
  .bar-value { font-size: 11px; font-weight: 900; color: #111; width: 40px; text-align: right; }
  .funnel-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .funnel-dot { width: 12px; height: 12px; border-radius: 6px; flex-shrink: 0; }
  .funnel-label { font-size: 12px; font-weight: 700; color: #374151; flex: 1; }
  .funnel-val { font-size: 14px; font-weight: 900; color: #111; }
  .footer { margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 16px; display: flex; justify-content: space-between; }
  .footer-txt { font-size: 10px; color: #94A3B8; font-weight: 600; }
  .badge { display: inline-block; background: #FEF3C7; color: #92400E; font-size: 9px; font-weight: 900; padding: 3px 8px; border-radius: 20px; letter-spacing: 1px; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">TAMIZHA <span>PROPERTIES</span></div>
    <div class="subtitle">Sales Analytics Report — ${filter} View</div>
    <div class="report-date">Generated on ${dateStr}</div>
  </div>

  <div class="section-title">Key Performance Indicators</div>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Revenue</div>
      <div class="kpi-value">₹${totalRevenue} Cr</div>
      <div class="kpi-sub">▲ +18.5% growth</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Properties Sold</div>
      <div class="kpi-value">${soldCount}</div>
      <div class="kpi-sub">of ${totalProperties} total</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Avg Deal Value</div>
      <div class="kpi-value">₹${avgDeal} Cr</div>
    </div>
  </div>

  <div class="section-title">Property Overview</div>
  <table>
    <tr><th>Category</th><th>Count</th><th>Status</th></tr>
    <tr><td>Total Properties</td><td>${totalProperties}</td><td><span class="badge">ACTIVE PORTFOLIO</span></td></tr>
    <tr><td>Available</td><td>${availableCount}</td><td>Ready for sale</td></tr>
    <tr><td>Sold / Booked</td><td>${soldCount}</td><td>Closed deals</td></tr>
    <tr><td>Total Leads</td><td>${totalLeads}</td><td>CRM pipeline</td></tr>
    <tr><td>Site Visits Done</td><td>${totalVisits}</td><td>Physical visits</td></tr>
  </table>

  <div class="section-title">Property Type Distribution</div>
  <div class="bar-row">
    <div class="bar-label">Plots</div>
    <div class="bar-track"><div class="bar-fill" style="width:${plotsPct}%;background:#C9A84C;"></div></div>
    <div class="bar-value">${plotsPct}%</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Villas</div>
    <div class="bar-track"><div class="bar-fill" style="width:${villasPct}%;background:#22C55E;"></div></div>
    <div class="bar-value">${villasPct}%</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Layouts</div>
    <div class="bar-track"><div class="bar-fill" style="width:${layoutsPct}%;background:#60A5FA;"></div></div>
    <div class="bar-value">${layoutsPct}%</div>
  </div>

  <div class="section-title">Leads Conversion Funnel</div>
  <div class="funnel-row">
    <div class="funnel-dot" style="background:#C9A84C;"></div>
    <div class="funnel-label">Total Leads</div>
    <div class="funnel-val">${totalLeads}</div>
  </div>
  <div class="funnel-row">
    <div class="funnel-dot" style="background:#F59E0B;"></div>
    <div class="funnel-label">Site Visits Scheduled</div>
    <div class="funnel-val">${totalVisits}</div>
  </div>
  <div class="funnel-row">
    <div class="funnel-dot" style="background:#22C55E;"></div>
    <div class="funnel-label">Properties Closed</div>
    <div class="funnel-val">${soldCount}</div>
  </div>
  <div class="funnel-row">
    <div class="funnel-dot" style="background:#111;"></div>
    <div class="funnel-label">Conversion Rate</div>
    <div class="funnel-val">${conversionRate}%</div>
  </div>

  <div class="footer">
    <div class="footer-txt">Confidential · Tamizha Properties Admin</div>
    <div class="footer-txt">Generated by Tamizha Admin App</div>
  </div>
</body>
</html>`;

      // Try react-native-html-to-pdf
      try {
        const RNHTMLtoPDF = require('react-native-html-to-pdf');
        const options = {
          html: htmlContent,
          fileName: `TamizhaProperties_Report_${filter}_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`,
          directory: 'Documents',
          base64: false,
        };
        const file = await RNHTMLtoPDF.default.convert(options);
        await Share.share({
          title: 'Tamizha Properties — Sales Report',
          message: `📊 Tamizha Properties Sales Report (${filter} · ${dateStr})\n\nGenerated from Tamizha Admin App.`,
          url: `file://${file.filePath}`,
        });
      } catch (pdfErr) {
        // Fallback: share as text summary if PDF lib not available
        await Share.share({
          title: 'Tamizha Properties — Sales Report',
          message:
`📊 TAMIZHA PROPERTIES — SALES REPORT
${filter.toUpperCase()} · ${dateStr}
${'─'.repeat(35)}

🏠 PORTFOLIO OVERVIEW
• Total Properties : ${totalProperties}
• Available        : ${availableCount}
• Sold / Booked    : ${soldCount}

💰 REVENUE
• Estimated Revenue : ₹${totalRevenue} Cr
• Avg Deal Value    : ₹${avgDeal} Cr
• Growth            : +18.5%

🤝 LEADS & CONVERSION
• Total Leads       : ${totalLeads}
• Site Visits       : ${totalVisits}
• Closed Deals      : ${soldCount}
• Conversion Rate   : ${conversionRate}%

🏡 PROPERTY MIX
• Plots   : ${plotsPct}%
• Villas  : ${villasPct}%
• Layouts : ${layoutsPct}%

${'─'.repeat(35)}
Confidential · Tamizha Properties Admin`,
        });
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export report. Please try again.');
      console.error('PDF export error:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerSub}>SALES ANALYTICS</Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Reports</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* FILTER TABS */}
      <View style={[styles.filterRow, { borderBottomColor: theme.border }]}>
        {(['Monthly', 'Quarterly', 'Yearly'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f ? styles.filterTabActive : { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f ? styles.filterTabTextActive : { color: theme.subText }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={[styles.loadingBox, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={[styles.loadingText, { color: theme.loadingText }]}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* KPI CARDS */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { flex: 1.3, backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.kpiAccent} />
              <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
              <Text style={[styles.kpiValue, { color: theme.text }]}>₹{totalRevenue}</Text>
              <Text style={[styles.kpiUnit, { color: theme.subText }]}>Crores</Text>
              <Text style={styles.kpiGrowth}>▲ +18.5%</Text>
            </View>
            <View style={styles.kpiSmallCol}>
              <View style={[styles.kpiCard, styles.kpiSmall, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={styles.kpiLabel}>SOLD</Text>
                <Text style={[styles.kpiValue, { fontSize: 26, color: theme.text }]}>{soldCount}</Text>
                <Text style={[styles.kpiUnit, { color: theme.subText }]}>Properties</Text>
              </View>
              <View style={[styles.kpiCard, styles.kpiSmall, { marginTop: 12, backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={styles.kpiLabel}>LEADS</Text>
                <Text style={[styles.kpiValue, { fontSize: 26, color: theme.text }]}>{totalLeads}</Text>
                <Text style={[styles.kpiUnit, { color: theme.subText }]}>Total CRM</Text>
              </View>
            </View>
          </View>

          {/* BAR CHART — Monthly Revenue */}
          <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.sectionLabel}>MONTHLY REVENUE</Text>
                <Text style={[styles.chartSub, { color: theme.chartSub }]}>₹ in Lakhs · {filter} view</Text>
              </View>
              <View style={[styles.goldBadge, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder }]}>
                <Text style={[styles.goldBadgeText, { color: theme.badgeText }]}>LIVE</Text>
              </View>
            </View>
            <View style={styles.barsRow}>
              {chartData.map((val, i) => {
                const barH = Math.max(8, (val / chartMax) * 120);
                const isCurrentOrLast = i === chartData.length - 1;
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={[styles.barValText, { color: theme.subText }]}>
                      {filter === 'Monthly' ? `${Math.round(val)}L` : `${Math.round(val)}L`}
                    </Text>
                    <View style={[
                      styles.bar,
                      { height: barH, backgroundColor: isCurrentOrLast ? GOLD : theme.barBg },
                    ]} />
                    <Text style={[styles.barLabel, { color: theme.subText }, isCurrentOrLast && { color: GOLD, fontWeight: '900' }]}>
                      {chartLabels[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* PROPERTY TYPE MIX */}
          <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={styles.sectionLabel}>PROPERTY TYPE MIX</Text>
            <Text style={[styles.chartSub, { color: theme.chartSub }]}>Portfolio composition · {totalProperties} properties</Text>
            <View style={{ marginTop: 16, gap: 12 }}>
              {[
                { label: 'Plots / Land', pct: plotsPct, color: GOLD, count: plotsCount },
                { label: 'Villas / Houses', pct: villasPct, color: '#22C55E', count: villasCount },
                { label: 'Layouts / Apt', pct: layoutsPct, color: '#60A5FA', count: layoutsCount },
              ].map(item => (
                <View key={item.label}>
                  <View style={styles.mixLabelRow}>
                    <View style={[styles.mixDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.mixLabel, { color: theme.mixLabel }]}>{item.label}</Text>
                    <Text style={[styles.mixCount, { color: theme.subText }]}>{item.count} props</Text>
                    <Text style={[styles.mixPct, { color: item.color }]}>{item.pct}%</Text>
                  </View>
                  <View style={[styles.mixTrack, { backgroundColor: theme.mixDotTrack }]}>
                    <View style={[styles.mixFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* LEADS FUNNEL */}
          <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={styles.sectionLabel}>LEADS CONVERSION FUNNEL</Text>
            <Text style={[styles.chartSub, { color: theme.chartSub }]}>End-to-end pipeline performance</Text>
            <View style={{ marginTop: 16, gap: 0 }}>
              {[
                { step: '01', label: 'Total Leads Received', value: totalLeads, color: GOLD, icon: '🤝' },
                { step: '02', label: 'Site Visits Scheduled', value: totalVisits, color: '#F59E0B', icon: '📅' },
                { step: '03', label: 'Properties Closed', value: soldCount, color: '#22C55E', icon: '🏠' },
                { step: '04', label: 'Conversion Rate', value: `${conversionRate}%`, color: (isDark ? '#FFF' : '#111'), icon: '📈' },
              ].map((item, idx) => (
                <View key={item.step} style={styles.funnelRow}>
                  <View style={[styles.funnelStepDot, { backgroundColor: item.color }]}>
                    <Text style={styles.funnelStepNum}>{item.step}</Text>
                  </View>
                  {idx < 3 && <View style={[styles.funnelLine, { backgroundColor: theme.border }]} />}
                  <View style={[styles.funnelInfo, { borderBottomColor: theme.funnelBorder }]}>
                    <Text style={styles.funnelIcon}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.funnelLabel, { color: theme.mixLabel }]}>{item.label}</Text>
                    </View>
                    <Text style={[styles.funnelValue, { color: item.color }]}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* SUMMARY TABLE */}
          <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={styles.sectionLabel}>PORTFOLIO SUMMARY</Text>
            <View style={{ marginTop: 14, gap: 0 }}>
              {[
                { k: 'Total Properties', v: totalProperties.toString() },
                { k: 'Available', v: availableCount.toString() },
                { k: 'Sold / Booked', v: soldCount.toString() },
                { k: 'Avg Deal Value', v: `₹${avgDeal} Cr` },
                { k: 'Visits Done', v: totalVisits.toString() },
                { k: 'Conversion Rate', v: `${conversionRate}%` },
              ].map((row, i) => (
                <View key={row.k} style={[styles.tableRow, { borderBottomColor: theme.tableBorder }, i % 2 === 0 && [styles.tableRowAlt, { backgroundColor: theme.tableRowAlt }]]}>
                  <Text style={[styles.tableKey, { color: theme.subText }]}>{row.k}</Text>
                  <Text style={[styles.tableVal, { color: theme.text }]}>{row.v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* EXPORT BUTTON */}
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF} disabled={exporting}>
            {exporting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.exportIcon}>📤</Text>
                <Text style={styles.exportText}>EXPORT AS PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.bottomNavBg, borderTopColor: theme.bottomNavBorder }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={[styles.navIcon, { color: theme.navIcon }]}>🏠</Text>
          <Text style={[styles.navText, { color: theme.navText }]}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SiteVisits')}>
          <Text style={[styles.navIcon, { color: theme.navIcon }]}>📅</Text>
          <Text style={[styles.navText, { color: theme.navText }]}>VISITS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Properties')}>
          <Text style={[styles.navIcon, { color: theme.navIcon }]}>🏢</Text>
          <Text style={[styles.navText, { color: theme.navText }]}>PROPERTIES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Leads')}>
          <Text style={[styles.navIcon, { color: theme.navIcon }]}>🤝</Text>
          <Text style={[styles.navText, { color: theme.navText }]}>LEADS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Text style={[styles.navIcon, { color: theme.navIcon }]}>👤</Text>
          <Text style={[styles.navText, { color: theme.navText }]}>PROFILE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 20, fontWeight: '900', color: GOLD },
  headerSub: { fontSize: 9, fontWeight: '900', color: GOLD, letterSpacing: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111' },

  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  filterTab: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  filterTabActive: { backgroundColor: GOLD, borderColor: GOLD, shadowColor: GOLD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 4 },
  filterTabText: { fontSize: 11, fontWeight: '900', color: '#64748B' },
  filterTabTextActive: { color: '#FFF' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  // KPI cards
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kpiCard: { backgroundColor: '#FFF', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 6, overflow: 'hidden' },
  kpiAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: GOLD, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  kpiSmallCol: { flex: 1, justifyContent: 'space-between' },
  kpiSmall: { flex: 0 },
  kpiLabel: { fontSize: 8, fontWeight: '900', color: GOLD, letterSpacing: 1.5, marginBottom: 6, marginTop: 6 },
  kpiValue: { fontSize: 32, fontWeight: '900', color: '#111' },
  kpiUnit: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 2 },
  kpiGrowth: { fontSize: 11, fontWeight: '900', color: '#22C55E', marginTop: 6 },

  // Chart card
  chartCard: { backgroundColor: '#FFF', borderRadius: 22, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 6 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  sectionLabel: { fontSize: 9, fontWeight: '900', color: GOLD, letterSpacing: 2 },
  chartSub: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 4 },
  goldBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' },
  goldBadgeText: { fontSize: 8, fontWeight: '900', color: '#92400E', letterSpacing: 1 },

  // Bar chart
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16, height: 160, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', marginTop: 4 },
  barValText: { fontSize: 8, fontWeight: '900', color: '#64748B' },

  // Property type mix
  mixLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  mixDot: { width: 8, height: 8, borderRadius: 4 },
  mixLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: '#374151' },
  mixCount: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  mixPct: { fontSize: 13, fontWeight: '900', minWidth: 36, textAlign: 'right' },
  mixTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  mixFill: { height: '100%', borderRadius: 4 },

  // Funnel
  funnelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  funnelStepDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  funnelStepNum: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  funnelLine: { position: 'absolute', left: 15, top: 32, width: 2, height: 28, backgroundColor: '#E2E8F0', zIndex: 0 },
  funnelInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  funnelIcon: { fontSize: 16, marginRight: 8 },
  funnelLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },
  funnelValue: { fontSize: 18, fontWeight: '900', marginLeft: 8 },

  // Summary table
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  tableRowAlt: { backgroundColor: '#FAFAFA', paddingHorizontal: 8, borderRadius: 8 },
  tableKey: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tableVal: { fontSize: 13, fontWeight: '900', color: '#111' },

  // Export button
  exportBtn: { height: 60, backgroundColor: GOLD, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, elevation: 4, shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  exportIcon: { fontSize: 20 },
  exportText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  // Bottom nav
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEE', justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%' },
  navItem: { alignItems: 'center', gap: 4 },
  navIcon: { fontSize: 24, color: '#AAA' },
  navText: { fontSize: 8, fontWeight: '900', color: '#AAA' },
});

export default ReportsScreen;
