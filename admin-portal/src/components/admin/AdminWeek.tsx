import React from 'react';
import StaffCalendarView from './StaffCalendarView';

/** "My week": the signed-in person's own weekly timetable. Only they can see or change these blocks. */
const AdminWeek: React.FC = () => <StaffCalendarView />;

export default AdminWeek;
