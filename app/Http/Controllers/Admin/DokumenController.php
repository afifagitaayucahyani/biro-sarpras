<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DokumenController extends Controller
{
    public function index()
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
                    'size' => $doc->size ?: '-',
                    'type' => $doc->type ?: 'pdf',
                    'extension' => $ext,
                    'date' => $doc->date ? Carbon::parse($doc->date)->format('Y-m-d') : $doc->created_at->format('Y-m-d'),
                    'formatted_date' => $doc->date ? Carbon::parse($doc->date)->translatedFormat('d M Y') : $doc->created_at->translatedFormat('d M Y'),
                    'fileUrl' => route('dokumen.lihat', $doc->id),
                ];
            });

        return Inertia::render('Admin/Dokumen', [
            'documents' => $documents,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'order' => ['nullable', 'integer', 'min:1'],
            'file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,csv',
                'mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain',
                'max:5120',
            ],
        ]);

        $file = $request->file('file');
        $bytes = $file->getSize();
        $sizeFormatted = $this->formatBytes($bytes);
        $ext = strtolower($file->getClientOriginalExtension());
        $type = $this->detectFileType($ext);

        $path = $file->store('uploads/dokumen', 'public');

        DB::transaction(function () use ($validated, $path, $sizeFormatted, $type) {
            $maxOrder = (int) Document::max('order');
            $targetOrder = isset($validated['order']) && (int) $validated['order'] > 0
                ? (int) $validated['order']
                : ($maxOrder + 1);
            Document::where('order', '>=', $targetOrder)->increment('order');
            Document::create([
                'title' => trim(strip_tags($validated['title'])),
                'category' => trim(strip_tags($validated['category'])),
                'order' => $targetOrder,
                'file_path' => '/storage/' . $path,
                'size' => $sizeFormatted,
                'type' => $type,
                'date' => now()->toDateString(),
            ]);
        });

        return redirect()->back()->with('success', 'Dokumen berhasil diunggah.');
    }

    public function update(Request $request, Document $dokumen)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'order' => ['nullable', 'integer', 'min:1'],
            'file' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,csv',
                'mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain',
                'max:5120',
            ],
        ]);

        DB::transaction(function () use ($request, $validated, $dokumen) {
            $dokumen->title = trim(strip_tags($validated['title']));
            $dokumen->category = trim(strip_tags($validated['category']));

            if (isset($validated['order']) && (int) $validated['order'] > 0) {
                $newOrder = (int) $validated['order'];
                $oldOrder = (int) $dokumen->order;
                if ($newOrder !== $oldOrder) {
                    if ($oldOrder > 0) {
                        if ($newOrder < $oldOrder) {
                            Document::where('id', '!=', $dokumen->id)
                                ->whereBetween('order', [$newOrder, $oldOrder - 1])
                                ->increment('order');
                        } else {
                            Document::where('id', '!=', $dokumen->id)
                                ->whereBetween('order', [$oldOrder + 1, $newOrder])
                                ->decrement('order');
                        }
                    } else {
                        Document::where('id', '!=', $dokumen->id)
                            ->where('order', '>=', $newOrder)
                            ->increment('order');
                    }
                    $dokumen->order = $newOrder;
                }
            }
           if ($request->hasFile('file')) {
                if ($dokumen->file_path && str_starts_with($dokumen->file_path, '/storage/')) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $dokumen->file_path));
                }
                $file = $request->file('file');
                $bytes = $file->getSize();
                $ext = strtolower($file->getClientOriginalExtension());
                $path = $file->store('uploads/dokumen', 'public');

               $dokumen->file_path = '/storage/' . $path;
                $dokumen->size = $this->formatBytes($bytes);
                $dokumen->type = $this->detectFileType($ext);
            }
            $dokumen->save();
        });

        return redirect()->back()->with('success', 'Dokumen berhasil diperbarui.');
    }

        public function reorder(Request $request, Document $dokumen)
    {
        $validated = $request->validate([
            'direction' => ['required', 'in:up,down'],
        ]);
        DB::transaction(function () use ($validated, $dokumen) {
            $docs = Document::orderBy('order', 'asc')
                ->latest('date')
                ->latest('id')
                ->lockForUpdate()
                ->get()
                ->values();
            // Pastikan setiap dokumen memiliki urutan sekuensial yang bersih (1..N)
            foreach ($docs as $idx => $item) {
                if ((int) $item->order !== $idx + 1) {
                    $item->order = $idx + 1;
                    $item->saveQuietly();
                }
            }
            $currentIndex = $docs->search(fn ($item) => $item->id === $dokumen->id);
            if ($currentIndex === false) {
                return;
            }
            $targetIndex = $validated['direction'] === 'up' ? $currentIndex - 1 : $currentIndex + 1;
            if ($targetIndex < 0 || $targetIndex >= $docs->count()) {
                return;
            }
            $currentDoc = $docs[$currentIndex];
            $neighborDoc = $docs[$targetIndex];
            $tempOrder = $currentDoc->order;
            $currentDoc->order = $neighborDoc->order;
            $neighborDoc->order = $tempOrder;
            $currentDoc->save();
            $neighborDoc->save();
        });
        return redirect()->back()->with('success', 'Urutan dokumen berhasil diperbarui.');
    }

    public function destroy(Document $dokumen)
    {
        if ($dokumen->file_path && str_starts_with($dokumen->file_path, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $dokumen->file_path));
        }

       DB::transaction(function () use ($dokumen) {
            $deletedOrder = (int) $dokumen->order;
            $dokumen->delete();
            if ($deletedOrder > 0) {
                Document::where('order', '>', $deletedOrder)->decrement('order');
            }
        });

        return redirect()->back()->with('success', 'Dokumen berhasil dihapus.');
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 0) . ' KB';
        }
        return $bytes . ' B';
    }

    private function detectFileType(string $ext): string
    {
        return match ($ext) {
            'xls', 'xlsx', 'csv' => 'excel',
            'doc', 'docx' => 'word',
            default => 'pdf',
        };
    }
}
