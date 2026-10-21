import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, Mail, Phone, MapPin, Printer, Handshake, Download, Loader2 } from 'lucide-react';
import { supabaseClient } from "../../src/lib/supabaseClient";

interface Partner {
    id: string;
    name: string;
    type: string;
    logo: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    created_at: string;
}

const AdminPartners = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [newPartner, setNewPartner] = useState<Partial<Partner>>({
        name: '',
        type: 'University',
        logo: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        address: ''
    });

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseClient
                .from('partners')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Error fetching partners", error);
            } else {
                setPartners(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePartner = async () => {
        if (!newPartner.name || !newPartner.type) return;
        setIsSaving(true);
        try {
            const { data, error } = await supabaseClient
                .from('partners')
                .insert([newPartner])
                .select()
                .single();
            
            if (error) throw error;
            
            if (data) {
                setPartners([data, ...partners]);
                setShowAddModal(false);
                setNewPartner({
                    name: '',
                    type: 'University',
                    logo: '',
                    contact_name: '',
                    contact_email: '',
                    contact_phone: '',
                    address: ''
                });
            }
        } catch (err) {
            console.error("Error saving partner", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPartner({ ...newPartner, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePrintCertificate = (partner: Partner) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Certificate of Partnership - ${partner.name}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; text-align: center; margin: 0; padding: 0; background: #f9fafb; display: flex; align-items: center; justify-content: center; height: 100vh; }
                        .certificate { width: 800px; padding: 50px; background: white; border: 20px solid #7c3aed; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                        .certificate::before { content: ''; position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 2px solid #7c3aed; }
                        h1 { font-size: 48px; color: #4c1d95; margin-bottom: 10px; }
                        h2 { font-size: 24px; color: #6b7280; font-weight: normal; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 2px; }
                        .awarded-to { font-size: 18px; color: #4b5563; margin-bottom: 20px; }
                        .partner-name { font-size: 36px; color: #111827; font-weight: bold; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: inline-block; min-width: 400px; }
                        .description { font-size: 18px; color: #4b5563; max-width: 600px; margin: 0 auto 50px auto; line-height: 1.6; }
                        .footer { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 50px; }
                        .signature { border-top: 1px solid #000; padding-top: 10px; width: 200px; font-weight: bold; }
                        .date { border-top: 1px solid #000; padding-top: 10px; width: 200px; font-weight: bold; }
                        .logo { max-width: 150px; max-height: 150px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="certificate">
                        ${partner.logo ? `<img src="${partner.logo}" class="logo" alt="Logo" />` : ''}
                        <h1>Certificate of Partnership</h1>
                        <h2>Welile School of AI</h2>
                        <div class="awarded-to">This proudly certifies that</div>
                        <div class="partner-name">${partner.name}</div>
                        <div class="description">
                            is an official ${partner.type} partner of the Welile School of AI, dedicated to advancing artificial intelligence education and empowering the next generation of tech leaders.
                        </div>
                        <div class="footer">
                            <div class="date">
                                <div>${new Date().toLocaleDateString()}</div>
                                <div style="font-size:12px; font-weight:normal; margin-top:5px;">Date of Issuance</div>
                            </div>
                            <div class="signature">
                                <div style="font-family: 'Brush Script MT', cursive; font-size: 24px; color: #4c1d95;">Welile Director</div>
                                <div style="font-size:12px; font-weight:normal; margin-top:5px;">Authorized Signature</div>
                            </div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const filteredPartners = partners.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Partners</h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-2">Manage University and Company course partners</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-violet-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-200 flex items-center gap-2"
                >
                    <Plus size={20} /> Add Partner
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search partners..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPartners.map(partner => (
                        <div key={partner.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-violet-600"></div>
                            <div className="flex items-start justify-between mb-4 mt-2">
                                <div className="flex items-center gap-4">
                                    {partner.logo ? (
                                        <img src={partner.logo} alt={partner.name} className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                                            <Building2 size={24} />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{partner.name}</h3>
                                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded mt-1">{partner.type}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 mt-4 flex-1">
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"><Search size={14} className="text-gray-400"/></div>
                                    <span className="font-medium">{partner.contact_name || 'No contact name'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"><Mail size={14} className="text-gray-400"/></div>
                                    <a href={`mailto:${partner.contact_email}`} className="text-violet-600 hover:underline">{partner.contact_email || 'N/A'}</a>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"><Phone size={14} className="text-gray-400"/></div>
                                    <span>{partner.contact_phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"><MapPin size={14} className="text-gray-400"/></div>
                                    <span className="truncate">{partner.address || 'N/A'}</span>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                                <button 
                                    onClick={() => handlePrintCertificate(partner)}
                                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2"
                                >
                                    <Printer size={16} /> Print Certificate
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {filteredPartners.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            <Handshake size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No partners found. Add a new partner to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Handshake className="text-violet-600" /> Register New Partner
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300">
                                <Plus className="rotate-45" size={20} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Organisation Name *</label>
                                        <input
                                            type="text"
                                            value={newPartner.name}
                                            onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                                            placeholder="e.g. Makerere University"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Type of Organisation *</label>
                                        <select
                                            value={newPartner.type}
                                            onChange={(e) => setNewPartner({...newPartner, type: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                                        >
                                            <option value="University">University</option>
                                            <option value="Company">Company</option>
                                            <option value="Non-Profit">Non-Profit</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Organisation Logo</label>
                                    <div className="flex items-center gap-4">
                                        {newPartner.logo && (
                                            <img src={newPartner.logo} alt="Preview" className="w-16 h-16 rounded-xl object-cover bg-gray-100 border border-gray-200" />
                                        )}
                                        <div className="flex-1 relative">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleLogoUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-500 hover:bg-gray-100 transition-colors">
                                                Click to upload logo (PNG, JPG)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="font-bold text-gray-800 mb-4">Contact Information</h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Responsible Person's Name</label>
                                            <input
                                                type="text"
                                                value={newPartner.contact_name}
                                                onChange={(e) => setNewPartner({...newPartner, contact_name: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                                                placeholder="e.g. Dr. Jane Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                value={newPartner.contact_email}
                                                onChange={(e) => setNewPartner({...newPartner, contact_email: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                                                placeholder="jane@university.edu"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact Number</label>
                                            <input
                                                type="tel"
                                                value={newPartner.contact_phone}
                                                onChange={(e) => setNewPartner({...newPartner, contact_phone: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                                                placeholder="+256 700 000000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Organisation Address</label>
                                            <input
                                                type="text"
                                                value={newPartner.address}
                                                onChange={(e) => setNewPartner({...newPartner, address: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                                                placeholder="Plot 1, University Road..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200">
                                Cancel
                            </button>
                            <button 
                                onClick={handleSavePartner} 
                                disabled={isSaving || !newPartner.name}
                                className="px-6 py-2.5 rounded-xl font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin" />}
                                {isSaving ? 'Saving...' : 'Register Partner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPartners;
