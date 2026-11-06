import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import DeleteConfirmModal from '@/Components/Admin/DeleteConfirmModal';
import { Node, mergeAttributes } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
    Newspaper,
    Plus,
    Pencil,
    Trash2,
    Calendar,
    User,
    Upload,
    X,
    CheckCircle2,
    Search,
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo2,
    Redo2,
    ImagePlus,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';

interface AdminNewsItem {
    id: number;
    title: string;
    slug: string;
    author: string;
    date: string;
    formatted_date: string;
    image: string;
    description: string;
    excerpt?: string;
    status: 'Aktif' | 'Draft';
}

interface BeritaProps {
    newsList: AdminNewsItem[];
}

const ITEMS_PER_PAGE = 10;

/**
 * Ekstensi Node Kustom Tiptap untuk menyisipkan <figure> + <img> + <figcaption>
 * tepat di tengah paragraf berita.
 */
const FigureWithCaption = Node.create({
    name: 'figureImage',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            src: {
                default: '',
            },
            alt: {
                default: '',
            },
            caption: {
                default: '',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'figure',
                getAttrs: (node) => {
                    if (typeof node === 'string') return false;
                    const element = node as HTMLElement;
                    const img = element.querySelector('img');
                    if (!img) return false;
                    const figcaption = element.querySelector('figcaption');
                    return {
                        src: img.getAttribute('src') || '',
                        alt: img.getAttribute('alt') || '',
                        caption:
                            figcaption?.textContent ||
                            img.getAttribute('alt') ||
                            '',
                    };
                },
            },
            {
                tag: 'img[src]',
                getAttrs: (node) => {
                    if (typeof node === 'string') return false;
                    const element = node as HTMLElement;
                    return {
                        src: element.getAttribute('src') || '',
                        alt: element.getAttribute('alt') || '',
                        caption: element.getAttribute('alt') || '',
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const { src, alt, caption } = HTMLAttributes;
        const children: any[] = [
            [
                'img',
                mergeAttributes({
                    src,
                    alt: alt || caption || 'Gambar Artikel',
                    class: 'mx-auto block rounded-2xl shadow-md max-w-full sm:max-w-2xl h-auto object-cover',
                }),
            ],
        ];

        if (caption) {
            children.push([
                'figcaption',
                {
                    class: 'mt-2.5 text-center text-xs sm:text-sm italic text-muted max-w-xl mx-auto',
                },
                caption,
            ]);
        }

        return [
            'figure',
            {
                class: 'my-6 flex flex-col items-center justify-center mx-auto',
            },
            ...children,
        ];
    },
});

function getCsrfHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    const metaToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    if (metaToken) {
        headers['X-CSRF-TOKEN'] = metaToken;
    }

    const xsrfMatch = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    if (xsrfMatch) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfMatch[1]);
    }

    return headers;
}

function stripHtmlForPreview(html: string): string {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export default function Berita({ newsList = [] }: BeritaProps) {
    const { flash } = usePage().props as any;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AdminNewsItem | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<AdminNewsItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // State Panel Sisipkan Gambar di Tengah Berita
    const [showInsertImageBox, setShowInsertImageBox] = useState(false);
    const [inlineImageFile, setInlineImageFile] = useState<File | null>(null);
    const [inlineImagePreview, setInlineImagePreview] = useState<string | null>(null);
    const [inlineImageCaption, setInlineImageCaption] = useState('');
    const [isUploadingInlineImage, setIsUploadingInlineImage] = useState(false);
    const [inlineImageError, setInlineImageError] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        title: string;
        author: string;
        date: string;
        description: string;
        status: 'Aktif' | 'Draft';
        image: File | null;
    }>({
        title: '',
        author: 'Admin Sarpras',
        date: today,
        description: '',
        status: 'Aktif',
        image: null,
    });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
                underline: false,
            }),
            Underline,
            FigureWithCaption,
        ],
        content: data.description,
        onUpdate: ({ editor: tiptap }) => {
            setData('description', tiptap.getHTML());
        },
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const resetInlineImageState = () => {
        setShowInsertImageBox(false);
        setInlineImageFile(null);
        setInlineImagePreview(null);
        setInlineImageCaption('');
        setInlineImageError(null);
    };

    const handleOpenCreateModal = () => {
        setEditingItem(null);
        setPreviewUrl(null);
        clearErrors();
        resetInlineImageState();
        const initialData = {
            title: '',
            author: 'Admin Sarpras',
            date: today,
            description: '',
            status: 'Aktif' as const,
            image: null,
        };
        setData(initialData);
        editor?.commands.setContent('');
        setIsFormModalOpen(true);
    };

    const handleEdit = (item: AdminNewsItem) => {
        setEditingItem(item);
        clearErrors();
        resetInlineImageState();
        const formattedHtml =
            item.description && item.description !== stripHtmlForPreview(item.description)
                ? item.description
                : `<p>${(item.description || '').replace(/\n+/g, '</p><p>')}</p>`;

        setData({
            title: item.title,
            author: item.author,
            date: item.date,
            description: formattedHtml,
            status: item.status,
            image: null,
        });
        editor?.commands.setContent(formattedHtml);
        setPreviewUrl(item.image || null);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        if (processing || isUploadingInlineImage) return;
        setIsFormModalOpen(false);
        setEditingItem(null);
        setPreviewUrl(null);
        clearErrors();
        resetInlineImageState();
        reset();
        editor?.commands.setContent('');
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleInlineImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setInlineImageFile(file);
            setInlineImagePreview(URL.createObjectURL(file));
            setInlineImageError(null);
        }
    };

    const handleInsertInlineImage = async () => {
        if (!inlineImageFile || !editor) {
            setInlineImageError('Silakan pilih file gambar terlebih dahulu.');
            return;
        }

        setIsUploadingInlineImage(true);
        setInlineImageError(null);

        try {
            const formData = new FormData();
            formData.append('image', inlineImageFile);

            const response = await fetch('/admin/berita/upload-image', {
                method: 'POST',
                headers: getCsrfHeaders(),
                body: formData,
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => null);
                const msg =
                    errJson?.errors?.image?.[0] ||
                    errJson?.message ||
                    'Gagal mengunggah gambar sisipan (Pastikan JPG/PNG/WEBP maks. 5MB).';
                throw new Error(msg);
            }

            const result = await response.json();
            const uploadedUrl = result.url;
            const captionText = inlineImageCaption.trim();

            editor
                .chain()
                .focus()
                .insertContent([
                    {
                        type: 'figureImage',
                        attrs: {
                            src: uploadedUrl,
                            alt: captionText || 'Gambar Artikel',
                            caption: captionText,
                        },
                    },
                    {
                        type: 'paragraph',
                    },
                ])
                .run();

            setData('description', editor.getHTML());
            resetInlineImageState();
        } catch (err: any) {
            setInlineImageError(err?.message || 'Terjadi kesalahan saat mengunggah gambar.');
        } finally {
            setIsUploadingInlineImage(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            post(`/admin/berita/${editingItem.id}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => handleCloseFormModal(),
            });
        } else {
            post('/admin/berita', {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => handleCloseFormModal(),
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/admin/berita/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const filteredNews = newsList.filter(
        (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Perhitungan Paginasi 10 Baris
    const totalPages = Math.max(1, Math.ceil(filteredNews.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedNews = filteredNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <AdminLayout>
            <Head title="Kelola Berita - Admin Biro Sarpras" />

            <div className="space-y-6">
                {/* Header dengan Tombol + Tambah Berita Baru */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-ink font-serif">
                            Kelola Berita & Pengumuman
                        </h1>
                        <p className="text-sm text-muted mt-1">
                            Tambahkan, perbarui, atau hapus berita dengan Rich Text Editor (Tiptap) dan sisipan gambar ber-caption.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Berita Baru
                    </button>
                </div>

                {/* Alert Sukses */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-soft border border-primary/20 text-primary text-sm font-semibold">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Daftar Berita Full-Width */}
                <div className="bg-white p-6 rounded-2xl border border-surface-container shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container">
                        <div>
                            <h2 className="text-lg font-bold text-ink">
                                Daftar Berita ({filteredNews.length})
                            </h2>
                            {filteredNews.length > 0 && (
                                <p className="text-xs text-muted mt-0.5">
                                    Menampilkan {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredNews.length)} dari {filteredNews.length} berita
                                </p>
                            )}
                        </div>
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari judul atau penulis..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-surface text-xs text-ink focus:outline-none focus:border-primary"
                            />
                            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    {paginatedNews.length === 0 ? (
                        <div className="text-center py-12 text-muted text-sm border-2 border-dashed border-surface-container rounded-2xl">
                            Belum ada data berita. Silakan tambahkan berita baru melalui tombol "+ Tambah Berita Baru" di atas.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paginatedNews.map((item) => {
                                const plainExcerpt =
                                    item.excerpt || stripHtmlForPreview(item.description);

                                return (
                                    <div
                                        key={item.id}
                                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-surface-container hover:bg-surface/60 transition-colors"
                                    >
                                        <img
                                            src={item.image || '/images/Hero.png'}
                                            alt={item.title}
                                            className="w-full sm:w-32 h-24 rounded-xl object-cover shrink-0 bg-slate-100"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://via.placeholder.com/200x150?text=Berita';
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-ink text-sm sm:text-base line-clamp-1">
                                                    {item.title}
                                                </h3>
                                                <span
                                                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                        item.status === 'Aktif'
                                                            ? 'bg-primary-soft text-primary'
                                                            : 'bg-slate-100 text-muted'
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-1 mb-2">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                                    {item.formatted_date}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5 text-primary" />
                                                    {item.author}
                                                </span>
                                            </div>

                                            <p className="text-xs text-muted line-clamp-2">
                                                {plainExcerpt}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(item)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-white text-xs font-semibold transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(item)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Navigasi Paginasi 10 Baris (Prev / Nomor Halaman / Next) */}
                    {filteredNews.length > ITEMS_PER_PAGE && (
                        <div className="pt-4 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-muted">
                                Halaman <strong className="text-ink">{safeCurrentPage}</strong> dari{' '}
                                <strong className="text-ink">{totalPages}</strong>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={safeCurrentPage <= 1}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-surface text-xs font-semibold text-ink transition-colors disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Prev
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                            page === safeCurrentPage
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'border border-slate-200 bg-white text-ink hover:bg-surface'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={safeCurrentPage >= totalPages}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-surface text-xs font-semibold text-ink transition-colors disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    Next
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Dialog Form Tambah / Edit Berita */}
            <Modal show={isFormModalOpen} onClose={handleCloseFormModal} maxWidth="2xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />

                <div className="p-6 sm:p-7 font-sans max-h-[88vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-4 border-b border-surface-container mb-5">
                        <h2 className="text-lg sm:text-xl font-bold text-ink font-serif flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                                <Newspaper className="w-5 h-5" />
                            </div>
                            {editingItem ? 'Edit Berita' : 'Tambah Berita Baru'}
                        </h2>
                        <button
                            type="button"
                            onClick={handleCloseFormModal}
                            disabled={processing || isUploadingInlineImage}
                            className="text-muted/60 hover:text-ink hover:bg-surface-low rounded-xl p-1.5 transition-colors"
                            title="Tutup"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Judul Berita */}
                        <div>
                            <label className="block text-sm font-semibold text-ink mb-1">
                                Judul Berita
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Masukkan judul berita..."
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                required
                            />
                            {errors.title && (
                                <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Tanggal */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.date && (
                                    <p className="text-xs text-red-600 mt-1">{errors.date}</p>
                                )}
                            </div>

                            {/* Penulis */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Penulis
                                </label>
                                <input
                                    type="text"
                                    value={data.author}
                                    onChange={(e) => setData('author', e.target.value)}
                                    placeholder="Nama penulis..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.author && (
                                    <p className="text-xs text-red-600 mt-1">{errors.author}</p>
                                )}
                            </div>

                            {/* Status Publikasi */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Status Publikasi
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) =>
                                        setData('status', e.target.value as 'Aktif' | 'Draft')
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="Aktif">Aktif (Tampil di Publik)</option>
                                    <option value="Draft">Draft (Disembunyikan)</option>
                                </select>
                            </div>
                        </div>

                        {/* Gambar Sampul (Cover) Berita */}
                        <div>
                            <label className="block text-sm font-semibold text-ink mb-1">
                                Gambar Sampul (Cover) Berita
                            </label>
                            <div className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-4 text-center transition-colors bg-surface">
                                <input
                                    type="file"
                                    id="berita-cover-image"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="berita-cover-image"
                                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                                >
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview Cover"
                                            className="w-full max-h-44 object-cover rounded-xl mb-2"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                    )}
                                    <span className="text-xs font-semibold text-primary">
                                        {previewUrl ? 'Ganti Gambar Sampul' : 'Pilih Gambar Sampul Berita'}
                                    </span>
                                    <span className="text-[11px] text-muted">
                                        JPG, PNG, WEBP (Maks. 5MB)
                                    </span>
                                </label>
                            </div>
                            {errors.image && (
                                <p className="text-xs text-red-600 mt-1">{errors.image}</p>
                            )}
                        </div>

                        {/* Rich Text Editor (Tiptap) untuk Deskripsi Berita */}
                        <div>
                            <label className="block text-sm font-semibold text-ink mb-1">
                                Isi / Deskripsi Berita
                            </label>

                            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                                {/* Toolbar Tiptap */}
                                {editor && (
                                    <div className="flex flex-wrap items-center gap-1 p-2 bg-surface border-b border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                editor.isActive('heading', { level: 2 })
                                                    ? 'bg-primary text-white'
                                                    : 'text-ink hover:bg-surface-container'
                                            }`}
                                            title="Heading 2"
                                        >
                                            <Heading2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                editor.isActive('heading', { level: 3 })
                                                    ? 'bg-primary text-white'
                                                    : 'text-ink hover:bg-surface-container'
                                            }`}
                                            title="Heading 3"
                                        >
                                            <Heading3 className="w-4 h-4" />
                                        </button>

                                        <div className="w-px h-5 bg-slate-200 mx-1" />

                                        <button
                                            type="button"
                                            onClick={() => editor.chain().focus().toggleBold().run()}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                editor.isActive('bold')
                                                    ? 'bg-primary text-white'
                                                    : 'text-ink hover:bg-surface-container'
                                            }`}
                                            title="Tebal (Bold)"
                                        >
                                            <Bold className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor.chain().focus().toggleItalic().run()}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                editor.isActive('italic')
                                                    ? 'bg-primary text-white'
                                                    : 'text-ink hover:bg-surface-container'
                                            }`}
                                            title="Miring (Italic)"
                                        >
                                            <Italic className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                editor.isActive('underline')
                                                    ? 'bg-primary text-white'
                                                    : 'text-ink hover:bg-surface-container'
                                            }`}
                                            title="Garis Bawah (Underline)"
                                        >
                                            <UnderlineIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor.chain().focus().toggleStrike().run()}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                editor.isActive('strike')
                                                    ? 'bg-primary text-white'
                                                    : 'text-ink hover:bg-surface-container'
                                            }`}
                                            title="Coret (Strike)"
                                        >
                                            <Strikethrough className="w-4 h-4" />
                                        </button>

                                        <div className="w-px h-5 bg-slate-200 mx-1" />

                                        <button
                                            type="button"
                                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                editor.isActive('bulletList')
                                                    ? 'bg-primary text-white'
                                                    : 'text-ink hover:bg-surface-container'
                                            }`}
                                            title="Bullet List"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                editor.isActive('orderedList')
                                                    ? 'bg-primary text-white'
                                                    : 'text-ink hover:bg-surface-container'
                                            }`}
                                            title="Numbered List"
                                        >
                                            <ListOrdered className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                editor.isActive('blockquote')
                                                    ? 'bg-primary text-white'
                                                    : 'text-ink hover:bg-surface-container'
                                            }`}
                                            title="Kutipan (Blockquote)"
                                        >
                                            <Quote className="w-4 h-4" />
                                        </button>

                                        <div className="w-px h-5 bg-slate-200 mx-1" />

                                        {/* Tombol Sisipkan Gambar + Caption di Tengah Berita */}
                                        <button
                                            type="button"
                                            onClick={() => setShowInsertImageBox((prev) => !prev)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                showInsertImageBox
                                                    ? 'bg-primary text-white'
                                                    : 'bg-primary-soft text-primary hover:bg-primary hover:text-white'
                                            }`}
                                            title="Sisipkan Gambar di Tengah Artikel + Caption"
                                        >
                                            <ImagePlus className="w-4 h-4" />
                                            Sisipkan Gambar
                                        </button>

                                        <div className="ml-auto flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => editor.chain().focus().undo().run()}
                                                disabled={!editor.can().undo()}
                                                className="p-1.5 rounded-lg text-ink hover:bg-surface-container disabled:opacity-30"
                                                title="Undo"
                                            >
                                                <Undo2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => editor.chain().focus().redo().run()}
                                                disabled={!editor.can().redo()}
                                                className="p-1.5 rounded-lg text-ink hover:bg-surface-container disabled:opacity-30"
                                                title="Redo"
                                            >
                                                <Redo2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Panel Sisipkan Gambar + Caption */}
                                {showInsertImageBox && (
                                    <div className="p-4 bg-primary-soft/40 border-b border-primary/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                                                Sisipkan Gambar di Tengah Paragraf + Caption
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={resetInlineImageState}
                                                className="text-xs text-muted hover:text-ink"
                                            >
                                                Tutup
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-ink mb-1">
                                                    Pilih Foto dari Komputer
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    onChange={handleInlineImageFileChange}
                                                    className="w-full text-xs text-ink file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-ink mb-1">
                                                    Judul / Keterangan Gambar (Caption)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={inlineImageCaption}
                                                    onChange={(e) => setInlineImageCaption(e.target.value)}
                                                    placeholder="Contoh: Suasana rapat anggaran Biro Sarpras"
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-ink focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                        </div>

                                        {inlineImagePreview && (
                                            <div className="flex flex-col items-center p-2 bg-white rounded-xl border border-slate-200">
                                                <img
                                                    src={inlineImagePreview}
                                                    alt="Pratinjau Sisipan"
                                                    className="max-h-36 rounded-lg object-cover"
                                                />
                                                {inlineImageCaption && (
                                                    <span className="mt-1 text-[11px] italic text-muted">
                                                        {inlineImageCaption}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {inlineImageError && (
                                            <p className="text-xs text-red-600 font-medium">
                                                {inlineImageError}
                                            </p>
                                        )}

                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={resetInlineImageState}
                                                disabled={isUploadingInlineImage}
                                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-muted hover:text-ink"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleInsertInlineImage}
                                                disabled={isUploadingInlineImage || !inlineImageFile}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold transition-all disabled:opacity-50"
                                            >
                                                {isUploadingInlineImage ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Mengunggah...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImagePlus className="w-3.5 h-3.5" />
                                                        Sisipkan ke Paragraf
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Area Editor Tiptap */}
                                <div className="tiptap-editor-content article-rich-content max-h-[340px] overflow-y-auto">
                                    <EditorContent editor={editor} />
                                </div>
                            </div>

                            {errors.description && (
                                <p className="text-xs text-red-600 mt-1">{errors.description}</p>
                            )}
                        </div>

                        {/* Tombol Aksi Modal */}
                        <div className="pt-4 border-t border-surface-container flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseFormModal}
                                disabled={processing || isUploadingInlineImage}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-muted hover:bg-surface-low hover:text-ink transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing || isUploadingInlineImage}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                {processing
                                    ? 'Menyimpan...'
                                    : editingItem
                                      ? 'Simpan Perubahan Berita'
                                      : 'Tambahkan Berita'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal Konfirmasi Hapus Berita */}
            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Berita"
                message="Apakah Anda yakin ingin menghapus berita ini?"
                itemName={deleteTarget?.title}
                processing={isDeleting}
            />
        </AdminLayout>
    );
}
