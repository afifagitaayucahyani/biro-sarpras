<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BeritaController extends Controller
{
        private const ALLOWED_HTML_TAGS = '<p><br><b><i><em><strong><u><s><strike><del><h1><h2><h3><h4><h5><h6><ul><ol><li><blockquote><a><span><figure><figcaption><img><hr>';
    public function index()
    {
        $news = News::latest('date')
            ->latest('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'author' => $item->author,
                'date' => Carbon::parse($item->date)->format('Y-m-d'),
                'formatted_date' => Carbon::parse($item->date)->translatedFormat('d M Y'),
                'image' => $item->image ?: '/images/Hero.png',
                'description' => $item->description,
                'excerpt' => Str::limit(trim((string) preg_replace('/\s+/', ' ', html_entity_decode(strip_tags($item->description)))), 160),
                'status' => $item->status ?? 'Aktif',
            ]);

        return Inertia::render('Admin/Berita', [
            'newsList' => $news,
        ]);
    }

        public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120',
            ],
        ]);
        $path = $request->file('image')->store('uploads/berita/konten', 'public');
        return response()->json([
            'url' => '/storage/'.$path,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:100000'],
            'status' => ['nullable', 'in:Aktif,Draft'],
            'image' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120',
            ],
        ]);

        $cleanTitle = trim(strip_tags($validated['title']));
        $cleanAuthor = trim(strip_tags($validated['author']));
        $cleanDescription = $this->sanitizeHtmlDescription($validated['description']);


        $imagePath = '/images/Hero.png';
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('uploads/berita', 'public');
            $imagePath = '/storage/'.$path;
        }

        DB::transaction(function () use ($cleanTitle, $cleanAuthor, $cleanDescription, $validated, $imagePath) {
            $slug = Str::slug($cleanTitle) ?: 'berita';
            $originalSlug = $slug;
            $counter = 1;
            while (News::where('slug', $slug)->exists()) {
                $slug = $originalSlug.'-'.$counter++;
            }

            News::create([
                'title' => $cleanTitle,
                'slug' => $slug,
                'author' => $cleanAuthor,
                'date' => $validated['date'],
                'description' => $cleanDescription,
                'image' => $imagePath,
                'status' => $validated['status'] ?? 'Aktif',
            ]);
        });

        return redirect()->back()->with('success', 'Berita berhasil ditambahkan.');
    }

    public function update(Request $request, News $berita)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:100000'],
            'status' => ['nullable', 'in:Aktif,Draft'],
            'image' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120',
            ],
        ]);

        $cleanTitle = trim(strip_tags($validated['title']));
        $cleanAuthor = trim(strip_tags($validated['author']));
        $cleanDescription = $this->sanitizeHtmlDescription($validated['description']);

         DB::transaction(function () use ($request, $berita, $cleanTitle, $cleanAuthor, $cleanDescription, $validated) {
            if ($berita->title !== $cleanTitle) {
                $slug = Str::slug($cleanTitle) ?: 'berita';
                $originalSlug = $slug;
                $counter = 1;
                while (News::where('slug', $slug)->where('id', '!=', $berita->id)->exists()) {
                    $slug = $originalSlug.'-'.$counter++;
                }
                $berita->slug = $slug;
            }


            if ($request->hasFile('image')) {
                if ($berita->image && str_starts_with($berita->image, '/storage/')) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $berita->image));
                }
                $path = $request->file('image')->store('uploads/berita', 'public');
                $berita->image = '/storage/'.$path;
        }

            $berita->title = $cleanTitle;
            $berita->author = $cleanAuthor;
            $berita->date = $validated['date'];
            $berita->description = $cleanDescription;
            $berita->status = $validated['status'] ?? 'Aktif';
            $berita->save();
        });

        return redirect()->back()->with('success', 'Berita berhasil diperbarui.');
    }

    public function destroy(News $berita)
    {
        DB::transaction(function () use ($berita) {
            if ($berita->image && str_starts_with($berita->image, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $berita->image));
            }

        $berita->delete();
        });

        return redirect()->back()->with('success', 'Berita berhasil dihapus.');
         }
    /**
     * Membersihkan HTML deskripsi berita dengan tetap mengizinkan tag pemformatan & gambar yang aman.
     */
    private function sanitizeHtmlDescription(string $html): string
    {
        $cleaned = strip_tags($html, self::ALLOWED_HTML_TAGS);
        // Hapus atribut event handler inline (onload, onerror, onclick, dsb.)
        $cleaned = (string) preg_replace('/\s+on[a-z]+\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $cleaned);
        // Cegah protokol berbahaya pada atribut href atau src
        $cleaned = (string) preg_replace('/(href|src)\s*=\s*(["\'])\s*(?:javascript|vbscript|data:text\/html):[^"\']*\2/i', '$1=$2#$2', $cleaned);
        return trim($cleaned);
    }
}
