const fs = require('fs');

function patchFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const oldDecl = 'const tutors: any[] = [];';
    const newDecl = `const [tutors, setTutors] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);

    useEffect(() => {
        const loadAux = async () => {
            try {
                const { data: pData } = await supabaseClient.from('partners').select('*');
                if (pData) setPartners(pData);
                const { data: tData } = await supabaseClient.from('instructors').select('*');
                if (tData) setTutors(tData);
            } catch (err) {
                console.error('Error loading partners/tutors:', err);
            }
        };
        loadAux();
    }, []);`;

    if (content.includes(oldDecl)) {
        content = content.replace(oldDecl, newDecl);
        // Also ensure fallback on maps
        content = content.replace('partners.map(p =>', '(partners || []).map(p =>');
        content = content.replace('tutors.map(t =>', '(tutors || []).map(t =>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Patched:', filePath);
    } else {
        console.log('Target not found in:', filePath);
    }
}

patchFile('admin-portal/src/components/admin/AdminCourseSetupWizard.tsx');
patchFile('frontend/components/admin/AdminCourseSetupWizard.tsx');
