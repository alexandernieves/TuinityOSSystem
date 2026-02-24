import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// ⚠️ REEMPLAZA ESTAS CONSTANTES CON TUS PROPIAS CLAVES DE GOOGLE
// Puedes obtenerlas en: https://developers.google.com/custom-search/v1/introduction
const GOOGLE_API_KEY = ''; // Tu API Key
const GOOGLE_CX = '';      // Tu Search Engine ID (debe tener "Image search" habilitado)

interface ImageResult {
    link: string;
    title: string;
    thumbnailLink: string;
    contextLink: string;
}

interface ImageSearchModalProps {
    isOpen: boolean;
    initialQuery: string;
    onClose: () => void;
    onSelectImage: (url: string) => void;
}

export function ImageSearchModal({ isOpen, initialQuery, onClose, onSelectImage }: ImageSearchModalProps) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<ImageResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Actualizar query cuando se abre con un producto diferente
    useEffect(() => {
        if (isOpen && initialQuery) {
            setQuery(initialQuery);
            if (GOOGLE_API_KEY && GOOGLE_CX) {
                handleSearch(initialQuery);
            } else {
                // Si no hay API KEY, cargamos mocks para demostración
                loadMockImages();
            }
        }
    }, [isOpen, initialQuery]);

    const handleSearch = async (searchTerm: string) => {
        if (!searchTerm.trim()) return;

        // Si no hay credenciales configuradas, usar mocks y avisar
        if (!GOOGLE_API_KEY || !GOOGLE_CX) {
            loadMockImages();
            // Solo mostramos el toast una vez
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const url = `https://customsearch.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchTerm)}&searchType=image&num=10`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Error al buscar en Google');
            }

            if (data.items) {
                setResults(data.items);
            } else {
                setResults([]);
                toast.info('No se encontraron imágenes');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            toast.error('Falló la búsqueda de imágenes');
        } finally {
            setLoading(false);
        }
    };

    const loadMockImages = () => {
        // Simulación de resultados para que el usuario vea la UI
        setTimeout(() => {
            setResults([
                { title: 'Ejemplo 1', link: 'https://images.unsplash.com/photo-1563729768640-d091da373318?auto=format&fit=crop&q=80&w=300&h=300', thumbnailLink: '', contextLink: '' },
                { title: 'Ejemplo 2', link: 'https://images.unsplash.com/photo-1627384113972-f4c0392fe5aa?auto=format&fit=crop&q=80&w=300&h=300', thumbnailLink: '', contextLink: '' },
                { title: 'Ejemplo 3', link: 'https://images.unsplash.com/photo-1549463412-43b295a3dfcd?auto=format&fit=crop&q=80&w=300&h=300', thumbnailLink: '', contextLink: '' },
                { title: 'Ejemplo 4', link: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=300&h=300', thumbnailLink: '', contextLink: '' },
                { title: 'Ejemplo 5', link: 'https://images.unsplash.com/photo-1584286595398-a59f21931b9e?auto=format&fit=crop&q=80&w=300&h=300', thumbnailLink: '', contextLink: '' },
                { title: 'Ejemplo 6', link: 'https://images.unsplash.com/photo-1597872252721-2464296fe70b?auto=format&fit=crop&q=80&w=300&h=300', thumbnailLink: '', contextLink: '' },
            ]);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-[#3B82F6]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0F172A]">Google Images</h2>
                            <p className="text-xs text-[#64748B]">Selecciona una imagen para el producto</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors text-[#64748B]">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="Buscar imágenes..."
                        />
                    </div>
                    <button
                        onClick={() => handleSearch(query)}
                        disabled={loading}
                        className="px-6 py-2.5 bg-[#2563EB] text-white text-sm font-bold rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#FBFCFE] min-h-0">
                    {!GOOGLE_API_KEY && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <strong>Modo Demostración:</strong> No se ha configurado la API Key de Google.
                                Se muestran imágenes de ejemplo. Para habilitar la búsqueda real, configura <code>GOOGLE_API_KEY</code> y <code>GOOGLE_CX</code> en el código.
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-[#64748B]">
                            <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#3B82F6]" />
                            <p>Buscando en Google...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1E293B]">Error en la búsqueda</h3>
                            <p className="text-sm text-[#64748B] mt-1 max-w-md mx-auto">{error}</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {results.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => onSelectImage(img.link)}
                                    className="group relative cursor-pointer bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:ring-2 hover:ring-[#3B82F6] hover:shadow-lg transition-all aspect-square"
                                >
                                    <img
                                        src={img.link}
                                        alt={img.title}
                                        className="w-full h-full object-contain p-2"
                                        onError={(e) => {
                                            // Si falla la carga, ocultar imagen rota
                                            (e.target as HTMLImageElement).style.opacity = '0.3';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-white truncate">{img.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
                            <ImageIcon className="w-16 h-16 opacity-20 mb-4" />
                            <p>No hay resultados. Intenta otra búsqueda.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-[#E2E8F0] shrink-0 text-center text-xs text-[#94A3B8]">
                    Powered by Google Custom Search
                </div>
            </div>
        </div>
    );
}
