<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->renameColumn('discount', 'cart_discount');
            $table->double('product_discounts_total')->default(0);
            $table->double('total_discount_amount')->default(0);
        });
    }

    public function down()
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->renameColumn('cart_discount', 'discount');
            $table->dropColumn('product_discounts_total');
            $table->dropColumn('total_discount_amount');
        });
    }
};
