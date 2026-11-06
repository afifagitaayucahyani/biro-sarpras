<?php
namespace Tests\Feature;
use App\Models\News;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
class BeritaTest extends TestCase
{
    use RefreshDatabase;
    public function test_admin_can_upload_inline_article_image(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $image = UploadedFile::fake()->image('rapat-anggaran.jpg', 800, 600);
        $response = $this->actingAs($user)
            ->postJson(route('admin.berita.upload-image'), [
                'image' => $image,
            ]);
        $response->assertOk();
        $url = $response->json('url');
        $this->assertStringStartsWith('/storage/uploads/berita/konten/', (string) $url);
        $relativePath = str_replace('/storage/', '', (string) $url);
        Storage::disk('public')->assertExists($relativePath);
    }
    public function test_admin_can_store_news_with_safe_rich_text_and_figure_caption(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $richHtml = '<h2>Laporan Rapat</h2><p>Ini adalah paragraf <strong>penting</strong>, <em>miring</em>, dan <u>garis bawah</u>.</p><figure><img src="/storage/uploads/berita/konten/foto.jpg" alt="Suasana Rapat" /><figcaption>Suasana Rapat Anggaran 2026</figcaption></figure><script>alert(1)</script>';
        $response = $this->actingAs($user)->post('/admin/berita', [
            'title' => 'Rapat Anggaran Tahunan 2026',
            'author' => 'Admin Keuangan',
            'date' => '2026-10-27',
            'description' => $richHtml,
            'status' => 'Aktif',
            ]);
        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $berita = News::firstOrFail();
        $this->assertStringContainsString('<figure>', $berita->description);
        $this->assertStringContainsString('<figcaption>Suasana Rapat Anggaran 2026</figcaption>', $berita->description);
        $this->assertStringContainsString('<strong>penting</strong>', $berita->description);
        $this->assertStringContainsString('<u>garis bawah</u>', $berita->description);
        $this->assertStringNotContainsString('<script>', $berita->description);
    }
}