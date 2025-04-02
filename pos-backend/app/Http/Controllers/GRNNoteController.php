<?php

namespace App\Http\Controllers;

use App\Models\GRNNote;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GRNNoteController extends Controller
{
    public function index()
    {
        $grnNotes = GRNNote::with(['supplier', 'product', 'admin'])->get();
        return response()->json(['status' => 'success', 'data' => $grnNotes]);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            // Validate request
            $validatedData = $request->validate([
                'grn_number' => 'required|string|unique:grn_notes',
                'product_id' => 'required|exists:products,id',
                'supplier_id' => 'required|exists:suppliers,id',
                'admin_id' => 'required|exists:admins,id',
                'price' => 'required|numeric|min:0',
                'product_details' => 'required|array',
                'product_details.name' => 'required|string',
                'product_details.description' => 'required|string',
                'product_details.brand_name' => 'required|string',
                'product_details.size' => 'required|string',
                'product_details.color' => 'required|string',
                'product_details.bar_code' => 'required|string',
                'received_date' => 'required|date'
            ]);

            // Create GRN Note
            $grnNote = GRNNote::create($validatedData);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'GRN Note created successfully',
                'data' => $grnNote
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create GRN Note: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $grnNote = GRNNote::with(['supplier', 'product', 'admin'])->findOrFail($id);
            return response()->json(['status' => 'success', 'data' => $grnNote]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'GRN Note not found'
            ], 404);
        }
    }
}
