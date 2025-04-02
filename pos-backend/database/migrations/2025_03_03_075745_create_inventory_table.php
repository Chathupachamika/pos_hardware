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
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            // $table->foreignId('admin_id')->constrained('admins')->onDelete('cascade');
            $table->decimal('quantity' , 10,2)->default(0);
            $table->dateTime('restock_date_time')->useCurrent()->nullable();
            $table->integer('added_stock_amount')->nullable()->default(0);
            $table->string('location');
            $table->String('status')->default('In Stock');
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
