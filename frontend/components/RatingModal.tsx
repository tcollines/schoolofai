import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

interface RatingModalProps {
    courseTitle: string;
    onClose: () => void;
    onSubmit: (rating: number, review: string) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ courseTitle, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [review, setReview] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Rate this Course</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-6 text-center">
                        How would you rate your experience with <strong className="text-gray-900">{courseTitle}</strong>?
                    </p>

                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(rating)}
                                className={`transition-all duration-200 ${(hover || rating) >= star ? 'text-yellow-400 scale-110' : 'text-gray-200 hover:text-yellow-200'}`}
                            >
                                <Star size={40} fill={(hover || rating) >= star ? 'currentColor' : 'none'} strokeWidth={1.5} />
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Write a Review (Optional)</label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Tell others what you thought about this course..."
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none h-32"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onSubmit(rating, review)}
                            disabled={rating === 0}
                            className="flex-1 bg-welile-purple text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit Rating
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
