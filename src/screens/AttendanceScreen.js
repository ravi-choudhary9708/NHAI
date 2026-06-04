import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { AppContext } from '../context/AppContext';
import { AppBar } from '../components/AppBar';
import { C } from '../constants/config';

export const AttendanceScreen = () => {
  const { setScreen, attendanceLog } = useContext(AppContext);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();

  const monthPrefix = selectedMonth.toISOString().slice(0, 7);
  const thisMonthRecords = attendanceLog.filter(r => r.timestamp.startsWith(monthPrefix));

  const groupedByDay = {};
  for (const r of thisMonthRecords) {
    const day = r.timestamp.slice(0, 10);
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(r);
  }

  let fullDays = 0;
  let totalMs = 0;
  for (const day in groupedByDay) {
    const recs = groupedByDay[day];
    const pin = recs.find(r => r.type === 'punch_in');
    const pout = recs.find(r => r.type === 'punch_out');
    if (pin && pout) {
      fullDays++;
      totalMs += (new Date(pout.timestamp).getTime() - new Date(pin.timestamp).getTime());
    }
  }
  const totalHours = (totalMs / (1000 * 60 * 60)).toFixed(1);

  const renderCalendar = () => {
    const cells = [];
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    for (let d of daysOfWeek) {
      cells.push(<Text key={`dow-${d}-${cells.length}`} style={styles.calHeaderCell}>{d}</Text>);
    }

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.calCell} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${monthPrefix}-${i.toString().padStart(2, '0')}`;
      const dayRecs = groupedByDay[dateStr] || [];
      const hasIn = dayRecs.some(r => r.type === 'punch_in');
      const hasOut = dayRecs.some(r => r.type === 'punch_out');
      
      let circleStyle = [styles.calDayCircle];
      let textStyle = [styles.calDayText];
      
      if (selectedDate === dateStr) {
        circleStyle.push({ backgroundColor: C.primary });
        textStyle.push({ color: '#FFF' });
      } else if (hasIn && hasOut) {
        circleStyle.push({ backgroundColor: '#E5E7EB' });
        textStyle.push({ fontWeight: '600' });
      } else if (hasIn || hasOut) {
        circleStyle.push({ borderWidth: 1, borderColor: '#E5E7EB' });
      }

      cells.push(
        <TouchableOpacity key={`day-${i}`} style={styles.calCell} onPress={() => setSelectedDate(dateStr)}>
          <View style={circleStyle}>
            <Text style={textStyle}>{i}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return <View style={styles.calGrid}>{cells}</View>;
  };

  const renderList = () => {
    const toShow = selectedDate ? (groupedByDay[selectedDate] || []) : attendanceLog;
    const sorted = [...toShow].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.recordRowMinimal}>
            <View>
              <Text style={styles.recordDate}>{item.timestamp.slice(0, 10)}</Text>
              <Text style={styles.recordTime}>
                {item.type === 'punch_in' ? 'PUNCH IN' : 'PUNCH OUT'} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: item.synced ? C.success : C.textSecondary }}>
              {item.synced ? '✓' : '↑'}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={{ color: C.textSecondary, marginTop: 20 }}>No logs to show.</Text>}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <AppBar title="History" onBack={() => setScreen('HOME')} />
      
      <View style={{ paddingHorizontal: 32, marginBottom: 24 }}>
        <Text style={styles.statLarge}>{fullDays} <Text style={styles.statSmall}>Full Days</Text></Text>
        <Text style={styles.statLarge}>{totalHours} <Text style={styles.statSmall}>Hours Logged</Text></Text>
      </View>

      <View style={{ paddingHorizontal: 32, marginBottom: 24 }}>
        <View style={styles.calMonthRow}>
          <TouchableOpacity onPress={() => {
            const d = new Date(selectedMonth); d.setMonth(d.getMonth() - 1); setSelectedMonth(d);
          }}>
            <Text style={styles.calNavBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.calMonthText}>
            {selectedMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => {
            const d = new Date(selectedMonth); d.setMonth(d.getMonth() + 1); setSelectedMonth(d);
          }}>
            <Text style={styles.calNavBtn}>→</Text>
          </TouchableOpacity>
        </View>
        {renderCalendar()}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontWeight: '600', color: C.textPrimary }}>
            {selectedDate ? `Logs for ${selectedDate}` : 'All Logs'}
          </Text>
          {selectedDate && (
            <TouchableOpacity onPress={() => setSelectedDate(null)}>
              <Text style={{ color: C.textSecondary, fontSize: 13 }}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>
        {renderList()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  statLarge: { fontSize: 32, fontWeight: '700', color: C.textPrimary },
  statSmall: { fontSize: 14, fontWeight: '500', color: C.textSecondary },
  calMonthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calNavBtn: { fontSize: 20, color: C.textSecondary, paddingHorizontal: 8 },
  calMonthText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calHeaderCell: { width: `${100/7}%`, textAlign: 'center', fontSize: 12, color: C.textSecondary, marginBottom: 12, fontWeight: '600' },
  calCell: { width: `${100/7}%`, height: 40, alignItems: 'center', justifyContent: 'center' },
  calDayCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  calDayText: { fontSize: 14, color: C.textPrimary },
  recordRowMinimal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  recordDate: { fontSize: 13, color: C.textSecondary, marginBottom: 4 },
  recordTime: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
});
