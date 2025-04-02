<?php

namespace App\Http\Controllers;

use App\Models\DailyExpenses;
use Illuminate\Http\Request;

class DailyExpensesController extends Controller
{
    public function index()
    {
        $expenses = DailyExpenses::all();
        return response()->json($expenses);
    }

    public function show($id)
    {
        $expense = DailyExpenses::find($id);
        if (!$expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }
        return response()->json($expense);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'category' => 'required|string|in:utility bills,transportation,rent,maintenance,other',
                'custom_category' => 'required_if:category,other|string|max:255|nullable',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'date' => 'nullable|date', // Will default to today if not provided
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->validator->errors()], 400);
        }

        $data = $request->all();
        // Set date to today if not provided
        $data['date'] = $request->input('date', now()->toDateString());

        $expense = DailyExpenses::create($data);
        return response()->json($expense, 201);
    }

    public function update(Request $request, $id)
    {
        $expense = DailyExpenses::find($id);
        if (!$expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        try {
            $request->validate([
                'category' => 'required|string|in:utility bills,transportation,rent,maintenance,other',
                'custom_category' => 'required_if:category,other|string|max:255|nullable',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'date' => 'nullable|date',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->validator->errors()], 400);
        }

        $data = $request->all();
        $data['date'] = $request->input('date', $expense->date);

        $expense->update($data);
        return response()->json($expense);
    }

    public function destroy($id)
    {
        $expense = DailyExpenses::find($id);
        if (!$expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        $expense->delete();
        return response()->json(['message' => 'Expense deleted successfully']);
    }
}
