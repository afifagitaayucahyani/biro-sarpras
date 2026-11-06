<?php
namespace Tests\Feature;
use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
class DokumenTest extends TestCase
{
    use RefreshDatabase;
    public function test_auto_shift_orders_when_inserting_new_document_at_order_one(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $doc1 = Document::create([
            'title' => 'Dokumen Lama 1',
            'category' => 'Pedoman',
            'order' => 1,
            'file_path' => '/storage/uploads/dokumen/doc1.pdf',
            'size' => '100 KB',
            'type' => 'pdf',
            'date' => '2026-10-25',
        ]);
        $doc2 = Document::create([
            'title' => 'Dokumen Lama 2',
            'category' => 'Formulir',
            'order' => 2,
            'file_path' => '/storage/uploads/dokumen/doc2.pdf',
            'size' => '120 KB',
            'type' => 'pdf',
            'date' => '2026-10-25',
        ]);

         $file = UploadedFile::fake()->create('pedoman-baru.pdf', 3000, 'application/pdf');
        $response = $this->actingAs($user)->post('/admin/dokumen', [
            'title' => 'Dokumen Baru Prioritas',
            'category' => 'Pedoman',
            'order' => 1,
            'file' => $file,
        ]);
        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $newDoc = Document::where('title', 'Dokumen Baru Prioritas')->firstOrFail();
        $this->assertSame(1, $newDoc->order);
        $this->assertSame(2, $doc1->fresh()->order);
        $this->assertSame(3, $doc2->fresh()->order);
    }

    public function test_admin_can_reorder_documents_up_and_down(): void
    {
        $user = User::factory()->create();
        $doc1 = Document::create([
            'title' => 'Dokumen Pertama',
            'category' => 'Pedoman',
            'order' => 1,
            'file_path' => '/storage/uploads/dokumen/doc1.pdf',
            'size' => '100 KB',
            'type' => 'pdf',
            'date' => '2026-10-25',
        ]);
        $doc2 = Document::create([
            'title' => 'Dokumen Kedua',
            'category' => 'Laporan',
            'order' => 2,
            'file_path' => '/storage/uploads/dokumen/doc2.pdf',
            'size' => '120 KB',
            'type' => 'pdf',
            'date' => '2026-10-25',
        ]);

        $this->actingAs($user)
            ->post("/admin/dokumen/{$doc2->id}/reorder", ['direction' => 'up'])
            ->assertRedirect();
        $this->assertSame(2, $doc1->fresh()->order);
        $this->assertSame(1, $doc2->fresh()->order);
    }
    public function test_lihat_dokumen_displays_file_inline(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('uploads/dokumen/sample.pdf', '%PDF-1.4 sample content');
        $doc = Document::create([
            'title' => 'SK Rektor 2026',
            'category' => 'SK',
            'order' => 1,
            'file_path' => '/storage/uploads/dokumen/sample.pdf',
            'size' => '150 KB',
            'type' => 'pdf',
            'date' => '2026-10-25',
        ]);

        $response = $this->get(route('dokumen.lihat', $doc->id));
        $response->assertOk();
        $this->assertStringContainsString(
            'inline',
            (string) $response->headers->get('Content-Disposition')
        );
    }
}