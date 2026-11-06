import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ChevronRight, Calendar, User, Share2 } from "lucide-react";
import { sanitizeHtml, sanitizeUrl } from "@/utils/sanitize";

interface DetailNewsProps {
    news?: {
        id: number;
        title: string;
        slug: string;
        content: string;
        image: string;
        date: string;
        author: string;
    } | null;
}

export function DetailBerita({ news }: DetailNewsProps) {
    if (!news) {
        return (
            <>
                <Head title="Berita Tidak Ditemukan - Biro Sarpras" />
                <main className="pt-20 pb-24 bg-surface font-sans min-h-[60vh] flex items-center justify-center">
                    <div className="text-center px-4">
                        <h1 className="text-2xl font-bold text-ink font-serif mb-2">
                            Berita Tidak Ditemukan
                        </h1>
                        <p className="text-muted text-sm mb-6">
                            Artikel berita yang Anda cari belum tersedia atau telah dihapus.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                        >
                            Kembali ke Beranda
                        </Link>
                    </div>
                </main>
            </>
        );
    }

    const safeContent = sanitizeHtml(news.content);
    const safeImage = sanitizeUrl(news.image, "/images/Hero.png");

    return (
        <>
            <Head title={`${news.title} - Biro Sarpras`} />

            <main className="pt-12 pb-16 lg:pt-18 lg:pb-24 bg-surface font-sans min-h-screen">
                <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Navigasi Breadcrumb */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-8 flex items-center text-sm font-normal text-blue-600 whitespace-nowrap overflow-hidden"
                    >
                        <Link href="/" className="hover:underline shrink-0">
                            Home
                        </Link>

                        <ChevronRight
                            className="w-4 h-4 mx-1.5 shrink-0 text-slate-500"
                            strokeWidth={1.5}
                        />

                        <span className="truncate hover:underline cursor-pointer">
                            {news.title}
                        </span>
                    </motion.div>

                    {/* Header Artikel */}
                    <header className="mb-10">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink font-serif leading-[1.2] mb-6"
                        >
                            {news.title}
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-medium text-muted border-y border-surface-container py-4"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center text-primary">
                                    <User className="w-4 h-4" />
                                </div>
                                <span>{news.author}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{news.date}</span>
                            </div>

                            {/* Tombol Bagikan */}
                            <button className="ml-auto flex items-center gap-2 text-primary hover:text-primary-dark transition-colors">
                                <Share2 className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    Bagikan
                                </span>
                            </button>
                        </motion.div>
                    </header>

                    {/* Gambar Cover */}
                    <motion.figure
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mb-12 rounded-3xl overflow-hidden shadow-lg shadow-ink/5 border border-surface-container"
                    >
                        <img
                            src={safeImage}
                            alt={news.title}
                            className="w-full h-auto aspect-video object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    "https://via.placeholder.com/1200x675?text=Berita+Sarpras";
                            }}
                        />
                    </motion.figure>

                    {/* Konten Artikel yang telah disanitasi dengan isomorphic-dompurify */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="article-rich-content prose prose-lg prose-slate max-w-none text-muted leading-relaxed
                       prose-headings:font-serif prose-headings:text-ink prose-headings:font-bold
                       prose-a:text-primary hover:prose-a:text-primary-dark
                       prose-ul:list-disc prose-ul:pl-5
                       prose-li:marker:text-primary
                       [&_figure]:my-8 [&_figure]:flex [&_figure]:flex-col [&_figure]:items-center [&_figure]:justify-center [&_figure]:mx-auto
                       [&_img]:mx-auto [&_img]:block [&_img]:rounded-2xl [&_img]:shadow-md [&_img]:max-w-full sm:[&_img]:max-w-2xl [&_img]:h-auto
                       [&_figcaption]:mt-2.5 [&_figcaption]:text-center [&_figcaption]:text-xs sm:[&_figcaption]:text-sm [&_figcaption]:italic [&_figcaption]:text-muted"
                        dangerouslySetInnerHTML={{ __html: safeContent }}
                    />
                </article>
            </main>
        </>
    );
}
