<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedInteger('order')->default(0)->index()->after('category');
        });
        // Inisialisasi urutan untuk dokumen yang sudah ada berdasarkan urutan terbaru
        $documents = DB::table('documents')
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get(['id']);
        foreach ($documents as $index => $doc) {
            DB::table('documents')
                ->where('id', $doc->id)
                ->update(['order' => $index + 1]);
        }
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
                        $table->dropIndex(['order']);
            $table->dropColumn('order');
        });
    }
};