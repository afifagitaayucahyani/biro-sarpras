<?php

use App\Http\Controllers\Admin\BeritaController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DokumenController;
use App\Http\Controllers\Admin\HeroSectionController;
use App\Http\Controllers\Admin\KontakController;
use App\Http\Controllers\Admin\SambutanController;
use App\Http\Controllers\Admin\StrukturController;
use App\Http\Controllers\Admin\VisiMisiController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicController::class, 'index'])->name('home');
Route::get('/berita/{slug}', [PublicController::class, 'berita'])->name('berita.detail');
Route::get('/dokumen', [PublicController::class, 'dokumen'])->name('dokumen');
Route::get('/dokumen/lihat/{dokumen}', [PublicController::class, 'lihatDokumen'])->name('dokumen.lihat');
Route::get('/dokumen/unduh/{dokumen}', [PublicController::class, 'unduhDokumen'])->name('dokumen.unduh');
Route::get('/struktur', [PublicController::class, 'struktur'])->name('struktur');

Route::middleware(['auth', 'verified', 'throttle:60,1'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Hero Section
    Route::get('/admin/hero', [HeroSectionController::class, 'index'])->name('admin.hero.index');
    Route::post('/admin/hero', [HeroSectionController::class, 'update'])->name('admin.hero.update');

    // Sambutan Ketua / Kepala Biro
    Route::get('/admin/sambutan', [SambutanController::class, 'index'])->name('admin.sambutan.index');
    Route::post('/admin/sambutan', [SambutanController::class, 'update'])->name('admin.sambutan.update');

    // Berita
    Route::get('/admin/berita', [BeritaController::class, 'index'])->name('admin.berita.index');
    Route::post('/admin/berita/upload-image', [BeritaController::class, 'uploadImage'])->name('admin.berita.upload-image');
    Route::post('/admin/berita', [BeritaController::class, 'store'])->name('admin.berita.store');
    Route::post('/admin/berita/{berita}', [BeritaController::class, 'update'])->name('admin.berita.update');
    Route::delete('/admin/berita/{berita}', [BeritaController::class, 'destroy'])->name('admin.berita.destroy');

    // Visi & Misi
    Route::get('/admin/visi-misi', [VisiMisiController::class, 'index'])->name('admin.visi-misi.index');
    Route::post('/admin/visi-misi', [VisiMisiController::class, 'update'])->name('admin.visi-misi.update');

    // Dokumen
    Route::get('/admin/dokumen', [DokumenController::class, 'index'])->name('admin.dokumen.index');
    Route::post('/admin/dokumen', [DokumenController::class, 'store'])->name('admin.dokumen.store');
    Route::post('/admin/dokumen/{dokumen}/reorder', [DokumenController::class, 'reorder'])->name('admin.dokumen.reorder');
    Route::post('/admin/dokumen/{dokumen}', [DokumenController::class, 'update'])->name('admin.dokumen.update');
    Route::delete('/admin/dokumen/{dokumen}', [DokumenController::class, 'destroy'])->name('admin.dokumen.destroy');

    // Struktur Organisasi
    Route::get('/admin/struktur', [StrukturController::class, 'index'])->name('admin.struktur.index');
    Route::post('/admin/struktur', [StrukturController::class, 'update'])->name('admin.struktur.update');

    // Kontak & Layanan
    Route::get('/admin/kontak', [KontakController::class, 'index'])->name('admin.kontak.index');
    Route::post('/admin/kontak', [KontakController::class, 'update'])->name('admin.kontak.update');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
