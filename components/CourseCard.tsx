import React from 'react';
import { PlayCircle, Award, Clock, BookOpen, MoreVertical } from 'lucide-react';
import { Course, CourseStatus } from '../types';

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const progress = Math.round((course.lessonsCompleted / course.lessonsTotal) * 100);

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.COMPLETED:
        return 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400';
      case CourseStatus.IN_PROGRESS:
        return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300';
    }
  };

  const getStatusText = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.COMPLETED:
        return 'Completed';
      case CourseStatus.IN_PROGRESS:
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col h-full cursor-pointer"
    >
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(course.status)}`}>
            {getStatusText(course.status)}
          </span>
        </div>
        {/* Play Overlay for In Progress */}
        {course.status === CourseStatus.IN_PROGRESS && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-welile-purple shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
              <PlayCircle fill="currentColor" size={24} />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{course.category}</span>
          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
            <span>★</span> <span>{course.rating}</span>
          </div>
        </div>

        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{course.instructor}</p>

        <div className="mt-auto">
          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-gray-600 dark:text-slate-350">
                {course.lessonsCompleted} / {course.lessonsTotal} Lessons
              </span>
              <span className="font-bold text-welile-purple">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${course.status === CourseStatus.COMPLETED ? 'bg-green-500' : 'bg-welile-purple'}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-gray-50 dark:border-slate-850 flex items-center justify-between">
            <div className="flex -space-x-2">
              {/* Mock avatars for enrolled students */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-gray-200 dark:bg-slate-800 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Student" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-gray-500 dark:text-slate-400 font-bold">
                +42
              </div>
            </div>

            <button className={`text-sm font-bold flex items-center gap-2 ${course.status === CourseStatus.COMPLETED ? 'text-green-600' : 'text-welile-purple hover:text-purple-700'}`}>
              {course.status === CourseStatus.COMPLETED ? (
                <> <Award size={16} /> Certificate </>
              ) : course.status === CourseStatus.IN_PROGRESS ? (
                <> Continue <PlayCircle size={16} /> </>
              ) : (
                <> Start Course <BookOpen size={16} /> </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
