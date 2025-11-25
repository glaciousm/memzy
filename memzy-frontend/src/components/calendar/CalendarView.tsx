import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Badge,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
} from '@mui/icons-material';
import { MediaFile } from '@/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
} from 'date-fns';

interface CalendarViewProps {
  mediaFiles: MediaFile[];
  onDateSelect: (date: Date, files: MediaFile[]) => void;
}

interface DayData {
  date: Date;
  count: number;
  files: MediaFile[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  mediaFiles,
  onDateSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<DayData[]>([]);
  const [monthStats, setMonthStats] = useState({ totalCount: 0, daysWithMedia: 0 });

  useEffect(() => {
    generateCalendar();
  }, [currentMonth, mediaFiles]);

  const generateCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: DayData[] = [];
    let day = startDate;
    let totalCount = 0;
    let daysWithMedia = 0;

    // Group media by date
    const mediaByDate = new Map<string, MediaFile[]>();
    mediaFiles.forEach((media) => {
      const date = media.dateTaken ? parseISO(media.dateTaken) : parseISO(media.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!mediaByDate.has(dateKey)) {
        mediaByDate.set(dateKey, []);
      }
      mediaByDate.get(dateKey)!.push(media);
    });

    // Generate calendar days
    while (day <= endDate) {
      const dateKey = format(day, 'yyyy-MM-dd');
      const files = mediaByDate.get(dateKey) || [];
      const count = files.length;
      const isCurrentMonthDay = isSameMonth(day, monthStart);

      if (isCurrentMonthDay && count > 0) {
        totalCount += count;
        daysWithMedia++;
      }

      days.push({
        date: new Date(day),
        count,
        files,
        isCurrentMonth: isCurrentMonthDay,
        isToday: isToday(day),
      });

      day = addDays(day, 1);
    }

    setCalendarDays(days);
    setMonthStats({ totalCount, daysWithMedia });
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDayClick = (dayData: DayData) => {
    if (dayData.count > 0) {
      setSelectedDate(dayData.date);
      onDateSelect(dayData.date, dayData.files);
    }
  };

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'transparent';
    if (count <= 5) return 'rgba(33, 150, 243, 0.2)';
    if (count <= 10) return 'rgba(33, 150, 243, 0.4)';
    if (count <= 20) return 'rgba(33, 150, 243, 0.6)';
    if (count <= 50) return 'rgba(33, 150, 243, 0.8)';
    return 'rgba(33, 150, 243, 1)';
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePreviousMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
          <IconButton onClick={handleToday}>
            <Today />
          </IconButton>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary">
            {monthStats.totalCount} files in {monthStats.daysWithMedia} days
          </Typography>
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Paper elevation={2} sx={{ p: 2 }}>
        {/* Week day headers */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {weekDays.map((day) => (
            <Grid item xs key={day}>
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center' }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar days */}
        <Grid container spacing={1}>
          {calendarDays.map((dayData, index) => (
            <Grid item xs key={index}>
              <Tooltip
                title={
                  dayData.count > 0
                    ? `${format(dayData.date, 'MMM d, yyyy')} - ${dayData.count} files`
                    : ''
                }
                arrow
              >
                <Card
                  sx={{
                    minHeight: 80,
                    cursor: dayData.count > 0 ? 'pointer' : 'default',
                    bgcolor: getIntensityColor(dayData.count),
                    border: dayData.isToday ? '2px solid' : '1px solid',
                    borderColor: dayData.isToday ? 'primary.main' : 'divider',
                    opacity: dayData.isCurrentMonth ? 1 : 0.4,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: dayData.count > 0 ? 'scale(1.05)' : 'none',
                      bgcolor: dayData.count > 0 ? 'action.hover' : 'transparent',
                    },
                    ...(selectedDate && isSameDay(dayData.date, selectedDate) && {
                      border: '2px solid',
                      borderColor: 'secondary.main',
                    }),
                  }}
                  onClick={() => handleDayClick(dayData)}
                >
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        fontWeight={dayData.isToday ? 700 : 400}
                        color={dayData.isCurrentMonth ? 'text.primary' : 'text.disabled'}
                      >
                        {format(dayData.date, 'd')}
                      </Typography>
                      {dayData.count > 0 && (
                        <Badge
                          badgeContent={dayData.count}
                          color="primary"
                          max={99}
                          sx={{ mt: 1 }}
                        >
                          <Box sx={{ width: 24, height: 24 }} />
                        </Badge>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Legend */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, justifyContent: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Less
        </Typography>
        {[0, 5, 10, 20, 50].map((count, index) => (
          <Box
            key={index}
            sx={{
              width: 24,
              height: 24,
              bgcolor: getIntensityColor(count + 1),
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0.5,
            }}
          />
        ))}
        <Typography variant="caption" color="text.secondary">
          More
        </Typography>
      </Box>
    </Box>
  );
};

export default CalendarView;
