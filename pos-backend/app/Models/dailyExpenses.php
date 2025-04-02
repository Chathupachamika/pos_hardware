<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyExpenses extends Model
{
    protected $fillable = [
        'category',
        'custom_category',
        'description',
        'amount',
        'date',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];
}
