export async function generateCurriculumFromNotes(file: File) {
    const formData = new FormData();
    formData.append('courseNotes', file);

    try {
        const response = await fetch('http://localhost:3000/api/generate-curriculum', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `Backend API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error generating curriculum:", error);
        throw error;
    }
}
