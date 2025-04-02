<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id('id');
            $table->foreignId('inventory_id')->constrained('inventories')->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->foreignId('admin_id')->constrained('admins');
            $table->decimal('profit')->onDelete('cascade')->default(0);
            $table->decimal('tax', 8, 2)->default(0);
            $table->string('size');
            $table->boolean('calculate_length')->default(0);
            $table->string('color');
            $table->decimal('seller_price', 10, 2)->default(0);
            $table->decimal('discount', 5, 2);
            $table->decimal('selling_discount', 5, 2)->default(0); // Ensure this column exists
            $table->text('description');
            $table->string('bar_code')->unique();
            $table->string('name');
            $table->decimal('price', 10, 2)->default(0);
            $table->string('brand_name');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
