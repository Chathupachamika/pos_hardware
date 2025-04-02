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
        Schema::create('daily_expenses', function (Blueprint $table) {
            $table->id();
            $table->string('category'); // utility bills, transportation, rent, maintenance, other
            $table->string('custom_category')->nullable(); // For "other" category
            $table->string('description')->nullable();
            $table->decimal('amount', 10, 2);
            $table->dateTime('date')->default(DB::raw('CURRENT_TIMESTAMP')); // Changed to DATETIME with default
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_expenses');
    }
};
