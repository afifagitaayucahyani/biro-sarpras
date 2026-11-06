import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@inertiajs/react";
import {
    Calendar,
    User,
    ArrowRight,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export interface NewsItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    date: string;
    author: string;
}

interface BeritaSectionProps {
    news?: NewsItem[];
    bgImage?: string;
}

const ITEMS_PER_PAGE = 5;

export function BeritaSection({
    news = [],
    bgImage = "/images/Hero.png",
}: BeritaSectionProps) {
    const [selectedYear, setSelectedYear] = useState<string>("2026");
    const [currentPage, setCurrentPage] = useState<number>(1);

    const filteredNews = news.filter((item) =>
        item.date.includes(selectedYear),
    );

    const totalPages = Math.max(
        1,
        Math.ceil(filteredNews.length / ITEMS_PER_PAGE),
    );
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const currentNews = filteredNews.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE,
    );

    const isSingleNews = currentNews.length === 1;
    const featuredNews = currentNews[0];
    const sideNews = currentNews.slice(1, 5);

    const years = ["2026", "2025", "2024", "2023", "2022"];

    return (
        <section
            id="berita"
            className="relative py-16 lg:py-20 font-sans overflow-hidden min-h-[500px]"
        >
            {/* Background Image & Overlay */}
            <img
                src={bgImage}
                alt="Latar Belakang Berita"
                className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-primary/75 backdrop-blur-sm" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-sm font-bold text-accent uppercase tracking-widest mb-2">
                            Informasi Terkini
                        </h2>
                        <h3 className="text-3xl sm:text-4xl font-bold text-white font-serif">
                            Berita & Pengumuman
                        </h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="relative w-full sm:w-auto"
                    >
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full sm:w-48 appearance-none bg-white/10 border border-white/20 text-white font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent backdrop-blur-md cursor-pointer"
                        >
                            {years.map((year) => (
                                <option
                                    key={year}
                                    value={year}
                                    className="text-black"
                                >
                                    Tahun {year}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white w-5 h-5 pointer-events-none" />
                    </motion.div>
                </div>

                {/* Konten Berita */}
                {filteredNews.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-white/50" />
                        </div>
                        <p className="text-white/80 text-lg font-medium">
                            Belum ada berita atau pengumuman di tahun{" "}
                            {selectedYear}.
                        </p>
                    </motion.div>
                ) : isSingleNews && featuredNews ? (
                    /* Jika berita hanya 1: Tampilkan sebagai Card Kecil yang proporsional */
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`single-${featuredNews.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="max-w-sm sm:max-w-md"
                        >
                            <div className="group bg-primary/75 rounded-2xl overflow-hidden shadow-lg border border-white/10 transition-all duration-300 flex flex-col">
                                <div className="relative h-48 overflow-hidden bg-slate-100">
                                    <img
                                        src={featuredNews.image}
                                        alt={featuredNews.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            (
                                                e.target as HTMLImageElement
                                            ).src =
                                                "https://via.placeholder.com/400x300?text=Berita";
                                        }}
                                    />
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-bold text-primary shadow-sm flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        {featuredNews.date}
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="flex items-center gap-1.5 text-xs text-white/85 mb-2 font-medium">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{featuredNews.author}</span>
                                    </div>
                                    <Link
                                        href={`/berita/${featuredNews.slug}`}
                                        className="block group-hover:text-[#FCB900] transition-colors mb-2"
                                    >
                                        <h4 className="text-lg font-bold text-white line-clamp-2 leading-snug">
                                            {featuredNews.title}
                                        </h4>
                                    </Link>
                                    <p className="text-sm text-white/80 line-clamp-2 mb-4 flex-grow">
                                        {featuredNews.excerpt}
                                    </p>
                                    <Link
                                        href={`/berita/${featuredNews.slug}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FCB900] group-hover:text-white transition-colors mt-auto"
                                    >
                                        Baca Selengkapnya
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    /* Jika berita lebih dari 1: Kiri Featured + Kanan Daftar Samping */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* KIRI: Berita Utama (Featured) */}
                        <div className="lg:col-span-7">
                            <AnimatePresence mode="wait">
                                {featuredNews && (
                                    <motion.div
                                        key={featuredNews.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4 }}
                                        className="group bg-primary/75 rounded-2xl overflow-hidden shadow-lg border border-white/10 transition-all duration-300 flex flex-col h-full"
                                    >
                                        <div className="relative h-49 sm:h-60 overflow-hidden bg-slate-100">
                                            <img
                                                src={featuredNews.image}
                                                alt={featuredNews.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).src =
                                                        "https://via.placeholder.com/600x400?text=Berita";
                                                }}
                                            />
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-primary shadow-sm flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {featuredNews.date}
                                            </div>
                                        </div>

                                        <div className="p-6 sm:p-8 flex flex-col flex-grow">
                                            <div className="flex items-center gap-2 text-xs text-white mb-3 font-medium">
                                                <User className="w-3.5 h-3.5" />
                                                <span>
                                                    {featuredNews.author}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/berita/${featuredNews.slug}`}
                                                className="block group-hover:text-[#FCB900] transition-colors"
                                            >
                                                <h4 className="text-xl sm:text-2xl font-bold text-white mb-4 line-clamp-2 leading-snug">
                                                    {featuredNews.title}
                                                </h4>
                                            </Link>
                                            <p className="text-base text-white/80 line-clamp-3 mb-6 flex-grow">
                                                {featuredNews.excerpt}
                                            </p>
                                            <Link
                                                href={`/berita/${featuredNews.slug}`}
                                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FCB900] group-hover:text-white transition-colors mt-auto"
                                            >
                                                Baca Selengkapnya
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* KANAN: Daftar 4 Berita di dalam Card Pembungkus */}
                        {sideNews.length > 0 && (
                            <div className="lg:col-span-5 flex flex-col">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 h-full flex flex-col gap-4 shadow-xl"
                                >
                                    <h4 className="text-white font-bold text-lg mb-1 border-b border-white/20 pb-3">
                                        Berita Lainnya
                                    </h4>
                                    <AnimatePresence mode="popLayout">
                                        {sideNews.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.95,
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: index * 0.1,
                                                }}
                                                className="group bg-primary/60 hover:bg-primary/80 rounded-xl overflow-hidden shadow-sm border border-white/10 transition-all duration-300 flex h-28 sm:h-26"
                                            >
                                                <div className="relative w-1/3 h-full shrink-0 overflow-hidden bg-slate-100">
                                                    <img
                                                        src={item.image}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => {
                                                            (
                                                                e.target as HTMLImageElement
                                                            ).src =
                                                                "https://via.placeholder.com/150x150?text=Berita";
                                                        }}
                                                    />
                                                </div>

                                                <div className="p-3 sm:p-4 flex flex-col flex-grow justify-center w-2/3">
                                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white/80 mb-1.5 font-medium">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{item.date}</span>
                                                    </div>
                                                    <Link
                                                        href={`/berita/${item.slug}`}
                                                        className="block group-hover:text-[#FCB900] transition-colors mb-1"
                                                    >
                                                        <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                                                            {item.title}
                                                        </h4>
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigasi Halaman Berita (Prev / Nomor Halaman / Next) agar halaman tidak memanjang ke bawah */}
                {totalPages > 1 && (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-10 flex flex-wrap items-center justify-center gap-2"
                    >
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={safePage <= 1}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                            <ChevronLeft className="w-4 h-4" />
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
                                className={`w-10 h-10 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                    page === safePage
                                        ? "bg-accent text-ink shadow-md"
                                        : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
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
                            disabled={safePage >= totalPages}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
