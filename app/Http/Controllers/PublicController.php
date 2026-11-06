<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\HeroSection;
use App\Models\News;
use App\Models\Sambutan;
use App\Models\StrukturOrganisasi;
use App\Models\View;
use App\Models\VisiMisi;
use Carbon\Carbon;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\RedirectResponse;

class PublicController extends Controller
{
    /**
     * Menampilkan halaman utama / landing page.
     */
    public function index(): Response
    {
        $view = View::firstOrCreate([], ['count' => 2000]);
        if (!session()->has('visited_landing')) {
            $view->increment('count');
            session()->put('visited_landing', true);
        }

        $hero = HeroSection::first();
        $sambutan = Sambutan::first();
        $visiMisi = VisiMisi::first();
        $news = News::where('status', 'Aktif')
            ->latest('date')
            ->latest('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'excerpt' => Str::limit(trim((string) preg_replace('/\s+/', ' ', html_entity_decode(strip_tags($item->description)))), 160),
                'image' => $item->image ?: '/images/Hero.png',
                'date' => Carbon::parse($item->date)->translatedFormat('d M Y'),
                'author' => $item->author,
            ]);

        return Inertia::render('Landing', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
            'visitorCount' => $view->count,
            'hero' => $hero ? [
                'title' => $hero->title,
                'subtitle' => $hero->subtitle,
                'image' => $hero->image ?: '/images/Hero.png',
            ] : null,
            'sambutan' => $sambutan ? [
                'photo' => $sambutan->photo ?: '/images/Kepala-sarpras.jpeg',
                'judul_kepala_biro' => $sambutan->judul_kepala_biro,
                'name' => $sambutan->name,
                'title' => $sambutan->title,
                'message' => $sambutan->message,
            ] : null,
            'news' => $news,
            'visiMisi' => $visiMisi ? [
                'visi' => $visiMisi->visi,
                'misi' => $visiMisi->misi,
            ] : null,
        ]);
    }

    /**
     * Menampilkan halaman detail berita berdasarkan slug.
     */
    public function berita(string $slug): Response
    {
        $berita = News::where('slug', $slug)
            ->where('status', 'Aktif')
            ->first();

        $rawDescription = (string) ($berita?->description ?? '');
        $hasHtmlTags = $rawDescription !== strip_tags($rawDescription);

        return Inertia::render('DetailBerita', [
            'news' => $berita ? [
                'id' => $berita->id,
                'title' => $berita->title,
                'slug' => $berita->slug,
                'content' => $hasHtmlTags ? $rawDescription : nl2br(e($rawDescription)),
                'image' => $berita->image ?: '/images/Hero.png',
                'date' => Carbon::parse($berita->date)->translatedFormat('d M Y'),
                'author' => $berita->author,
            ] : null,
        ]);
    }

    /**
     * Menampilkan halaman dokumen publik.
     */
    public function dokumen(): Response
    {
        $documents = Document::orderBy('order', 'asc')
            ->latest('date')
            ->latest('id')
            ->get()
            ->map(function ($doc) {
                $ext = strtoupper(pathinfo($doc->file_path, PATHINFO_EXTENSION));
                if (!$ext) {
                    $ext = match ($doc->type) {
                        'excel' => 'XLSX',
                        'word' => 'DOCX',
                        default => 'PDF',
                    };
                }
                return [
                    'id' => $doc->id,
                    'title' => $doc->title,
                    'category' => $doc->category,
                    'order' => $doc->order,
                    'fileUrl' => route('dokumen.lihat', $doc->id),
                    'type' => $doc->type ?: 'pdf',
                    'extension' => $ext,
                ];
            });

        return Inertia::render('Dokumen', [
            'documents' => $documents,
        ]);
    }
    /**
     * Menampilkan berkas dokumen secara inline (Native Browser PDF Viewer).
     */
    public function lihatDokumen(Document $dokumen): BinaryFileResponse|RedirectResponse
    {
        $path = str_replace('/storage/', '', $dokumen->file_path);
        $fullPath = Storage::disk('public')->path($path);
        if (!file_exists($fullPath)) {
            return redirect()->back()->with('error', 'Berkas dokumen fisik tidak ditemukan di server.');
        }
        $extension = pathinfo($dokumen->file_path, PATHINFO_EXTENSION) ?: 'pdf';
        $namaBerkas = (Str::slug($dokumen->title) ?: 'dokumen') . '.' . $extension;
        return response()->file($fullPath, [
            'Content-Disposition' => 'inline; filename="' . $namaBerkas . '"',
        ]);
    }

    public function unduhDokumen(Document $dokumen): BinaryFileResponse|RedirectResponse
    {

        $path = str_replace('/storage/', '', $dokumen->file_path);
    
        // Ambil path absolut fisik file di server
        $fullPath = Storage::disk('public')->path($path);
        if (!file_exists($fullPath)) {
            return redirect()->back()->with('error', 'Berkas dokumen fisik tidak ditemukan di server.');
        }
        $extension = pathinfo($dokumen->file_path, PATHINFO_EXTENSION) ?: 'pdf';
        $namaUnduhan = Str::slug($dokumen->title) . '.' . $extension;
        return response()->download($fullPath, $namaUnduhan);
    }

    /**
     * Menampilkan halaman bagan struktur organisasi.
     */
    public function struktur(): Response
    {
        $struktur = StrukturOrganisasi::first();

        return Inertia::render('Struktur', [
            'struktur' => $struktur ? [
                'id' => $struktur->id,
                'image' => $struktur->image,
            ] : null,
        ]);
    }
}
