import { useState } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { FileText, Download, FileSpreadsheet, Search } from "lucide-react";
import { sanitizeUrl } from "@/utils/sanitize";

// Tipe Data Dokumen
export interface DocumentItem {
  id: number;
  title: string;
  category: string;
  order?: number;
  size?: string;
  date?: string;
  fileUrl: string;
  type: "pdf" | "excel" | "word";
  extension?: string;
}

export function Dokumen({ documents = [] }: { documents?: DocumentItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter dokumen berdasarkan pencarian
 const filteredDocs = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

    const getExtensionLabel = (doc: DocumentItem): string => {
    if (doc.extension) {
      return doc.extension.toUpperCase();
    }
    if (doc.type === "excel") return "XLSX";
    if (doc.type === "word") return "DOCX";
    return "PDF";
  };

  return (
    <>
      <Head title="Dokumen Resmi" />

      {/* HERO SECTION */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 font-sans overflow-hidden">
        {/* Latar Belakang Gambar */}
        <img
          src="/images/Hero.png"
          alt="Latar Belakang Dokumen"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        
        {/* Overlay Hijau Transparan */}
        <div className="absolute inset-0 bg-primary/75 backdrop-blur-sm" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-serif mb-4 drop-shadow-sm">
              Dokumen Resmi & Unduhan
            </h1>
            <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Pusat unduhan formulir, pedoman, surat keputusan, dan berbagai dokumen resmi terkait administrasi Biro Sarana & Prasarana Universitas Nurul Huda.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="py-12 lg:py-20 bg-surface font-sans min-h-[50vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Kolom Pencarian */}
          <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-bold text-ink">Daftar File Tersedia</h2>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari dokumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Tabel / Daftar Dokumen */}
          <div className="bg-white border border-surface-container rounded-2xl shadow-sm overflow-hidden">
            {filteredDocs.length > 0 ? (
              <ul className="divide-y divide-surface-container">
                {filteredDocs.map((doc) => {
                  const extLabel = getExtensionLabel(doc);
                  return (
                    <motion.li
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 sm:p-6 hover:bg-surface-low transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0 text-primary">
                          {doc.type === "excel" ? (
                            <FileSpreadsheet className="w-6 h-6" />
                          ) : (
                            <FileText className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-ink mb-1.5 leading-snug">
                            {doc.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                            <span className="px-2.5 py-0.5 bg-surface-container rounded-md text-ink font-semibold">
                              {doc.category}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wide border ${
                                doc.type === "excel"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                                  : doc.type === "word"
                                    ? "bg-blue-50 text-blue-700 border-blue-200/70"
                                    : "bg-red-50 text-red-700 border-red-200/70"
                              }`}
                            >
                              {extLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    {/* Tombol Lihat (Native PDF Viewer Bawaan Browser) */}
                      <a
                        href={sanitizeUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-white text-sm font-semibold transition-all whitespace-nowrap self-start sm:self-center"
                      >
                        <Download className="w-4 h-4" />
                        Unduh Dokumen
                      </a>
                    </motion.li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-12 text-center text-muted">
                Belum ada dokumen yang tersedia.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
