<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'title',
        'category',
        'order',
        'file_path',
        'size',
        'type',
        'date',
    ];

    protected $casts = [
        'order' => 'integer',
        'date' => 'date:Y-m-d',
    ];
}
