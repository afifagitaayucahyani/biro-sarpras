import React, { useState, useEffect } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Modal from "@/Components/Modal";
import DeleteConfirmModal from "@/Components/Admin/DeleteConfirmModal";
import {
    FileText,
    FileSpreadsheet,
    Plus,
    Pencil,
    Trash2,
    Upload,
    Download,
    CheckCircle2,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface AdminDocumentItem {
    id: number;
    title: string;
    category: string;
    order: number;
    size: string;
    type: "pdf" | "excel" | "word";
    extension?: string;
    date: string;
    formatted_date: string;
    fileUrl: string;
}

interface DokumenProps {
    documents: AdminDocumentItem[];
}

const CATEGORIES = ["Pedoman", "Formulir", "Laporan", "SK", "Lainnya"];
const FILTER_CATEGORIES = ["Semua", ...CATEGORIES];
const ITEMS_PER_PAGE = 10;

export default function Dokumen({ documents = [] }: DokumenProps) {
    const { flash } = usePage().props as any;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<AdminDocumentItem | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Semua");
    const [currentPage, setCurrentPage] = useState(1);
    const [reorderingId, setReorderingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminDocumentItem | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<{
            title: string;
            category: string;
            order: number | string;
            file: File | null;
        }>({
            title: "",
            category: "Pedoman",
            order: 1,
            file: null,
        });

    // Reset ke halaman 1 ketika filter atau pencarian berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory]);
    const handleOpenCreateModal = () => {
        setEditingDoc(null);
        clearErrors();
        setData({
            title: "",
            category: "Pedoman",
            order: 1,
            file: null,
        });
        setIsFormModalOpen(true);
    };
    const handleOpenEditModal = (doc: AdminDocumentItem) => {
        setEditingDoc(doc);
        clearErrors();
        const normalizedCategory =
            doc.category === "Surat Keputusan" ? "SK" : doc.category;
        setData({
            title: doc.title,
            category: CATEGORIES.includes(normalizedCategory)
                ? normalizedCategory
                : "Lainnya",
            order: doc.order || 1,
            file: null,
        });
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        if (processing) return;
        setIsFormModalOpen(false);
        setEditingDoc(null);
        clearErrors();
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDoc) {
            post(`/admin/dokumen/${editingDoc.id}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditingDoc(null);
                    reset();
                },
            });
        } else {
            post("/admin/dokumen", {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleMoveOrder = (
        doc: AdminDocumentItem,
        direction: "up" | "down",
    ) => {
        if (reorderingId !== null) return;
        setReorderingId(doc.id);
        router.post(
            `/admin/dokumen/${doc.id}/reorder`,
            { direction },
            {
                preserveScroll: true,
                onFinish: () => setReorderingId(null),
            },
        );
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/admin/dokumen/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const getExtensionLabel = (doc: AdminDocumentItem): string => {
        if (doc.extension) {
            return doc.extension.toUpperCase();
        }
        if (doc.type === "excel") return "XLSX";
        if (doc.type === "word") return "DOCX";
        return "PDF";
    };
    // Filter dokumen berdasarkan kategori cepat & kata kunci pencarian
    const filteredDocs = documents.filter((doc) => {
        const matchesCategory =
            selectedCategory === "Semua" ||
            doc.category === selectedCategory ||
            (selectedCategory === "SK" && doc.category === "Surat Keputusan");
        const matchesSearch =
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.category.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });
    // Perhitungan Paginasi 10 Baris
    const totalPages = Math.max(
        1,
        Math.ceil(filteredDocs.length / ITEMS_PER_PAGE),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedDocs = filteredDocs.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE,
    );

    return (
        <AdminLayout>
            <Head title="Kelola Dokumen - Admin Biro Sarpras" />

            <div className="space-y-6">
                {/* Header dengan Tombol + Tambah Dokumen */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-ink font-serif">
                            Kelola Dokumen Resmi & Unduhan
                        </h1>
                        <p className="text-sm text-muted mt-1">
                            Unggah, atur urutan posisi, dan kelola berkas
                            dokumen resmi (PDF, Word, Excel) untuk pusat unduhan
                            publik.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />+ Tambah Dokumen
                    </button>
                </div>

                {/* Alert Sukses */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-soft border border-primary/20 text-primary text-sm font-semibold">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Daftar Dokumen Full-Width */}
                <div className="bg-white p-6 rounded-2xl border border-surface-container shadow-sm space-y-5">
                    {/* Baris Judul, Filter Cepat Kategori, dan Pencarian */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {FILTER_CATEGORIES.map((cat) => {
                                const isActive = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                            isActive
                                                ? "bg-primary text-white shadow-sm"
                                                : "bg-surface text-muted hover:bg-surface-container hover:text-ink border border-slate-200/80"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="relative w-full lg:w-72">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari judul atau kategori dokumen..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-surface text-xs text-ink focus:outline-none focus:border-primary"
                            />
                            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Info Total Dokumen */}
                    <div className="flex items-center justify-between border-b border-surface-container pb-3">
                        <h2 className="text-base font-bold text-ink">
                            Daftar Dokumen ({filteredDocs.length})
                        </h2>
                        {filteredDocs.length > 0 && (
                            <span className="text-xs text-muted font-medium">
                                Menampilkan {startIndex + 1}–
                                {Math.min(
                                    startIndex + ITEMS_PER_PAGE,
                                    filteredDocs.length,
                                )}{" "}
                                dari {filteredDocs.length} dokumen
                            </span>
                        )}
                    </div>

                    {/* Daftar Baris Dokumen */}
                    {paginatedDocs.length === 0 ? (
                        <div className="text-center py-12 text-muted text-sm border-2 border-dashed border-surface-container rounded-2xl">
                            Belum ada dokumen yang sesuai atau diunggah.
                        </div>
                    ) : (
                        <div className="divide-y divide-surface-container">
                            {paginatedDocs.map((doc, idx) => {
                                const globalIdx = documents.findIndex(
                                    (d) => d.id === doc.id,
                                );
                                const isFirstOverall = globalIdx <= 0;
                                const isLastOverall =
                                    globalIdx === -1 ||
                                    globalIdx >= documents.length - 1;
                                const orderNumber =
                                    doc.order > 0
                                        ? doc.order
                                        : startIndex + idx + 1;
                                const extLabel = getExtensionLabel(doc);

                                return (
                                    <div
                                        key={doc.id}
                                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/40 px-2 rounded-xl transition-colors"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            {/* Kontrol Urutan: Panah Naik (▲) & Turun (▼) */}
                                            <div className="flex flex-col items-center gap-0.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleMoveOrder(
                                                            doc,
                                                            "up",
                                                        )
                                                    }
                                                    disabled={
                                                        isFirstOverall ||
                                                        reorderingId !== null
                                                    }
                                                    title="Geser Naik"
                                                    className="w-6 h-5 rounded bg-surface-container hover:bg-primary hover:text-white text-ink text-[10px] font-bold flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleMoveOrder(
                                                            doc,
                                                            "down",
                                                        )
                                                    }
                                                    disabled={
                                                        isLastOverall ||
                                                        reorderingId !== null
                                                    }
                                                    title="Geser Turun"
                                                    className="w-6 h-5 rounded bg-surface-container hover:bg-primary hover:text-white text-ink text-[10px] font-bold flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                            {/* Badge Urutan (#1, #2, dst.) */}
                                            <span className="px-2.5 py-1 rounded-lg bg-primary-soft text-primary text-xs font-extrabold shrink-0 border border-primary/15">
                                                #{orderNumber}
                                            </span>
                                            {/* Ikon Tipe Dokumen */}
                                            <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                                                {doc.type === "excel" ? (
                                                    <FileSpreadsheet className="w-5 h-5" />
                                                ) : (
                                                    <FileText className="w-5 h-5" />
                                                )}
                                            </div>
                                            {/* Judul & Badge Kategori + Format (Tanpa Ukuran & Tanggal) */}
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-ink mb-1 truncate">
                                                    {doc.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                                                    <span className="px-2.5 py-0.5 rounded-md bg-surface-container text-ink font-semibold">
                                                        {doc.category}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${
                                                            doc.type === "excel"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                                                                : doc.type ===
                                                                    "word"
                                                                  ? "bg-blue-50 text-blue-700 border-blue-200/70"
                                                                  : "bg-red-50 text-red-700 border-red-200/70"
                                                        }`}
                                                    >
                                                        {extLabel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tombol Aksi: Lihat, Edit, Hapus */}
                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-ink hover:bg-slate-200 text-xs font-semibold transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Unduh
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleOpenEditModal(doc)
                                                }
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-white text-xs font-semibold transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeleteTarget(doc)
                                                }
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
                    {/* Navigasi Paginasi (Prev / Nomor Halaman / Next) */}
                    {filteredDocs.length > ITEMS_PER_PAGE && (
                        <div className="pt-4 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-muted">
                                Halaman{" "}
                                <strong className="text-ink">
                                    {safeCurrentPage}
                                </strong>{" "}
                                dari{" "}
                                <strong className="text-ink">
                                    {totalPages}
                                </strong>
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1),
                                        )
                                    }
                                    disabled={safeCurrentPage <= 1}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-surface text-xs font-semibold text-ink transition-colors disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Prev
                                </button>
                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1,
                                ).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                            page === safeCurrentPage
                                                ? "bg-primary text-white shadow-sm"
                                                : "border border-slate-200 bg-white text-ink hover:bg-surface"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1),
                                        )
                                    }
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

            {/* Modal Dialog Form Tambah / Edit Dokumen */}
            <Modal
                show={isFormModalOpen}
                onClose={handleCloseFormModal}
                maxWidth="lg"
            >
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />
                <div className="p-6 sm:p-7 font-sans">
                    <div className="flex items-center justify-between pb-4 border-b border-surface-container mb-5">
                        <h2 className="text-lg sm:text-xl font-bold text-ink font-serif flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            {editingDoc
                                ? "Edit Dokumen"
                                : "Tambah Dokumen Baru"}
                        </h2>
                        <button
                            type="button"
                            onClick={handleCloseFormModal}
                            disabled={processing}
                            className="text-muted/60 hover:text-ink hover:bg-surface-low rounded-xl p-1.5 transition-colors"
                            title="Tutup"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Judul Dokumen */}
                        <div>
                            <label className="block text-sm font-semibold text-ink mb-1">
                                Judul Dokumen
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) =>
                                    setData("title", e.target.value)
                                }
                                placeholder="Contoh: SOP Pencairan Dana 2026"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                required
                            />
                            {errors.title && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Kategori Dokumen */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Kategori Dokumen
                                </label>
                                <select
                                    value={data.category}
                                    onChange={(e) =>
                                        setData("category", e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.category}
                                    </p>
                                )}
                            </div>

                            {/* Nomor Urutan Posisi */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Posisi Urutan
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={data.order}
                                    onChange={(e) =>
                                        setData(
                                            "order",
                                            e.target.value
                                                ? parseInt(e.target.value, 10)
                                                : "",
                                        )
                                    }
                                    placeholder="1"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.order && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.order}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Upload File Berkas */}
                        <div>
                            <label className="block text-sm font-semibold text-ink mb-1">
                                File Dokumen{" "}
                                {editingDoc && "(Kosongkan jika tidak diganti)"}
                            </label>
                            <div className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-5 text-center transition-colors bg-surface">
                                <input
                                    type="file"
                                    id="dokumen-file-modal"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                                    onChange={(e) =>
                                        setData(
                                            "file",
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                    className="hidden"
                                    required={!editingDoc}
                                />
                                <label
                                    htmlFor="dokumen-file-modal"
                                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-ink">
                                        Klik untuk memilih berkas dokumen
                                    </span>
                                    <span className="text-[11px] text-muted">
                                        PDF, Word (.doc/.docx), atau Excel
                                        (.xls/.xlsx) maks. 5MB
                                    </span>
                                    {data.file && (
                                        <span className="mt-1 px-3 py-1 bg-primary text-white text-xs rounded-full font-medium">
                                            {data.file.name}
                                        </span>
                                    )}
                                </label>
                            </div>
                            {errors.file && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.file}
                                </p>
                            )}
                        </div>

                        {/* Tombol Aksi Modal */}
                        <div className="pt-4 border-t border-surface-container flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseFormModal}
                                disabled={processing}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-muted hover:bg-surface-low hover:text-ink transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                {processing
                                    ? "Menyimpan..."
                                    : editingDoc
                                      ? "Simpan Perubahan"
                                      : "Unggah Dokumen"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal Konfirmasi Hapus Dokumen */}
            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Dokumen"
                message="Apakah Anda yakin ingin menghapus berkas dokumen ini?"
                itemName={deleteTarget?.title}
                processing={isDeleting}
            />
        </AdminLayout>
    );
}
