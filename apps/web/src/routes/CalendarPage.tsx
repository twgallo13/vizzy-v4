import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react';

export default function CalendarPage(): JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Mock calendar data
  const events = [
    {
      id: '1',
      title: 'Campaign Review Meeting',
      date: new Date(2024, 0, 15, 10, 0),
      duration: 60,
      type: 'meeting',
      assignedTo: 'John Doe',
    },
    {
      id: '2',
      title: 'Content Approval Deadline',
      date: new Date(2024, 0, 18, 17, 0),
      duration: 0,
      type: 'deadline',
      assignedTo: 'Jane Smith',
    },
    {
      id: '3',
      title: 'AI Strategy Session',
      date: new Date(2024, 0, 22, 14, 0),
      duration: 90,
      type: 'meeting',
      assignedTo: 'Mike Johnson',
    },
  ];

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, -startingDayOfWeek + i + 1));
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const navigateMonth = (direction: 'prev' | 'next'): void => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Calendar</h1>
          <p className="text-secondary-600 mt-1">
            Manage campaign deadlines and meetings
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-secondary-900">
            {formatDate(currentDate)}
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {(['month', 'week', 'day'] as const).map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === viewType
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-700 hover:bg-secondary-100'
              }`}
            >
              {viewType}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card p-0 overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-secondary-200">
          {weekDays.map((day) => (
            <div key={day} className="p-4 text-center text-sm font-medium text-secondary-600 bg-secondary-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(day);

            return (
              <motion.div
                key={index}
                className={`min-h-32 p-2 border-r border-b border-secondary-200 ${
                  isCurrentMonth ? 'bg-white' : 'bg-secondary-50'
                } ${isToday ? 'bg-primary-50' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-secondary-900' : 'text-secondary-400'
                } ${isToday ? 'text-primary-600' : ''}`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`p-1 rounded text-xs ${
                        event.type === 'meeting'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-75">
                        {event.date.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-secondary-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-secondary-900">Upcoming Events</h3>
          </div>
          
          <div className="space-y-3">
            {events
              .filter(event => event.date > new Date())
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                  <div className={`h-2 w-2 rounded-full ${
                    event.type === 'meeting' ? 'bg-blue-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {event.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-xs text-secondary-500">
                    <User className="h-3 w-3 inline mr-1" />
                    {event.assignedTo}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <CalendarIcon className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-secondary-900">Quick Actions</h3>
          </div>
          
          <div className="space-y-3">
            <button className="w-full p-3 text-left bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors">
              <div className="text-sm font-medium text-secondary-900">Schedule Campaign Review</div>
              <div className="text-xs text-secondary-500">Book a meeting with stakeholders</div>
            </button>
            
            <button className="w-full p-3 text-left bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors">
              <div className="text-sm font-medium text-secondary-900">Set Content Deadline</div>
              <div className="text-xs text-secondary-500">Create a deadline reminder</div>
            </button>
            
            <button className="w-full p-3 text-left bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors">
              <div className="text-sm font-medium text-secondary-900">Plan AI Strategy Session</div>
              <div className="text-xs text-secondary-500">Schedule AI planning meeting</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
