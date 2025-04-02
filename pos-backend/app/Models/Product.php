<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'name',
        'price',
        'seller_price',
        'profit',
        'discount', // Normal discount
        'selling_discount', // Ensure this line exists
        'tax',
        'size',
        'color',
        'description',
        'bar_code',
        'brand_name',
        'inventory_id',
        'supplier_id',
        'admin_id',
        'calculate_length'
    ];

    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class, 'inventory_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function grnNotes()
    {
        return $this->hasMany(GRNNote::class);
    }
}
