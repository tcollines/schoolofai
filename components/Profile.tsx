import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Briefcase, GraduationCap, Save, Camera, FileImage, Cloud, X, Loader, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { useTranslation } from './translations';

const DefaultAvatar = () => (
    <svg viewBox="0 0 128 128" className="w-full h-full text-gray-400 dark:text-slate-500 fill-current bg-gray-100 dark:bg-slate-800">
        <path d="M64 8a26 26 0 100 52 26 26 0 000-52zm0 60c-29.07 0-52.61 20.62-55.77 48h111.54C116.61 88.62 93.07 68 64 68z" />
    </svg>
);

const cropImage = (
    imageSrc: string,
    zoom: number,
    panX: number,
    panY: number,
    callback: (croppedUrl: string) => void
) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imgAspect = img.width / img.height;
        let drawW = 256;
        let drawH = 256;
        if (imgAspect > 1) {
            drawW = 256 * imgAspect;
        } else {
            drawH = 256 / imgAspect;
        }

        ctx.save();
        ctx.translate(128, 128);
        ctx.scale(zoom, zoom);
        // Canvas is 256px, Preview circle is 224px (w-56)
        const scaleFactor = 256 / 224;
        ctx.translate(panX * scaleFactor, panY * scaleFactor);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        callback(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => {
        callback(imageSrc);
    };
};

interface AvatarUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectImage: (imageUrl: string) => void;
}

interface EducationItem {
    id: string;
    institution: string;
    degree: string;
    status: 'In Progress' | 'Completed';
    year: string;
    fileName?: string;
}

interface AddEducationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (institution: string, degree: string, status: 'In Progress' | 'Completed', year: string, fileName: string) => void;
}

const AddEducationModal: React.FC<AddEducationModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [institution, setInstitution] = useState('');
    const [degree, setDegree] = useState('');
    const [status, setStatus] = useState<'In Progress' | 'Completed'>('Completed');
    const [year, setYear] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setInstitution('');
            setDegree('');
            setStatus('Completed');
            setYear('');
            setFile(null);
            setError(null);
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (!['application/pdf', 'image/jpeg', 'image/png'].includes(selected.type)) {
                setError('Invalid file type. Only PDF, JPEG, or PNG files are accepted as proof.');
                setFile(null);
                return;
            }
            if (selected.size > 5 * 1024 * 1024) {
                setError('File is too large. Maximum allowed size is 5MB.');
                setFile(null);
                return;
            }
            setFile(selected);
            setError(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!institution.trim() || !degree.trim() || !year.trim()) {
            setError('Please fill in all required academic fields.');
            return;
        }
        if (!file) {
            setError('Strict verification requires uploading a proof document (PDF, PNG, or JPG).');
            return;
        }

        setIsSaving(true);
        setTimeout(() => {
            onAdd(institution, degree, status, year, file.name);
            setIsSaving(false);
            onClose();
        }, 800);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
                    <X size={20} />
                </button>
                
                <h3 className="text-lg font-bold text-center mb-6">Add Education Entry</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold border border-red-100 dark:border-red-900/50">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400">School / Institution *</label>
                        <input 
                            type="text" 
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="e.g. University of Cape Town"
                            className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Degree / Qualification *</label>
                        <input 
                            type="text" 
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            placeholder="e.g. Bachelor of Science in Computer Science"
                            className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Status *</label>
                            <select 
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                            >
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Year *</label>
                            <input 
                                type="text" 
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="e.g. 2024"
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Upload Verification Proof *</label>
                        <div className="border-2 border-dashed border-gray-250 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/40 relative">
                            <input 
                                type="file" 
                                onChange={handleFileChange}
                                accept=".pdf,image/png,image/jpeg"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-green-600 dark:text-green-400">✓ Proof Uploaded Successfully</p>
                                    <p className="text-[10px] text-gray-400 truncate max-w-[200px] mx-auto">{file.name}</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-600 dark:text-slate-300 font-semibold">Click to upload document</p>
                                    <p className="text-[10px] text-gray-400">PDF, PNG, JPG (Max 5MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-800/40"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-welile-purple text-white py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSaving ? (
                                <>
                                    <Loader size={14} className="animate-spin text-white" />
                                    Saving...
                                </>
                            ) : (
                                'Add Record'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ isOpen, onClose, onSelectImage }) => {
    const [source, setSource] = useState<'menu' | 'camera' | 'google' | 'icloud' | 'crop'>('menu');
    const [loading, setLoading] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Cropping & Positioning State
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPanX(e.clientX - dragStart.x);
        setPanY(e.clientY - dragStart.y);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        setPanX(e.touches[0].clientX - dragStart.x);
        setPanY(e.touches[0].clientY - dragStart.y);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Mock stock photos for Google & iCloud Photos
    const mockPhotos = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=60"
    ];

    useEffect(() => {
        if (source === 'google' || source === 'icloud') {
            setLoading(true);
            const timer = setTimeout(() => setLoading(false), 1200);
            return () => clearTimeout(timer);
        }
    }, [source]);

    useEffect(() => {
        if (source === 'camera') {
            navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } })
                .then(stream => {
                    setCameraStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Camera access error:", err);
                    alert("Unable to access camera. Please check permissions.");
                    setSource('menu');
                });
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [source]);

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.translate(300, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(videoRef.current, 0, 0, 300, 300);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setTempImage(dataUrl);
                setZoom(1);
                setPanX(0);
                setPanY(0);
                setSource('crop');
                stopCamera();
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    setTempImage(reader.result);
                    setZoom(1);
                    setPanX(0);
                    setPanY(0);
                    setSource('crop');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-205">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 text-center">
                    {source === 'menu' && 'Choose Photo Source'}
                    {source === 'camera' && 'Take Profile Picture'}
                    {source === 'google' && 'Import from Google Photos'}
                    {source === 'icloud' && 'Import from iCloud'}
                    {source === 'crop' && 'Position & Zoom Photo'}
                </h3>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />

                {source === 'menu' && (
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setSource('camera')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 hover:bg-violet-50/50 dark:hover:bg-slate-800/40 hover:border-violet-300 dark:hover:border-slate-700 transition-all text-center gap-3"
                        >
                            <span className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Camera size={24} />
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200">Use Camera</span>
                        </button>

                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 hover:bg-violet-50/50 dark:hover:bg-slate-800/40 hover:border-violet-300 dark:hover:border-slate-700 transition-all text-center gap-3"
                        >
                            <span className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                                <FileImage size={24} />
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200">Upload Files</span>
                        </button>

                        <button 
                            onClick={() => setSource('google')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 hover:bg-violet-50/50 dark:hover:bg-slate-800/40 hover:border-violet-300 dark:hover:border-slate-700 transition-all text-center gap-3"
                        >
                            <span className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                                <Cloud size={24} />
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200">Google Photos</span>
                        </button>

                        <button 
                            onClick={() => setSource('icloud')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 hover:bg-violet-50/50 dark:hover:bg-slate-800/40 hover:border-violet-300 dark:hover:border-slate-700 transition-all text-center gap-3"
                        >
                            <span className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
                                <Cloud size={24} />
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200">iCloud Photos</span>
                        </button>
                    </div>
                )}

                {source === 'camera' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-gray-100 dark:border-slate-800 bg-black">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover scale-x-[-1]" 
                            />
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setSource('menu')}
                                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleCapture}
                                className="px-6 py-2.5 rounded-xl bg-welile-lime text-black font-bold text-sm hover:bg-lime-400"
                            >
                                Capture Photo
                            </button>
                        </div>
                    </div>
                )}

                {(source === 'google' || source === 'icloud') && (
                    <div className="flex flex-col items-center gap-6">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center gap-3">
                                <Loader className="animate-spin text-welile-purple w-8 h-8" />
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Fetching photos stream...</p>
                            </div>
                        ) : (
                            <div className="w-full">
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 text-center">Select a photo from your library to set as profile avatar:</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {mockPhotos.map((url, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => {
                                                setTempImage(url);
                                                setZoom(1);
                                                setPanX(0);
                                                setPanY(0);
                                                setSource('crop');
                                            }}
                                            className="aspect-square rounded-2xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-welile-purple/50 border border-gray-100 dark:border-slate-800 transition-all"
                                        >
                                            <img src={url} alt="Mock photo" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setSource('menu')}
                                    className="w-full mt-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
                                >
                                    Back
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {source === 'crop' && tempImage && (
                    <div className="flex flex-col items-center gap-6">
                        <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
                            Drag the photo to position it, or adjust the sliders below:
                        </p>
                        
                        {/* Interactive circle boundary */}
                        <div 
                            className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-welile-purple bg-black flex items-center justify-center cursor-move select-none"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <img 
                                src={tempImage} 
                                alt="Crop Preview" 
                                className="max-w-none max-h-none w-full h-full object-cover pointer-events-none select-none"
                                style={{ 
                                    transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, 
                                    transformOrigin: 'center center' 
                                }} 
                            />
                        </div>

                        {/* Adjuster sliders */}
                        <div className="w-full space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
                                    <span>Zoom</span>
                                    <span>{Math.round(zoom * 100)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="3" 
                                    step="0.01" 
                                    value={zoom} 
                                    onChange={(e) => setZoom(parseFloat(e.target.value))} 
                                    className="w-full accent-welile-purple cursor-pointer bg-gray-200 dark:bg-slate-700 h-1.5 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
                                    <span>Horizontal Adjust</span>
                                    <span>{panX}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="-150" 
                                    max="150" 
                                    step="1" 
                                    value={panX} 
                                    onChange={(e) => setPanX(parseInt(e.target.value))} 
                                    className="w-full accent-welile-purple/60 cursor-pointer bg-gray-200 dark:bg-slate-700 h-1.5 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
                                    <span>Vertical Adjust</span>
                                    <span>{panY}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="-150" 
                                    max="150" 
                                    step="1" 
                                    value={panY} 
                                    onChange={(e) => setPanY(parseInt(e.target.value))} 
                                    className="w-full accent-welile-purple/60 cursor-pointer bg-gray-200 dark:bg-slate-700 h-1.5 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 w-full mt-2">
                            <button 
                                onClick={() => {
                                    setSource('menu');
                                    stopCamera();
                                }}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                onClick={() => {
                                    setLoading(true);
                                    cropImage(tempImage, zoom, panX, panY, (croppedUrl) => {
                                        setLoading(false);
                                        onSelectImage(croppedUrl);
                                        onClose();
                                    });
                                }}
                                disabled={loading}
                                className="flex-1 bg-welile-purple text-white py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader size={14} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Picture'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ProfileProps {
    user?: UserProfile;
    onUpgradeClick?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpgradeClick }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<UserProfile | undefined>(() => {
        if (user) {
            return {
                ...user,
                avatar: localStorage.getItem('user-avatar') || user.avatar
            };
        }
        return user;
    });
    const [avatarError, setAvatarError] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEduModal, setShowEduModal] = useState(false);

    const [educationList, setEducationList] = useState<EducationItem[]>(() => {
        const stored = localStorage.getItem('profile-education');
        if (stored) return JSON.parse(stored);
        return [
            {
                id: 'edu-default-1',
                institution: 'University of Cape Town',
                degree: 'Bachelor of Science in Computer Science',
                status: 'Completed',
                year: '2023',
                fileName: 'uct_degree.pdf'
            }
        ];
    });

    useEffect(() => {
        if (user) {
            setFormData({
                ...user,
                avatar: localStorage.getItem('user-avatar') || user.avatar
            });
            setAvatarError(false);
        }
    }, [user]);

    const handleAddEducation = (institution: string, degree: string, status: 'In Progress' | 'Completed', year: string, fileName: string) => {
        const newItem = {
            id: 'edu-' + Date.now(),
            institution,
            degree,
            status,
            year,
            fileName
        };
        const updated = [...educationList, newItem];
        setEducationList(updated);
        localStorage.setItem('profile-education', JSON.stringify(updated));

        addPortalNotification(
            "Education Details Added",
            `Successfully added verification proof for: ${degree} from ${institution}.`,
            "profile"
        );
    };

    const addPortalNotification = (title: string, description: string, type: 'assignment' | 'profile' | 'course' | 'system') => {
        const stored = localStorage.getItem('portal-notifications');
        const list = stored ? JSON.parse(stored) : [];
        const newItem = {
            id: Date.now().toString(),
            title,
            description,
            timestamp: new Date().toISOString(),
            read: false,
            type
        };
        localStorage.setItem('portal-notifications', JSON.stringify([newItem, ...list]));
        window.dispatchEvent(new Event('notifications-update'));
    };

    const handleSelectImage = (imageUrl: string) => {
        if (formData) {
            const updated = {
                ...formData,
                avatar: imageUrl
            };
            setFormData(updated);
            setAvatarError(false);
            
            localStorage.setItem('user-avatar', imageUrl);
            window.dispatchEvent(new Event('profile-update'));

            addPortalNotification(
                "Profile Picture Updated",
                "Your profile avatar was successfully updated across the schoolofai portal.",
                "profile"
            );
        }
    };

    const handleDeleteAvatar = () => {
        if (formData) {
            const updated = {
                ...formData,
                avatar: ''
            };
            setFormData(updated);
            setAvatarError(false);
            
            localStorage.removeItem('user-avatar');
            window.dispatchEvent(new Event('profile-update'));

            addPortalNotification(
                "Profile Picture Removed",
                "Your profile avatar was successfully removed.",
                "profile"
            );
        }
    };

    if (!formData) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('my_profile')}</h2>
                <button 
                    onClick={() => {
                        addPortalNotification(
                            "Profile Details Updated",
                            "Your personal settings and profile descriptions have been saved.",
                            "system"
                        );
                        alert("Profile changes saved successfully!");
                    }}
                    className="flex items-center gap-2 bg-welile-purple text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 shadow-md shadow-purple-200 dark:shadow-none cursor-pointer"
                >
                    <Save size={16} /> {t('save_changes')}
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">

                {/* Left Col: Avatar & Status */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 text-center shadow-sm">
                        <div className="relative inline-block">
                            {!formData.avatar || avatarError ? (
                                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-gray-50 dark:border-slate-800 flex items-center justify-center bg-gray-100 dark:bg-slate-800">
                                    <DefaultAvatar />
                                </div>
                            ) : (
                                <img 
                                    src={formData.avatar} 
                                    alt="Profile" 
                                    onError={() => setAvatarError(true)}
                                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-50 dark:border-slate-800" 
                                />
                            )}
                            <button 
                                onClick={() => setShowUploadModal(true)}
                                className="absolute bottom-0 right-0 bg-welile-lime text-black p-1.5 rounded-full border-2 border-white dark:border-slate-900 hover:bg-lime-400 cursor-pointer"
                            >
                                <Camera size={14} />
                            </button>
                            {formData.avatar && !avatarError && (
                                <button 
                                    onClick={handleDeleteAvatar}
                                    className="absolute bottom-0 left-0 bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 p-1.5 rounded-full border-2 border-white dark:border-slate-900 hover:bg-red-200 dark:hover:bg-red-900/40 cursor-pointer transition-colors"
                                    title="Delete profile picture"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        <h3 className="mt-4 font-bold text-lg text-gray-900 dark:text-white">{formData.name}</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">{formData.email}</p>
                        <div className="inline-block bg-purple-50 dark:bg-purple-950/30 text-welile-purple dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-100 dark:border-purple-900/50">
                            {formData.role === 'SPONSORED' ? 'Enterprise Plan' : formData.role === 'INDIVIDUAL' ? 'Basic Plan' : (formData.role || 'Student').replace('_', ' ')}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-50 dark:border-slate-800">
                            <button
                                onClick={onUpgradeClick}
                                className="w-full bg-black dark:bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-violet-700 transition-colors shadow-lg shadow-gray-200 dark:shadow-none"
                            >
                                Upgrade Plan
                            </button>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Unlock premium features & courses</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Briefcase size={16} className="text-gray-400 dark:text-slate-500" /> Employment
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Company</label>
                                <p className="font-medium text-gray-800 dark:text-slate-200">{formData.companyName || 'Not Employed'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Career Goal</label>
                                <p className="font-medium text-gray-800 dark:text-slate-200">{formData.careerGoal}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Forms */}
                <div className="md:col-span-2 space-y-6">

                    {/* Personal Details */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-50 dark:border-slate-800">
                            <User size={18} className="text-welile-purple" /> Personal Information
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-350">Full Name</label>
                                <input 
                                    type="text" 
                                    defaultValue={formData.name} 
                                    placeholder="Enter your full name"
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/25 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Date of Birth</label>
                                <input 
                                    type="date" 
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/25 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Phone</label>
                                <input 
                                    type="tel" 
                                    placeholder="+1 234 567 890" 
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/25 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Nationality</label>
                                <select className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/25 outline-none transition-all">
                                    <option>Algeria</option>
                                    <option>Angola</option>
                                    <option>Australia</option>
                                    <option>Benin</option>
                                    <option>Botswana</option>
                                    <option>Brazil</option>
                                    <option>Burkina Faso</option>
                                    <option>Burundi</option>
                                    <option>Cabo Verde</option>
                                    <option>Cameroon</option>
                                    <option>Canada</option>
                                    <option>Central African Republic</option>
                                    <option>Chad</option>
                                    <option>Comoros</option>
                                    <option>Congo, Democratic Republic of the</option>
                                    <option>Congo, Republic of the</option>
                                    <option>Cote d'Ivoire</option>
                                    <option>Djibouti</option>
                                    <option>Egypt</option>
                                    <option>Equatorial Guinea</option>
                                    <option>Eritrea</option>
                                    <option>Eswatini</option>
                                    <option>Ethiopia</option>
                                    <option>France</option>
                                    <option>Gabon</option>
                                    <option>Gambia</option>
                                    <option>Germany</option>
                                    <option>Ghana</option>
                                    <option>Guinea</option>
                                    <option>Guinea-Bissau</option>
                                    <option>India</option>
                                    <option>Kenya</option>
                                    <option>Lesotho</option>
                                    <option>Liberia</option>
                                    <option>Libya</option>
                                    <option>Madagascar</option>
                                    <option>Malawi</option>
                                    <option>Mali</option>
                                    <option>Mauritania</option>
                                    <option>Mauritius</option>
                                    <option>Morocco</option>
                                    <option>Mozambique</option>
                                    <option>Namibia</option>
                                    <option>Niger</option>
                                    <option>Nigeria</option>
                                    <option>Rwanda</option>
                                    <option>Sao Tome and Principe</option>
                                    <option>Senegal</option>
                                    <option>Seychelles</option>
                                    <option>Sierra Leone</option>
                                    <option>Somalia</option>
                                    <option>South Africa</option>
                                    <option>South Sudan</option>
                                    <option>Sudan</option>
                                    <option>Tanzania</option>
                                    <option>Togo</option>
                                    <option>Tunisia</option>
                                    <option>Uganda</option>
                                    <option>United Kingdom</option>
                                    <option>United States</option>
                                    <option>Zambia</option>
                                    <option>Zimbabwe</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Residency */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-50 dark:border-slate-800">
                            <MapPin size={18} className="text-welile-purple" /> Residency
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Physical Address</label>
                                <input 
                                    type="text" 
                                    defaultValue={formData.location} 
                                    placeholder="Enter physical address"
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/25 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">City</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Cape Town"
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/25 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-slate-355">Zip Code</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 7700"
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/25 outline-none transition-all" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Academic */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-50 dark:border-slate-800">
                            <GraduationCap size={18} className="text-welile-purple" /> Education <span className="text-xs font-normal text-gray-400 ml-1">(Optional)</span>
                        </h4>
                        <div className="space-y-4">
                            {educationList.map((item) => (
                                <div key={item.id} className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{item.institution}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{item.degree} • {item.year}</p>
                                        {item.fileName && (
                                            <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold mt-1 flex items-center gap-1">
                                                ✓ Verified Proof: {item.fileName}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                        item.status === 'Completed'
                                            ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                                            : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                            <button 
                                type="button"
                                onClick={() => setShowEduModal(true)}
                                className="w-full py-2.5 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-gray-500 dark:text-slate-400 text-sm hover:border-welile-purple hover:text-welile-purple transition-all cursor-pointer font-semibold"
                            >
                                + Add Education
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <AvatarUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSelectImage={handleSelectImage}
            />

            <AddEducationModal
                isOpen={showEduModal}
                onClose={() => setShowEduModal(false)}
                onAdd={handleAddEducation}
            />
        </div>
    );
};

export default Profile;